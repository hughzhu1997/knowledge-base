import { AuditLogService } from '../services/AuditLogService.js';

/**
 * Audit Logger Middleware
 * Automatically logs API operations for audit trail
 */

/**
 * Create audit log middleware for specific action
 * @param {string} action - Action being performed (e.g., 'docs:Create', 'users:Update')
 * @param {string|Function} resourcePattern - Resource pattern or function to generate resource
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware function
 */
export const createAuditLogger = (action, resourcePattern, options = {}) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;
    
    // Store original response for auditing
    let responseData = null;
    let hasError = false;
    let errorDetails = null;

    // Override res.send to capture response
    res.send = function(data) {
      responseData = data;
      return originalSend.call(this, data);
    };

    // Override error handling
    const originalNext = next;
    next = function(error) {
      if (error) {
        hasError = true;
        errorDetails = {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR',
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        };
      }
      return originalNext.apply(this, arguments);
    };

    // Handle response completion (success or error)
    const handleAuditLog = async () => {
      try {
        const userId = req.user?.userId || req.user?.id || null;
        if (!userId) {
          // Skip logging for unauthenticated requests unless explicitly enabled
          if (!options.allowUnauthenticated) {
            return;
          }
        }

        // Determine resource from pattern or function
        let resource;
        if (typeof resourcePattern === 'function') {
          resource = resourcePattern(req);
        } else {
          resource = resourcePattern.replace(/:(\w+)/g, (match, param) => {
            return req.params[param] || match;
          });
        }

        // Determine if action was successful
        const status = hasError ? 'FAILURE' : 'SUCCESS';
        const message = options.message || generateActionMessage(action, req, status);
        
        // Prepare audit log data
        const logData = {
          action,
          resource,
          actorId: userId,
          targetUserId: options.targetUserId || (req.body?.userId ? req.body.userId : null),
          clientIp: getClientIp(req),
          userAgent: req.get('user-agent'),
          sessionId: req.session?.id,
          requestId: req.requestId || req.id,
          status,
          message,
          metadata: {
            method: req.method,
            originalUrl: req.originalUrl,
            userAgent: req.get('user-agent'),
            responseTime: Date.now() - startTime,
            statusCode: res.statusCode,
            ...(status === 'SUCCESS' ? {
              action: action,
              resourceType: extractResourceType(resource),
              recordsModified: extractRecordCount(responseData)
            } : {
              error: errorDetails
            }),
            ...options.metadata
          },
          errorCode: hasError ? errorDetails?.code : null,
          errorMessage: hasError ? errorDetails?.message : null
        };

        // Create audit log asynchronously (don't wait for it)
        AuditLogService.createLog(logData).catch(error => {
          console.error('Failed to create audit log:', error);
        });

      } catch (auditError) {
        console.error('Audit logging error:', auditError);
      }
    };

    // Ensure audit log is created after response is sent
    res.on('finish', handleAuditLog);
    res.on('close', handleAuditLog);

    // Continue to next middleware
    next();
  };
};

/**
 * Audit logger for authentication operations
 */
export const authAuditLogger = createAuditLogger('auth:Login', '*', {
  message: 'User authentication attempt',
  allowUnauthenticated: true
});

/**
 * Audit logger for user management operations
 */
export const userManageAuditLogger = (resourcePattern) => 
  createAuditLogger('users:Update', resourcePattern, {
    message: 'User management operation performed'
  });

/**
 * Audit logger for document operations
 */
export const documentAuditLogger = (action, resourcePattern) =>
  createAuditLogger(action, resourcePattern, {
    message: `Document ${action.split(':')[1].toLowerCase()} operation performed`
  });

/**
 * Audit logger for admin operations
 */
export const adminAuditLogger = createAuditLogger('admin:Access', '*', {
  message: 'Admin panel access attempted'
});

/**
 * Helper function to get client IP address
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
const getClientIp = (req) => {
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         '127.0.0.1';
};

/**
 * Generate human-readable action message
 * @param {string} action - Action performed
 * @param {Object} req - Express request object
 * @param {string} status - Success or failure status
 * @returns {string} Human-readable message
 */
const generateActionMessage = (action, req, status) => {
  const [actionType, operation] = action.split(':');
  const resourceType = extractResourceType(req.originalUrl);
  
  const statusText = status === 'SUCCESS' ? 'successfully' : 'failed';
  
  switch (actionType) {
    case 'auth':
      return `Authentication ${statusText}: ${operation.toLowerCase()} attempt`;
    case 'docs':
      return `Document ${operation.toLowerCase()}: ${statusText}`;
    case 'users':
      return `User ${operation.toLowerCase()}: ${statusText}`;
    case 'admin':
      return `Admin operation ${statusText}: ${operation.toLowerCase()}`;
    default:
      return `${actionType} ${operation.toLowerCase()}: ${statusText}`;
  }
};

/**
 * Extract resource type from URL pattern
 * @param {string} resource - Resource identifier
 * @returns {string} Resource type
 */
const extractResourceType = (resource) => {
  if (resource.includes('doc:')) return 'document';
  if (resource.includes('user:')) return 'user';
  if (resource.includes('role:')) return 'role';
  if (resource.includes('tag:')) return 'tag';
  return 'unknown';
};

/**
 * Extract record count from response data
 * @param {any} responseData - Response data
 * @returns {number} Number of records affected
 */
const extractRecordCount = (responseData) => {
  try {
    if (typeof responseData === 'string') {
      const data = JSON.parse(responseData);
      return data.data?.length || (data.success ? 1 : 0);
    }
    if (responseData?.data?.length !== undefined) {
      return responseData.data.length;
    }
    return responseData?.success ? 1 : 0;
  } catch {
    return 0;
  }
};

/**
 * Express error handler that ensures audit logs are created for errors
 */
export const auditErrorHandler = (err, req, res, next) => {
  // Create audit log for errors
  if (req.user?.userId && req.originalUrl) {
    const action = req.action || 'unknown:Error';
    const resource = req.resource || req.originalUrl;
    
    AuditLogService.logFailure(action, resource, req.user.userId, req, {
      message: `Error occurred: ${err.message}`,
      metadata: {
        method: req.method,
        originalUrl: req.originalUrl,
        errorCode: err.code || 'UNKNOWN_ERROR',
        statusCode: err.status || 500
      },
      errorCode: err.code || 'UNKNOWN_ERROR',
      errorMessage: err.message
    }).catch(auditError => {
      console.error('Failed to create error audit log:', auditError);
    });
  }
  
  next(err);
};

export default {
  createAuditLogger,
  authAuditLogger,
  userManageAuditLogger,
  documentAuditLogger,
  adminAuditLogger,
  auditErrorHandler
};
