// Application configuration
const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/knowledge-base',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  
  // File upload limits
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || '10MB',
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  },
  
  // Pagination defaults
  pagination: {
    defaultLimit: 10,
    maxLimit: 100
  },
  
  // Search configuration
  search: {
    maxResults: 20,
    snippetLength: 200
  }
};

// Validation function
const validateConfig = () => {
  const requiredEnvVars = [];
  
  if (config.nodeEnv === 'production') {
    requiredEnvVars.push('JWT_SECRET', 'MONGODB_URI');
  }
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    process.exit(1);
  }
};

// Initialize configuration
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
