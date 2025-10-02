// Policy.js
// Policy model definition for IAM system

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Policy model definition
 * Defines IAM-style policies with JSON documents
 */
const Policy = sequelize.define('Policy', {
  // Primary key - UUID for better security
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Policy name with uniqueness constraint
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 100]
    }
  },
  // Policy description
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // IAM policy document in JSON format
  policyDocument: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'policy_document',
    validate: {
      isValidPolicyDocument(value) {
        if (!value || typeof value !== 'object') {
          throw new Error('Policy document must be a valid JSON object');
        }
        
        if (!value.Version) {
          throw new Error('Policy document must have a Version field');
        }
        
        if (!value.Statement || !Array.isArray(value.Statement)) {
          throw new Error('Policy document must have a Statement array');
        }
        
        // Validate each statement
        value.Statement.forEach((statement, index) => {
          if (!statement.Effect || !['Allow', 'Deny'].includes(statement.Effect)) {
            throw new Error(`Statement ${index} must have Effect set to Allow or Deny`);
          }
          
          if (!statement.Action || (!Array.isArray(statement.Action) && typeof statement.Action !== 'string')) {
            throw new Error(`Statement ${index} must have Action field`);
          }
          
          if (!statement.Resource || (!Array.isArray(statement.Resource) && typeof statement.Resource !== 'string')) {
            throw new Error(`Statement ${index} must have Resource field`);
          }
        });
      }
    }
  },
  // Policy version
  version: {
    type: DataTypes.STRING,
    defaultValue: '1.0',
    validate: {
      len: [1, 10]
    }
  }
}, {
  tableName: 'policies',
  timestamps: true,
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['version']
    }
  ]
});

/**
 * Instance method to validate policy document
 * @param {Object} policyDoc - Policy document to validate
 * @returns {boolean} True if valid
 */
Policy.prototype.validatePolicyDocument = function(policyDoc) {
  try {
    this.policyDocument = policyDoc;
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Instance method to check if policy allows action on resource
 * @param {string} action - Action to check (e.g., 'docs:Read')
 * @param {string} resource - Resource to check (e.g., 'docs/123')
 * @param {Object} context - Additional context (e.g., user info)
 * @returns {string|null} 'Allow', 'Deny', or null (no match)
 */
Policy.prototype.evaluatePermission = function(action, resource, context = {}) {
  if (!this.policyDocument || !this.policyDocument.Statement) {
    return null;
  }
  
  let result = null;
  
  for (const statement of this.policyDocument.Statement) {
    // Check if action matches
    const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
    const actionMatch = actions.some(act => {
      if (act === '*') return true;
      if (act.endsWith('*')) {
        return action.startsWith(act.slice(0, -1));
      }
      return act === action;
    });
    
    if (!actionMatch) continue;
    
    // Check if resource matches
    const resources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource];
    const resourceMatch = resources.some(res => {
      if (res === '*') return true;
      if (res.includes('${')) {
        // Handle variable substitution
        let processedRes = res;
        Object.keys(context).forEach(key => {
          processedRes = processedRes.replace(`\${${key}}`, context[key]);
        });
        return this.matchResource(processedRes, resource);
      }
      return this.matchResource(res, resource);
    });
    
    if (!resourceMatch) continue;
    
    // Check conditions if present
    if (statement.Condition) {
      if (!this.evaluateCondition(statement.Condition, context)) {
        continue;
      }
    }
    
    // Deny takes precedence over Allow
    if (statement.Effect === 'Deny') {
      return 'Deny';
    }
    
    if (statement.Effect === 'Allow') {
      result = 'Allow';
    }
  }
  
  return result;
};

/**
 * Helper method to match resource patterns
 * @param {string} pattern - Resource pattern
 * @param {string} resource - Actual resource
 * @returns {boolean} True if matches
 */
Policy.prototype.matchResource = function(pattern, resource) {
  if (pattern === '*') return true;
  if (pattern.endsWith('*')) {
    return resource.startsWith(pattern.slice(0, -1));
  }
  return pattern === resource;
};

/**
 * Helper method to evaluate conditions
 * @param {Object} condition - Condition object
 * @param {Object} context - Context object
 * @returns {boolean} True if condition is met
 */
Policy.prototype.evaluateCondition = function(condition, context) {
  for (const [operator, conditions] of Object.entries(condition)) {
    for (const [key, expectedValue] of Object.entries(conditions)) {
      const actualValue = context[key];
      
      switch (operator) {
        case 'StringEquals':
          if (actualValue !== expectedValue) return false;
          break;
        case 'StringLike':
          if (!this.stringLike(actualValue, expectedValue)) return false;
          break;
        case 'NumericEquals':
          if (Number(actualValue) !== Number(expectedValue)) return false;
          break;
        case 'DateEquals':
          if (new Date(actualValue).getTime() !== new Date(expectedValue).getTime()) return false;
          break;
        default:
          return false;
      }
    }
  }
  return true;
};

/**
 * Helper method for StringLike condition
 * @param {string} actual - Actual value
 * @param {string} pattern - Pattern with wildcards
 * @returns {boolean} True if matches
 */
Policy.prototype.stringLike = function(actual, pattern) {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  return regex.test(actual);
};

module.exports = Policy;

