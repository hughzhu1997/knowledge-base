// server.js
// Main Express server configuration and startup for the Knowledge Base API
// Handles middleware setup, route mounting, error handling, and database connection

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const path = require('path');
require('dotenv').config({ path: __dirname + '/.env' });

// Import configuration and database modules
const { initConfig } = require('./config/app');
const { connectDB } = require('./config/database');
const { sequelize } = require('./config/database');

// Import API route modules
const authRoutes = require('./routes/auth');
const enhancedAuthRoutes = require('./routes/enhancedAuth');
const docsRoutes = require('./routes/docs');
const searchRoutes = require('./routes/search');
const adminRoutes = require('./routes/admin-custom');
const nlpRoutes = require('./routes/nlp');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const policyRoutes = require('./routes/policies');

// Import admin authentication middleware
const { sessionConfig, sessionStore } = require('./middleware/adminAuth');

// Initialize application configuration
const config = initConfig();

const app = express();
const PORT = config.port;

// Configure EJS template engine for admin views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Security and utility middleware configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "https://cdn.tailwindcss.com"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware for admin authentication
app.use(session(sessionConfig));

// Mount API route modules
app.use('/api/auth', authRoutes);
app.use('/api/enhanced-auth', enhancedAuthRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/nlp', nlpRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/policies', policyRoutes);

// Mount admin routes (serves both API and web interface)
app.use('/admin', adminRoutes);

/**
 * Root endpoint - API information and status
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {JSON} API information and available endpoints
 */
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Knowledge Base API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          auth: '/api/auth',
          enhancedAuth: '/api/enhanced-auth',
          docs: '/api/docs',
          search: '/api/search',
          admin: '/api/admin',
          nlp: '/api/nlp',
          users: '/api/users',
          roles: '/api/roles',
          policies: '/api/policies'
        }
  });
});

/**
 * Health check endpoint for monitoring
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {JSON} Server health status and uptime
 */
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * 404 handler for undefined routes
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {JSON} Not found error message
 */
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

/**
 * Global error handler for unhandled exceptions
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 * @returns {JSON} Error response with appropriate message
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

/**
 * Start the Express server and initialize database connection
 * @returns {Promise<void>} Server startup process
 */
const startServer = async () => {
  try {
    // Establish database connection
    await connectDB();
    
    // Load all Sequelize models and their associations
    require('./models');
    
    // Synchronize database schema with models (force: false to avoid conflicts)
    // Skip problematic models for now
    try {
      await sequelize.sync({ force: false });
    } catch (syncError) {
      console.warn('⚠️  Database sync warning:', syncError.message);
      console.log('📝 Continuing without full sync...');
    }
    
    // Start HTTP server on configured port
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 Knowledge Base API v1.0`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Initialize and start the server
startServer();

module.exports = app;
