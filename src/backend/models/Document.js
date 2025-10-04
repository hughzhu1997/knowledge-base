'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Document extends Model {
    static associate(models) {
      // Document belongs to User (author)
      Document.belongsTo(models.User, {
        foreignKey: 'author_id',
        as: 'author'
      });

      // Document has many Tags through DocumentTag
      Document.belongsToMany(models.Tag, {
        through: models.DocumentTag,
        foreignKey: 'document_id',
        otherKey: 'tag_id',
        as: 'tags'
      });

      // Document has many DocumentTags
      Document.hasMany(models.DocumentTag, {
        foreignKey: 'document_id',
        as: 'documentTags'
      });

      // Document has many Revisions
      Document.hasMany(models.Revision, {
        foreignKey: 'document_id',
        as: 'revisions'
      });
    }

    // Instance methods
    async publish() {
      this.status = 'published';
      this.published_at = new Date();
      this.version += 1;
      await this.save();
      
      // Create revision record
      await this.createRevision({
        version: this.version,
        title: this.title,
        content: this.content,
        summary: this.summary,
        change_summary: 'Document published',
        updated_by: this.author_id
      });
    }

    async archive() {
      this.status = 'archived';
      this.archived_at = new Date();
      await this.save();
    }

    async createRevision(revisionData) {
      const db = await import('./index.js');
      const Revision = db.default.Revision;
      return await Revision.create({
        document_id: this.id,
        ...revisionData
      });
    }

    // Virtual fields
    get isPublished() {
      return this.status === 'published';
    }

    get isArchived() {
      return this.status === 'archived';
    }

    get isDraft() {
      return this.status === 'draft';
    }
  }

  Document.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 200]
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['prd', 'architecture', 'api', 'db', 'code', 'dependency']]
      }
    },
    doc_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'General',
      validate: {
        isIn: [['SOP', 'Review', 'Research', 'General']]
      }
    },
    author_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'draft',
      validate: {
        isIn: [['draft', 'published', 'archived']]
      }
    },
    visibility: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'private',
      validate: {
        isIn: [['private', 'group', 'public']]
      }
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    archived_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Document',
    tableName: 'documents',
    timestamps: false, // Handled by created_at and updated_at
    underscored: true,
    hooks: {
      beforeUpdate: async (document, options) => {
        // Auto-increment version on content changes
        if (document.changed('content') || document.changed('title')) {
          document.version += 1;
          
      // Create revision record
      const db = await import('./index.js');
      const Revision = db.default.Revision;
          await Revision.create({
            document_id: document.id,
            version: document.version,
            title: document.title,
            content: document.content,
            summary: document.summary,
            change_summary: 'Document updated',
            updated_by: document.author_id
          });
        }
      }
    }
  });

  return Document;
};
