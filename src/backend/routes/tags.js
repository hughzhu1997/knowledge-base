import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  canReadDocs, 
  canCreateDocs, 
  canUpdateDocs, 
  canDeleteDocs 
} from '../middleware/iam.js';
import { TagController } from '../controllers/TagController.js';

const router = express.Router();

/**
 * Create new tag
 * Requires document creation permissions
 */
router.post('/',
  authenticateToken,
  canCreateDocs,
  TagController.createTag
);

/**
 * Get all tags with pagination and filtering
 * Requires document read permissions
 */
router.get('/',
  authenticateToken,
  canReadDocs,
  TagController.getTags
);

/**
 * Search tags
 * Requires document read permissions
 */
router.get('/search',
  authenticateToken,
  canReadDocs,
  TagController.searchTags
);

/**
 * Get popular tags
 * Requires document read permissions
 */
router.get('/popular',
  authenticateToken,
  canReadDocs,
  TagController.getPopularTags
);

/**
 * Get tag statistics
 * Requires document read permissions
 */
router.get('/stats',
  authenticateToken,
  canReadDocs,
  TagController.getTagStats
);

/**
 * Get tags by document ID
 * Requires document read permissions
 */
router.get('/document/:documentId',
  authenticateToken,
  canReadDocs,
  TagController.getTagsByDocument
);

/**
 * Get specific tag by ID
 * Requires document read permissions
 */
router.get('/:tagId',
  authenticateToken,
  canReadDocs,
  TagController.getTag
);

/**
 * Update tag
 * Requires document update permissions
 */
router.put('/:tagId',
  authenticateToken,
  canUpdateDocs,
  TagController.updateTag
);

/**
 * Delete tag
 * Requires document deletion permissions
 */
router.delete('/:tagId',
  authenticateToken,
  canDeleteDocs,
  TagController.deleteTag
);

export default router;
