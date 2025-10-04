import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Sequelize instance
const sequelize = new Sequelize(process.env.DATABASE_URL || 
  `postgres://${process.env.DB_USER || 'mac'}:${process.env.DB_PASSWORD || null}@${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'knowledge_db'}`, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

// Import models
import User from './User.js';
import Role from './Role.js';
import Policy from './Policy.js';
import UserRole from './UserRole.js';
import RolePolicy from './RolePolicy.js';
import Document from './Document.js';
import Tag from './Tag.js';
import DocumentTag from './DocumentTag.js';
import Revision from './Revision.js';
import AuditLog from './AuditLog.js';

// Initialize models
const db = {};
db.User = User(sequelize);
db.Role = Role(sequelize);
db.Policy = Policy(sequelize);
db.UserRole = UserRole(sequelize);
db.RolePolicy = RolePolicy(sequelize);
db.Document = Document(sequelize, Sequelize.DataTypes);
db.Tag = Tag(sequelize, Sequelize.DataTypes);
db.DocumentTag = DocumentTag(sequelize, Sequelize.DataTypes);
db.Revision = Revision(sequelize, Sequelize.DataTypes);
db.AuditLog = AuditLog(sequelize, Sequelize.DataTypes);

// Define associations

// User ↔ Role (Many-to-Many through UserRole)
db.User.belongsToMany(db.Role, {
  through: db.UserRole,
  foreignKey: 'user_id',
  otherKey: 'role_id',
  as: 'roles'
});

db.Role.belongsToMany(db.User, {
  through: db.UserRole,
  foreignKey: 'role_id',
  otherKey: 'user_id',
  as: 'users'
});

// Role ↔ Policy (Many-to-Many through RolePolicy)
db.Role.belongsToMany(db.Policy, {
  through: db.RolePolicy,
  foreignKey: 'role_id',
  otherKey: 'policy_id',
  as: 'policies'
});

db.Policy.belongsToMany(db.Role, {
  through: db.RolePolicy,
  foreignKey: 'policy_id',
  otherKey: 'role_id',
  as: 'roles'
});

// UserRole associations
db.UserRole.belongsTo(db.User, {
  foreignKey: 'user_id',
  as: 'user'
});

db.UserRole.belongsTo(db.Role, {
  foreignKey: 'role_id',
  as: 'role'
});

db.UserRole.belongsTo(db.User, {
  foreignKey: 'assigned_by',
  as: 'assigner'
});

// RolePolicy associations
db.RolePolicy.belongsTo(db.Role, {
  foreignKey: 'role_id',
  as: 'role'
});

db.RolePolicy.belongsTo(db.Policy, {
  foreignKey: 'policy_id',
  as: 'policy'
});

// Direct User associations
db.User.hasMany(db.UserRole, {
  foreignKey: 'user_id',
  as: 'userRoles'
});

db.User.hasMany(db.UserRole, {
  foreignKey: 'assigned_by',
  as: 'assignedRoles'
});

// Direct Role associations
db.Role.hasMany(db.UserRole, {
  foreignKey: 'role_id',
  as: 'userRoles'
});

db.Role.hasMany(db.RolePolicy, {
  foreignKey: 'role_id',
  as: 'rolePolicies'
});

// Direct Policy associations
db.Policy.hasMany(db.RolePolicy, {
  foreignKey: 'policy_id',
  as: 'rolePolicies'
});

// Document ↔ User associations
db.Document.belongsTo(db.User, {
  foreignKey: 'author_id',
  as: 'author'
});

db.User.hasMany(db.Document, {
  foreignKey: 'author_id',
  as: 'documents'
});

// Document ↔ Tag associations
db.Document.belongsToMany(db.Tag, {
  through: db.DocumentTag,
  foreignKey: 'document_id',
  otherKey: 'tag_id',
  as: 'tags'
});

db.Tag.belongsToMany(db.Document, {
  through: db.DocumentTag,
  foreignKey: 'tag_id',
  otherKey: 'document_id',
  as: 'documents'
});

// Document ↔ Revision associations
db.Document.hasMany(db.Revision, {
  foreignKey: 'document_id',
  as: 'revisions'
});

db.Revision.belongsTo(db.Document, {
  foreignKey: 'document_id',
  as: 'document'
});

db.Revision.belongsTo(db.User, {
  foreignKey: 'updated_by',
  as: 'updater'
});

// Tag ↔ User associations
db.Tag.belongsTo(db.User, {
  foreignKey: 'created_by',
  as: 'creator'
});

db.User.hasMany(db.Tag, {
  foreignKey: 'created_by',
  as: 'createdTags'
});

// AuditLog associations
db.AuditLog.belongsTo(db.User, {
  foreignKey: 'actor_id',
  as: 'actor'
});

db.AuditLog.belongsTo(db.User, {
  foreignKey: 'target_user_id',
  as: 'targetUser'
});

db.User.hasMany(db.AuditLog, {
  foreignKey: 'actor_id',
  as: 'auditLogs'
});

db.User.hasMany(db.AuditLog, {
  foreignKey: 'target_user_id',
  as: 'targetAuditLogs'
});

// Export everything
db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;