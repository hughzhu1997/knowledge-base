const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { sequelize } = require('../config/database');
const { User } = require('../models');
const { AuditLog } = require('../models');

// 配置Session存储
const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: 'admin_sessions',
  checkExpirationInterval: 15 * 60 * 1000, // 15分钟检查一次过期
  expiration: 24 * 60 * 60 * 1000, // 24小时过期
});

// Session配置
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'admin-secret-key-change-in-production',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24小时
  },
  name: 'admin.sid',
};

// 权限检查中间件
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.session || !req.session.adminUser) {
      return res.redirect('/admin/login');
    }

    // 验证用户是否仍然是admin
    const user = await User.findByPk(req.session.adminUser.id);
    if (!user || user.role !== 'admin') {
      req.session.destroy();
      return res.redirect('/admin/login');
    }

    // 更新session中的用户信息
    req.session.adminUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    req.session.destroy();
    res.redirect('/admin/login');
  }
};

// 审计日志中间件
const auditLogger = (action, resourceType) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // 记录操作到审计日志
      if (req.session && req.session.adminUser) {
        AuditLog.create({
          userId: req.session.adminUser.id,
          action,
          resourceType,
          resourceId: req.params.id || null,
          summary: `${action} ${resourceType}${req.params.id ? ` (ID: ${req.params.id})` : ''}`,
          details: {
            method: req.method,
            url: req.originalUrl,
            body: req.body,
            query: req.query,
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
        }).catch(err => {
          console.error('Audit log error:', err);
        });
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// 登录处理
const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.render('admin/login', {
        error: '邮箱和密码不能为空',
        email: email || '',
      });
    }

    const user = await User.findOne({ where: { email } });
    
    if (!user || user.role !== 'admin' || !(await user.checkPassword(password))) {
      return res.render('admin/login', {
        error: '邮箱或密码错误，或您没有管理员权限',
        email,
      });
    }

    // 设置session
    req.session.adminUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    // 记录登录日志
    await AuditLog.create({
      userId: user.id,
      action: 'login',
      resourceType: 'User',
      resourceId: user.id,
      summary: `管理员登录: ${user.username}`,
      details: {
        loginTime: new Date(),
        userAgent: req.get('User-Agent'),
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    });

    res.redirect('/admin');
  } catch (error) {
    console.error('Login error:', error);
    res.render('admin/login', {
      error: '登录失败，请稍后重试',
      email: req.body.email || '',
    });
  }
};

// 登出处理
const handleLogout = async (req, res) => {
  try {
    if (req.session && req.session.adminUser) {
      // 记录登出日志
      await AuditLog.create({
        userId: req.session.adminUser.id,
        action: 'logout',
        resourceType: 'User',
        resourceId: req.session.adminUser.id,
        summary: `管理员登出: ${req.session.adminUser.username}`,
        details: {
          logoutTime: new Date(),
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
      });
    }
  } catch (error) {
    console.error('Logout audit error:', error);
  } finally {
    req.session.destroy();
    res.redirect('/admin/login');
  }
};

module.exports = {
  sessionConfig,
  sessionStore,
  requireAdmin,
  auditLogger,
  handleLogin,
  handleLogout,
};



