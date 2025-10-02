// Database models index file
// This file exports all models and sets up associations

const User = require('./User');
const Document = require('./Document');
const Role = require('./Role');
const Revision = require('./Revision');
const Tag = require('./Tag');
const DocTag = require('./DocTag');
const AuditLog = require('./AuditLog');

// IAM System models
const Policy = require('./Policy');
const UserRole = require('./UserRole');
const RolePolicy = require('./RolePolicy');

// Improved Permission System models
const WorkGroup = require('./WorkGroup');
const GroupMember = require('./GroupMember');
const PermissionRequest = require('./PermissionRequest');
const DocumentPermission = require('./DocumentPermission');

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

// 标签关联
Document.belongsToMany(Tag, { 
  through: DocTag, 
  foreignKey: 'documentId', 
  otherKey: 'tagId',
  as: 'tags' 
});
Tag.belongsToMany(Document, { 
  through: DocTag, 
  foreignKey: 'tagId', 
  otherKey: 'documentId',
  as: 'documents' 
});

// 审计日志关联
User.hasMany(AuditLog, { 
  foreignKey: 'userId', 
  as: 'auditLogs' 
});
AuditLog.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

// IAM System associations
// User-Role many-to-many relationship
User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: 'userId',
  otherKey: 'roleId',
  as: 'roles'
});
Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: 'roleId',
  otherKey: 'userId',
  as: 'users'
});

// Role-Policy many-to-many relationship
Role.belongsToMany(Policy, {
  through: RolePolicy,
  foreignKey: 'roleId',
  otherKey: 'policyId',
  as: 'policies'
});
Policy.belongsToMany(Role, {
  through: RolePolicy,
  foreignKey: 'policyId',
  otherKey: 'roleId',
  as: 'roles'
});

// UserRole associations
UserRole.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserRole.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
UserRole.belongsTo(User, { foreignKey: 'assignedBy', as: 'assignedByUser' });

// RolePolicy associations
RolePolicy.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
RolePolicy.belongsTo(Policy, { foreignKey: 'policyId', as: 'policy' });

// Improved Permission System associations
// WorkGroup associations
User.hasMany(WorkGroup, { foreignKey: 'creatorId', as: 'createdGroups' });
WorkGroup.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

// GroupMember associations
User.belongsToMany(WorkGroup, {
  through: GroupMember,
  foreignKey: 'userId',
  otherKey: 'groupId',
  as: 'groups'
});
WorkGroup.belongsToMany(User, {
  through: GroupMember,
  foreignKey: 'groupId',
  otherKey: 'userId',
  as: 'members'
});

GroupMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
GroupMember.belongsTo(WorkGroup, { foreignKey: 'groupId', as: 'group' });
GroupMember.belongsTo(User, { foreignKey: 'invitedBy', as: 'invitedByUser' });

// PermissionRequest associations
User.hasMany(PermissionRequest, { foreignKey: 'userId', as: 'permissionRequests' });
PermissionRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });
PermissionRequest.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

// DocumentPermission associations
Document.hasMany(DocumentPermission, { foreignKey: 'documentId', as: 'permissions' });
DocumentPermission.belongsTo(Document, { foreignKey: 'documentId', as: 'document' });
DocumentPermission.belongsTo(User, { foreignKey: 'userId', as: 'user' });
DocumentPermission.belongsTo(WorkGroup, { foreignKey: 'groupId', as: 'group' });
DocumentPermission.belongsTo(User, { foreignKey: 'grantedBy', as: 'grantedByUser' });

User.hasMany(DocumentPermission, { foreignKey: 'userId', as: 'documentPermissions' });
WorkGroup.hasMany(DocumentPermission, { foreignKey: 'groupId', as: 'documentPermissions' });

module.exports = {
  User,
  Document,
  Role,
  Revision,
  Tag,
  DocTag,
  AuditLog,
  Policy,
  UserRole,
  RolePolicy,
  WorkGroup,
  GroupMember,
  PermissionRequest,
  DocumentPermission
};