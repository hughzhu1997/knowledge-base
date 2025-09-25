const express = require('express');
const router = express.Router();
const docsController = require('../controllers/docsController');
const authMiddleware = require('../middleware/auth');
const { validateRequired, validateObjectId, validateCategory } = require('../middleware/validation');

// GET /api/docs - Get all documents (with pagination, search, filtering)
router.get('/', 
  authMiddleware, 
  docsController.getAllDocs
);

// GET /api/docs/categories - Get all document categories
router.get('/categories', 
  authMiddleware, 
  docsController.getCategories
);

// GET /api/docs/stats - Get document statistics
router.get('/stats', 
  authMiddleware, 
  docsController.getDocStats
);

// GET /api/docs/my - Get current user's documents
router.get('/my', 
  authMiddleware, 
  docsController.getMyDocs
);

// GET /api/docs/:id - Get single document
router.get('/:id', 
  authMiddleware, 
  validateObjectId('id'),
  docsController.getDocById
);

// POST /api/docs - Create new document
router.post('/', 
  authMiddleware,
  validateRequired(['title', 'category', 'content']),
  validateCategory,
  docsController.createDoc
);

// PUT /api/docs/:id - Update document
router.put('/:id', 
  authMiddleware, 
  validateObjectId('id'),
  docsController.updateDoc
);

// DELETE /api/docs/:id - Delete document
router.delete('/:id', 
  authMiddleware, 
  validateObjectId('id'),
  docsController.deleteDoc
);

module.exports = router;
