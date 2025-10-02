// database.js
// Database configuration and connection management for PostgreSQL

const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * Create Sequelize instance with PostgreSQL configuration
 * Uses environment variables with fallback defaults
 */
const sequelize = new Sequelize(
  process.env.DB_NAME || 'knowledge_base',   // Database name
  process.env.DB_USER || 'mac',             // Username
  process.env.DB_PASS || 'password',        // Password
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false, // Set to true for SQL debugging
  }
);

/**
 * Test database connection and handle errors
 * @returns {Promise<void>} Connection test result
 */
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

