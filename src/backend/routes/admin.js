const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// GET /api/admin/users - Get all users (admin only)
router.get('/users', authMiddleware, adminMiddleware, adminController.getAllUsers);

// PUT /api/admin/users/:id/role - Update user role (admin only)
router.put('/users/:id/role', authMiddleware, adminMiddleware, adminController.updateUserRole);

module.exports = router;
