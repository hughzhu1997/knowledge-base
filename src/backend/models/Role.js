const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  roleName: {
    type: DataTypes.ENUM('admin', 'developer', 'user'),
    allowNull: false
  },
  permissions: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: 'read'
  }
}, {
  tableName: 'roles',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['roleName']
    }
  ]
});

// Static method to get role permissions
Role.getPermissions = async function(roleName) {
  const role = await this.findOne({ 
    where: { roleName },
    attributes: ['permissions']
  });
  return role ? role.permissions : [];
};

// Instance method to check if role has specific permission
Role.prototype.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

module.exports = Role;