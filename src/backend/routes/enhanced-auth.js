import express from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { adminOnly } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route POST /enhanced-auth/register
 * @desc Enhanced registration with additional roles
 * @access Admin only
 */
router.post('/register', adminOnly, AuthController.enhancedRegister);

export default router;
