// roles.js
// Role management routes for IAM system

const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const authMiddleware = require('../middleware/auth');
const { iamMiddleware } = require('../middleware/iam');
const { validateRequired, validateObjectId } = require('../middleware/validation');

// All routes require authentication
router.use(authMiddleware);

// GET /api/roles - Get all roles with pagination and search
router.get('/', 
  iamMiddleware.roles.list,
  roleController.getAllRoles
);

// GET /api/roles/templates - Get role templates
router.get('/templates', 
  iamMiddleware.roles.read,
  (req, res) => {
    const templates = [
      {
        name: 'Administrator',
        description: 'Full system access',
        policies: ['SystemFullAccess', 'UserManagement', 'DocumentManagement']
      },
      {
        name: 'Editor',
        description: 'Document editing and management',
        policies: ['DocumentFullAccess', 'DocumentManagement']
      },
      {
        name: 'Viewer',
        description: 'Read-only access',
        policies: ['DocumentReadOnly']
      },
      {
        name: 'User',
        description: 'Basic user access',
        policies: ['OwnDocumentAccess']
      }
    ];

    res.status(200).json({
      success: true,
      data: { templates }
    });
  }
);

// GET /api/roles/:id - Get single role by ID
router.get('/:id', 
  validateObjectId('id'),
  iamMiddleware.roles.read,
  roleController.getRoleById
);

// POST /api/roles - Create new role
router.post('/', 
  validateRequired(['name']),
  iamMiddleware.roles.create,
  roleController.createRole
);

// PUT /api/roles/:id - Update role by ID
router.put('/:id', 
  validateObjectId('id'),
  iamMiddleware.roles.update,
  roleController.updateRole
);

// DELETE /api/roles/:id - Delete role by ID
router.delete('/:id', 
  validateObjectId('id'),
  iamMiddleware.roles.delete,
  roleController.deleteRole
);

// POST /api/roles/assign - Assign role to user
router.post('/assign', 
  validateRequired(['userId', 'roleId']),
  iamMiddleware.users.update,
  roleController.assignRoleToUser
);

// DELETE /api/roles/:roleId/users/:userId - Remove role from user
router.delete('/:roleId/users/:userId', 
  validateObjectId('roleId'),
  validateObjectId('userId'),
  iamMiddleware.users.update,
  roleController.removeRoleFromUser
);

module.exports = router;

