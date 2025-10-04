import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../models/index.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { validatePassword } from '../utils/validation.js';

const { User, Role, UserRole } = db;

export class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.username - Username
   * @param {string} userData.email - Email address
   * @param {string} userData.password - Password
   * @param {string} userData.displayName - Display name (optional)
   * @returns {Object} Registration result with user and tokens
   */
  static async registerUser(userData) {
    const transaction = await db.sequelize.transaction();
    
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [db.Sequelize.Op.or]: [
            { email: userData.email.toLowerCase() },
            { username: userData.username.toLowerCase() }
          ]
        },
        transaction
      });

      if (existingUser) {
        const field = existingUser.email.toLowerCase() === userData.email.toLowerCase() ? 'email' : 'username';
        throw new Error(`${field} is already taken`);
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_COST) || 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const user = await User.create({
        username: userData.username.toLowerCase(),
        email: userData.email.toLowerCase(),
        password_hash: hashedPassword,
        display_name: userData.displayName || userData.username,
        is_active: true,
        email_verified: false
      }, { transaction });

      // Assign default role (User)
      const defaultRole = await Role.findOne({
        where: { name: 'User' },
        transaction
      });

      if (defaultRole) {
        await UserRole.create({
          user_id: user.id,
          role_id: defaultRole.id,
          assigned_at: new Date()
        }, { transaction });
      }

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        username: user.username,
        email: user.email,
        roles: ['User']
      });

      const refreshToken = generateRefreshToken({
        userId: user.id
      });

      await transaction.commit();

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          is_active: user.is_active,
          email_verified: user.email_verified,
          created_at: user.created_at
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: 'Bearer',
          expires_in: parseInt(process.env.JWT_EXPIRES_IN?.replace('h', '')) * 3600 || 86400
        }
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Enhanced registration with additional roles
   * @param {Object} userData - Enhanced user registration data
   * @param {Array} additionalRoles - Additional roles to assign
   * @returns {Object} Registration result with user and tokens
   */
  static async enhancedRegister(userData, additionalRoles = []) {
    const transaction = await db.sequelize.transaction();
    
    try {
      // Use regular registration first
      const result = await AuthService.registerUser(userData);

      // Add additional roles if provided
      if (additionalRoles.length > 0) {
        const roles = await Role.findAll({
          where: {
            name: additionalRoles
          },
          transaction
        });

        for (const role of roles) {
          await UserRole.create({
            user_id: result.user.id,
            role_id: role.id,
            assigned_at: new Date()
          }, { transaction });
        }

        // Regenerate access token with all roles
        const allRoles = ['User', ...additionalRoles.filter(r => r !== 'User')];
        const accessToken = generateAccessToken({
          userId: result.user.id,
          username: result.user.username,
          email: result.user.email,
          roles: allRoles
        });

        result.tokens.access_token = accessToken;
      }

      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Authenticate user login
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - Email address
   * @param {string} credentials.password - Password
   * @returns {Object} Login result with user and tokens
   */
  static async loginUser(credentials) {
    // Find user by email
    const user = await User.findOne({
      where: {
        email: credentials.email.toLowerCase(),
        is_active: true
      },
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] }
        }
      ]
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await user.update({ last_login_at: new Date() });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles.map(role => role.name)
    });

    const refreshToken = generateRefreshToken({
      userId: user.id
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        is_active: user.is_active,
        email_verified: user.email_verified,
        last_login_at: user.last_login_at,
        roles: user.roles.map(role => ({
          id: role.id,
          name: role.name,
          description: role.description
        }))
      },
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: parseInt(process.env.JWT_EXPIRES_IN?.replace('h', '')) * 3600 || 86400
      }
    };
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} New tokens
   */
  static async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'devsecret');
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Get user with roles
      const user = await User.findByPk(decoded.userId, {
        include: [
          {
            model: Role,
            as: 'roles',
            through: { attributes: [] }
          }
        ]
      });

      if (!user || !user.is_active) {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles.map(role => role.name)
      });

      const newRefreshToken = generateRefreshToken({
        userId: user.id
      });

      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
        token_type: 'Bearer',
        expires_in: parseInt(process.env.JWT_EXPIRES_IN?.replace('h', '')) * 3600 || 86400
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {boolean} Success status
   */
  static async changePassword(userId, currentPassword, newPassword) {
    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_COST) || 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await user.update({ password_hash: hashedNewPassword });

    return true;
  }
}
