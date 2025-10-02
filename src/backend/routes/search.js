const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const authMiddleware = require('../middleware/auth');

// GET /api/search - Full text search
router.get('/', authMiddleware, searchController.search);

module.exports = router;
