const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * GroupMember Model
 * Join table for the many-to-many relationship between Users and WorkGroups.
 */
const GroupMember = sequelize.define('GroupMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  groupId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'group_id',
    references: {
      model: 'work_groups',
      key: 'id'
    }
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
  role: {
    type: DataTypes.ENUM('leader', 'editor', 'member'),
    defaultValue: 'member',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'pending', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  joinedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'joined_at'
  },
  invitedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'invited_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'group_members',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['group_id', 'user_id']
    },
    {
      fields: ['group_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['role']
    }
  ]
});

/**
 * Instance method to check if membership is active
 * @returns {boolean} True if membership is active
 */
GroupMember.prototype.isActive = function() {
  return this.status === 'active';
};

/**
 * Instance method to check if user can manage group
 * @returns {boolean} True if user can manage the group
 */
GroupMember.prototype.canManage = function() {
  return this.role === 'leader';
};

/**
 * Instance method to check if user can edit group content
 * @returns {boolean} True if user can edit group content
 */
GroupMember.prototype.canEdit = function() {
  return ['leader', 'editor'].includes(this.role);
};

module.exports = GroupMember;
