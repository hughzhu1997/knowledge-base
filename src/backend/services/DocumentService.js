import db from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Document Service
 * Handles document CRUD operations, search, filtering, and business logic
 */
export class DocumentService {
  /**
   * Create a new document
   * @param {Object} documentData - Document data
   * @param {string} authorId - Author user ID
   * @returns {Promise<Object>} Created document
   */
  static async createDocument(documentData, authorId) {
    const { title, content, summary, category, doc_type, visibility, tagIds } = documentData;

    // Validate required fields
    if (!title || !content || !category) {
      throw new Error('Title, content, and category are required');
    }

    // Create document
    const document = await db.Document.create({
      title,
      content,
      summary,
      category,
      doc_type: doc_type || 'General',
      visibility: visibility || 'private',
      author_id: authorId,
      status: 'draft',
      version: 1
    });

    // Add tags if provided
    if (tagIds && tagIds.length > 0) {
      // Create associations for tag IDs
      const associations = tagIds.map(tagId => ({
        document_id: document.id,
        tag_id: tagId
      }));
      
      await db.DocumentTag.bulkCreate(associations, {
        ignoreDuplicates: true
      });
    }

    // Create initial revision
    await db.Revision.create({
      document_id: document.id,
      version: 1,
      title,
      content,
      summary,
      change_summary: 'Initial document creation',
      updated_by: authorId
    });

    // Return document with associations
    return await this.getDocumentById(document.id);
  }

  /**
   * Get document by ID with all associations
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} Document with associations
   */
  static async getDocumentById(documentId) {
    const document = await db.Document.findByPk(documentId, {
      include: [
        {
          model: db.User,
          as: 'author',
          attributes: ['id', 'username', 'email', 'display_name']
        },
        {
          model: db.Tag,
          as: 'tags',
          attributes: ['id', 'name', 'description', 'color']
        },
        {
          model: db.Revision,
          as: 'revisions',
          attributes: ['id', 'version', 'change_summary', 'created_at'],
          include: [{
            model: db.User,
            as: 'updater',
            attributes: ['id', 'username']
          }],
          order: [['version', 'DESC']],
          limit: 5
        }
      ]
    });

    if (!document) {
      throw new Error('Document not found');
    }

    return document;
  }

  /**
   * Get documents with pagination, search, and filtering
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.limit - Items per page (default: 10)
   * @param {string} options.search - Search term
   * @param {string} options.category - Category filter
   * @param {string} options.status - Status filter
   * @param {string} options.visibility - Visibility filter
   * @param {string} options.authorId - Author filter
   * @param {Array} options.tags - Tags filter
   * @param {string} options.sortBy - Sort field (default: 'created_at')
   * @param {string} options.sortOrder - Sort order (default: 'DESC')
   * @returns {Promise<Object>} Paginated documents
   */
  static async getDocuments(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      status,
      visibility,
      authorId,
      tags,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (category) where.category = category;
    if (status) where.status = status;
    if (visibility) where.visibility = visibility;
    if (authorId) where.author_id = authorId;

    // Apply search
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
        { summary: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const include = [
      {
        model: db.User,
        as: 'author',
        attributes: ['id', 'username', 'email', 'display_name']
      },
      {
        model: db.Tag,
        as: 'tags',
        attributes: ['id', 'name', 'description', 'color'],
        // Apply tag filter if tags are specified
        ...(tags && tags.length > 0 ? {
          where: { id: { [Op.in]: tags } }
        } : {})
      }
    ];

    const { count, rows: documents } = await db.Document.findAndCountAll({
      where,
      include,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Update document
   * @param {string} documentId - Document ID
   * @param {Object} updateData - Update data
   * @param {string} userId - User ID performing the update
   * @returns {Promise<Object>} Updated document
   */
  static async updateDocument(documentId, updateData, userId) {
    const document = await db.Document.findByPk(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Check if user can update this document
    if (document.author_id !== userId) {
      throw new Error('You can only update your own documents');
    }

    const { title, content, summary, category, doc_type, visibility, tags } = updateData;

    // Update document fields
    if (title !== undefined) document.title = title;
    if (content !== undefined) document.content = content;
    if (summary !== undefined) document.summary = summary;
    if (category !== undefined) document.category = category;
    if (doc_type !== undefined) document.doc_type = doc_type;
    if (visibility !== undefined) document.visibility = visibility;

    await document.save();

    // Update tags if provided
    if (tags !== undefined) {
      await db.DocumentTag.updateDocumentTags(documentId, tags, userId);
    }

    return await this.getDocumentById(documentId);
  }

  /**
   * Delete document
   * @param {string} documentId - Document ID
   * @param {string} userId - User ID performing the deletion
   * @returns {Promise<boolean>} Success status
   */
  static async deleteDocument(documentId, userId) {
    const document = await db.Document.findByPk(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Check if user can delete this document
    if (document.author_id !== userId) {
      throw new Error('You can only delete your own documents');
    }

    await document.destroy();
    return true;
  }

  /**
   * Publish document
   * @param {string} documentId - Document ID
   * @param {string} userId - User ID performing the publish
   * @returns {Promise<Object>} Published document
   */
  static async publishDocument(documentId, userId) {
    const document = await db.Document.findByPk(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Check if user can publish this document
    if (document.author_id !== userId) {
      throw new Error('You can only publish your own documents');
    }

    if (document.status === 'published') {
      throw new Error('Document is already published');
    }

    await document.publish();
    return await this.getDocumentById(documentId);
  }

  /**
   * Archive document
   * @param {string} documentId - Document ID
   * @param {string} userId - User ID performing the archive
   * @returns {Promise<Object>} Archived document
   */
  static async archiveDocument(documentId, userId) {
    const document = await db.Document.findByPk(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Check if user can archive this document
    if (document.author_id !== userId) {
      throw new Error('You can only archive your own documents');
    }

    if (document.status === 'archived') {
      throw new Error('Document is already archived');
    }

    await document.archive();
    return await this.getDocumentById(documentId);
  }

  /**
   * Get document revisions
   * @param {string} documentId - Document ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Document revisions
   */
  static async getDocumentRevisions(documentId, options = {}) {
    const { limit = 10, page = 1 } = options;
    const offset = (page - 1) * limit;

    const revisions = await db.Revision.findAll({
      where: { document_id: documentId },
      include: [{
        model: db.User,
        as: 'updater',
        attributes: ['id', 'username', 'email']
      }],
      order: [['version', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return revisions;
  }

  /**
   * Get document statistics
   * @param {string} userId - User ID (optional)
   * @returns {Promise<Object>} Document statistics
   */
  static async getDocumentStats(userId = null) {
    const where = userId ? { author_id: userId } : {};

    const stats = await db.Document.findAll({
      where,
      attributes: [
        'status',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const categoryStats = await db.Document.findAll({
      where,
      attributes: [
        'category',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['category'],
      raw: true
    });

    return {
      statusStats: stats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.count);
        return acc;
      }, {}),
      categoryStats: categoryStats.reduce((acc, stat) => {
        acc[stat.category] = parseInt(stat.count);
        return acc;
      }, {})
    };
  }

  /**
   * Search documents using full-text search
   * @param {string} searchTerm - Search term
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  static async searchDocuments(searchTerm, options = {}) {
    const { page = 1, limit = 10, category, status, visibility } = options;
    const offset = (page - 1) * limit;

    const where = {
      [Op.or]: [
        db.sequelize.literal(`to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', '${searchTerm}')`)
      ]
    };

    if (category) where.category = category;
    if (status) where.status = status;
    if (visibility) where.visibility = visibility;

    const { count, rows: documents } = await db.Document.findAndCountAll({
      where,
      include: [
        {
          model: db.User,
          as: 'author',
          attributes: ['id', 'username', 'email', 'display_name']
        },
        {
          model: db.Tag,
          as: 'tags',
          attributes: ['id', 'name', 'description', 'color']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      },
      searchTerm
    };
  }
}
