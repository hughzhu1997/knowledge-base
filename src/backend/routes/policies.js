// policies.js
// Policy management routes for IAM system

const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policyController');
const authMiddleware = require('../middleware/auth');
const { iamMiddleware } = require('../middleware/iam');
const { validateRequired, validateObjectId } = require('../middleware/validation');

// All routes require authentication
router.use(authMiddleware);

// GET /api/policies - Get all policies with pagination and search
router.get('/', 
  iamMiddleware.policies.list,
  policyController.getAllPolicies
);

// GET /api/policies/templates - Get policy templates
router.get('/templates', 
  iamMiddleware.policies.read,
  policyController.getPolicyTemplates
);

// GET /api/policies/:id - Get single policy by ID
router.get('/:id', 
  validateObjectId('id'),
  iamMiddleware.policies.read,
  policyController.getPolicyById
);

// POST /api/policies - Create new policy
router.post('/', 
  validateRequired(['name', 'policyDocument']),
  iamMiddleware.policies.create,
  policyController.createPolicy
);

// PUT /api/policies/:id - Update policy by ID
router.put('/:id', 
  validateObjectId('id'),
  iamMiddleware.policies.update,
  policyController.updatePolicy
);

// DELETE /api/policies/:id - Delete policy by ID
router.delete('/:id', 
  validateObjectId('id'),
  iamMiddleware.policies.delete,
  policyController.deletePolicy
);

// POST /api/policies/:id/test - Test policy against action and resource
router.post('/:id/test', 
  validateObjectId('id'),
  validateRequired(['action', 'resource']),
  iamMiddleware.policies.read,
  policyController.testPolicy
);

module.exports = router;

