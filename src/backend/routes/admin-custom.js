const express = require('express');
const router = express.Router();
const path = require('path');
const { User, Document, Tag, DocTag, AuditLog } = require('../models');
const { requireAdmin, handleLogin, handleLogout, auditLogger } = require('../middleware/adminAuth');

// 自定义登录页面
router.get('/login', (req, res) => {
  res.render('admin/login-local', {
    error: null,
    email: '',
  });
});

// 处理登录
router.post('/login', handleLogin);

// 处理登出
router.get('/logout', handleLogout);

// 应用认证中间件
router.use(requireAdmin);

// 后台首页
router.get('/', async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.count(),
      totalDocuments: await Document.count(),
      totalTags: await Tag.count(),
      recentLogs: await AuditLog.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [{ model: User, as: 'user', attributes: ['username'] }]
      })
    };

    res.render('admin/dashboard', {
      title: '后台管理',
      stats,
      user: req.session.adminUser
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('admin/error', { error: '加载仪表板失败' });
  }
});

// 用户管理
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    res.render('admin/users', {
      title: '用户管理',
      users,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      },
      user: req.session.adminUser
    });
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).render('admin/error', { error: '加载用户列表失败' });
  }
});

// 文档管理
router.get('/documents', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'all';

    const where = status !== 'all' ? { status } : {};

    const { count, rows: documents } = await Document.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'author', attributes: ['username', 'email'] },
        { model: Tag, as: 'tags', through: { attributes: [] } }
      ]
    });

    res.render('admin/documents', {
      title: '文档管理',
      documents,
      currentStatus: status,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      },
      user: req.session.adminUser
    });
  } catch (error) {
    console.error('Documents error:', error);
    res.status(500).render('admin/error', { error: '加载文档列表失败' });
  }
});

// 标签管理
router.get('/tags', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const { count, rows: tags } = await Tag.findAndCountAll({
      limit,
      offset,
      order: [['name', 'ASC']]
    });

    res.render('admin/tags', {
      title: '标签管理',
      tags,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      },
      user: req.session.adminUser
    });
  } catch (error) {
    console.error('Tags error:', error);
    res.status(500).render('admin/error', { error: '加载标签列表失败' });
  }
});

// 审计日志
router.get('/audit-logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['username', 'email'] }]
    });

    res.render('admin/audit-logs', {
      title: '审计日志',
      auditLogs: logs,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      },
      user: req.session.adminUser
    });
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).render('admin/error', { error: '加载审计日志失败' });
  }
});

// 发布文档
router.post('/documents/:id/publish', auditLogger('publish', 'Document'), async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    if (!document) {
      return res.status(404).json({ error: '文档不存在' });
    }

    await document.update({
      status: 'published',
      publishedAt: new Date()
    });

    res.json({ success: true, message: '文档已发布' });
  } catch (error) {
    console.error('Publish error:', error);
    res.status(500).json({ error: '发布失败' });
  }
});

// 取消发布文档
router.post('/documents/:id/unpublish', auditLogger('unpublish', 'Document'), async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    if (!document) {
      return res.status(404).json({ error: '文档不存在' });
    }

    await document.update({
      status: 'draft',
      publishedAt: null
    });

    res.json({ success: true, message: '文档已取消发布' });
  } catch (error) {
    console.error('Unpublish error:', error);
    res.status(500).json({ error: '取消发布失败' });
  }
});

// 归档文档
router.post('/documents/:id/archive', auditLogger('archive', 'Document'), async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    if (!document) {
      return res.status(404).json({ error: '文档不存在' });
    }

    await document.update({
      status: 'archived',
      archivedAt: new Date()
    });

    res.json({ success: true, message: '文档已归档' });
  } catch (error) {
    console.error('Archive error:', error);
    res.status(500).json({ error: '归档失败' });
  }
});

module.exports = router;
