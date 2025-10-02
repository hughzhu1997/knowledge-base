const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['create', 'update', 'delete', 'publish', 'unpublish', 'archive', 'login', 'logout']]
    }
  },
  resourceType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['User', 'Document', 'Role', 'Revision', 'AuditLog']]
    }
  },
  resourceId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  details: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['action']
    },
    {
      fields: ['resourceType']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// 关联到User模型
AuditLog.associate = (models) => {
  AuditLog.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

module.exports = AuditLog;



