'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class DocumentTag extends Model {
    static associate(models) {
      // DocumentTag belongs to Document
      DocumentTag.belongsTo(models.Document, {
        foreignKey: 'document_id',
        as: 'document'
      });

      // DocumentTag belongs to Tag
      DocumentTag.belongsTo(models.Tag, {
        foreignKey: 'tag_id',
        as: 'tag'
      });
    }

    // Static methods
    static async addTagsToDocument(documentId, tagNames, creatorId = null) {
      const db = await import('./index.js');
      
      const tags = [];
      for (const tagName of tagNames) {
        const { tag } = await db.Tag.findOrCreateByName(tagName, creatorId);
        tags.push(tag);
      }

      // Create associations
      const associations = tags.map(tag => ({
        document_id: documentId,
        tag_id: tag.id
      }));

      await this.bulkCreate(associations, {
        ignoreDuplicates: true
      });

      return tags;
    }

    static async removeTagsFromDocument(documentId, tagNames) {
      const db = await import('./index.js');
      
      const tags = await db.Tag.findAll({
        where: {
          name: tagNames.map(name => name.toLowerCase())
        }
      });

      if (tags.length > 0) {
        await this.destroy({
          where: {
            document_id: documentId,
            tag_id: tags.map(tag => tag.id)
          }
        });
      }

      return tags;
    }

    static async updateDocumentTags(documentId, tagNames, creatorId = null) {
      // Remove all existing tags
      await this.destroy({
        where: { document_id: documentId }
      });

      // Add new tags
      if (tagNames && tagNames.length > 0) {
        await this.addTagsToDocument(documentId, tagNames, creatorId);
      }
    }
  }

  DocumentTag.init({
    document_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'documents',
        key: 'id'
      }
    },
    tag_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'tags',
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
    modelName: 'DocumentTag',
    tableName: 'document_tags',
    timestamps: false, // Handled by created_at
    underscored: true
  });

  return DocumentTag;
};
