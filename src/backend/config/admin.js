const AdminJS = require('adminjs');
const AdminJSExpress = require('@adminjs/express');
const AdminJSSequelize = require('@adminjs/sequelize');
const { User, Document, Tag, DocTag, AuditLog } = require('../models');
const { publishDocument, unpublishDocument, archiveDocument, bulkPublish, bulkArchive } = require('../actions/documentActions');

// 注册Sequelize适配器
AdminJS.registerAdapter(AdminJSSequelize);

// 自定义认证函数
const authenticate = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (user && user.role === 'admin' && await user.checkPassword(password)) {
    return { email: user.email, id: user.id, role: user.role };
  }
  return null;
};

// 配置AdminJS资源
const adminJs = new AdminJS({
  resources: [
    {
      resource: User,
      options: {
        parent: {
          name: '用户管理',
          icon: 'User',
        },
        listProperties: ['username', 'email', 'role', 'createdAt'],
        showProperties: ['username', 'email', 'role', 'createdAt', 'updatedAt'],
        editProperties: ['username', 'email', 'role'],
        filterProperties: ['username', 'email', 'role'],
        sort: {
          sortBy: 'createdAt',
          direction: 'desc',
        },
        properties: {
          password: {
            isVisible: false,
          },
          id: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          createdAt: {
            isVisible: { list: true, filter: true, show: true, edit: false },
          },
          updatedAt: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
        },
      },
    },
    {
      resource: Document,
      options: {
        parent: {
          name: '文档管理',
          icon: 'FileText',
        },
        listProperties: ['title', 'category', 'status', 'author.username', 'createdAt'],
        showProperties: ['title', 'category', 'content', 'status', 'author.username', 'tags', 'createdAt', 'updatedAt'],
        editProperties: ['title', 'category', 'content', 'status'],
        filterProperties: ['title', 'category', 'status', 'authorId'],
        sort: {
          sortBy: 'createdAt',
          direction: 'desc',
        },
        properties: {
          content: {
            type: 'richtext',
            isVisible: { list: false, filter: false, show: true, edit: true },
          },
          id: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          authorId: {
            isVisible: { list: false, filter: true, show: false, edit: false },
          },
          version: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          publishedAt: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          archivedAt: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
        },
        actions: {
          publish: publishDocument,
          unpublish: unpublishDocument,
          archive: archiveDocument,
          bulkPublish: bulkPublish,
          bulkArchive: bulkArchive,
        },
      },
    },
    {
      resource: Tag,
      options: {
        parent: {
          name: '标签管理',
          icon: 'Tag',
        },
        listProperties: ['name', 'color', 'isActive', 'createdAt'],
        showProperties: ['name', 'description', 'color', 'isActive', 'createdAt', 'updatedAt'],
        editProperties: ['name', 'description', 'color', 'isActive'],
        filterProperties: ['name', 'isActive'],
        sort: {
          sortBy: 'name',
          direction: 'asc',
        },
        properties: {
          id: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          color: {
            type: 'string',
            isVisible: { list: true, filter: false, show: true, edit: true },
          },
        },
      },
    },
    {
      resource: DocTag,
      options: {
        parent: {
          name: '文档标签关联',
          icon: 'Link',
        },
        listProperties: ['document.title', 'tag.name', 'createdAt'],
        showProperties: ['document.title', 'tag.name', 'createdAt'],
        editProperties: ['documentId', 'tagId'],
        filterProperties: ['documentId', 'tagId'],
        sort: {
          sortBy: 'createdAt',
          direction: 'desc',
        },
        properties: {
          id: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
        },
      },
    },
    {
      resource: AuditLog,
      options: {
        parent: {
          name: '审计日志',
          icon: 'Shield',
        },
        listProperties: ['user.username', 'action', 'resourceType', 'summary', 'createdAt'],
        showProperties: ['user.username', 'action', 'resourceType', 'resourceId', 'summary', 'details', 'ipAddress', 'createdAt'],
        editProperties: [],
        filterProperties: ['action', 'resourceType', 'userId'],
        sort: {
          sortBy: 'createdAt',
          direction: 'desc',
        },
        properties: {
          id: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          details: {
            type: 'json',
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          ipAddress: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          userAgent: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
        },
      },
    },
  ],
  branding: {
    companyName: 'Knowledge Base Admin',
    logo: false,
    softwareBrothers: false,
    theme: {
      colors: {
        primary100: '#3B82F6',
        primary80: '#60A5FA',
        primary60: '#93C5FD',
        primary40: '#DBEAFE',
        primary20: '#EFF6FF',
        grey100: '#F3F4F6',
        grey80: '#E5E7EB',
        grey60: '#D1D5DB',
        grey40: '#9CA3AF',
        grey20: '#6B7280',
        grey0: '#111827',
        success100: '#10B981',
        success80: '#34D399',
        success60: '#6EE7B7',
        success40: '#A7F3D0',
        success20: '#D1FAE5',
        error100: '#EF4444',
        error80: '#F87171',
        error60: '#FCA5A5',
        error40: '#FECACA',
        error20: '#FEE2E2',
        info100: '#3B82F6',
        info80: '#60A5FA',
        info60: '#93C5FD',
        info40: '#DBEAFE',
        info20: '#EFF6FF',
      },
    },
  },
  rootPath: '/admin',
  loginPath: '/admin/login',
  logoutPath: '/admin/logout',
});

module.exports = {
  adminJs,
  authenticate,
};
