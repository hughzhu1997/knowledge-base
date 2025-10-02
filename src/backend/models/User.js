// User.js
// User model definition with authentication and role management

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * User model definition
 * Defines the structure and behavior of user accounts in the system
 */
const User = sequelize.define('User', {
  // Primary key - UUID for better security
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Username field with length validation
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 50]
    }
  },
  // Email field with uniqueness and format validation
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  // Password field with length validation (hashed before storage)
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  // Legacy role field - will be deprecated in favor of IAM system
  role: {
    type: DataTypes.ENUM('admin', 'editor', 'user'),
    defaultValue: 'user'
  },
  // Account status for enabling/disabling users
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  // Model hooks for password hashing
  hooks: {
    // Hash password before creating new user
    beforeCreate: async (user) => {
      if (user.password) {
        const saltRounds = 10;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
    },
    // Hash password before updating if password field changed
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const saltRounds = 10;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
    }
  }
});

/**
 * Instance method to verify password
 * @param {string} password - Plain text password to verify
 * @returns {Promise<boolean>} True if password matches, false otherwise
 */
User.prototype.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

/**
 * Instance method to convert user to JSON (excludes password)
 * @returns {Object} User object without password field
 */
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

module.exports = User;