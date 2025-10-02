// iam.js
// IAM-style permission middleware for fine-grained access control

const { User, Role, Policy, UserRole, RolePolicy } = require('../models');
const { Op } = require('sequelize');

/**
 * IAM Permission Checker Class
 * Handles permission evaluation based on AWS IAM-style policies
 */
class IAMPermissionChecker {
  constructor() {
    this.permissionCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Check if user has permission for action on resource
   * @param {string} userId - User ID
   * @param {string} action - Action to check (e.g., 'docs:Read')
   * @param {string} resource - Resource to check (e.g., 'docs/123')
   * @param {Object} context - Additional context for condition evaluation
   * @returns {Promise<string|null>} 'Allow', 'Deny', or null (no match)
   */
  async checkPermission(userId, action, resource, context = {}) {
    const cacheKey = `${userId}:${action}:${resource}`;
    
    // Check cache first
    if (this.permissionCache.has(cacheKey)) {
      const cached = this.permissionCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.result;
      }
      this.permissionCache.delete(cacheKey);
    }

    try {
      // Get user with roles and policies
      const user = await User.findByPk(userId, {
        include: [
          {
            model: Role,
            as: 'roles',
            through: {
              model: UserRole,
              where: {
                [Op.or]: [
                  { expiresAt: null },
                  { expiresAt: { [Op.gt]: new Date() } }
                ]
              }
            },
            include: [
              {
                model: Policy,
                as: 'policies'
              }
            ]
          }
        ]
      });

      if (!user) {
        return null;
      }

      // Evaluate all policies
      let result = null;
      const allPolicies = [];

      // Collect all policies from user's roles
      for (const role of user.roles) {
        for (const policy of role.policies) {
          allPolicies.push(policy);
        }
      }

      // Evaluate each policy
      for (const policy of allPolicies) {
        const policyResult = policy.evaluatePermission(action, resource, {
          ...context,
          'user.id': user.id,
          'user.username': user.username,
          'user.email': user.email
        });

        if (policyResult === 'Deny') {
          // Deny takes precedence
          result = 'Deny';
          break;
        } else if (policyResult === 'Allow') {
          result = 'Allow';
        }
      }

      // Cache the result
      this.permissionCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('IAM permission check error:', error);
      return null;
    }
  }

  /**
   * Clear permission cache for a user
   * @param {string} userId - User ID
   */
  clearUserCache(userId) {
    for (const key of this.permissionCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.permissionCache.delete(key);
      }
    }
  }

  /**
   * Clear all permission cache
   */
  clearAllCache() {
    this.permissionCache.clear();
  }
}

// Create singleton instance
const permissionChecker = new IAMPermissionChecker();

/**
 * IAM Permission Middleware Factory
 * Creates middleware for specific action and resource
 * @param {string} action - Action to check (e.g., 'docs:Read')
 * @param {string|Function} resource - Resource pattern or function to generate resource
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware function
 */
const requirePermission = (action, resource, options = {}) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User must be authenticated to access this resource'
        });
      }

      // Determine resource
      let resourceValue;
      if (typeof resource === 'function') {
        resourceValue = resource(req);
      } else {
        resourceValue = resource;
      }

      // Add request context
      const context = {
        ...options.context,
        'request.method': req.method,
        'request.path': req.path,
        'request.query': req.query,
        'request.body': req.body
      };

      // Check permission
      const result = await permissionChecker.checkPermission(
        req.user.userId,
        action,
        resourceValue,
        context
      );

      if (result === 'Deny') {
        return res.status(403).json({
          error: 'Access denied',
          message: `Permission denied for action '${action}' on resource '${resourceValue}'`
        });
      }

      if (result === 'Allow') {
        return next();
      }

      // No explicit permission found - default deny
      return res.status(403).json({
        error: 'Access denied',
        message: `No permission found for action '${action}' on resource '${resourceValue}'`
      });

    } catch (error) {
      console.error('IAM middleware error:', error);
      return res.status(500).json({
        error: 'Permission check failed',
        message: 'An error occurred during permission verification'
      });
    }
  };
};

/**
 * Convenience middleware for common actions
 */
const iamMiddleware = {
  // Document permissions
  docs: {
    create: requirePermission('docs:Create', 'docs/*'),
    read: requirePermission('docs:Read', 'docs/*'),
    update: requirePermission('docs:Update', (req) => `docs/${req.params.id}`),
    delete: requirePermission('docs:Delete', (req) => `docs/${req.params.id}`),
    list: requirePermission('docs:List', 'docs/*')
  },

  // User permissions
  users: {
    create: requirePermission('users:Create', 'users/*'),
    read: requirePermission('users:Read', 'users/*'),
    update: requirePermission('users:Update', (req) => `users/${req.params.id}`),
    delete: requirePermission('users:Delete', (req) => `users/${req.params.id}`),
    list: requirePermission('users:List', 'users/*')
  },

  // Role permissions
  roles: {
    create: requirePermission('roles:Create', 'roles/*'),
    read: requirePermission('roles:Read', 'roles/*'),
    update: requirePermission('roles:Update', (req) => `roles/${req.params.id}`),
    delete: requirePermission('roles:Delete', (req) => `roles/${req.params.id}`),
    list: requirePermission('roles:List', 'roles/*')
  },

  // Policy permissions
  policies: {
    create: requirePermission('policies:Create', 'policies/*'),
    read: requirePermission('policies:Read', 'policies/*'),
    update: requirePermission('policies:Update', (req) => `policies/${req.params.id}`),
    delete: requirePermission('policies:Delete', (req) => `policies/${req.params.id}`),
    list: requirePermission('policies:List', 'policies/*')
  },

  // Admin permissions
  admin: {
    access: requirePermission('admin:Access', 'admin/*')
  }
};

/**
 * Middleware to clear permission cache when user roles change
 */
const clearPermissionCache = (req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    // Clear cache for the user if this was a role/policy change
    if (req.user && req.user.userId && 
        (req.path.includes('/roles') || req.path.includes('/policies') || req.path.includes('/users'))) {
      permissionChecker.clearUserCache(req.user.userId);
    }
    return originalSend.call(this, data);
  };
  next();
};

module.exports = {
  requirePermission,
  iamMiddleware,
  permissionChecker,
  clearPermissionCache
};
