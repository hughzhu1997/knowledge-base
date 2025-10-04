import { DocumentService } from '../services/DocumentService.js';
import { TagService } from '../services/TagService.js';

/**
 * Document Controller
 * Handles HTTP requests for document operations
 */
export class DocumentController {
  /**
   * Create a new document
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async createDocument(req, res, next) {
    try {
      const documentData = req.body;
      const authorId = req.user.userId;

      const document = await DocumentService.createDocument(documentData, authorId);

      res.status(201).json({
        success: true,
        message: 'Document created successfully',
        data: { document }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get document by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getDocument(req, res, next) {
    try {
      const { documentId } = req.params;
      const document = await DocumentService.getDocumentById(documentId);

      res.json({
        success: true,
        message: 'Document retrieved successfully',
        data: { document }
      });
    } catch (error) {
      if (error.message === 'Document not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: error.message
          }
        });
      }
      next(error);
    }
  }

  /**
   * Get documents with pagination and filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getDocuments(req, res, next) {
    try {
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
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        category,
        status,
        visibility,
        authorId,
        tags: tags ? tags.split(',') : undefined,
        sortBy,
        sortOrder
      };

      const result = await DocumentService.getDocuments(options);

      res.json({
        success: true,
        message: 'Documents retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update document
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async updateDocument(req, res, next) {
    try {
      const { documentId } = req.params;
      const updateData = req.body;
      const userId = req.user.userId;

      const document = await DocumentService.updateDocument(documentId, updateData, userId);

      res.json({
        success: true,
        message: 'Document updated successfully',
        data: { document }
      });
    } catch (error) {
      if (error.message === 'Document not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: error.message
          }
        });
      }
      if (error.message.includes('You can only update your own documents')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: error.message
          }
        });
      }
      next(error);
    }
  }

  /**
   * Delete document
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async deleteDocument(req, res, next) {
    try {
      const { documentId } = req.params;
      const userId = req.user.userId;

      await DocumentService.deleteDocument(documentId, userId);

      res.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      if (error.message === 'Document not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: error.message
          }
        });
      }
      if (error.message.includes('You can only delete your own documents')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: error.message
          }
        });
      }
      next(error);
    }
  }

  /**
   * Publish document
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async publishDocument(req, res, next) {
    try {
      const { documentId } = req.params;
      const userId = req.user.userId;

      const document = await DocumentService.publishDocument(documentId, userId);

      res.json({
        success: true,
        message: 'Document published successfully',
        data: { document }
      });
    } catch (error) {
      if (error.message === 'Document not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: error.message
          }
        });
      }
      if (error.message.includes('You can only publish your own documents')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: error.message
          }
        });
      }
      if (error.message === 'Document is already published') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DOCUMENT_ALREADY_PUBLISHED',
            message: error.message
          }
        });
      }
      next(error);
    }
  }

  /**
   * Archive document
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async archiveDocument(req, res, next) {
    try {
      const { documentId } = req.params;
      const userId = req.user.userId;

      const document = await DocumentService.archiveDocument(documentId, userId);

      res.json({
        success: true,
        message: 'Document archived successfully',
        data: { document }
      });
    } catch (error) {
      if (error.message === 'Document not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: error.message
          }
        });
      }
      if (error.message.includes('You can only archive your own documents')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: error.message
          }
        });
      }
      if (error.message === 'Document is already archived') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DOCUMENT_ALREADY_ARCHIVED',
            message: error.message
          }
        });
      }
      next(error);
    }
  }

  /**
   * Get document revisions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getDocumentRevisions(req, res, next) {
    try {
      const { documentId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const revisions = await DocumentService.getDocumentRevisions(documentId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        message: 'Document revisions retrieved successfully',
        data: { revisions }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get document statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getDocumentStats(req, res, next) {
    try {
      const userId = req.query.userId || null;
      const stats = await DocumentService.getDocumentStats(userId);

      res.json({
        success: true,
        message: 'Document statistics retrieved successfully',
        data: { stats }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search documents
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async searchDocuments(req, res, next) {
    try {
      const { q: searchTerm } = req.query;
      const {
        page = 1,
        limit = 10,
        category,
        status,
        visibility
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
        category,
        status,
        visibility
      };

      const result = await DocumentService.searchDocuments(searchTerm, options);

      res.json({
        success: true,
        message: 'Search completed successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's documents
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getUserDocuments(req, res, next) {
    try {
      const userId = req.user.userId;
      const {
        page = 1,
        limit = 10,
        search,
        category,
        status,
        visibility,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        category,
        status,
        visibility,
        authorId: userId,
        sortBy,
        sortOrder
      };

      const result = await DocumentService.getDocuments(options);

      res.json({
        success: true,
        message: 'User documents retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
