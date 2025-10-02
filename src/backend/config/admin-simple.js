const AdminJS = require('adminjs');
const AdminJSExpress = require('@adminjs/express');
const AdminJSSequelize = require('@adminjs/sequelize');
const { User, Document, Tag, DocTag, AuditLog } = require('../models');

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

// 简化的AdminJS配置
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
        properties: {
          password: {
            isVisible: false,
          },
          id: {
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
        showProperties: ['title', 'category', 'content', 'status', 'author.username', 'createdAt', 'updatedAt'],
        editProperties: ['title', 'category', 'content', 'status'],
        filterProperties: ['title', 'category', 'status'],
        properties: {
          content: {
            type: 'textarea',
            isVisible: { list: false, filter: false, show: true, edit: true },
          },
          id: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
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
        properties: {
          id: {
            isVisible: { list: false, filter: false, show: true, edit: false },
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
  },
  rootPath: '/admin',
  loginPath: '/admin/login',
  logoutPath: '/admin/logout',
});

module.exports = {
  adminJs,
  authenticate,
};



