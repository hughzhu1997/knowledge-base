// Document.js
// Document model definition for knowledge base documents

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Document model definition
 * Defines the structure and behavior of documents in the knowledge base
 */
const Document = sequelize.define('Document', {
  // Primary key - UUID for better security
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Document title with length validation
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 200]
    }
  },
  // Document category for organization
  category: {
    type: DataTypes.ENUM('prd', 'architecture', 'api', 'db', 'code', 'dependency', 'tech', 'tools', 'security', 'tutorial', 'other'),
    allowNull: false
  },
  // Document type classification for better organization and filtering
  docType: {
    type: DataTypes.ENUM('SOP', 'Review', 'Research', 'General'),
    allowNull: true,
    defaultValue: 'General'
  },
  // Document content (TEXT for large content)
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  // Foreign key to User model (author)
  authorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Document version for tracking changes
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  // Document status for workflow management
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft'
  },
  // Timestamp when document was published
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Timestamp when document was archived
  archivedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Document visibility control
  visibility: {
    type: DataTypes.ENUM('public', 'private'),
    defaultValue: 'private',
    allowNull: false
  }
}, {
  tableName: 'documents',
  timestamps: true,
  // Database indexes for performance optimization
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
    },
    {
      fields: ['status']
    },
    {
      fields: ['docType']
    }
  ]
});

/**
 * Instance method to get content snippet
 * @returns {string} Truncated content with ellipsis if longer than 200 characters
 */
Document.prototype.getSnippet = function() {
  if (this.content && this.content.length > 200) {
    return this.content.substring(0, 200) + '...';
  }
  return this.content || '';
};

/**
 * Model associations
 * Defines relationships between Document and other models
 * @param {Object} models - Sequelize models object
 */
Document.associate = (models) => {
  // Many-to-many relationship with Tag model
  Document.belongsToMany(models.Tag, {
    through: 'DocTag',
    foreignKey: 'documentId',
    otherKey: 'tagId',
    as: 'tags'
  });
  
  // Many-to-one relationship with User model (author)
  Document.belongsTo(models.User, {
    foreignKey: 'authorId',
    as: 'author'
  });
};

module.exports = Document;