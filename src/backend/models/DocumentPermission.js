const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * DocumentPermission Model
 * Represents permissions for specific documents.
 */
const DocumentPermission = sequelize.define('DocumentPermission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  documentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'document_id',
    references: {
      model: 'documents',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  groupId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'group_id',
    references: {
      model: 'work_groups',
      key: 'id'
    }
  },
  permissionType: {
    type: DataTypes.ENUM('owner', 'collaborator', 'reader'),
    allowNull: false,
    field: 'permission_type'
  },
  grantedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'granted_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  grantedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    field: 'granted_at'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    field: 'is_active'
  }
}, {
  tableName: 'document_permissions',
  timestamps: true,
  indexes: [
    {
      fields: ['document_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['group_id']
    },
    {
      fields: ['permission_type']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['expires_at']
    }
  ]
});

/**
 * Instance method to check if permission is active
 * @returns {boolean} True if permission is active
 */
DocumentPermission.prototype.isPermissionActive = function() {
  if (!this.isActive) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  return true;
};

/**
 * Instance method to check if user can edit document
 * @returns {boolean} True if user can edit document
 */
DocumentPermission.prototype.canEdit = function() {
  return this.isPermissionActive() && ['owner', 'collaborator'].includes(this.permissionType);
};

/**
 * Instance method to check if user can delete document
 * @returns {boolean} True if user can delete document
 */
DocumentPermission.prototype.canDelete = function() {
  return this.isPermissionActive() && this.permissionType === 'owner';
};

/**
 * Static method to get document permissions
 * @param {string} documentId - The document ID
 * @returns {Promise<DocumentPermission[]>} Array of DocumentPermission instances
 */
DocumentPermission.getDocumentPermissions = async function(documentId) {
  return this.findAll({
    where: { 
      documentId,
      isActive: true
    },
    order: [['grantedAt', 'DESC']]
  });
};

/**
 * Static method to get user document permissions
 * @param {string} userId - The user ID
 * @returns {Promise<DocumentPermission[]>} Array of DocumentPermission instances
 */
DocumentPermission.getUserPermissions = async function(userId) {
  return this.findAll({
    where: { 
      userId,
      isActive: true
    },
    order: [['grantedAt', 'DESC']]
  });
};

module.exports = DocumentPermission;
