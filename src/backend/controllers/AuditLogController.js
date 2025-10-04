import { AuditLogService } from '../services/AuditLogService.js';

/**
 * AuditLog Controller
 * Handles audit log management endpoints
 */
export class AuditLogController {
  /**
   * Get audit logs with filtering and pagination
   * GET /admin/audit-logs
   */
  static async getAuditLogs(req, res) {
    try {
      const queryParams = req.query;
      
      // Extract query parameters
      const options = {
        page: parseInt(queryParams.page) || 1,
        limit: Math.min(parseInt(queryParams.limit) || 20, 100), // Max 100 per page
        action: queryParams.action || null,
        actorId: queryParams.actorId || null,
        targetUserId: queryParams.targetUserId || null,
        status: queryParams.status?.toUpperCase() || null,
        resource: queryParams.resource || null,
        dateFrom: queryParams.dateFrom || null,
        dateTo: queryParams.dateTo || null,
        severityLevel: queryParams.severityLevel || null
      };

      const result = await AuditLogService.getAuditLogs(options);

      res.status(200).json({
        success: true,
        message: 'Audit logs retrieved successfully',
        data: {
          logs: result.logs,
          pagination: result.pagination
        }
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs',
        error: error.message
      });
    }
  }

  /**
   * Get audit log statistics
   * GET /admin/audit-logs/stats
   */
  static async getAuditLogStats(req, res) {
    try {
      const queryParams = req.query;
      
      const options = {
        dateFrom: queryParams.dateFrom || null,
        dateTo: queryParams.dateTo || null
      };

      const stats = await AuditLogService.getAuditLogStats(options);

      res.status(200).json({
        success: true,
        message: 'Audit log statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Error fetching audit log statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit log statistics',
        error: error.message
      });
    }
  }

  /**
   * Get current user's audit logs
   * GET /api/audit-logs/my
   */
  static async getMyAuditLogs(req, res) {
    try {
      const userId = req.user.userId;
      const queryParams = req.query;
      
      const options = {
        page: parseInt(queryParams.page) || 1,
        limit: Math.min(parseInt(queryParams.limit) || 20, 50), // Max 50 per page for user's own logs
        action: queryParams.action || null,
        status: queryParams.status?.toUpperCase() || null,
        dateFrom: queryParams.dateFrom || null,
        dateTo: queryParams.dateTo || null
      };

      const result = await AuditLogService.getUserAuditLogs(userId, options);

      res.status(200).json({
        success: true,
        message: 'Your audit logs retrieved successfully',
        data: {
          logs: result.logs,
          pagination: result.pagination
        }
      });
    } catch (error) {
      console.error('Error fetching user audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch your audit logs',
        error: error.message
      });
    }
  }

  /**
   * Get audit logs affecting a specific user
   * GET /admin/audit-logs/user/:userId
   */
  static async getUserTargetAuditLogs(req, res) {
    try {
      const userId = req.params.userId;
      const queryParams = req.query;
      
      const options = {
        page: parseInt(queryParams.page) || 1,
        limit: Math.min(parseInt(queryParams.limit) || 20, 50),
        action: queryParams.action || null,
        actorId: queryParams.actorId || null,
        status: queryParams.status?.toUpperCase() || null,
        dateFrom: queryParams.dateFrom || null,
        dateTo: queryParams.dateTo || null
      };

      const result = await AuditLogService.getUserTargetAuditLogs(userId, options);

      res.status(200).json({
        success: true,
        message: `Audit logs for user ${userId} retrieved successfully`,
        data: {
          logs: result.logs,
          pagination: result.pagination,
          targetUserId: userId
        }
      });
    } catch (error) {
      console.error('Error fetching user target audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user audit logs',
        error: error.message
      });
    }
  }

  /**
   * Get specific audit log by ID
   * GET /admin/audit-logs/:id
   */
  static async getAuditLogById(req, res) {
    try {
      const logId = req.params.id;
      
      // Import database models dynamically
      const db = await import('../models/index.js');
      
      const auditLog = await db.default.AuditLog.findByPk(logId, {
        include: [
          {
            model: db.default.User,
            as: 'actor',
            attributes: ['id', 'username', 'email', 'display_name']
          },
          {
            model: db.default.User,
            as: 'targetUser',
            attributes: ['id', 'username', 'email', 'display_name']
          }
        ]
      });

      if (!auditLog) {
        return res.status(404).json({
          success: false,
          message: 'Audit log not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Audit log retrieved successfully',
        data: auditLog
      });
    } catch (error) {
      console.error('Error fetching audit log by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit log',
        error: error.message
      });
    }
  }

  /**
   * Clean up old audit logs
   * DELETE /admin/audit-logs/cleanup
   */
  static async cleanupOldLogs(req, res) {
    try {
      const retentionDays = parseInt(req.body.retentionDays) || 90;
      
      // Ensure reasonable retention period (minimum 7 days, maximum 365 days)
      const validRetentionDays = Math.max(7, Math.min(retentionDays, 365));
      
      const result = await AuditLogService.cleanupOldLogs(validRetentionDays);

      res.status(200).json({
        success: true,
        message: `Successfully cleaned up audit logs older than ${validRetentionDays} days`,
        data: result
      });
    } catch (error) {
      console.error('Error cleaning up audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup old audit logs',
        error: error.message
      });
    }
  }

  /**
   * Export audit logs as CSV
   * GET /admin/audit-logs/export
   */
  static async exportAuditLogs(req, res) {
    try {
      // Set large limit for export (max 10000 records)
      const options = {
        limit: Math.min(parseInt(req.query.limit) || 5000, 10000),
        action: req.query.action || null,
        actorId: req.query.actorId || null,
        targetUserId: req.query.targetUserId || null,
        status: req.query.status?.toUpperCase() || null,
        resource: req.query.resource || null,
        dateFrom: req.query.dateFrom || null,
        dateTo: req.query.dateTo || null
      };

      const result = await AuditLogService.getAuditLogs(options);
      
      // Generate CSV content
      const csvHeader = [
        'ID',
        'Action',
        'Resource',
        'Actor ID',
        'Actor Username',
        'Actor Email',
        'Target User ID',
        'Target Username',
        'Target Email',
        'Client IP',
        'User Agent',
        'Status',
        'Message',
        'Created At'
      ];

      const csvRows = result.logs.map(log => [
        log.id,
        log.action,
        log.resource,
        log.actor_id,
        log.actor?.username || '',
        log.actor?.email || '',
        log.target_user_id || '',
        log.targetUser?.username || '',
        log.targetUser?.email || '',
        log.client_ip || '',
        (log.user_agent || '').replace(/,/g, ' '), // Remove commas from user agent
        log.status,
        (log.message || '').replace(/,/g, ' '), // Remove commas from message
        log.created_at
      ]);

      const csvContent = [csvHeader, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // Set response headers for file download
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `audit-logs-${timestamp}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      res.status(200).send(csvContent);
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export audit logs',
        error: error.message
      });
    }
  }
}
