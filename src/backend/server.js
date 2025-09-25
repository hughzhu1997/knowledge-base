const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config({ path: __dirname + '/.env' });

// Import configuration and database
const { initConfig } = require('./config/app');
const { connectDB } = require('./config/database');
const { sequelize } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const docsRoutes = require('./routes/docs');
const searchRoutes = require('./routes/search');
const adminRoutes = require('./routes/admin');
const nlpRoutes = require('./routes/nlp');
const userRoutes = require('./routes/users');

// Initialize configuration
const config = initConfig();

const app = express();
const PORT = config.port;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/nlp', nlpRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize models and sync database
    require('./models'); // Load all models and associations
    await sequelize.sync({ alter: true }); // Sync database schema
    
    // Start HTTP server
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

// Start the server
startServer();

module.exports = app;
