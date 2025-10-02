const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Revision = sequelize.define('Revision', {
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
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'revisions',
  timestamps: true,
  indexes: [
    {
      fields: ['documentId', 'version'],
      unique: true
    },
    {
      fields: ['updatedAt']
    },
    {
      fields: ['updatedBy']
    }
  ]
});

// Static method to get document revisions
Revision.getDocumentRevisions = async function(documentId, limit = 10) {
  return await this.findAll({
    where: { documentId },
    include: [{
      model: sequelize.models.User,
      as: 'updatedByUser',
      attributes: ['id', 'username', 'email']
    }],
    order: [['version', 'DESC']],
    limit
  });
};

// Static method to get specific revision
Revision.getRevision = async function(documentId, version) {
  return await this.findOne({
    where: { documentId, version },
    include: [{
      model: sequelize.models.User,
      as: 'updatedByUser',
      attributes: ['id', 'username', 'email']
    }]
  });
};

module.exports = Revision;