const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { validateRequired, validateEmail, validatePassword, validateObjectId } = require('../middleware/validation');

// GET /api/users - 获取所有用户（分页、搜索、筛选）
router.get('/', 
  authMiddleware, 
  userController.getAllUsers
);

// GET /api/users/stats - 获取用户统计信息
router.get('/stats', 
  authMiddleware, 
  adminMiddleware, 
  userController.getUserStats
);

// GET /api/users/:id - 获取单个用户
router.get('/:id', 
  authMiddleware, 
  validateObjectId('id'),
  userController.getUserById
);

// POST /api/users - 创建新用户（仅管理员）
router.post('/', 
  authMiddleware, 
  adminMiddleware,
  validateRequired(['username', 'email', 'password']),
  validateEmail,
  validatePassword,
  userController.createUser
);

// PUT /api/users/:id - 更新用户
router.put('/:id', 
  authMiddleware, 
  validateObjectId('id'),
  userController.updateUser
);

// DELETE /api/users/:id - 删除用户（仅管理员）
router.delete('/:id', 
  authMiddleware, 
  adminMiddleware,
  validateObjectId('id'),
  userController.deleteUser
);

// PATCH /api/users/:id/role - 更新用户角色（仅管理员）
router.patch('/:id/role', 
  authMiddleware, 
  adminMiddleware,
  validateObjectId('id'),
  validateRequired(['role']),
  userController.updateUserRole
);

// PATCH /api/users/:id/password - 更新用户密码
router.patch('/:id/password', 
  authMiddleware, 
  validateObjectId('id'),
  validateRequired(['currentPassword', 'newPassword']),
  validatePassword,
  userController.updateUserPassword
);

module.exports = router;
