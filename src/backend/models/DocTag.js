const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DocTag = sequelize.define('DocTag', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  documentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'documents',
      key: 'id'
    }
  },
  tagId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tags',
      key: 'id'
    }
  }
}, {
  tableName: 'doc_tags',
  timestamps: true,
  indexes: [
    {
      fields: ['documentId', 'tagId'],
      unique: true
    },
    {
      fields: ['documentId']
    },
    {
      fields: ['tagId']
    }
  ]
});

module.exports = DocTag;



