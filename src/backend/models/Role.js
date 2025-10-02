// Role.js
// Role model definition for IAM system

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Role model definition
 * Defines roles that can be assigned to users
 */
const Role = sequelize.define('Role', {
  // Primary key - UUID for better security
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Role name with uniqueness constraint
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 100]
    }
  },
  // Role description
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // System roles cannot be deleted
  isSystemRole: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_system_role'
  }
}, {
  tableName: 'roles',
  timestamps: true,
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['is_system_role']
    }
  ]
});

/**
 * Instance method to check if role can be deleted
 * @returns {boolean} True if role can be deleted
 */
Role.prototype.canBeDeleted = function() {
  return !this.isSystemRole;
};

/**
 * Instance method to get role policies
 * @returns {Promise<Array>} Array of policies associated with this role
 */
Role.prototype.getPolicies = async function() {
  const { Policy } = require('./index');
  return await this.getPolicies();
};

module.exports = Role;