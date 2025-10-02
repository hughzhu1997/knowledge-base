// userController.js
// Controller for managing user-related operations: CRUD, authentication, roles, and user documents

const { User, Document, AuditLog } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all users with pagination, search, and filtering
 * @param {Request} req - Express request object with query parameters
 * @param {Response} res - Express response object
 * @returns {JSON} Paginated list of users or error message
 */
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'DESC';

    // Build search and filter conditions
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

    // Calculate pagination offset
    const offset = (page - 1) * limit;

    // Query users with pagination
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] }, // Exclude password field for security
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: limit,
      offset: offset
    });

    // Calculate pagination metadata
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

/**
 * Get a single user by ID
 * @param {Request} req - Express request object with user ID parameter
 * @param {Response} res - Express response object
 * @returns {JSON} User data or error message
 */
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

/**
 * Create a new user account
 * @param {Request} req - Express request object with user data
 * @param {Response} res - Express response object
 * @returns {JSON} Created user data or error message
 */
const createUser = async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Username, email, and password are required'
      });
    }

    // Validate email format using regex
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      });
    }

    // Validate password minimum length
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password too short',
        message: 'Password must be at least 6 characters long'
      });
    }

    // Validate user role against allowed values
    const validRoles = ['admin', 'developer', 'user'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role',
        message: 'Role must be one of: admin, developer, user'
      });
    }

    // Check if email already exists in database
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Email already exists',
        message: 'A user with this email already exists'
      });
    }

    // Check if username already exists in database
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ 
        error: 'Username already exists',
        message: 'A user with this username already exists'
      });
    }

    // Create new user in database
    const user = await User.create({
      username,
      email,
      password,
      role
    });

    // Return user data without password for security
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

/**
 * Update an existing user's information
 * @param {Request} req - Express request object with user ID and update data
 * @param {Response} res - Express response object
 * @returns {JSON} Updated user data or error message
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, password } = req.body;

    // Find user by ID
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          error: 'Invalid email format',
          message: 'Please provide a valid email address'
        });
      }

      // Check if email is already used by another user
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

    // Validate username if provided
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

    // Validate role if provided
    if (role) {
      const validRoles = ['admin', 'developer', 'user'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          error: 'Invalid role',
          message: 'Role must be one of: admin, developer, user'
        });
      }
    }

    // Validate password length if provided
    if (password && password.length < 6) {
      return res.status(400).json({ 
        error: 'Password too short',
        message: 'Password must be at least 6 characters long'
      });
    }

    // Build update data object with only provided fields
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (password) updateData.password = password;

    // Update user in database
    await user.update(updateData);

    // Return updated user data without password
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

/**
 * Delete a user account
 * @param {Request} req - Express request object with user ID parameter
 * @param {Response} res - Express response object
 * @returns {JSON} Success message or error message
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user by ID
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }

    // Prevent users from deleting their own account
    if (req.user && req.user.userId === id) {
      return res.status(400).json({ 
        error: 'Cannot delete self',
        message: 'You cannot delete your own account'
      });
    }

    // Delete user from database
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

/**
 * Update a user's role
 * @param {Request} req - Express request object with user ID and new role
 * @param {Response} res - Express response object
 * @returns {JSON} Updated user data or error message
 */
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role against allowed values
    const validRoles = ['admin', 'developer', 'user'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role',
        message: 'Role must be one of: admin, developer, user'
      });
    }

    // Find user by ID
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }

    // Update user role in database
    await user.update({ role });

    // Return updated user data without password
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

/**
 * Update a user's password (requires current password verification)
 * @param {Request} req - Express request object with user ID and password data
 * @param {Response} res - Express response object
 * @returns {JSON} Success message or error message
 */
const updateUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Current password and new password are required'
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Password too short',
        message: 'New password must be at least 6 characters long'
      });
    }

    // Find user by ID
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }

    // Verify current password before allowing change
    const isCurrentPasswordValid = await user.checkPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        error: 'Invalid current password',
        message: 'Current password is incorrect'
      });
    }

    // Update password in database
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

/**
 * Reset a user's password (admin only - no current password required)
 * @param {Request} req - Express request object with user ID and new password
 * @param {Response} res - Express response object
 * @returns {JSON} Success message or error message
 */
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Validate new password format and length
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Invalid password',
        message: 'New password must be at least 6 characters long'
      });
    }

    // Find user by ID
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }

    // Reset password in database
    await user.update({ password: newPassword });

    res.json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset user password error:', error);
    res.status(500).json({ 
      error: 'Failed to reset password',
      message: 'An error occurred while resetting the password'
    });
  }
};

/**
 * Update a user's active status (enable/disable account)
 * @param {Request} req - Express request object with user ID and status
 * @param {Response} res - Express response object
 * @returns {JSON} Success message or error message
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Validate status value type
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ 
        error: 'Invalid status',
        message: 'isActive must be a boolean value'
      });
    }

    // Find user by ID
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }

    // Prevent users from disabling their own account
    if (req.user && req.user.userId === id && !isActive) {
      return res.status(400).json({ 
        error: 'Cannot disable self',
        message: 'You cannot disable your own account'
      });
    }

    // Update user status in database
    await user.update({ isActive });

    res.json({
      message: `User ${isActive ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ 
      error: 'Failed to update user status',
      message: 'An error occurred while updating user status'
    });
  }
};

/**
 * Get user statistics and analytics data
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {JSON} User statistics and role distribution
 */
const getUserStats = async (req, res) => {
  try {
    // Count total users and users by role
    const totalUsers = await User.count();
    const adminUsers = await User.count({ where: { role: 'admin' } });
    const developerUsers = await User.count({ where: { role: 'developer' } });
    const regularUsers = await User.count({ where: { role: 'user' } });

    // Get recently registered users for dashboard
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

/**
 * Get active users count (users who logged in within last 30 days)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {JSON} Active users count
 */
const getActiveUsersCount = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Count distinct users who have login records in the last 30 days
    const activeUsersCount = await AuditLog.count({
      distinct: true,
      col: 'userId',
      where: {
        action: 'login',
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    res.json({
      activeUsersCount,
      period: '30 days',
      message: 'Active users count retrieved successfully'
    });
  } catch (error) {
    console.error('Get active users count error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch active users count',
      message: 'An error occurred while fetching active users count'
    });
  }
};

/**
 * Get monthly visits count (total visits this month)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {JSON} Monthly visits count
 */
const getMonthlyVisitsCount = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Count all login records this month
    const monthlyVisitsCount = await AuditLog.count({
      where: {
        action: 'login',
        createdAt: {
          [Op.gte]: startOfMonth,
          [Op.lte]: endOfMonth
        }
      }
    });

    res.json({
      monthlyVisitsCount,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      message: 'Monthly visits count retrieved successfully'
    });
  } catch (error) {
    console.error('Get monthly visits count error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch monthly visits count',
      message: 'An error occurred while fetching monthly visits count'
    });
  }
};

/**
 * Get documents created by a specific user with pagination and filtering
 * @param {Request} req - Express request object with user ID and query parameters
 * @param {Response} res - Express response object
 * @returns {JSON} Paginated list of user's documents or error message
 */
const getUserDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'DESC';

    // Verify user exists before querying documents
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'The specified user does not exist'
      });
    }

    // Build search and filter conditions for documents
    const whereClause = { authorId: id };
    
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (category) {
      whereClause.category = category;
    }

    // Calculate pagination offset
    const offset = (page - 1) * limit;

    // Query documents with author information and pagination
    const { count, rows: documents } = await Document.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'email']
      }],
      attributes: ['id', 'title', 'category', 'content', 'version', 'createdAt', 'updatedAt'],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: limit,
      offset: offset
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      documents,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
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
    console.error('Get user documents error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user documents',
      message: 'An error occurred while fetching user documents'
    });
  }
};

/**
 * Assign role to user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {JSON} Success message or error
 */
const assignRoleToUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleId, expiresAt } = req.body;

    // Check if user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The specified user does not exist'
      });
    }

    // Check if role exists
    const { Role } = require('../models');
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        error: 'Role not found',
        message: 'The specified role does not exist'
      });
    }

    // Check if user already has this role
    const { UserRole } = require('../models');
    const existingUserRole = await UserRole.findOne({
      where: { userId: id, roleId: roleId }
    });

    if (existingUserRole) {
      return res.status(409).json({
        error: 'Role already assigned',
        message: 'User already has this role'
      });
    }

    // Assign role to user
    await UserRole.create({
      userId: id,
      roleId: roleId,
      assignedBy: req.user.userId,
      assignedAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    res.json({
      success: true,
      message: `Role "${role.name}" assigned to user successfully`,
      data: {
        userId: id,
        roleId: roleId,
        roleName: role.name,
        assignedAt: new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

  } catch (error) {
    console.error('Assign role to user error:', error);
    res.status(500).json({
      error: 'Failed to assign role',
      message: 'An error occurred while assigning role to user'
    });
  }
};

/**
 * Remove role from user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {JSON} Success message or error
 */
const removeRoleFromUser = async (req, res) => {
  try {
    const { id, roleId } = req.params;

    // Check if user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The specified user does not exist'
      });
    }

    // Check if role exists
    const { Role } = require('../models');
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        error: 'Role not found',
        message: 'The specified role does not exist'
      });
    }

    // Check if user has this role
    const { UserRole } = require('../models');
    const userRole = await UserRole.findOne({
      where: { userId: id, roleId: roleId }
    });

    if (!userRole) {
      return res.status(404).json({
        error: 'Role not assigned',
        message: 'User does not have this role'
      });
    }

    // Remove role from user
    await userRole.destroy();

    res.json({
      success: true,
      message: `Role "${role.name}" removed from user successfully`,
      data: {
        userId: id,
        roleId: roleId,
        roleName: role.name,
        removedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Remove role from user error:', error);
    res.status(500).json({
      error: 'Failed to remove role',
      message: 'An error occurred while removing role from user'
    });
  }
};

/**
 * Get user roles
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {JSON} User roles or error
 */
const getUserRoles = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The specified user does not exist'
      });
    }

    // Get user roles with role details
    const { UserRole, Role } = require('../models');
    const userRoles = await UserRole.findAll({
      where: { userId: id },
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'description', 'isSystemRole']
      }],
      attributes: ['id', 'assignedAt', 'expiresAt']
    });

    res.json({
      success: true,
      data: {
        userId: id,
        username: user.username,
        email: user.email,
        roles: userRoles.map(ur => ({
          id: ur.id,
          roleId: ur.role.id,
          roleName: ur.role.name,
          roleDescription: ur.role.description,
          isSystemRole: ur.role.isSystemRole,
          assignedAt: ur.assignedAt,
          expiresAt: ur.expiresAt,
          isActive: ur.expiresAt ? new Date() < new Date(ur.expiresAt) : true
        }))
      }
    });

  } catch (error) {
    console.error('Get user roles error:', error);
    res.status(500).json({
      error: 'Failed to fetch user roles',
      message: 'An error occurred while fetching user roles'
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
  resetUserPassword,
  updateUserStatus,
  getUserStats,
  getActiveUsersCount,
  getMonthlyVisitsCount,
  getUserDocuments,
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles
};
