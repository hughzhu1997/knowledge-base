'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Tag extends Model {
    static associate(models) {
      // Tag belongs to User (creator)
      Tag.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });

      // Tag belongs to many Documents through DocumentTag
      Tag.belongsToMany(models.Document, {
        through: models.DocumentTag,
        foreignKey: 'tag_id',
        otherKey: 'document_id',
        as: 'documents'
      });

      // Tag has many DocumentTags
      Tag.hasMany(models.DocumentTag, {
        foreignKey: 'tag_id',
        as: 'documentTags'
      });
    }

    // Instance methods
    async getDocumentCount() {
      return await this.countDocuments();
    }

    // Static methods
    static async findOrCreateByName(name, creatorId = null) {
      const [tag, created] = await this.findOrCreate({
        where: { name: name.toLowerCase() },
        defaults: {
          name: name.toLowerCase(),
          created_by: creatorId
        }
      });
      return { tag, created };
    }

    static async getPopularTags(limit = 10) {
      const { DocumentTag } = require('./index');
      
      const popularTags = await this.findAll({
        include: [{
          model: DocumentTag,
          as: 'documentTags',
          attributes: []
        }],
        attributes: [
          'id',
          'name',
          'description',
          'color',
          [sequelize.fn('COUNT', sequelize.col('documentTags.tag_id')), 'documentCount']
        ],
        group: ['Tag.id'],
        order: [[sequelize.literal('documentCount'), 'DESC']],
        limit
      });

      return popularTags;
    }
  }

  Tag.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: false,
      defaultValue: '#3B82F6',
      validate: {
        is: /^#[0-9A-F]{6}$/i
      }
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
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
    modelName: 'Tag',
    tableName: 'tags',
    timestamps: false, // Handled by created_at
    underscored: true,
    hooks: {
      beforeCreate: (tag) => {
        // Normalize tag name to lowercase
        tag.name = tag.name.toLowerCase();
      },
      beforeUpdate: (tag) => {
        // Normalize tag name to lowercase
        if (tag.changed('name')) {
          tag.name = tag.name.toLowerCase();
        }
      }
    }
  });

  return Tag;
};
