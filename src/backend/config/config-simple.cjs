require('dotenv').config();

module.exports = {
  development: {
    username: process.env.USER || 'mac',
    password: null,
    database: process.env.DB_NAME || 'knowledge_db',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
};
