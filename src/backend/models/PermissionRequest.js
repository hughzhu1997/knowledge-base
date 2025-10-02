const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * PermissionRequest Model
 * Represents a user's request for additional permissions or group membership.
 */
const PermissionRequest = sequelize.define('PermissionRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  requestType: {
    type: DataTypes.ENUM('join_group', 'role_upgrade', 'special_permission', 'document_access'),
    allowNull: false,
    field: 'request_type'
  },
  targetId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'target_id',
    comment: 'ID of the target (group, role, document, etc.)'
  },
  targetType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'target_type',
    comment: 'Type of the target (group, role, document, etc.)'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'reviewed_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reviewed_at'
  },
  reviewNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'review_notes'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional metadata for the request'
  }
}, {
  tableName: 'permission_requests',
  timestamps: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['request_type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['target_id']
    },
    {
      fields: ['reviewed_by']
    },
    {
      fields: ['created_at']
    }
  ]
});

/**
 * Instance method to check if request is pending
 * @returns {boolean} True if request is pending
 */
PermissionRequest.prototype.isPending = function() {
  return this.status === 'pending';
};

/**
 * Instance method to check if request is approved
 * @returns {boolean} True if request is approved
 */
PermissionRequest.prototype.isApproved = function() {
  return this.status === 'approved';
};

/**
 * Instance method to check if request is rejected
 * @returns {boolean} True if request is rejected
 */
PermissionRequest.prototype.isRejected = function() {
  return this.status === 'rejected';
};

/**
 * Static method to get requests by user
 * @param {string} userId - The user ID
 * @returns {Promise<PermissionRequest[]>} Array of PermissionRequest instances
 */
PermissionRequest.getRequestsByUser = async function(userId) {
  return this.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']]
  });
};

/**
 * Static method to get pending requests
 * @returns {Promise<PermissionRequest[]>} Array of pending PermissionRequest instances
 */
PermissionRequest.getPendingRequests = async function() {
  return this.findAll({
    where: { status: 'pending' },
    order: [['createdAt', 'ASC']]
  });
};

module.exports = PermissionRequest;
