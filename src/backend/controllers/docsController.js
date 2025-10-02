// docsController.js
// Controller for managing document-related operations: CRUD, search, and document management

const { Document, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all documents with pagination, search, and filtering
 * Supports filtering by docType, category, author, and text search
 * @param {Request} req - Express request object with query parameters
 * @param {Response} res - Express response object
 * @returns {JSON} Paginated list of documents or error message
 */
const getAllDocs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const docType = req.query.docType || ''; // Filter by document type (SOP, Review, Research, General)
    const authorId = req.query.authorId || '';
    const sortBy = req.query.sortBy || 'updatedAt';
    const sortOrder = req.query.sortOrder || 'DESC';

    // Build search and filter conditions
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (category) {
      whereClause.category = category;
    }
    
    // Apply docType filter if specified
    if (docType) {
      whereClause.docType = docType;
    }
    
    if (authorId) {
      whereClause.authorId = authorId;
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
      attributes: ['id', 'title', 'category', 'docType', 'content', 'version', 'authorId', 'visibility', 'createdAt', 'updatedAt'],
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
    console.error('Get all docs error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch documents',
      message: 'An error occurred while fetching documents'
    });
  }
};

/**
 * Get a single document by ID with author information
 * @param {Request} req - Express request object with document ID parameter
 * @param {Response} res - Express response object
 * @returns {JSON} Document data with author info or error message
 */
const getDocById = async (req, res) => {
  try {
    const { id } = req.params;
    // Find document by ID with author information
    const document = await Document.findByPk(id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'email']
      }]
    });

    if (!document) {
      return res.status(404).json({ 
        error: 'Document not found',
        message: 'The requested document does not exist'
      });
    }

    res.json(document);
  } catch (error) {
    console.error('Get doc by ID error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch document',
      message: 'An error occurred while fetching the document'
    });
  }
};

/**
 * Create a new document
 * Supports optional docType field with backward compatibility (defaults to 'General')
 * @param {Request} req - Express request object with document data and authenticated user
 * @param {Response} res - Express response object
 * @returns {JSON} Created document data or error message
 */
const createDoc = async (req, res) => {
  try {
    const { title, category, docType, content, visibility } = req.body; // Extract docType and visibility from request body

    // Validate required fields
    if (!title || !category || !content) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Title, category, and content are required'
      });
    }

    // Validate title length
    if (title.length > 200) {
      return res.status(400).json({ 
        error: 'Title too long',
        message: 'Title must be 200 characters or less'
      });
    }

    // Validate category against allowed values
    const validCategories = ['prd', 'architecture', 'api', 'db', 'code', 'dependency', 'tech', 'tools', 'security', 'tutorial', 'other'];
    if (!validCategories.includes(category.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid category',
        message: `Category must be one of: ${validCategories.join(', ')}`
      });
    }

    // Validate visibility if provided
    if (visibility && !['public', 'private'].includes(visibility.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid visibility',
        message: 'Visibility must be either "public" or "private"'
      });
    }

    // Create new document with author ID from authenticated user
    // Backward compatibility: if docType is not provided, default to 'General'
    // If visibility is not provided, default to 'private'
    const document = await Document.create({
      title: title.trim(),
      category: category.toLowerCase(),
      docType: docType || 'General', // Use provided docType or default to 'General' for backward compatibility
      content: content.trim(),
      authorId: req.user.userId,
      version: 1,
      visibility: visibility ? visibility.toLowerCase() : 'private' // Default to private if not specified
    });

    // 获取创建后的文档信息（包含作者信息）
    const createdDocument = await Document.findByPk(document.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'email']
      }]
    });

    res.status(201).json({
      message: 'Document created successfully',
      document: createdDocument
    });
  } catch (error) {
    console.error('Create doc error:', error);
    res.status(500).json({ 
      error: 'Failed to create document',
      message: 'An error occurred while creating the document'
    });
  }
};

/**
 * Update an existing document
 * Supports updating docType field along with other document properties
 * @param {Request} req - Express request object with document ID and update data
 * @param {Response} res - Express response object
 * @returns {JSON} Updated document data or error message
 */
const updateDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, docType, content, visibility } = req.body; // Extract docType and visibility from request body

    // Find document by ID
    const document = await Document.findByPk(id);
    if (!document) {
      return res.status(404).json({ 
        error: 'Document not found',
        message: 'The requested document does not exist'
      });
    }

    // Check permissions: only author or admin can edit
    if (document.authorId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You can only edit your own documents'
      });
    }

    // Validate title length if provided
    if (title && title.length > 200) {
      return res.status(400).json({ 
        error: 'Title too long',
        message: 'Title must be 200 characters or less'
      });
    }

    // Validate category if provided
    if (category) {
      const validCategories = ['prd', 'architecture', 'api', 'db', 'code', 'dependency', 'tech', 'tools', 'security', 'tutorial', 'other'];
      if (!validCategories.includes(category.toLowerCase())) {
        return res.status(400).json({ 
          error: 'Invalid category',
          message: `Category must be one of: ${validCategories.join(', ')}`
        });
      }
    }

    // Validate visibility if provided
    if (visibility && !['public', 'private'].includes(visibility.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid visibility',
        message: 'Visibility must be either "public" or "private"'
      });
    }

    // Build update data object with only provided fields
    const updateData = {};
    if (title) updateData.title = title.trim();
    if (category) updateData.category = category.toLowerCase();
    if (docType) updateData.docType = docType; // Update docType if provided
    if (visibility) updateData.visibility = visibility.toLowerCase(); // Update visibility if provided
    if (content) {
      updateData.content = content.trim();
      updateData.version = document.version + 1; // Increment version when content changes
    }

    // 更新文档
    await document.update(updateData);

    // 获取更新后的文档信息（包含作者信息）
    const updatedDocument = await Document.findByPk(id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'email']
      }]
    });

    res.json({
      message: 'Document updated successfully',
      document: updatedDocument
    });
  } catch (error) {
    console.error('Update doc error:', error);
    res.status(500).json({ 
      error: 'Failed to update document',
      message: 'An error occurred while updating the document'
    });
  }
};

/**
 * Delete a document
 * @param {Request} req - Express request object with document ID parameter
 * @param {Response} res - Express response object
 * @returns {JSON} Success message or error message
 */
const deleteDoc = async (req, res) => {
  try {
    const { id } = req.params;

    // Find document by ID
    const document = await Document.findByPk(id);
    if (!document) {
      return res.status(404).json({ 
        error: 'Document not found',
        message: 'The requested document does not exist'
      });
    }

    // Check permissions: only author or admin can delete
    if (document.authorId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You can only delete your own documents'
      });
    }

    // Delete document from database
    await document.destroy();

    res.json({
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete doc error:', error);
    res.status(500).json({ 
      error: 'Failed to delete document',
      message: 'An error occurred while deleting the document'
    });
  }
};

/**
 * Get all available document categories
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {JSON} List of document categories with labels
 */
const getCategories = async (req, res) => {
  try {
    // Define available document categories with labels
    const categories = [
      { value: 'prd', label: 'PRD (产品需求文档)' },
      { value: 'architecture', label: 'Architecture (架构设计)' },
      { value: 'api', label: 'API (接口文档)' },
      { value: 'db', label: 'Database (数据库设计)' },
      { value: 'code', label: 'Code (代码规范)' },
      { value: 'dependency', label: 'Dependency (依赖管理)' }
    ];

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch categories',
      message: 'An error occurred while fetching categories'
    });
  }
};

/**
 * Get document statistics and analytics
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {JSON} Document statistics including counts by category and recent documents
 */
const getDocStats = async (req, res) => {
  try {
    // Get total document count
    const totalDocs = await Document.count();
    
    // Get document count by category
    const docsByCategory = await Document.findAll({
      attributes: [
        'category',
        [Document.sequelize.fn('COUNT', Document.sequelize.col('id')), 'count']
      ],
      group: ['category'],
      raw: true
    });

    // Get recent documents for dashboard
    const recentDocs = await Document.findAll({
      attributes: ['id', 'title', 'category', 'createdAt'],
      include: [{
        model: User,
        as: 'author',
        attributes: ['username']
      }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.json({
      totalDocs,
      docsByCategory,
      recentDocs
    });
  } catch (error) {
    console.error('Get doc stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch document statistics',
      message: 'An error occurred while fetching document statistics'
    });
  }
};

/**
 * Get current user's documents with pagination and filtering
 * @param {Request} req - Express request object with authenticated user and query parameters
 * @param {Response} res - Express response object
 * @returns {JSON} Paginated list of user's documents or error message
 */
const getMyDocs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const sortBy = req.query.sortBy || 'updatedAt';
    const sortOrder = req.query.sortOrder || 'DESC';

    // Build query conditions for user's documents only
    const whereClause = {
      authorId: req.user.userId
    };
    
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

    // Query user's documents with pagination
    const { count, rows: documents } = await Document.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'email']
      }],
      attributes: ['id', 'title', 'category', 'docType', 'content', 'version', 'createdAt', 'updatedAt'],
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
    console.error('Get my docs error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch your documents',
      message: 'An error occurred while fetching your documents'
    });
  }
};

/**
 * Update document category
 * @param {Request} req - Express request object with document ID and new category
 * @param {Response} res - Express response object
 * @returns {JSON} Success message or error response
 */
const updateDocCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;

    // Validate required fields
    if (!category) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'Category is required'
      });
    }

    // Validate category against allowed values
    const validCategories = ['prd', 'architecture', 'api', 'db', 'code', 'dependency', 'tech', 'tools', 'security', 'tutorial', 'other'];
    if (!validCategories.includes(category.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid category',
        message: `Category must be one of: ${validCategories.join(', ')}`,
        validCategories
      });
    }

    // Find the document
    const document = await Document.findByPk(id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'email']
      }]
    });

    if (!document) {
      return res.status(404).json({
        error: 'Document not found',
        message: `Document with ID ${id} does not exist`
      });
    }

    // Update the category
    await document.update({
      category: category.toLowerCase()
    });

    // Return updated document
    res.json({
      message: 'Document category updated successfully',
      document: {
        id: document.id,
        title: document.title,
        category: document.category,
        updatedAt: document.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating document category:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update document category'
    });
  }
};

/**
 * Update document visibility (public/private)
 * Only document author or admin can update visibility
 * @param {Request} req - Express request object with document ID and visibility
 * @param {Response} res - Express response object
 * @returns {JSON} Success message with updated document info or error
 */
const updateDocVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { visibility } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (!visibility) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'Visibility is required'
      });
    }

    const validVisibilities = ['public', 'private'];
    if (!validVisibilities.includes(visibility.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid visibility',
        message: `Visibility must be one of: ${validVisibilities.join(', ')}`,
        validVisibilities
      });
    }

    // Find the document
    const document = await Document.findByPk(id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'email']
      }]
    });

    if (!document) {
      return res.status(404).json({
        error: 'Document not found',
        message: `Document with ID ${id} does not exist`
      });
    }

    // Check permissions: only author or admin can update visibility
    if (userRole !== 'admin' && document.authorId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only document author or admin can update visibility'
      });
    }

    // Update the visibility
    await document.update({
      visibility: visibility.toLowerCase()
    });

    // Return updated document
    res.json({
      message: 'Document visibility updated successfully',
      document: {
        id: document.id,
        title: document.title,
        visibility: document.visibility,
        updatedAt: document.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating document visibility:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update document visibility'
    });
  }
};

module.exports = {
  getAllDocs,
  getDocById,
  createDoc,
  updateDoc,
  deleteDoc,
  getCategories,
  getDocStats,
  getMyDocs,
  updateDocCategory,
  updateDocVisibility
};
