// docs.js
// Document management routes for CRUD operations, search, and document management

const express = require('express');
const router = express.Router();
const docsController = require('../controllers/docsController');
const authMiddleware = require('../middleware/auth');
const { iamMiddleware } = require('../middleware/iam');
const { validateRequired, validateObjectId, validateCategory, validateDocType } = require('../middleware/validation');

// GET /api/docs - Get all documents with pagination, search, and filtering
// Supports filtering by docType, category, author, and text search
// Query parameters: ?docType=SOP&category=prd&search=keyword&page=1&limit=10
router.get('/', 
  authMiddleware, 
  iamMiddleware.docs.list,
  docsController.getAllDocs
);

// GET /api/docs/categories - Get all available document categories
router.get('/categories', 
  authMiddleware, 
  docsController.getCategories
);

// GET /api/docs/stats - Get document statistics and analytics
router.get('/stats', 
  authMiddleware, 
  docsController.getDocStats
);

// GET /api/docs/my - Get current user's documents
router.get('/my', 
  authMiddleware, 
  docsController.getMyDocs
);

// GET /api/docs/:id - Get single document by ID
router.get('/:id', 
  authMiddleware, 
  validateObjectId('id'),
  docsController.getDocById
);

// POST /api/docs - Create new document
// Supports optional docType field (defaults to 'General' if not provided)
router.post('/', 
  authMiddleware,
  iamMiddleware.docs.create,
  validateRequired(['title', 'category', 'content']),
  validateCategory,
  validateDocType, // Validates docType field if provided
  docsController.createDoc
);

// PUT /api/docs/:id - Update existing document
// Supports updating docType field along with other document properties
router.put('/:id', 
  authMiddleware, 
  validateObjectId('id'),
  iamMiddleware.docs.update,
  validateDocType, // Validates docType field if provided
  docsController.updateDoc
);

// DELETE /api/docs/:id - Delete document
router.delete('/:id', 
  authMiddleware, 
  validateObjectId('id'),
  iamMiddleware.docs.delete,
  docsController.deleteDoc
);

// PUT /api/docs/:id/category - Update document category
router.put('/:id/category', 
  authMiddleware, 
  validateObjectId('id'),
  iamMiddleware.docs.update,
  validateRequired(['category']),
  validateCategory,
  docsController.updateDocCategory
);

// PUT /api/docs/:id/visibility - Update document visibility
router.put('/:id/visibility', 
  authMiddleware, 
  validateObjectId('id'),
  iamMiddleware.docs.update,
  validateRequired(['visibility']),
  docsController.updateDocVisibility
);

module.exports = router;
