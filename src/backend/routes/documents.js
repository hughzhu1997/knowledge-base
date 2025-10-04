import express from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { 
  canReadDocs, 
  canCreateDocs, 
  canUpdateDocs, 
  canDeleteDocs,
  selfResourceIAM,
  resourceIAM 
} from '../middleware/iam.js';

const router = express.Router();

/**
 * Get all documents
 * Requires document read permissions
 */
router.get('/',
  optionalAuth,
  canReadDocs,
  (req, res) => {
    res.json({
      success: true,
      message: 'Documents retrieved successfully',
      data: {
        documents: [
          {
            id: 'doc-1',
            title: 'Sample Document',
            content: 'This is a sample document',
            author: 'admin',
            createdAt: new Date().toISOString(),
            isPublic: true
          }
        ],
        count: 1,
        user: req.user ? req.user.username : 'anonymous'
      }
    });
  }
);

/**
 * Get specific document
 * Requires document read permissions for that specific document
 */
router.get('/:docId',
  authenticateToken,
  resourceIAM('docs:Read', 'doc'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Document retrieved successfully',
      data: {
        document: {
          id: req.params.docId,
          title: `Document ${req.params.docId}`,
          content: 'This is the document content',
          author: req.user.username,
          createdAt: new Date().toISOString(),
          permissions: req.iamDecision || 'IAM decision not available'
        }
      }
    });
  }
);

/**
 * Create new document
 * Requires document creation permissions
 */
router.post('/',
  authenticateToken,
  canCreateDocs,
  (req, res) => {
    res.json({
      success: true,
      message: 'Document created successfully',
      data: {
        document: {
          id: `doc-${Date.now()}`,
          title: req.body.title || 'New Document',
          content: req.body.content || '',
          author: req.user.username,
          createdAt: new Date().toISOString()
        },
        permissions: req.iamDecision || 'IAM decision not available'
      }
    });
  }
);

/**
 * Update document
 * Requires document update permissions for that specific document
 */
router.put('/:docId',
  authenticateToken,
  resourceIAM('docs:Update', 'doc'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Document updated successfully',
      data: {
        document: {
          id: req.params.docId,
          title: req.body.title || 'Updated Document',
          content: req.body.content || 'Updated content',
          author: req.user.username,
          updatedAt: new Date().toISOString()
        },
        permissions: req.iamDecision || 'IAM decision not available'
      }
    });
  }
);

/**
 * Delete document
 * Requires document deletion permissions for that specific document
 */
router.delete('/:docId',
  authenticateToken,
  resourceIAM('docs:Delete', 'doc'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Document deleted successfully',
      data: {
        deletedDocumentId: req.params.docId,
        deletedBy: req.user.username,
        deletedAt: new Date().toISOString(),
        permissions: req.iamDecision || 'IAM decision not available'
      }
    });
  }
);

/**
 * Get user's own documents
 * Uses self-resource IAM check
 */
router.get('/my/documents',
  authenticateToken,
  selfResourceIAM('docs:Read', 'doc'),
  (req, res) => {
    res.json({
      success: true,
      message: 'User documents retrieved successfully',
      data: {
        documents: [
          {
            id: `doc-${req.user.userId}-1`,
            title: 'My Personal Document',
            content: 'This is my personal document',
            author: req.user.username,
            createdAt: new Date().toISOString()
          }
        ],
        count: 1,
        user: req.user.username,
        permissions: req.iamDecision || 'IAM decision not available'
      }
    });
  }
);

export default router;
