// policyController.js
// Policy management controller for IAM system

const { Policy, Role, RolePolicy } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all policies with pagination and search
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.getAllPolicies = async (req, res) => {
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

    const { count, rows: policies } = await Policy.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['name', 'ASC']],
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] },
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        policies,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all policies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch policies',
      message: error.message
    });
  }
};

/**
 * Get single policy by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.getPolicyById = async (req, res) => {
  try {
    const { id } = req.params;

    const policy = await Policy.findByPk(id, {
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] },
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found',
        message: 'The requested policy does not exist'
      });
    }

    res.status(200).json({
      success: true,
      data: { policy }
    });
  } catch (error) {
    console.error('Get policy by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch policy',
      message: error.message
    });
  }
};

/**
 * Create new policy
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.createPolicy = async (req, res) => {
  try {
    const { name, description, policyDocument, version } = req.body;

    // Check if policy already exists
    const existingPolicy = await Policy.findOne({ where: { name } });
    if (existingPolicy) {
      return res.status(400).json({
        success: false,
        error: 'Policy already exists',
        message: 'A policy with this name already exists'
      });
    }

    // Validate policy document
    if (!policyDocument || !policyDocument.Statement) {
      return res.status(400).json({
        success: false,
        error: 'Invalid policy document',
        message: 'Policy document must have Statement array'
      });
    }

    // Create policy
    const policy = await Policy.create({
      name,
      description,
      policyDocument,
      version: version || '1.0'
    });

    res.status(201).json({
      success: true,
      data: { policy },
      message: 'Policy created successfully'
    });
  } catch (error) {
    console.error('Create policy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create policy',
      message: error.message
    });
  }
};

/**
 * Update policy by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.updatePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, policyDocument, version } = req.body;

    const policy = await Policy.findByPk(id);
    if (!policy) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found',
        message: 'The requested policy does not exist'
      });
    }

    // Check if new name conflicts with existing policy
    if (name && name !== policy.name) {
      const existingPolicy = await Policy.findOne({ where: { name } });
      if (existingPolicy) {
        return res.status(400).json({
          success: false,
          error: 'Policy name conflict',
          message: 'A policy with this name already exists'
        });
      }
    }

    // Update policy
    await policy.update({
      name: name || policy.name,
      description: description !== undefined ? description : policy.description,
      policyDocument: policyDocument || policy.policyDocument,
      version: version || policy.version
    });

    res.status(200).json({
      success: true,
      data: { policy },
      message: 'Policy updated successfully'
    });
  } catch (error) {
    console.error('Update policy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update policy',
      message: error.message
    });
  }
};

/**
 * Delete policy by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.deletePolicy = async (req, res) => {
  try {
    const { id } = req.params;

    const policy = await Policy.findByPk(id);
    if (!policy) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found',
        message: 'The requested policy does not exist'
      });
    }

    // Check if policy has roles assigned
    const roleCount = await policy.countRoles();
    if (roleCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete policy with roles',
        message: 'Policy cannot be deleted because it has roles assigned. Please remove from roles first.'
      });
    }

    await policy.destroy();

    res.status(200).json({
      success: true,
      message: 'Policy deleted successfully'
    });
  } catch (error) {
    console.error('Delete policy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete policy',
      message: error.message
    });
  }
};

/**
 * Test policy against action and resource
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.testPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, resource, context } = req.body;

    const policy = await Policy.findByPk(id);
    if (!policy) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found',
        message: 'The requested policy does not exist'
      });
    }

    const result = policy.evaluatePermission(action, resource, context || {});

    res.status(200).json({
      success: true,
      data: {
        policy: policy.name,
        action,
        resource,
        result,
        context
      }
    });
  } catch (error) {
    console.error('Test policy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test policy',
      message: error.message
    });
  }
};

/**
 * Get policy templates
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.getPolicyTemplates = async (req, res) => {
  try {
    const templates = [
      {
        name: 'DocumentFullAccess',
        description: 'Full access to documents',
        policyDocument: {
          Version: '1.0',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'docs:Create',
                'docs:Read',
                'docs:Update',
                'docs:Delete',
                'docs:List'
              ],
              Resource: ['docs/*']
            }
          ]
        }
      },
      {
        name: 'DocumentReadOnly',
        description: 'Read-only access to documents',
        policyDocument: {
          Version: '1.0',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'docs:Read',
                'docs:List'
              ],
              Resource: ['docs/*']
            }
          ]
        }
      },
      {
        name: 'UserManagement',
        description: 'Full access to user management',
        policyDocument: {
          Version: '1.0',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'users:Create',
                'users:Read',
                'users:Update',
                'users:Delete',
                'users:List'
              ],
              Resource: ['users/*']
            }
          ]
        }
      },
      {
        name: 'OwnDocumentAccess',
        description: 'Access only to own documents',
        policyDocument: {
          Version: '1.0',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'docs:Read',
                'docs:Update',
                'docs:Delete'
              ],
              Resource: ['docs/*'],
              Condition: {
                StringEquals: {
                  'docs:author_id': '${user.id}'
                }
              }
            }
          ]
        }
      }
    ];

    res.status(200).json({
      success: true,
      data: { templates }
    });
  } catch (error) {
    console.error('Get policy templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch policy templates',
      message: error.message
    });
  }
};

