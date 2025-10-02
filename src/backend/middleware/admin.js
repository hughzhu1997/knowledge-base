// admin.js
// Admin role authorization middleware for protecting admin-only routes

/**
 * Admin Role Authorization Middleware
 * Verifies that the authenticated user has admin privileges
 * Must be used after the auth middleware
 * @param {Request} req - Express request object with authenticated user
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void} Calls next() on success or sends error response
 */
const admin = (req, res, next) => {
  try {
    // Verify user is authenticated (set by auth middleware)
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'User must be authenticated first'
      });
    }

    // Verify user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Admin privileges required'
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ 
      error: 'Authorization failed',
      message: 'An error occurred during authorization'
    });
  }
};

module.exports = admin;
