import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';

/**
 * JWT Authentication middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required'
        }
      });
    }

    // Verify token
    const payload = verifyToken(token);
    
    // Check if token is access token
    if (payload.type !== 'access') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_TYPE',
          message: 'Invalid token type'
        }
      });
  }

    // Attach user info to request
    req.user = {
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
      roles: payload.roles || []
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired access token'
      }
    });
  }
};

/**
 * Authorization middleware for role-based access control
 * @param {string|Array} allowedRoles - Role(s) allowed to access the route
 * @returns {Function} Middleware function
 */
export const authorizeRoles = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Insufficient permissions. Required roles: ${roles.join(', ')}`
        }
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user info if token is provided but doesn't require it
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const payload = verifyToken(token);
      
      if (payload.type === 'access') {
        req.user = {
          userId: payload.userId,
          username: payload.username,
          email: payload.email,
          roles: payload.roles || []
        };
      }
    }

    next();
  } catch (error) {
    // Ignore token errors in optional auth
    next();
  }
};

/**
 * Admin only middleware
 */
export const adminOnly = authorizeRoles(['Administrator']);

/**
 * Editor or Admin middleware
 */
export const editorOrAdmin = authorizeRoles(['Editor', 'Administrator']);

/**
 * Any authenticated user middleware
 */
export const anyAuth = authorizeRoles(['User', 'Editor', 'Administrator', 'Auditor']);
