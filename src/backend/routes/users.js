// users.js
// User management routes for CRUD operations, role management, and user documents

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { iamMiddleware } = require('../middleware/iam');
const { validateRequired, validateEmail, validatePassword, validateObjectId } = require('../middleware/validation');

// GET /api/users - Get all users with pagination, search, and filtering (admin only)
router.get('/', 
  authMiddleware, 
  iamMiddleware.users.list,
  userController.getAllUsers
);

// GET /api/users/stats - Get user statistics (admin only)
router.get('/stats', 
  authMiddleware, 
  iamMiddleware.users.read,
  userController.getUserStats
);

// GET /api/users/active-count - Get active users count (last 30 days)
router.get('/active-count', 
  authMiddleware, 
  userController.getActiveUsersCount
);

// GET /api/users/monthly-visits - Get monthly visits count
router.get('/monthly-visits', 
  authMiddleware, 
  userController.getMonthlyVisitsCount
);

// GET /api/users/:id/documents - Get documents created by specific user
router.get('/:id/documents', 
  authMiddleware, 
  userController.getUserDocuments
);

// GET /api/users/:id - Get single user by ID
router.get('/:id', 
  authMiddleware, 
  validateObjectId('id'),
  userController.getUserById
);

// POST /api/users - Create new user (admin only)
router.post('/', 
  authMiddleware, 
  iamMiddleware.users.create,
  validateRequired(['username', 'email', 'password']),
  validateEmail,
  validatePassword,
  userController.createUser
);

// PUT /api/users/:id - Update user information (admin only)
router.put('/:id', 
  authMiddleware, 
  iamMiddleware.users.update,
  validateObjectId('id'),
  userController.updateUser
);

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', 
  authMiddleware, 
  iamMiddleware.users.delete,
  validateObjectId('id'),
  userController.deleteUser
);

// PATCH /api/users/:id/role - Update user role (admin only)
router.patch('/:id/role', 
  authMiddleware, 
  iamMiddleware.users.update,
  validateObjectId('id'),
  validateRequired(['role']),
  userController.updateUserRole
);

// PATCH /api/users/:id/password - Update user password (requires current password)
router.patch('/:id/password', 
  authMiddleware, 
  validateObjectId('id'),
  validateRequired(['currentPassword', 'newPassword']),
  validatePassword,
  userController.updateUserPassword
);

// POST /api/users/:id/reset-password - Reset user password (admin only)
router.post('/:id/reset-password', 
  authMiddleware, 
  iamMiddleware.users.update,
  validateObjectId('id'),
  validateRequired(['newPassword']),
  validatePassword,
  userController.resetUserPassword
);

// PATCH /api/users/:id/status - Update user status (enable/disable, admin only)
router.patch('/:id/status', 
  authMiddleware, 
  iamMiddleware.users.update,
  validateObjectId('id'),
  validateRequired(['isActive']),
  userController.updateUserStatus
);

// POST /api/users/:id/roles - Assign role to user (admin only)
router.post('/:id/roles', 
  authMiddleware, 
  iamMiddleware.users.update,
  validateObjectId('id'),
  validateRequired(['roleId']),
  userController.assignRoleToUser
);

// DELETE /api/users/:id/roles/:roleId - Remove role from user (admin only)
router.delete('/:id/roles/:roleId', 
  authMiddleware, 
  iamMiddleware.users.update,
  validateObjectId('id'),
  validateObjectId('roleId'),
  userController.removeRoleFromUser
);

// GET /api/users/:id/roles - Get user roles (admin only)
router.get('/:id/roles', 
  authMiddleware, 
  iamMiddleware.users.read,
  validateObjectId('id'),
  userController.getUserRoles
);

module.exports = router;
