// RolePolicy.js
// Role-Policy association model for IAM system

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * RolePolicy model definition
 * Many-to-many relationship between Roles and Policies
 */
const RolePolicy = sequelize.define('RolePolicy', {
  // Primary key - UUID for better security
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Role ID reference
  roleId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'role_id',
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  // Policy ID reference
  policyId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'policy_id',
    references: {
      model: 'policies',
      key: 'id'
    }
  }
}, {
  tableName: 'role_policies',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['role_id', 'policy_id']
    },
    {
      fields: ['role_id']
    },
    {
      fields: ['policy_id']
    }
  ]
});

module.exports = RolePolicy;
