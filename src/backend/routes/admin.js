import express from 'express';
import { AuditLogController } from '../controllers/AuditLogController.js';
import { authenticateToken } from '../middleware/auth.js';
import { adminAuditLogger } from '../middleware/auditLogger.js';

const router = express.Router();

/**
 * Admin Routes
 * All routes require authentication and admin privileges
 */

// Apply authentication and admin access middleware to all routes
router.use(authenticateToken);
router.use(adminAuditLogger);

// Apply IAM middleware for admin operations
router.use((req, res, next) => {
  console.log('Admin route access check:', {
    user: req.user,
    roles: req.user?.roles,
    hasAdminRole: req.user?.roles?.includes('Administrator')
  });
  
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  // Check if user has admin role
  const hasAdminRole = req.user.roles && req.user.roles.includes('Administrator');
  
  if (!hasAdminRole) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  
  next();
});

/**
 * Audit Log Management Routes
 */

// GET /admin/audit-logs - Get audit logs with filtering
router.get('/audit-logs', 
  AuditLogController.getAuditLogs
);

// GET /admin/audit-logs/stats - Get audit log statistics
router.get('/audit-logs/stats', 
  AuditLogController.getAuditLogStats
);

// GET /admin/audit-logs/:id - Get specific audit log
router.get('/audit-logs/:id', 
  AuditLogController.getAuditLogById
);

// GET /admin/audit-logs/user/:userId - Get audit logs for specific user
router.get('/audit-logs/user/:userId', 
  AuditLogController.getUserTargetAuditLogs
);

// DELETE /admin/audit-logs/cleanup - Clean up old audit logs
router.delete('/audit-logs/cleanup', 
  AuditLogController.cleanupOldLogs
);

// GET /admin/audit-logs/export - Export audit logs as CSV
router.get('/audit-logs/export', 
  AuditLogController.exportAuditLogs
);

/**
 * System Overview Routes
 */

// GET /admin/stats - Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const db = await import('../models/index.js');
    
    // Get basic system statistics
    const [
      userCount,
      documentCount,
      tagCount,
      auditLogCount
    ] = await Promise.all([
      db.default.User.count(),
      db.default.Document.count(),
      db.default.Tag.count(),
      db.default.AuditLog.count()
    ]);

    // Get recent audit logs (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentAuditLogs = await db.default.AuditLog.count({
      where: {
        created_at: {
          [db.default.Sequelize.Op.gte]: twentyFourHoursAgo
        }
      }
    });

    // Get user registration count (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentUserRegistrations = await db.default.User.count({
      where: {
        created_at: {
          [db.default.Sequelize.Op.gte]: thirtyDaysAgo
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'System statistics retrieved successfully',
      data: {
        users: {
          total: userCount,
          recentRegistrations: recentUserRegistrations
        },
        documents: {
          total: documentCount
        },
        tags: {
          total: tagCount
        },
        auditLogs: {
          total: auditLogCount,
          recentActivity: recentAuditLogs
        }
      }
    });
  } catch (error) {
    console.error('Error fetching system statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system statistics',
      error: error.message
    });
  }
});

/**
 * Admin Health Check
 * GET /admin/health
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin panel is healthy',
    data: {
      timestamp: new Date().toISOString(),
      adminUser: req.user.username,
      permissions: req.user.roles && req.user.roles.includes('Administrator') ? ['full_admin_access'] : []
    }
  });
});

export default router;