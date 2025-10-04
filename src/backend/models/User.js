import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

export default (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        notEmpty: true,
        isAlphanumeric: {
          args: true,
          msg: 'Username must contain only letters and numbers'
        }
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    display_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    underscored: true,
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        // Hash password if it's not already hashed
        if (user.changed('password_hash') && !user.password_hash.startsWith('$2')) {
          user.password_hash = await bcrypt.hash(user.password_hash, parseInt(process.env.BCRYPT_COST) || 12);
        }
      },
      beforeUpdate: async (user) => {
        // Hash password if it's being changed and not already hashed
        if (user.changed('password_hash') && !user.password_hash.startsWith('$2')) {
          user.password_hash = await bcrypt.hash(user.password_hash, parseInt(process.env.BCRYPT_COST) || 12);
        }
      }
    },
    instanceMethods: {
      async validatePassword(password) {
        return await bcrypt.compare(password, this.password_hash);
      }
    }
  });

  return User;
};
