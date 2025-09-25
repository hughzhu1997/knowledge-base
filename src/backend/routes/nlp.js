const express = require('express');
const router = express.Router();
const nlpController = require('../controllers/nlpController');
const authMiddleware = require('../middleware/auth');

// POST /api/nlp/query - Q&A interface
router.post('/query', authMiddleware, nlpController.query);

module.exports = router;
