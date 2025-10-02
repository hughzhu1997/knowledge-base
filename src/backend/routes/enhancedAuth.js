const express = require('express');
const router = express.Router();
const enhancedAuthController = require('../controllers/enhancedAuthController');
const authMiddleware = require('../middleware/auth');
const { validateRequired, validateEmail, validatePassword } = require('../middleware/validation');

// POST /api/enhanced-auth/register - Register new user with default permissions
router.post('/register',
  validateRequired(['username', 'email', 'password']),
  validateEmail,
  validatePassword,
  enhancedAuthController.register
);

// POST /api/enhanced-auth/login - Login user
router.post('/login',
  validateRequired(['email', 'password']),
  validateEmail,
  enhancedAuthController.login
);

// GET /api/enhanced-auth/profile - Get user profile with groups and permissions
router.get('/profile',
  authMiddleware,
  enhancedAuthController.getProfile
);

// PUT /api/enhanced-auth/profile - Update user profile
router.put('/profile',
  authMiddleware,
  enhancedAuthController.updateProfile
);

// PATCH /api/enhanced-auth/password - Change user password
router.patch('/password',
  authMiddleware,
  validateRequired(['currentPassword', 'newPassword']),
  validatePassword,
  enhancedAuthController.changePassword
);

module.exports = router;
