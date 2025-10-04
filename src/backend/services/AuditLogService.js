import db from '../models/index.js';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

/**
 * AuditLog Service
 * Handles audit logging operations and queries
 */
export class AuditLogService {
  /**
   * Create a new audit log entry
   * @param {Object} logData - Audit log data
   * @returns {Promise<Object>} Created audit log
   */
  static async createLog(logData) {
    const {
      action,
      resource,
      actorId,
      targetUserId = null,
      clientIp = null,
      userAgent = null,
      sessionId = null,
      requestId = null,
      status = 'SUCCESS',
      message = null,
      metadata = null,
      errorCode = null,
      errorMessage = null
    } = logData;

    try {
      return await db.AuditLog.create({
        action,
        resource,
        actor_id: actorId,
        target_user_id: targetUserId,
        client_ip: clientIp,
        user_agent: userAgent,
        session_id: sessionId,
        request_id: requestId,
        status,
        message,
        metadata,
        error_code: errorCode,
        error_message: errorMessage
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      throw error;
    }
  }

  /**
   * Get audit logs with filtering and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated audit logs
   */
  static async getAuditLogs(options = {}) {
    const {
      page = 1,
      limit = 20,
      action = null,
      actorId = null,
      targetUserId = null,
      status = null,
      resource = null,
      dateFrom = null,
      dateTo = null,
      severityLevel = null
    } = options;

    const where = {};
    
    // Build query conditions
    if (action) {
      where.action = {
        [Op.like]: `%${action}%`
      };
    }
    
    if (actorId) {
      where.actor_id = actorId;
    }
    
    if (targetUserId) {
      where.target_user_id = targetUserId;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (resource) {
      where.resource = {
        [Op.like]: `%${resource}%`
      };
    }
    
    // Date range filtering
    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) {
        where.created_at[Op.gte] = new Date(dateFrom);
      }
      if (dateTo) {
        where.created_at[Op.lte] = new Date(dateTo);
      }
    }

    const offset = (page - 1) * limit;

    try {
      const { count, rows } = await db.AuditLog.findAndCountAll({
        where,
        include: [
          {
            model: db.User,
            as: 'actor',
            attributes: ['id', 'username', 'email', 'display_name']
          },
          {
            model: db.User,
            as: 'targetUser',
            attributes: ['id', 'username', 'email', 'display_name']
          }
        ],
        order: [['created_at', 'DESC']],
        offset,
        limit,
        distinct: true
      });

      return {
        logs: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
          hasMore: page < Math.ceil(count / limit)
        }
      };
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} User's audit logs
   */
  static async getUserAuditLogs(userId, options = {}) {
    return await this.getAuditLogs({
      ...options,
      actorId: userId
    });
  }

  /**
   * Get audit logs for actions affecting a specific user
   * @param {string} userId - Target user ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Audit logs affecting the user
   */
  static async getUserTargetAuditLogs(userId, options = {}) {
    return await this.getAuditLogs({
      ...options,
      targetUserId: userId
    });
  }

  /**
   * Get audit log statistics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Audit log statistics
   */
  static async getAuditLogStats(options = {}) {
    const { dateFrom = null, dateTo = null } = options;
    
    const where = {};
    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) {
        where.created_at[Op.gte] = new Date(dateFrom);
      }
      if (dateTo) {
        where.created_at[Op.lte] = new Date(dateTo);
      }
    }

    try {
      const stats = await db.AuditLog.findAll({
        where,
        attributes: [
          'status',
          'action',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
        ],
        group: ['status', 'action'],
        raw: true
      });

      // Count by severity level
      const criticalActions = ['users:Create', 'users:Delete', 'auth:Login', 'auth:Logout'];
      const moderateActions = ['docs:Delete', 'docs:Update', 'users:Update'];
      
      let criticalCount = 0;
      let moderateCount = 0;
      let lowCount = 0;

      stats.forEach(stat => {
        if (criticalActions.includes(stat.action)) {
          criticalCount += parseInt(stat.count);
        } else if (moderateActions.includes(stat.action)) {
          moderateCount += parseInt(stat.count);
        } else {
          lowCount += parseInt(stat.count);
        }
      });

      return {
        byStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = (acc[stat.status] || 0) + parseInt(stat.count);
          return acc;
        }, {}),
        byAction: stats.reduce((acc, stat) => {
          acc[stat.action] = (acc[stat.action] || 0) + parseInt(stat.count);
          return acc;
        }, {}),
        bySeverity: {
          critical: criticalCount,
          moderate: moderateCount,
          low: lowCount
        },
        totalActions: stats.reduce((acc, stat) => acc + parseInt(stat.count), 0)
      };
    } catch (error) {
      console.error('Failed to get audit log statistics:', error);
      throw error;
    }
  }

  /**
   * Clean up old audit logs (keep only recent ones)
   * @param {number} retentionDays - Number of days to retain logs
   * @returns {Promise<Object>} Cleanup results
   */
  static async cleanupOldLogs(retentionDays = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      const deletedCount = await db.AuditLog.destroy({
        where: {
          created_at: {
            [Op.lt]: cutoffDate
          }
        }
      });

      return {
        deletedCount,
        cutoffDate,
        retentionDays
      };
    } catch (error) {
      console.error('Failed to cleanup old audit logs:', error);
      throw error;
    }
  }

  /**
   * Helper method to create audit log with common patterns
   * @param {string} action - Action performed
   * @param {string} resource - Resource affected
   * @param {string} actorId - Actor user ID
   * @param {Object} request - Express request object
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created audit log
   */
  static async logAction(action, resource, actorId, request, options = {}) {
    const logData = {
      action,
      resource,
      actorId,
      clientIp: request.ip || request.connection?.remoteAddress,
      userAgent: request.get('user-agent'),
      sessionId: request.session?.id,
      requestId: options.requestId || uuidv4(),
      ...options
    };

    return await this.createLog(logData);
  }

  /**
   * Log successful action
   * @param {string} action - Action performed
   * @param {string} resource - Resource affected
   * @param {string} actorId - Actor user ID
   * @param {Object} request - Express request object
   * @param {Object} extraData - Additional data
   * @returns {Promise<Object>} Created audit log
   */
  static async logSuccess(action, resource, actorId, request, extraData = {}) {
    return await this.logAction(action, resource, actorId, request, {
      status: 'SUCCESS',
      ...extraData
    });
  }

  /**
   * Log failed action
   * @param {string} action - Action that failed
   * @param {string} resource - Resource affected
   * @param {string} actorId - Actor user ID
   * @param {Object} request - Express request object
   * @param {Object} errorData - Error information
   * @returns {Promise<Object>} Created audit log
   */
  static async logFailure(action, resource, actorId, request, errorData = {}) {
    return await this.logAction(action, resource, actorId, request, {
      status: 'FAILURE',
      ...errorData
    });
  }
}
