import db from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Tag Service
 * Handles tag CRUD operations and business logic
 */
export class TagService {
  /**
   * Create a new tag
   * @param {Object} tagData - Tag data
   * @param {string} creatorId - Creator user ID
   * @returns {Promise<Object>} Created tag
   */
  static async createTag(tagData, creatorId) {
    const { name, description, color } = tagData;

    if (!name) {
      throw new Error('Tag name is required');
    }

    // Check if tag already exists
    const existingTag = await db.Tag.findOne({
      where: { name: name.toLowerCase() }
    });

    if (existingTag) {
      throw new Error('Tag with this name already exists');
    }

    const tag = await db.Tag.create({
      name: name.toLowerCase(),
      description,
      color: color || '#3B82F6',
      created_by: creatorId
    });

    return tag;
  }

  /**
   * Get all tags with optional filtering
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.search - Search term
   * @param {boolean} options.withDocumentCount - Include document count
   * @returns {Promise<Object>} Tags with pagination
   */
  static async getTags(options = {}) {
    const {
      page = 1,
      limit = 50,
      search,
      withDocumentCount = false
    } = options;

    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const attributes = ['id', 'name', 'description', 'color', 'created_at'];
    
    if (withDocumentCount) {
      attributes.push([
        db.sequelize.fn('COUNT', db.sequelize.col('documentTags.tag_id')),
        'documentCount'
      ]);
    }

    const include = withDocumentCount ? [{
      model: db.DocumentTag,
      as: 'documentTags',
      attributes: []
    }] : [];

    const { count, rows: tags } = await db.Tag.findAndCountAll({
      where,
      attributes,
      include,
      group: withDocumentCount ? ['Tag.id'] : undefined,
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      tags,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get tag by ID
   * @param {string} tagId - Tag ID
   * @returns {Promise<Object>} Tag with associations
   */
  static async getTagById(tagId) {
    const tag = await db.Tag.findByPk(tagId, {
      include: [
        {
          model: db.User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        },
        {
          model: db.Document,
          as: 'documents',
          attributes: ['id', 'title', 'status', 'visibility', 'created_at'],
          include: [{
            model: db.User,
            as: 'author',
            attributes: ['id', 'username']
          }]
        }
      ]
    });

    if (!tag) {
      throw new Error('Tag not found');
    }

    return tag;
  }

  /**
   * Update tag
   * @param {string} tagId - Tag ID
   * @param {Object} updateData - Update data
   * @param {string} userId - User ID performing the update
   * @returns {Promise<Object>} Updated tag
   */
  static async updateTag(tagId, updateData, userId) {
    const tag = await db.Tag.findByPk(tagId);
    if (!tag) {
      throw new Error('Tag not found');
    }

    const { name, description, color } = updateData;

    // Check if new name conflicts with existing tag
    if (name && name.toLowerCase() !== tag.name) {
      const existingTag = await db.Tag.findOne({
        where: { 
          name: name.toLowerCase(),
          id: { [Op.ne]: tagId }
        }
      });

      if (existingTag) {
        throw new Error('Tag with this name already exists');
      }
    }

    if (name !== undefined) tag.name = name.toLowerCase();
    if (description !== undefined) tag.description = description;
    if (color !== undefined) tag.color = color;

    await tag.save();
    return tag;
  }

  /**
   * Delete tag
   * @param {string} tagId - Tag ID
   * @param {string} userId - User ID performing the deletion
   * @returns {Promise<boolean>} Success status
   */
  static async deleteTag(tagId, userId) {
    const tag = await db.Tag.findByPk(tagId);
    if (!tag) {
      throw new Error('Tag not found');
    }

    // Check if tag is being used by documents
    const documentCount = await db.DocumentTag.count({
      where: { tag_id: tagId }
    });

    if (documentCount > 0) {
      throw new Error('Cannot delete tag that is being used by documents');
    }

    await tag.destroy();
    return true;
  }

  /**
   * Get popular tags
   * @param {number} limit - Number of tags to return
   * @returns {Promise<Array>} Popular tags
   */
  static async getPopularTags(limit = 10) {
    return await db.Tag.getPopularTags(limit);
  }

  /**
   * Find or create tags by names
   * @param {Array} tagNames - Array of tag names
   * @param {string} creatorId - Creator user ID
   * @returns {Promise<Array>} Tags (created or existing)
   */
  static async findOrCreateTags(tagNames, creatorId) {
    const tags = [];
    
    for (const tagName of tagNames) {
      const { tag } = await db.Tag.findOrCreateByName(tagName, creatorId);
      tags.push(tag);
    }

    return tags;
  }

  /**
   * Get tags by document ID
   * @param {string} documentId - Document ID
   * @returns {Promise<Array>} Document tags
   */
  static async getTagsByDocumentId(documentId) {
    const documentTags = await db.DocumentTag.findAll({
      where: { document_id: documentId },
      include: [{
        model: db.Tag,
        as: 'tag',
        attributes: ['id', 'name', 'description', 'color']
      }]
    });

    return documentTags.map(dt => dt.tag);
  }

  /**
   * Get tag statistics
   * @returns {Promise<Object>} Tag statistics
   */
  static async getTagStats() {
    const totalTags = await db.Tag.count();
    
    const popularTags = await db.Tag.findAll({
      include: [{
        model: db.DocumentTag,
        as: 'documentTags',
        attributes: []
      }],
      attributes: [
        'id',
        'name',
        [db.sequelize.fn('COUNT', db.sequelize.col('documentTags.tag_id')), 'documentCount']
      ],
      group: ['Tag.id'],
      order: [[db.sequelize.literal('documentCount'), 'DESC']],
      limit: 10
    });

    const unusedTags = await db.Tag.findAll({
      include: [{
        model: db.DocumentTag,
        as: 'documentTags',
        required: false
      }],
      where: {
        '$documentTags.tag_id$': null
      },
      attributes: ['id', 'name', 'created_at']
    });

    return {
      totalTags,
      popularTags,
      unusedTags: unusedTags.length
    };
  }

  /**
   * Search tags
   * @param {string} searchTerm - Search term
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  static async searchTags(searchTerm, options = {}) {
    const { page = 1, limit = 20, withDocumentCount = false } = options;
    const offset = (page - 1) * limit;

    const where = {
      name: { [Op.iLike]: `%${searchTerm}%` }
    };

    const attributes = ['id', 'name', 'description', 'color', 'created_at'];
    
    if (withDocumentCount) {
      attributes.push([
        db.sequelize.fn('COUNT', db.sequelize.col('documentTags.tag_id')),
        'documentCount'
      ]);
    }

    const include = withDocumentCount ? [{
      model: db.DocumentTag,
      as: 'documentTags',
      attributes: []
    }] : [];

    const { count, rows: tags } = await db.Tag.findAndCountAll({
      where,
      attributes,
      include,
      group: withDocumentCount ? ['Tag.id'] : undefined,
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      tags,
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
