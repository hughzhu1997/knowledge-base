const { Document } = require('../models');
const { AuditLog } = require('../models');

// 发布文档
const publishDocument = {
  actionType: 'record',
  name: 'publish',
  label: '发布',
  icon: 'CheckCircle',
  isVisible: (context) => {
    return context.record.params.status === 'draft';
  },
  handler: async (request, response, data) => {
    const { record } = data;
    
    try {
      await record.update({
        status: 'published',
        publishedAt: new Date(),
      });

      // 记录审计日志
      await AuditLog.create({
        userId: request.session.adminUser.id,
        action: 'publish',
        resourceType: 'Document',
        resourceId: record.id(),
        summary: `发布文档: ${record.params.title}`,
        details: {
          documentId: record.id(),
          title: record.params.title,
          publishedAt: new Date(),
        },
        ipAddress: request.ip || request.connection.remoteAddress,
        userAgent: request.get('User-Agent'),
      });

      return {
        record: record.toJSON(),
        notice: {
          message: '文档已成功发布',
          type: 'success',
        },
      };
    } catch (error) {
      console.error('Publish document error:', error);
      return {
        record: record.toJSON(),
        notice: {
          message: '发布失败，请稍后重试',
          type: 'error',
        },
      };
    }
  },
};

// 取消发布文档
const unpublishDocument = {
  actionType: 'record',
  name: 'unpublish',
  label: '取消发布',
  icon: 'XCircle',
  isVisible: (context) => {
    return context.record.params.status === 'published';
  },
  handler: async (request, response, data) => {
    const { record } = data;
    
    try {
      await record.update({
        status: 'draft',
        publishedAt: null,
      });

      // 记录审计日志
      await AuditLog.create({
        userId: request.session.adminUser.id,
        action: 'unpublish',
        resourceType: 'Document',
        resourceId: record.id(),
        summary: `取消发布文档: ${record.params.title}`,
        details: {
          documentId: record.id(),
          title: record.params.title,
          unpublishedAt: new Date(),
        },
        ipAddress: request.ip || request.connection.remoteAddress,
        userAgent: request.get('User-Agent'),
      });

      return {
        record: record.toJSON(),
        notice: {
          message: '文档已取消发布',
          type: 'success',
        },
      };
    } catch (error) {
      console.error('Unpublish document error:', error);
      return {
        record: record.toJSON(),
        notice: {
          message: '取消发布失败，请稍后重试',
          type: 'error',
        },
      };
    }
  },
};

// 归档文档
const archiveDocument = {
  actionType: 'record',
  name: 'archive',
  label: '归档',
  icon: 'Archive',
  isVisible: (context) => {
    return context.record.params.status !== 'archived';
  },
  handler: async (request, response, data) => {
    const { record } = data;
    
    try {
      await record.update({
        status: 'archived',
        archivedAt: new Date(),
      });

      // 记录审计日志
      await AuditLog.create({
        userId: request.session.adminUser.id,
        action: 'archive',
        resourceType: 'Document',
        resourceId: record.id(),
        summary: `归档文档: ${record.params.title}`,
        details: {
          documentId: record.id(),
          title: record.params.title,
          archivedAt: new Date(),
        },
        ipAddress: request.ip || request.connection.remoteAddress,
        userAgent: request.get('User-Agent'),
      });

      return {
        record: record.toJSON(),
        notice: {
          message: '文档已归档',
          type: 'success',
        },
      };
    } catch (error) {
      console.error('Archive document error:', error);
      return {
        record: record.toJSON(),
        notice: {
          message: '归档失败，请稍后重试',
          type: 'error',
        },
      };
    }
  },
};

// 批量发布
const bulkPublish = {
  actionType: 'bulk',
  name: 'bulkPublish',
  label: '批量发布',
  icon: 'CheckCircle',
  handler: async (request, response, data) => {
    const { records } = data;
    const successCount = [];
    const errorCount = [];

    for (const record of records) {
      try {
        if (record.params.status === 'draft') {
          await record.update({
            status: 'published',
            publishedAt: new Date(),
          });

          // 记录审计日志
          await AuditLog.create({
            userId: request.session.adminUser.id,
            action: 'publish',
            resourceType: 'Document',
            resourceId: record.id(),
            summary: `批量发布文档: ${record.params.title}`,
            details: {
              documentId: record.id(),
              title: record.params.title,
              publishedAt: new Date(),
              bulkAction: true,
            },
            ipAddress: request.ip || request.connection.remoteAddress,
            userAgent: request.get('User-Agent'),
          });

          successCount.push(record.params.title);
        }
      } catch (error) {
        console.error('Bulk publish error for record:', record.id(), error);
        errorCount.push(record.params.title);
      }
    }

    return {
      notice: {
        message: `批量发布完成: 成功 ${successCount.length} 个，失败 ${errorCount.length} 个`,
        type: successCount.length > 0 ? 'success' : 'error',
      },
    };
  },
};

// 批量归档
const bulkArchive = {
  actionType: 'bulk',
  name: 'bulkArchive',
  label: '批量归档',
  icon: 'Archive',
  handler: async (request, response, data) => {
    const { records } = data;
    const successCount = [];
    const errorCount = [];

    for (const record of records) {
      try {
        if (record.params.status !== 'archived') {
          await record.update({
            status: 'archived',
            archivedAt: new Date(),
          });

          // 记录审计日志
          await AuditLog.create({
            userId: request.session.adminUser.id,
            action: 'archive',
            resourceType: 'Document',
            resourceId: record.id(),
            summary: `批量归档文档: ${record.params.title}`,
            details: {
              documentId: record.id(),
              title: record.params.title,
              archivedAt: new Date(),
              bulkAction: true,
            },
            ipAddress: request.ip || request.connection.remoteAddress,
            userAgent: request.get('User-Agent'),
          });

          successCount.push(record.params.title);
        }
      } catch (error) {
        console.error('Bulk archive error for record:', record.id(), error);
        errorCount.push(record.params.title);
      }
    }

    return {
      notice: {
        message: `批量归档完成: 成功 ${successCount.length} 个，失败 ${errorCount.length} 个`,
        type: successCount.length > 0 ? 'success' : 'error',
      },
    };
  },
};

module.exports = {
  publishDocument,
  unpublishDocument,
  archiveDocument,
  bulkPublish,
  bulkArchive,
};



