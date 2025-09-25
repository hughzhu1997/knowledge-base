// Database models index file
// This file exports all models and sets up associations

const User = require('./User');
const Document = require('./Document');
const Role = require('./Role');
const Revision = require('./Revision');

// Define associations
User.hasMany(Document, { 
  foreignKey: 'authorId', 
  as: 'documents' 
});
Document.belongsTo(User, { 
  foreignKey: 'authorId', 
  as: 'author' 
});

User.hasMany(Revision, { 
  foreignKey: 'updatedBy', 
  as: 'revisions' 
});
Revision.belongsTo(User, { 
  foreignKey: 'updatedBy', 
  as: 'updatedByUser' 
});

Document.hasMany(Revision, { 
  foreignKey: 'documentId', 
  as: 'revisions' 
});
Revision.belongsTo(Document, { 
  foreignKey: 'documentId', 
  as: 'document' 
});

module.exports = {
  User,
  Document,
  Role,
  Revision
};