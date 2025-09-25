// Admin role middleware
// This middleware should be used after auth middleware
const admin = (req, res, next) => {
  try {
    // Check if user is authenticated (should be set by auth middleware)
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'User must be authenticated first'
      });
    }

    // Check if user has admin role
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
