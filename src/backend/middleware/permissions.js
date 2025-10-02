// permissions.js
// Fine-grained permission middleware for document and user management

/**
 * Permission levels:
 * - user: Can only view/edit their own documents
 * - editor: Can view/edit all documents, but cannot manage users
 * - admin: Full access to all features
 */

/**
 * Check if user can access document management features
 * @param {Request} req - Express request object with authenticated user
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void} Calls next() on success or sends error response
 */
const canManageDocuments = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'User must be authenticated first'
      });
    }

    // Admin and editor can manage documents
    if (['admin', 'editor'].includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Access denied',
      message: 'Document management requires editor or admin privileges'
    });
  } catch (error) {
    console.error('Document permission middleware error:', error);
    res.status(500).json({ 
      error: 'Permission check failed',
      message: 'An error occurred during permission verification'
    });
  }
};

/**
 * Check if user can manage users (admin only)
 * @param {Request} req - Express request object with authenticated user
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void} Calls next() on success or sends error response
 */
const canManageUsers = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'User must be authenticated first'
      });
    }

    // Only admin can manage users
    if (req.user.role === 'admin') {
      return next();
    }

    return res.status(403).json({ 
      error: 'Access denied',
      message: 'User management requires admin privileges'
    });
  } catch (error) {
    console.error('User permission middleware error:', error);
    res.status(500).json({ 
      error: 'Permission check failed',
      message: 'An error occurred during permission verification'
    });
  }
};

/**
 * Check if user can edit a specific document
 * @param {Request} req - Express request object with authenticated user
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void} Calls next() on success or sends error response
 */
const canEditDocument = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'User must be authenticated first'
      });
    }

    const documentId = req.params.id;
    if (!documentId) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Document ID is required'
      });
    }

    // Admin and editor can edit any document
    if (['admin', 'editor'].includes(req.user.role)) {
      return next();
    }

    // Regular users can only edit their own documents
    const { Document } = require('../models');
    const document = await Document.findByPk(documentId);
    
    if (!document) {
      return res.status(404).json({ 
        error: 'Document not found',
        message: 'The requested document does not exist'
      });
    }

    if (document.authorId !== req.user.userId) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You can only edit your own documents'
      });
    }

    next();
  } catch (error) {
    console.error('Document edit permission middleware error:', error);
    res.status(500).json({ 
      error: 'Permission check failed',
      message: 'An error occurred during permission verification'
    });
  }
};

/**
 * Check if user can delete a specific document
 * @param {Request} req - Express request object with authenticated user
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void} Calls next() on success or sends error response
 */
const canDeleteDocument = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'User must be authenticated first'
      });
    }

    const documentId = req.params.id;
    if (!documentId) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Document ID is required'
      });
    }

    // Admin can delete any document
    if (req.user.role === 'admin') {
      return next();
    }

    // Editor and regular users can only delete their own documents
    const { Document } = require('../models');
    const document = await Document.findByPk(documentId);
    
    if (!document) {
      return res.status(404).json({ 
        error: 'Document not found',
        message: 'The requested document does not exist'
      });
    }

    if (document.authorId !== req.user.userId) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You can only delete your own documents'
      });
    }

    next();
  } catch (error) {
    console.error('Document delete permission middleware error:', error);
    res.status(500).json({ 
      error: 'Permission check failed',
      message: 'An error occurred during permission verification'
    });
  }
};

/**
 * Check if user can view all documents (not just their own)
 * @param {Request} req - Express request object with authenticated user
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void} Calls next() on success or sends error response
 */
const canViewAllDocuments = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'User must be authenticated first'
      });
    }

    // Admin and editor can view all documents
    if (['admin', 'editor'].includes(req.user.role)) {
      return next();
    }

    // Regular users are redirected to their own documents
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'You can only view your own documents. Use /api/docs/my instead.'
    });
  } catch (error) {
    console.error('View all documents permission middleware error:', error);
    res.status(500).json({ 
      error: 'Permission check failed',
      message: 'An error occurred during permission verification'
    });
  }
};

module.exports = {
  canManageDocuments,
  canManageUsers,
  canEditDocument,
  canDeleteDocument,
  canViewAllDocuments
};
