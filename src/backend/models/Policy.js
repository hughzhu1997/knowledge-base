import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Policy = sequelize.define('Policy', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 100],
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    document: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidPolicyDocument(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Policy document must be a valid JSON object');
          }
          
          if (!value.Version || !value.Statement) {
            throw new Error('Policy document must have Version and Statement fields');
          }
          
          if (!Array.isArray(value.Statement)) {
            throw new Error('Policy Statement must be an array');
          }
          
          // Validate each statement
          value.Statement.forEach((statement, index) => {
            if (!statement.Effect || !['Allow', 'Deny'].includes(statement.Effect)) {
              throw new Error(`Statement ${index} must have valid Effect (Allow/Deny)`);
            }
            if (!statement.Action && !statement.Action?.length) {
              throw new Error(`Statement ${index} must have Action field`);
            }
            if (!statement.Resource && !statement.Resource?.length) {
              throw new Error(`Statement ${index} must have Resource field`);
            }
          });
        }
      }
    },
    is_system_policy: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    tableName: 'policies',
    underscored: true,
    timestamps: true
  });

  return Policy;
};
