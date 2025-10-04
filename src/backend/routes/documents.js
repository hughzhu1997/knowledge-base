import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  canReadDocs, 
  canCreateDocs, 
  canUpdateDocs, 
  canDeleteDocs,
  resourceIAM,
  selfResourceIAM
} from '../middleware/iam.js';
import { DocumentController } from '../controllers/DocumentController.js';

const router = express.Router();

/**
 * Create new document
 * Requires document creation permissions
 */
router.post('/',
  authenticateToken,
  canCreateDocs,
  DocumentController.createDocument
);

/**
 * Get all documents with pagination and filtering
 * Requires document read permissions
 */
router.get('/',
  authenticateToken,
  canReadDocs,
  DocumentController.getDocuments
);

/**
 * Search documents using full-text search
 * Requires document read permissions
 */
router.get('/search',
  authenticateToken,
  canReadDocs,
  DocumentController.searchDocuments
);

/**
 * Get document statistics
 * Requires document read permissions
 */
router.get('/stats',
  authenticateToken,
  canReadDocs,
  DocumentController.getDocumentStats
);

/**
 * Get user's own documents
 * Requires document read permissions for user's own docs
 */
router.get('/my',
  authenticateToken,
  selfResourceIAM('docs:Read', 'doc'),
  DocumentController.getUserDocuments
);

/**
 * Get specific document by ID
 * Requires document read permissions for that specific document
 */
router.get('/:documentId',
  authenticateToken,
  resourceIAM('docs:Read', 'doc'),
  DocumentController.getDocument
);

/**
 * Update document
 * Requires document update permissions for that specific document
 */
router.put('/:documentId',
  authenticateToken,
  resourceIAM('docs:Update', 'doc'),
  DocumentController.updateDocument
);

/**
 * Delete document
 * Requires document deletion permissions for that specific document
 */
router.delete('/:documentId',
  authenticateToken,
  resourceIAM('docs:Delete', 'doc'),
  DocumentController.deleteDocument
);

/**
 * Publish document
 * Requires document update permissions for that specific document
 */
router.post('/:documentId/publish',
  authenticateToken,
  resourceIAM('docs:Update', 'doc'),
  DocumentController.publishDocument
);

/**
 * Archive document
 * Requires document update permissions for that specific document
 */
router.post('/:documentId/archive',
  authenticateToken,
  resourceIAM('docs:Update', 'doc'),
  DocumentController.archiveDocument
);

/**
 * Get document revisions
 * Requires document read permissions for that specific document
 */
router.get('/:documentId/revisions',
  authenticateToken,
  resourceIAM('docs:Read', 'doc'),
  DocumentController.getDocumentRevisions
);

export default router;