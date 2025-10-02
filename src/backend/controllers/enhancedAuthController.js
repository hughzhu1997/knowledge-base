const { User, WorkGroup, GroupMember, PermissionRequest } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * Enhanced Authentication Controller
 * Handles user registration and login with improved permission system
 */

/**
 * Register a new user with default permissions
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {JSON} User data and JWT token
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: existingUser.email === email 
          ? 'A user with this email already exists'
          : 'A user with this username already exists'
      });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      role: 'user' // Default role
    });

    // Create welcome work group for the user
    const welcomeGroup = await WorkGroup.create({
      name: `${username}'s Workspace`,
      description: `Personal workspace for ${username}`,
      creatorId: user.id,
      isPublic: false,
      settings: {
        allowMemberInvite: true,
        requireApproval: false,
        defaultPermission: 'collaborator'
      }
    });

    // Add user as leader of their welcome group
    await GroupMember.create({
      groupId: welcomeGroup.id,
      userId: user.id,
      role: 'leader',
      status: 'active',
      joinedAt: new Date()
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      welcomeGroup: {
        id: welcomeGroup.id,
        name: welcomeGroup.name,
        description: welcomeGroup.description
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to register user'
    });
  }
};

/**
 * Login user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {JSON} User data and JWT token
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await user.checkPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account disabled',
        message: 'Your account has been disabled. Please contact an administrator.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to login'
    });
  }
};

/**
 * Get user profile with groups and permissions
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {JSON} User profile data
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findByPk(userId, {
      include: [
        {
          model: WorkGroup,
          as: 'groups',
          through: {
            model: GroupMember,
            where: { status: 'active' },
            attributes: ['role', 'joinedAt']
          }
        },
        {
          model: WorkGroup,
          as: 'createdGroups',
          attributes: ['id', 'name', 'description', 'isPublic']
        },
        {
          model: PermissionRequest,
          as: 'permissionRequests',
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        groups: user.groups,
        createdGroups: user.createdGroups,
        recentRequests: user.permissionRequests
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to get user profile'
    });
  }
};

/**
 * Update user profile
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {JSON} Updated user data
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, email } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        where: { email }
      });
      if (existingUser) {
        return res.status(409).json({
          error: 'Email already exists',
          message: 'A user with this email already exists'
        });
      }
    }

    // Update user
    await user.update({
      username: username || user.username,
      email: email || user.email
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update profile'
    });
  }
};

/**
 * Change user password
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {JSON} Success message
 */
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await user.checkPassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    await user.update({ password: newPassword });

    res.status(200).json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to change password'
    });
  }
};
