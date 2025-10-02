// app.js
// Application configuration and environment management

/**
 * Application configuration object
 * Contains all configuration settings with environment variable fallbacks
 */
const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration (PostgreSQL)
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'knowledge_base',
    user: process.env.DB_USER || 'mac',
    password: process.env.DB_PASS || 'password'
  },
  
  // JWT configuration for authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  // CORS configuration for cross-origin requests
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  
  // File upload limits and allowed types
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || '10MB',
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  },
  
  // Pagination defaults for API responses
  pagination: {
    defaultLimit: 10,
    maxLimit: 100
  },
  
  // Search configuration for document queries
  search: {
    maxResults: 20,
    snippetLength: 200
  }
};

/**
 * Validate required environment variables
 * Checks for required variables based on environment
 * @returns {void} Exits process if validation fails
 */
const validateConfig = () => {
  const requiredEnvVars = [];
  
  if (config.nodeEnv === 'production') {
    requiredEnvVars.push('JWT_SECRET', 'DB_NAME', 'DB_USER', 'DB_PASS');
  }
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    process.exit(1);
  }
};

/**
 * Initialize and validate application configuration
 * @returns {Object} Validated configuration object
 */
const initConfig = () => {
  validateConfig();
  
  if (config.nodeEnv === 'development') {
    console.log('🔧 Running in development mode');
    console.log('⚠️  Using fallback JWT secret - change in production!');
  }
  
  return config;
};

module.exports = {
  config,
  validateConfig,
  initConfig
};
