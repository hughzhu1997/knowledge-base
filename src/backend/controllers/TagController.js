import { TagService } from '../services/TagService.js';

/**
 * Tag Controller
 * Handles HTTP requests for tag operations
 */
export class TagController {
  /**
   * Create a new tag
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async createTag(req, res, next) {
    try {
      const tagData = req.body;
      const creatorId = req.user.userId;

      const tag = await TagService.createTag(tagData, creatorId);

      res.status(201).json({
        success: true,
        message: 'Tag created successfully',
        data: { tag }
      });
    } catch (error) {
      if (error.message === 'Tag with this name already exists') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'TAG_EXISTS',
            message: error.message
          }
        });
      }
      next(error);
    }
  }

  /**
   * Get all tags
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getTags(req, res, next) {
    try {
      const {
        page = 1,
        limit = 50,
        search,
        withDocumentCount = false
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        withDocumentCount: withDocumentCount === 'true'
      };

      const result = await TagService.getTags(options);

      res.json({
        success: true,
        message: 'Tags retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get tag by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getTag(req, res, next) {
    try {
      const { tagId } = req.params;
      const tag = await TagService.getTagById(tagId);

      res.json({
        success: true,
        message: 'Tag retrieved successfully',
        data: { tag }
      });
    } catch (error) {
      if (error.message === 'Tag not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TAG_NOT_FOUND',
            message: error.message
          }
        });
      }
      next(error);
    }
  }

  /**
   * Update tag
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async updateTag(req, res, next) {
    try {
      const { tagId } = req.params;
      const updateData = req.body;
      const userId = req.user.userId;

      const tag = await TagService.updateTag(tagId, updateData, userId);

      res.json({
        success: true,
        message: 'Tag updated successfully',
        data: { tag }
      });
    } catch (error) {
      if (error.message === 'Tag not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TAG_NOT_FOUND',
            message: error.message
          }
        });
      }
      if (error.message === 'Tag with this name already exists') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'TAG_EXISTS',
            message: error.message
          }
        });
      }
      next(error);
    }
  }

  /**
   * Delete tag
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async deleteTag(req, res, next) {
    try {
      const { tagId } = req.params;
      const userId = req.user.userId;

      await TagService.deleteTag(tagId, userId);

      res.json({
        success: true,
        message: 'Tag deleted successfully'
      });
    } catch (error) {
      if (error.message === 'Tag not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TAG_NOT_FOUND',
            message: error.message
          }
        });
      }
      if (error.message.includes('Cannot delete tag that is being used')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'TAG_IN_USE',
            message: error.message
          }
        });
      }
      next(error);
    }
  }

  /**
   * Get popular tags
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getPopularTags(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const tags = await TagService.getPopularTags(parseInt(limit));

      res.json({
        success: true,
        message: 'Popular tags retrieved successfully',
        data: { tags }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get tags by document ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getTagsByDocument(req, res, next) {
    try {
      const { documentId } = req.params;
      const tags = await TagService.getTagsByDocumentId(documentId);

      res.json({
        success: true,
        message: 'Document tags retrieved successfully',
        data: { tags }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get tag statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getTagStats(req, res, next) {
    try {
      const stats = await TagService.getTagStats();

      res.json({
        success: true,
        message: 'Tag statistics retrieved successfully',
        data: { stats }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search tags
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async searchTags(req, res, next) {
    try {
      const { q: searchTerm } = req.query;
      const {
        page = 1,
        limit = 20,
        withDocumentCount = false
      } = req.query;

      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'SEARCH_TERM_REQUIRED',
            message: 'Search term is required'
          }
        });
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        withDocumentCount: withDocumentCount === 'true'
      };

      const result = await TagService.searchTags(searchTerm, options);

      res.json({
        success: true,
        message: 'Tag search completed successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
