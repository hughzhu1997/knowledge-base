// auth.js
// Authentication routes for user registration, login, logout, and profile management

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register - Register new user account
router.post('/register', authController.register);

// POST /api/auth/login - Authenticate user and return JWT token
router.post('/login', authController.login);

// POST /api/auth/logout - Handle user logout (client-side token removal)
router.post('/logout', authController.logout);

// GET /api/auth/me - Get current user's profile information
router.get('/me', authController.getProfile);

module.exports = router;
