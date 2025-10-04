require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || process.env.USER,
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || 'knowledge_db',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: true,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  },
  test: {
    username: process.env.DB_USER || process.env.USER,
    password: process.env.DB_PASSWORD || null,
    database: 'knowledge_db_test',
    host: '127.0.0.1',
    port: 5432,
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
};