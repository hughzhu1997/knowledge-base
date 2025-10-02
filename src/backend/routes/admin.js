const express = require('express');
const router = express.Router();
const path = require('path');
const { adminJs, authenticate } = require('../config/admin-simple');
const { sessionConfig, requireAdmin, handleLogin, handleLogout } = require('../middleware/adminAuth');

// 设置视图引擎
router.set('view engine', 'ejs');
router.set('views', path.join(__dirname, '../views'));

// 自定义登录页面
router.get('/login', (req, res) => {
  res.render('admin/login', {
    error: null,
    email: '',
  });
});

// 处理登录
router.post('/login', handleLogin);

// 处理登出
router.get('/logout', handleLogout);

// AdminJS路由（需要认证）
const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
  adminJs,
  {
    authenticate,
    cookieName: 'adminjs',
    cookiePassword: process.env.ADMINJS_COOKIE_SECRET || 'adminjs-secret-key-change-in-production',
  },
  null,
  {
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET || 'admin-secret-key-change-in-production',
  }
);

// 应用认证中间件
router.use(requireAdmin);

// 挂载AdminJS路由
router.use('/', adminRouter);

module.exports = router;