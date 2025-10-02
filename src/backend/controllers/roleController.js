// roleController.js
// Role management controller for IAM system

const { Role, Policy, UserRole, RolePolicy, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all roles with pagination and search
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.getAllRoles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: roles } = await Role.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['name', 'ASC']],
      include: [
        {
          model: Policy,
          as: 'policies',
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'users',
          through: { attributes: [] },
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        roles,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all roles error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch roles',
      message: error.message
    });
  }
};

/**
 * Get single role by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id, {
      include: [
        {
          model: Policy,
          as: 'policies',
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'users',
          through: { attributes: ['assignedAt', 'expiresAt'] },
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
        message: 'The requested role does not exist'
      });
    }

    res.status(200).json({
      success: true,
      data: { role }
    });
  } catch (error) {
    console.error('Get role by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch role',
      message: error.message
    });
  }
};

/**
 * Create new role
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.createRole = async (req, res) => {
  try {
    const { name, description, policyIds } = req.body;

    // Check if role already exists
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        error: 'Role already exists',
        message: 'A role with this name already exists'
      });
    }

    // Create role
    const role = await Role.create({
      name,
      description,
      isSystemRole: false
    });

    // Associate policies if provided
    if (policyIds && policyIds.length > 0) {
      await role.setPolicies(policyIds);
    }

    // Fetch role with policies
    const roleWithPolicies = await Role.findByPk(role.id, {
      include: [
        {
          model: Policy,
          as: 'policies',
          through: { attributes: [] }
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: { role: roleWithPolicies },
      message: 'Role created successfully'
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create role',
      message: error.message
    });
  }
};

/**
 * Update role by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, policyIds } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
        message: 'The requested role does not exist'
      });
    }

    // Check if it's a system role
    if (role.isSystemRole) {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify system role',
        message: 'System roles cannot be modified'
      });
    }

    // Check if new name conflicts with existing role
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ where: { name } });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          error: 'Role name conflict',
          message: 'A role with this name already exists'
        });
      }
    }

    // Update role
    await role.update({
      name: name || role.name,
      description: description !== undefined ? description : role.description
    });

    // Update policies if provided
    if (policyIds !== undefined) {
      await role.setPolicies(policyIds);
    }

    // Fetch updated role with policies
    const updatedRole = await Role.findByPk(role.id, {
      include: [
        {
          model: Policy,
          as: 'policies',
          through: { attributes: [] }
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: { role: updatedRole },
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update role',
      message: error.message
    });
  }
};

/**
 * Delete role by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
        message: 'The requested role does not exist'
      });
    }

    // Check if it's a system role
    if (role.isSystemRole) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete system role',
        message: 'System roles cannot be deleted'
      });
    }

    // Check if role has users assigned
    const userCount = await role.countUsers();
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete role with users',
        message: 'Role cannot be deleted because it has users assigned. Please reassign users first.'
      });
    }

    await role.destroy();

    res.status(200).json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete role',
      message: error.message
    });
  }
};

/**
 * Assign role to user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.assignRoleToUser = async (req, res) => {
  try {
    const { userId, roleId, expiresAt } = req.body;

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }

    // Check if role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
        message: 'The requested role does not exist'
      });
    }

    // Check if assignment already exists
    const existingAssignment = await UserRole.findOne({
      where: { userId, roleId }
    });

    if (existingAssignment) {
      // Update existing assignment
      await existingAssignment.update({
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        assignedBy: req.user.userId
      });
    } else {
      // Create new assignment
      await UserRole.create({
        userId,
        roleId,
        assignedBy: req.user.userId,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      });
    }

    res.status(200).json({
      success: true,
      message: 'Role assigned to user successfully'
    });
  } catch (error) {
    console.error('Assign role to user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign role to user',
      message: error.message
    });
  }
};

/**
 * Remove role from user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.removeRoleFromUser = async (req, res) => {
  try {
    const { userId, roleId } = req.params;

    const assignment = await UserRole.findOne({
      where: { userId, roleId }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Role assignment not found',
        message: 'The user does not have this role assigned'
      });
    }

    await assignment.destroy();

    res.status(200).json({
      success: true,
      message: 'Role removed from user successfully'
    });
  } catch (error) {
    console.error('Remove role from user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove role from user',
      message: error.message
    });
  }
};

