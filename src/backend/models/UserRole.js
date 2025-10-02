// UserRole.js
// User-Role association model for IAM system

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * UserRole model definition
 * Many-to-many relationship between Users and Roles
 */
const UserRole = sequelize.define('UserRole', {
  // Primary key - UUID for better security
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // User ID reference
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Role ID reference
  roleId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'role_id',
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  // Who assigned this role
  assignedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'assigned_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // When the role was assigned
  assignedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'assigned_at'
  },
  // When the role expires (NULL means never expires)
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at'
  }
}, {
  tableName: 'user_roles',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'role_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['role_id']
    },
    {
      fields: ['assigned_by']
    },
    {
      fields: ['expires_at']
    }
  ]
});

/**
 * Instance method to check if role assignment is active
 * @returns {boolean} True if role is active and not expired
 */
UserRole.prototype.isActive = function() {
  if (!this.expiresAt) return true;
  return new Date() < new Date(this.expiresAt);
};

/**
 * Instance method to get time until expiration
 * @returns {number|null} Milliseconds until expiration, or null if never expires
 */
UserRole.prototype.getTimeUntilExpiration = function() {
  if (!this.expiresAt) return null;
  return new Date(this.expiresAt).getTime() - new Date().getTime();
};

module.exports = UserRole;
