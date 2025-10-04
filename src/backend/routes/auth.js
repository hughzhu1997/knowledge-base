import express from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route POST /auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', AuthController.register);

/**
 * @route POST /auth/login
 * @desc Authenticate user and return tokens
 * @access Public
 */
router.post('/login', AuthController.login);

/**
 * @route POST /auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', AuthController.refresh);

/**
 * @route POST /auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post('/change-password', authenticateToken, AuthController.changePassword);

export default router;
