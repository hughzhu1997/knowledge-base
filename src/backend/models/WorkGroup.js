const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * WorkGroup Model
 * Represents a work group where users can collaborate and share documents.
 */
const WorkGroup = sequelize.define('WorkGroup', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  creatorId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'creator_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'is_public'
  },
  settings: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      allowMemberInvite: true,
      requireApproval: true,
      defaultPermission: 'reader'
    }
  }
}, {
  tableName: 'work_groups',
  timestamps: true,
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['creator_id']
    },
    {
      fields: ['is_public']
    }
  ]
});

/**
 * Instance method to check if user can manage this group
 * @param {string} userId - The user ID to check
 * @returns {boolean} True if user can manage the group
 */
WorkGroup.prototype.canManage = function(userId) {
  return this.creatorId === userId;
};

/**
 * Static method to get groups by user
 * @param {string} userId - The user ID
 * @returns {Promise<WorkGroup[]>} Array of WorkGroup instances
 */
WorkGroup.getGroupsByUser = async function(userId) {
  const { GroupMember } = require('./index');
  
  return this.findAll({
    include: [
      {
        model: GroupMember,
        as: 'members',
        where: { userId },
        required: true
      }
    ]
  });
};

module.exports = WorkGroup;
