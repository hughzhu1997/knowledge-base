'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Revision extends Model {
    static associate(models) {
      // Revision belongs to Document
      Revision.belongsTo(models.Document, {
        foreignKey: 'document_id',
        as: 'document'
      });

      // Revision belongs to User (updated by)
      Revision.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
      });
    }

    // Instance methods
    get isLatest() {
      return this.version === this.document?.version;
    }

    // Static methods
    static async getDocumentHistory(documentId, limit = 10) {
      return await this.findAll({
        where: { document_id: documentId },
        include: [{
          model: sequelize.models.User,
          as: 'updater',
          attributes: ['id', 'username', 'email']
        }],
        order: [['version', 'DESC']],
        limit
      });
    }

    static async getLatestRevision(documentId) {
      return await this.findOne({
        where: { document_id: documentId },
        include: [{
          model: sequelize.models.User,
          as: 'updater',
          attributes: ['id', 'username', 'email']
        }],
        order: [['version', 'DESC']]
      });
    }

    static async createRevision(documentId, revisionData) {
      const { Document } = await import('./index.js');
      
      const document = await Document.findByPk(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      const revision = await this.create({
        document_id: documentId,
        version: document.version,
        ...revisionData
      });

      return revision;
    }

    static async compareRevisions(documentId, version1, version2) {
      const revisions = await this.findAll({
        where: {
          document_id: documentId,
          version: [version1, version2]
        },
        order: [['version', 'ASC']]
      });

      if (revisions.length !== 2) {
        throw new Error('One or both revisions not found');
      }

      const [oldRevision, newRevision] = revisions;

      return {
        old: oldRevision,
        new: newRevision,
        changes: {
          title: oldRevision.title !== newRevision.title,
          content: oldRevision.content !== newRevision.content,
          summary: oldRevision.summary !== newRevision.summary
        }
      };
    }
  }

  Revision.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    document_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'documents',
        key: 'id'
      }
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    change_summary: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Revision',
    tableName: 'revisions',
    timestamps: false, // Handled by created_at
    underscored: true
  });

  return Revision;
};
