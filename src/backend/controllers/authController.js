// authController.js
// Controller for handling user authentication operations: registration, login, logout, and profile management

const { User, AuditLog } = require('../models');
const jwt = require('jsonwebtoken');

/**
 * Register a new user account
 * @param {Request} req - Express request object with user registration data
 * @param {Response} res - Express response object
 * @returns {JSON} Success message or error message
 */
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Username, email, and password are required'
      });
    }

    // Check if user already exists by email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
    }

    // Create new user with default role (password hashed by model hook)
    const user = await User.create({
      username,
      email,
      password,
      role: 'user'
    });

    // Automatically assign 'User' role to new user
    const { Role, UserRole } = require('../models');
    const userRole = await Role.findOne({ where: { name: 'User' } });
    
    if (userRole) {
      await UserRole.create({
        userId: user.id,
        roleId: userRole.id,
        assignedBy: null, // System assignment
        assignedAt: new Date()
      });
      console.log(`✅ Assigned 'User' role to new user: ${user.email}`);
    } else {
      console.warn(`⚠️  'User' role not found, user ${user.email} created without role assignment`);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully with default role user',
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
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
};

/**
 * Authenticate user and generate JWT token
 * @param {Request} req - Express request object with login credentials
 * @param {Response} res - Express response object
 * @returns {JSON} JWT token and user data or error message
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required credentials
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      });
    }

    // Verify password using model method
    const isValidPassword = await user.checkPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token with user information
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '1h' }
    );

    // Record login audit log
    try {
      await AuditLog.create({
        userId: user.id,
        action: 'login',
        resourceType: 'User',
        resourceId: user.id,
        summary: `用户登录: ${user.username}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
    } catch (auditError) {
      console.warn('Failed to record login audit log:', auditError.message);
      // Don't fail login if audit logging fails
    }

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      expiresIn: 3600
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
};

/**
 * Handle user logout (client-side token removal)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {JSON} Success message
 */
const logout = async (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // by removing the token from storage
  res.json({
    message: 'Logged out successfully'
  });
};

/**
 * Get current user's profile information
 * @param {Request} req - Express request object with authenticated user
 * @param {Response} res - Express response object
 * @returns {JSON} User profile data or error message
 */
const getProfile = async (req, res) => {
  try {
    // Get user profile by ID from JWT token (exclude password)
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      error: 'Failed to get profile',
      message: 'An error occurred while fetching profile'
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile
};
