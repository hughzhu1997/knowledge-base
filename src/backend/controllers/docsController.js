const { Document, User } = require('../models');
const { Op } = require('sequelize');

// GET /api/docs - Get all documents (with pagination, search, filtering)
const getAllDocs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const authorId = req.query.authorId || '';
    const sortBy = req.query.sortBy || 'updatedAt';
    const sortOrder = req.query.sortOrder || 'DESC';

    // 构建查询条件
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
    
    if (authorId) {
      whereClause.authorId = authorId;
    }

    // 计算偏移量
    const offset = (page - 1) * limit;

    // 查询文档
    const { count, rows: documents } = await Document.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'email']
      }],
      attributes: ['id', 'title', 'category', 'version', 'createdAt', 'updatedAt'],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: limit,
      offset: offset
    });

    // 计算分页信息
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

// GET /api/docs/:id - Get single document
const getDocById = async (req, res) => {
  try {
    const { id } = req.params;
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

// POST /api/docs - Create new document
const createDoc = async (req, res) => {
  try {
    const { title, category, content } = req.body;

    // 验证必填字段
    if (!title || !category || !content) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Title, category, and content are required'
      });
    }

    // 验证标题长度
    if (title.length > 200) {
      return res.status(400).json({ 
        error: 'Title too long',
        message: 'Title must be 200 characters or less'
      });
    }

    // 验证分类
    const validCategories = ['prd', 'architecture', 'api', 'db', 'code', 'dependency'];
    if (!validCategories.includes(category.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid category',
        message: `Category must be one of: ${validCategories.join(', ')}`
      });
    }

    // 创建文档
    const document = await Document.create({
      title: title.trim(),
      category: category.toLowerCase(),
      content: content.trim(),
      authorId: req.user.userId,
      version: 1
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

// PUT /api/docs/:id - Update document
const updateDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, content } = req.body;

    // 查找文档
    const document = await Document.findByPk(id);
    if (!document) {
      return res.status(404).json({ 
        error: 'Document not found',
        message: 'The requested document does not exist'
      });
    }

    // 检查权限：只有作者或管理员可以修改
    if (document.authorId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You can only edit your own documents'
      });
    }

    // 验证标题长度（如果提供）
    if (title && title.length > 200) {
      return res.status(400).json({ 
        error: 'Title too long',
        message: 'Title must be 200 characters or less'
      });
    }

    // 验证分类（如果提供）
    if (category) {
      const validCategories = ['prd', 'architecture', 'api', 'db', 'code', 'dependency'];
      if (!validCategories.includes(category.toLowerCase())) {
        return res.status(400).json({ 
          error: 'Invalid category',
          message: `Category must be one of: ${validCategories.join(', ')}`
        });
      }
    }

    // 构建更新数据
    const updateData = {};
    if (title) updateData.title = title.trim();
    if (category) updateData.category = category.toLowerCase();
    if (content) {
      updateData.content = content.trim();
      updateData.version = document.version + 1;
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

// DELETE /api/docs/:id - Delete document
const deleteDoc = async (req, res) => {
  try {
    const { id } = req.params;

    // 查找文档
    const document = await Document.findByPk(id);
    if (!document) {
      return res.status(404).json({ 
        error: 'Document not found',
        message: 'The requested document does not exist'
      });
    }

    // 检查权限：只有作者或管理员可以删除
    if (document.authorId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You can only delete your own documents'
      });
    }

    // 删除文档
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

// GET /api/docs/categories - Get all document categories
const getCategories = async (req, res) => {
  try {
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

// GET /api/docs/stats - Get document statistics
const getDocStats = async (req, res) => {
  try {
    const totalDocs = await Document.count();
    const docsByCategory = await Document.findAll({
      attributes: [
        'category',
        [Document.sequelize.fn('COUNT', Document.sequelize.col('id')), 'count']
      ],
      group: ['category'],
      raw: true
    });

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

// GET /api/docs/my - Get current user's documents
const getMyDocs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const sortBy = req.query.sortBy || 'updatedAt';
    const sortOrder = req.query.sortOrder || 'DESC';

    // 构建查询条件
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

    // 计算偏移量
    const offset = (page - 1) * limit;

    // 查询文档
    const { count, rows: documents } = await Document.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'email']
      }],
      attributes: ['id', 'title', 'category', 'version', 'createdAt', 'updatedAt'],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: limit,
      offset: offset
    });

    // 计算分页信息
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

module.exports = {
  getAllDocs,
  getDocById,
  createDoc,
  updateDoc,
  deleteDoc,
  getCategories,
  getDocStats,
  getMyDocs
};
