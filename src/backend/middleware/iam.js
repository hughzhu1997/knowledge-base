import db from '../models/index.js';

/**
 * IAM Policy Evaluation Middleware
 * Implements AWS-style IAM policy evaluation with Deny-first principle
 */

/**
 * Parse IAM policy document
 * @param {Object} policyDocument - IAM policy document
 * @returns {Object} Parsed policy with statements
 */
const parsePolicyDocument = (policyDocument) => {
  if (typeof policyDocument === 'string') {
    try {
      return JSON.parse(policyDocument);
    } catch (error) {
      console.error('Failed to parse policy document:', error);
      return null;
    }
  }
  return policyDocument;
};

/**
 * Check if resource matches pattern
 * @param {string} resource - Resource to check
 * @param {string} pattern - Pattern to match against
 * @param {Object} context - Context for variable substitution
 * @returns {boolean} True if resource matches pattern
 */
const matchesResource = (resource, pattern, context = {}) => {
  if (pattern === '*') return true;
  
  // Handle variable substitution (e.g., ${user.id})
  let processedPattern = pattern;
  if (pattern.includes('${')) {
    processedPattern = pattern.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      const parts = varName.split('.');
      let value = context;
      for (const part of parts) {
        value = value?.[part];
      }
      return value || match; // Return original if not found
    });
  }
  
  if (processedPattern === resource) return true;
  
  // Handle wildcard patterns
  if (processedPattern.includes('*')) {
    const regexPattern = processedPattern.replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(resource);
  }
  
  return false;
};

/**
 * Check if action matches pattern
 * @param {string} action - Action to check
 * @param {string} pattern - Pattern to match against
 * @returns {boolean} True if action matches pattern
 */
const matchesAction = (action, pattern) => {
  if (pattern === '*') return true;
  if (pattern === action) return true;
  
  // Handle wildcard patterns
  if (pattern.includes('*')) {
    const regexPattern = pattern.replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(action);
  }
  
  return false;
};

/**
 * Evaluate a single policy statement
 * @param {Object} statement - Policy statement
 * @param {string} action - Action being performed
 * @param {string} resource - Resource being accessed
 * @param {Object} context - Additional context (user info, etc.)
 * @returns {string|null} 'Allow', 'Deny', or null (no match)
 */
const evaluateStatement = (statement, action, resource, context = {}) => {
  const { Effect, Action, Resource, Condition } = statement;
  
  // Check action match
  const actions = Array.isArray(Action) ? Action : [Action];
  const actionMatch = actions.some(a => matchesAction(action, a));
  
  if (!actionMatch) return null;
  
  // Check resource match
  const resources = Array.isArray(Resource) ? Resource : [Resource];
  const resourceMatch = resources.some(r => matchesResource(resource, r, context));
  
  if (!resourceMatch) return null;
  
  // Check conditions if present
  if (Condition) {
    // Simple condition evaluation - can be extended
    const conditionMet = evaluateCondition(Condition, context);
    if (!conditionMet) return null;
  }
  
  return Effect; // 'Allow' or 'Deny'
};

/**
 * Evaluate condition (simplified implementation)
 * @param {Object} condition - Condition object
 * @param {Object} context - Context with user info
 * @returns {boolean} True if condition is met
 */
const evaluateCondition = (condition, context) => {
  // Simple condition evaluation
  // In a real implementation, this would be more sophisticated
  
  for (const [operator, conditions] of Object.entries(condition)) {
    switch (operator) {
      case 'StringEquals':
        for (const [key, value] of Object.entries(conditions)) {
          if (context[key] !== value) return false;
        }
        break;
      case 'StringLike':
        for (const [key, pattern] of Object.entries(conditions)) {
          if (!matchesResource(context[key], pattern)) return false;
        }
        break;
      // Add more condition types as needed
      default:
        console.warn(`Unknown condition operator: ${operator}`);
        return false;
    }
  }
  
  return true;
};

/**
 * Get user's policies from database
 * @param {string} userId - User ID
 * @returns {Array} Array of policy documents
 */
const getUserPolicies = async (userId) => {
  try {
    const user = await db.User.findByPk(userId, {
      include: [
        {
          model: db.Role,
          as: 'roles',
          include: [
            {
              model: db.Policy,
              as: 'policies'
            }
          ]
        }
      ]
    });
    
    if (!user) return [];
    
    const policies = [];
    user.roles.forEach(role => {
      role.policies.forEach(policy => {
        policies.push(policy.document);
      });
    });
    
    return policies;
  } catch (error) {
    console.error('Error fetching user policies:', error);
    return [];
  }
};

/**
 * Evaluate IAM policies for access control
 * @param {string} action - Action being performed
 * @param {string} resource - Resource being accessed
 * @param {string} userId - User ID
 * @param {Object} context - Additional context
 * @returns {Object} Evaluation result
 */
const evaluatePolicies = async (action, resource, userId, context = {}) => {
  try {
    const policies = await getUserPolicies(userId);
    
    if (policies.length === 0) {
      return {
        decision: 'Deny',
        reason: 'No policies found for user'
      };
    }
    
    let explicitDeny = false;
    let explicitAllow = false;
    const denyReasons = [];
    const allowReasons = [];
    
    // Evaluate each policy
    for (const policyDoc of policies) {
      const policy = parsePolicyDocument(policyDoc);
      if (!policy || !policy.Statement) continue;
      
      const statements = Array.isArray(policy.Statement) 
        ? policy.Statement 
        : [policy.Statement];
      
      for (const statement of statements) {
        const result = evaluateStatement(statement, action, resource, context);
        
        if (result === 'Deny') {
          explicitDeny = true;
          denyReasons.push(`Policy ${policy.Version || 'unknown'} denies access`);
        } else if (result === 'Allow') {
          explicitAllow = true;
          allowReasons.push(`Policy ${policy.Version || 'unknown'} allows access`);
        }
      }
    }
    
    // Deny-first principle: explicit deny overrides allow
    if (explicitDeny) {
      return {
        decision: 'Deny',
        reason: 'Explicit deny found',
        details: denyReasons
      };
    }
    
    if (explicitAllow) {
      return {
        decision: 'Allow',
        reason: 'Explicit allow found',
        details: allowReasons
      };
    }
    
    return {
      decision: 'Deny',
      reason: 'No matching policy found'
    };
    
  } catch (error) {
    console.error('Error evaluating policies:', error);
    return {
      decision: 'Deny',
      reason: 'Policy evaluation error',
      error: error.message
    };
  }
};

/**
 * IAM middleware factory
 * Creates middleware for specific action and resource
 * @param {string} action - Action to check (e.g., 'docs:Read', 'users:Create')
 * @param {string|Function} resource - Resource pattern or function to generate resource
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware function
 */
export const iamCheck = (action, resource, options = {}) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required for IAM check'
          }
        });
      }
      
      // Determine resource
      let resourceValue;
      if (typeof resource === 'function') {
        resourceValue = resource(req);
      } else {
        resourceValue = resource;
      }
      
      // Build context
      const context = {
        userId: req.user.userId,
        username: req.user.username,
        email: req.user.email,
        user: {
          id: req.user.userId,
          username: req.user.username,
          email: req.user.email
        },
        ...options.context
      };
      
      // Evaluate policies
      const result = await evaluatePolicies(action, resourceValue, req.user.userId, context);
      
      // Debug logging (commented out for production)
      // console.log(`🔍 IAM Check: ${action} on ${resourceValue} for user ${req.user.userId}`);
      // console.log(`   Context:`, context);
      // console.log(`   Decision:`, result.decision, result.reason);
      
      if (result.decision === 'Allow') {
        // Attach policy decision to request for logging/debugging
        req.iamDecision = result;
        next();
      } else {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'Access denied by IAM policy',
            details: result.reason,
            action,
            resource: resourceValue
          }
        });
      }
      
    } catch (error) {
      console.error('IAM middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'IAM_ERROR',
          message: 'Internal error in IAM evaluation'
        }
      });
    }
  };
};

/**
 * Convenience middleware for common actions
 */

// Document operations
export const canReadDocs = iamCheck('docs:Read', '*');
export const canCreateDocs = iamCheck('docs:Create', '*');
export const canUpdateDocs = iamCheck('docs:Update', '*');
export const canDeleteDocs = iamCheck('docs:Delete', '*');

// User operations
export const canReadUsers = iamCheck('users:Read', '*');
export const canCreateUsers = iamCheck('users:Create', '*');
export const canUpdateUsers = iamCheck('users:Update', '*');
export const canDeleteUsers = iamCheck('users:Delete', '*');

// Admin operations
export const canManageSystem = iamCheck('system:Manage', '*');

/**
 * Resource-specific middleware factory
 * @param {string} action - Action to check
 * @param {string} resourceType - Type of resource (e.g., 'doc', 'user')
 * @returns {Function} Middleware function
 */
export const resourceIAM = (action, resourceType) => {
  return iamCheck(action, (req) => {
    const resourceId = req.params.id || req.params.docId || req.params.userId;
    return `${resourceType}:${resourceId}`;
  });
};

/**
 * Self-resource middleware
 * Allows access only to user's own resources
 * @param {string} action - Action to check
 * @param {string} resourceType - Type of resource
 * @returns {Function} Middleware function
 */
export const selfResourceIAM = (action, resourceType) => {
  return iamCheck(action, (req) => {
    const userId = req.user.userId;
    return `${resourceType}:${userId}/*`;
  });
};

export default {
  iamCheck,
  canReadDocs,
  canCreateDocs,
  canUpdateDocs,
  canDeleteDocs,
  canReadUsers,
  canCreateUsers,
  canUpdateUsers,
  canDeleteUsers,
  canManageSystem,
  resourceIAM,
  selfResourceIAM
};
