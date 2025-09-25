const jwt = require('jsonwebtoken');
const { User } = require('../models');

// JWT Authentication Middleware
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied',
        message: 'No token provided or invalid token format'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Check if user still exists
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        error: 'Access denied',
        message: 'User no longer exists'
      });
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Token is not valid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Token has expired'
      });
    }

    res.status(500).json({ 
      error: 'Authentication failed',
      message: 'An error occurred during authentication'
    });
  }
};

module.exports = auth;
