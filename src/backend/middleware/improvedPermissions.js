// improvedPermissions.js
// Improved permission middleware for the new permission system

const { User, Document, WorkGroup, GroupMember, DocumentPermission, PermissionRequest } = require('../models');
const { Op } = require('sequelize');

/**
 * Enhanced Permission Checker Class
 * Handles permission evaluation for the improved permission system
 */
class EnhancedPermissionChecker {
  constructor(user) {
    this.user = user;
    this.userGroups = [];
    this.userPermissions = [];
    this.initialized = false;
  }

  /**
   * Initializes the checker by fetching user's groups and permissions
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initialized) return;

    if (!this.user || !this.user.id) {
      this.initialized = true;
      return;
    }

    try {
      // Get user's active group memberships
      const userWithGroups = await User.findByPk(this.user.id, {
        include: [
          {
            model: WorkGroup,
            as: 'groups',
            through: {
              model: GroupMember,
              where: {
                status: 'active'
              }
            }
          }
        ]
      });

      if (userWithGroups) {
        this.userGroups = userWithGroups.groups || [];
      }

      // Get user's document permissions
      this.userPermissions = await DocumentPermission.getUserPermissions(this.user.id);

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing EnhancedPermissionChecker:', error);
      this.initialized = true;
    }
  }

  /**
   * Check if user can create documents
   * @returns {boolean} True if user can create documents
   */
  canCreateDocuments() {
    // All authenticated users can create documents by default
    return !!this.user;
  }

  /**
   * Check if user can view a specific document
   * @param {string} documentId - The document ID
   * @param {object} document - The document object (optional)
   * @returns {Promise<boolean>} True if user can view the document
   */
  async canViewDocument(documentId, document = null) {
    if (!this.user) return false;

    // If document is provided, check if it's public or user is the author
    if (document) {
      if (document.authorId === this.user.id) return true;
      if (document.status === 'published') return true;
    }

    // Check specific document permissions
    await this.init();
    
    const hasPermission = this.userPermissions.some(perm => 
      perm.documentId === documentId && 
      perm.isActive() &&
      ['owner', 'collaborator', 'reader'].includes(perm.permissionType)
    );

    if (hasPermission) return true;

    // Check group permissions
    for (const group of this.userGroups) {
      const groupPermission = await DocumentPermission.findOne({
        where: {
          documentId,
          groupId: group.id,
          isActive: true
        }
      });
      
      if (groupPermission) return true;
    }

    return false;
  }

  /**
   * Check if user can edit a specific document
   * @param {string} documentId - The document ID
   * @param {object} document - The document object (optional)
   * @returns {Promise<boolean>} True if user can edit the document
   */
  async canEditDocument(documentId, document = null) {
    if (!this.user) return false;

    // If document is provided, check if user is the author
    if (document && document.authorId === this.user.id) return true;

    // Check specific document permissions
    await this.init();
    
    const hasPermission = this.userPermissions.some(perm => 
      perm.documentId === documentId && 
      perm.isActive() &&
      ['owner', 'collaborator'].includes(perm.permissionType)
    );

    if (hasPermission) return true;

    // Check group permissions
    for (const group of this.userGroups) {
      const groupPermission = await DocumentPermission.findOne({
        where: {
          documentId,
          groupId: group.id,
          isActive: true,
          permissionType: ['owner', 'collaborator']
        }
      });
      
      if (groupPermission) return true;
    }

    return false;
  }

  /**
   * Check if user can delete a specific document
   * @param {string} documentId - The document ID
   * @param {object} document - The document object (optional)
   * @returns {Promise<boolean>} True if user can delete the document
   */
  async canDeleteDocument(documentId, document = null) {
    if (!this.user) return false;

    // If document is provided, check if user is the author
    if (document && document.authorId === this.user.id) return true;

    // Check specific document permissions
    await this.init();
    
    const hasPermission = this.userPermissions.some(perm => 
      perm.documentId === documentId && 
      perm.isActive() &&
      perm.permissionType === 'owner'
    );

    return hasPermission;
  }

  /**
   * Check if user can manage a work group
   * @param {string} groupId - The group ID
   * @returns {Promise<boolean>} True if user can manage the group
   */
  async canManageGroup(groupId) {
    if (!this.user) return false;

    await this.init();

    // Check if user is the group creator
    const group = await WorkGroup.findByPk(groupId);
    if (group && group.creatorId === this.user.id) return true;

    // Check if user is a group leader
    const membership = await GroupMember.findOne({
      where: {
        groupId,
        userId: this.user.id,
        status: 'active',
        role: 'leader'
      }
    });

    return !!membership;
  }

  /**
   * Check if user can join a work group
   * @param {string} groupId - The group ID
   * @returns {Promise<boolean>} True if user can join the group
   */
  async canJoinGroup(groupId) {
    if (!this.user) return false;

    // Check if user is already a member
    const existingMembership = await GroupMember.findOne({
      where: {
        groupId,
        userId: this.user.id
      }
    });

    if (existingMembership) return false;

    // Check if group allows new members
    const group = await WorkGroup.findByPk(groupId);
    if (!group) return false;

    return group.settings?.allowMemberInvite !== false;
  }

  /**
   * Check if user can create work groups
   * @returns {boolean} True if user can create work groups
   */
  canCreateGroups() {
    // All authenticated users can create work groups
    return !!this.user;
  }

  /**
   * Check if user can submit permission requests
   * @returns {boolean} True if user can submit permission requests
   */
  canSubmitRequests() {
    // All authenticated users can submit permission requests
    return !!this.user;
  }

  /**
   * Check if user can review permission requests
   * @returns {boolean} True if user can review permission requests
   */
  canReviewRequests() {
    // Only admins can review permission requests
    return this.user && this.user.role === 'admin';
  }
}

/**
 * Factory function to create enhanced permission middleware
 * @param {string} action - The action to check
 * @param {string} resourceType - The resource type
 * @returns {Function} Express middleware function
 */
const createEnhancedPermissionMiddleware = (action, resourceType) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to perform this action.'
      });
    }

    const checker = new EnhancedPermissionChecker(req.user);
    await checker.init();

    let hasPermission = false;

    try {
      switch (action) {
        case 'create':
          if (resourceType === 'documents') {
            hasPermission = checker.canCreateDocuments();
          } else if (resourceType === 'groups') {
            hasPermission = checker.canCreateGroups();
          }
          break;

        case 'read':
          if (resourceType === 'documents' && req.params.id) {
            hasPermission = await checker.canViewDocument(req.params.id);
          } else if (resourceType === 'documents') {
            hasPermission = true; // Can list documents
          }
          break;

        case 'update':
          if (resourceType === 'documents' && req.params.id) {
            hasPermission = await checker.canEditDocument(req.params.id);
          }
          break;

        case 'delete':
          if (resourceType === 'documents' && req.params.id) {
            hasPermission = await checker.canDeleteDocument(req.params.id);
          }
          break;

        case 'manage':
          if (resourceType === 'groups' && req.params.id) {
            hasPermission = await checker.canManageGroup(req.params.id);
          }
          break;

        case 'join':
          if (resourceType === 'groups' && req.params.id) {
            hasPermission = await checker.canJoinGroup(req.params.id);
          }
          break;

        case 'request':
          hasPermission = checker.canSubmitRequests();
          break;

        case 'review':
          hasPermission = checker.canReviewRequests();
          break;
      }

      if (hasPermission) {
        next();
      } else {
        res.status(403).json({
          error: 'Access denied',
          message: `No permission for action '${action}' on resource '${resourceType}'`
        });
      }
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        error: 'Server error',
        message: 'Failed to check permissions.'
      });
    }
  };
};

// Export enhanced permission middleware
const enhancedPermissions = {
  documents: {
    create: createEnhancedPermissionMiddleware('create', 'documents'),
    read: createEnhancedPermissionMiddleware('read', 'documents'),
    update: createEnhancedPermissionMiddleware('update', 'documents'),
    delete: createEnhancedPermissionMiddleware('delete', 'documents'),
  },
  groups: {
    create: createEnhancedPermissionMiddleware('create', 'groups'),
    manage: createEnhancedPermissionMiddleware('manage', 'groups'),
    join: createEnhancedPermissionMiddleware('join', 'groups'),
  },
  requests: {
    submit: createEnhancedPermissionMiddleware('request', 'requests'),
    review: createEnhancedPermissionMiddleware('review', 'requests'),
  }
};

module.exports = { enhancedPermissions, EnhancedPermissionChecker };
