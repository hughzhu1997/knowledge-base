// src/backend/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

// 创建 Sequelize 实例
const sequelize = new Sequelize(
  process.env.DB_NAME || 'knowledge_base',   // 数据库名
  process.env.DB_USER || 'postgres',         // 用户名
  process.env.DB_PASS || 'password',         // 密码
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false, // 设置为 true 可以调试 SQL
  }
);

// 连接测试函数
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL Connected');
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };

