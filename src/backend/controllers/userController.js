const { User } = require('../models');
const { Op } = require('sequelize');

// GET /api/users - 获取所有用户（分页）
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'DESC';

    // 构建查询条件
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (role) {
      whereClause.role = role;
    }

    // 计算偏移量
    const offset = (page - 1) * limit;

    // 查询用户
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] }, // 排除密码字段
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: limit,
      offset: offset
    });

    // 计算分页信息
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      message: 'An error occurred while fetching users'
    });
  }
};

// GET /api/users/:id - 获取单个用户
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user',
      message: 'An error occurred while fetching the user'
    });
  }
};

// POST /api/users - 创建新用户
const createUser = async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    // 验证必填字段
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Username, email, and password are required'
      });
    }

    // 验证邮箱格式
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      });
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password too short',
        message: 'Password must be at least 6 characters long'
      });
    }

    // 验证角色
    const validRoles = ['admin', 'developer', 'user'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role',
        message: 'Role must be one of: admin, developer, user'
      });
    }

    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Email already exists',
        message: 'A user with this email already exists'
      });
    }

    // 检查用户名是否已存在
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ 
        error: 'Username already exists',
        message: 'A user with this username already exists'
      });
    }

    // 创建用户
    const user = await User.create({
      username,
      email,
      password,
      role
    });

    // 返回用户信息（不包含密码）
    const userResponse = user.toJSON();

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      error: 'Failed to create user',
      message: 'An error occurred while creating the user'
    });
  }
};

// PUT /api/users/:id - 更新用户
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, password } = req.body;

    // 查找用户
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }

    // 验证邮箱格式（如果提供）
    if (email) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          error: 'Invalid email format',
          message: 'Please provide a valid email address'
        });
      }

      // 检查邮箱是否已被其他用户使用
      const existingUser = await User.findOne({ 
        where: { 
          email, 
          id: { [Op.ne]: id } 
        } 
      });
      if (existingUser) {
        return res.status(400).json({ 
          error: 'Email already exists',
          message: 'A user with this email already exists'
        });
      }
    }

    // 验证用户名（如果提供）
    if (username) {
      const existingUsername = await User.findOne({ 
        where: { 
          username, 
          id: { [Op.ne]: id } 
        } 
      });
      if (existingUsername) {
        return res.status(400).json({ 
          error: 'Username already exists',
          message: 'A user with this username already exists'
        });
      }
    }

    // 验证角色（如果提供）
    if (role) {
      const validRoles = ['admin', 'developer', 'user'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          error: 'Invalid role',
          message: 'Role must be one of: admin, developer, user'
        });
      }
    }

    // 验证密码长度（如果提供）
    if (password && password.length < 6) {
      return res.status(400).json({ 
        error: 'Password too short',
        message: 'Password must be at least 6 characters long'
      });
    }

    // 构建更新数据
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (password) updateData.password = password;

    // 更新用户
    await user.update(updateData);

    // 返回更新后的用户信息（不包含密码）
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      error: 'Failed to update user',
      message: 'An error occurred while updating the user'
    });
  }
};

// DELETE /api/users/:id - 删除用户
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 查找用户
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }

    // 检查是否尝试删除自己
    if (req.user && req.user.userId === id) {
      return res.status(400).json({ 
        error: 'Cannot delete self',
        message: 'You cannot delete your own account'
      });
    }

    // 删除用户
    await user.destroy();

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      error: 'Failed to delete user',
      message: 'An error occurred while deleting the user'
    });
  }
};

// PATCH /api/users/:id/role - 更新用户角色
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // 验证角色
    const validRoles = ['admin', 'developer', 'user'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role',
        message: 'Role must be one of: admin, developer, user'
      });
    }

    // 查找用户
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }

    // 更新角色
    await user.update({ role });

    // 返回更新后的用户信息
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      message: 'User role updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ 
      error: 'Failed to update user role',
      message: 'An error occurred while updating user role'
    });
  }
};

// PATCH /api/users/:id/password - 更新用户密码
const updateUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // 验证必填字段
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Current password and new password are required'
      });
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Password too short',
        message: 'New password must be at least 6 characters long'
      });
    }

    // 查找用户
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }

    // 验证当前密码
    const isCurrentPasswordValid = await user.checkPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        error: 'Invalid current password',
        message: 'Current password is incorrect'
      });
    }

    // 更新密码
    await user.update({ password: newPassword });

    res.json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update user password error:', error);
    res.status(500).json({ 
      error: 'Failed to update password',
      message: 'An error occurred while updating the password'
    });
  }
};

// GET /api/users/stats - 获取用户统计信息
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const adminUsers = await User.count({ where: { role: 'admin' } });
    const developerUsers = await User.count({ where: { role: 'developer' } });
    const regularUsers = await User.count({ where: { role: 'user' } });

    // 获取最近注册的用户
    const recentUsers = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.json({
      totalUsers,
      roleDistribution: {
        admin: adminUsers,
        developer: developerUsers,
        user: regularUsers
      },
      recentUsers
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user statistics',
      message: 'An error occurred while fetching user statistics'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  updateUserPassword,
  getUserStats
};
