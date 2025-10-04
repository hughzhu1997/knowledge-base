import { AuthService } from '../services/AuthService.js';
import { validateRegistrationData, validateRequiredFields } from '../utils/validation.js';

export class AuthController {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async register(req, res, next) {
    try {
      // Validate input data
      const validation = validateRegistrationData(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: validation.errors
          }
        });
      }

      // Register user
      const result = await AuthService.registerUser(req.body);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      // Handle specific errors
      if (error.message.includes('already taken')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: error.message
          }
        });
      }

      // Generic error
      res.status(500).json({
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: 'Registration failed',
          details: error.message
        }
      });
    }
  }

  /**
   * Enhanced registration with additional roles
   * @param {Object} req - Express request object
   * @param {Object} res - Express response response object
   * @param {Function} next - Express next middleware function
   */
  static async enhancedRegister(req, res, next) {
    try {
      const { userData, additionalRoles = [] } = req.body;

      // Validate user data
      const validation = validateRegistrationData(userData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid user input data',
            details: validation.errors
          }
        });
      }

      // Validate additional roles
      const validRoles = ['Administrator', 'Editor', 'User', 'Auditor'];
      const invalidRoles = additionalRoles.filter(role => !validRoles.includes(role));
      if (invalidRoles.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ROLES',
            message: 'Invalid additional roles',
            details: invalidRoles
          }
        });
      }

      // Enhanced registration
      const result = await AuthService.enhancedRegister(userData, additionalRoles);

      res.status(201).json({
        success: true,
        message: 'Enhanced user registration completed successfully',
        data: result
      });
    } catch (error) {
      if (error.message.includes('already taken')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: error.message
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'ENHANCED_REGISTRATION_FAILED',
          message: 'Enhanced registration failed',
          details: error.message
        }
      });
    }
  }

  /**
   * Authenticate user login
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async login(req, res, next) {
    try {
      // Validate required fields
      const validation = validateRequiredFields(req.body, ['email', 'password']);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required',
            details: validation.errors
          }
        });
      }

      // Authenticate user
      const result = await AuthService.loginUser(req.body);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      if (error.message.includes('Invalid email or password')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: 'Login failed',
          details: error.message
        }
      });
    }
  }

  /**
   * Refresh access token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async refresh(req, res, next) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REFRESH_TOKEN',
            message: 'Refresh token is required'
          }
        });
      }

      // Refresh tokens
      const tokens = await AuthService.refreshToken(refresh_token);

      res.status(200).json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: { tokens }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token'
        }
      });
    }
  }

  /**
   * Change user password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      }

      const validation = validateRequiredFields(req.body, ['currentPassword', 'newPassword']);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Current password and new password are required',
            details: validation.errors
          }
        });
      }

      // Change password
      await AuthService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'PASSWORD_CHANGE_FAILED',
          message: error.message
        }
      });
    }
  }
}
