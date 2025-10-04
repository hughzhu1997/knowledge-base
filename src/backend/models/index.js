import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Sequelize instance
const sequelize = new Sequelize(process.env.DATABASE_URL || 
  `postgres://${process.env.DB_USER || 'knowledge_user'}:${process.env.DB_PASSWORD || 'knowledge_pass'}@${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'knowledge_db'}`, {
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

// Initialize models
const db = {};
db.User = User(sequelize);
db.Role = Role(sequelize);
db.Policy = Policy(sequelize);
db.UserRole = UserRole(sequelize);
db.RolePolicy = RolePolicy(sequelize);

// Define associations

// User ↔ Role (Many-to-Many through UserRole)
db.User.belongsMany(db.Role, {
  through: db.UserRole,
  foreignKey: 'user_id',
  otherKey: 'role_id',
  as: 'roles'
});

db.Role.belongsMany(db.User, {
  through: db.UserRole,
  foreignKey: 'role_id',
  otherKey: 'user_id',
  as: 'users'
});

// Role ↔ Policy (Many-to-Many through RolePolicy)
db.Role.belongsMany(db.Policy, {
  through: db.RolePolicy,
  foreignKey: 'role_id',
  otherKey: 'policy_id',
  as: 'policies'
});

db.Policy.belongsMany(db.Role, {
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

// Export everything
db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;