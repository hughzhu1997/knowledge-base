const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 200]
    }
  },
  category: {
    type: DataTypes.ENUM('prd', 'architecture', 'api', 'db', 'code', 'dependency'),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  authorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1
    }
  }
}, {
  tableName: 'documents',
  timestamps: true,
  indexes: [
    {
      fields: ['title', 'content'],
      using: 'gin',
      operator: 'gin_trgm_ops'
    },
    {
      fields: ['category']
    },
    {
      fields: ['authorId']
    },
    {
      fields: ['updatedAt']
    }
  ]
});

// Virtual field for snippet
Document.prototype.getSnippet = function() {
  if (this.content && this.content.length > 200) {
    return this.content.substring(0, 200) + '...';
  }
  return this.content || '';
};

module.exports = Document;