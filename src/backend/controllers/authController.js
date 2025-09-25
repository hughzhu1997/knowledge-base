const { User } = require('../models');
const jwt = require('jsonwebtoken');

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Username, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
    }

    // Create user (password will be hashed by the model hook)
    const user = await User.create({
      username,
      email,
      password,
      role: 'user'
    });

    res.status(201).json({
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }

    // Find user
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

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '1h' }
    );

    res.json({
      token,
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

// POST /api/auth/logout
const logout = async (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // by removing the token from storage
  res.json({
    message: 'Logged out successfully'
  });
};

// GET /api/auth/me
const getProfile = async (req, res) => {
  try {
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
