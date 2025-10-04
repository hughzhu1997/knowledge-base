import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import authRoutes from '../routes/auth.js';
import enhancedAuthRoutes from '../routes/enhanced-auth.js';
import adminRoutes from '../routes/admin.js';
import documentRoutes from '../routes/documents.js';
import tagRoutes from '../routes/tags.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100
});
app.use('/api', limiter);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ok',
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: '2.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/enhanced-auth', enhancedAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/tags', tagRoutes);

// Root route
app.get('/api', (req, res) => {
  res.json({
    message: 'Knowledge Base System API',
    version: '2.0.0',
    status: 'running',
      endpoints: {
        health: '/api/health',
        auth: {
          register: 'POST /api/auth/register',
          login: 'POST /api/auth/login',
          refresh: 'POST /api/auth/refresh',
          changePassword: 'POST /api/auth/change-password'
        },
        enhancedAuth: {
          enhancedRegister: 'POST /api/enhanced-auth/register (Admin only)'
        },
        admin: {
          dashboard: 'GET /api/admin/dashboard (IAM: system:Manage)',
          users: 'GET /api/admin/users (IAM: users:Read)',
          createUser: 'POST /api/admin/users (IAM: users:Create)',
          settings: 'GET /api/admin/settings (IAM: system:Manage)'
        },
            documents: {
              list: 'GET /api/documents (IAM: docs:Read)',
              get: 'GET /api/documents/:id (IAM: docs:Read)',
              create: 'POST /api/documents (IAM: docs:Create)',
              update: 'PUT /api/documents/:id (IAM: docs:Update)',
              delete: 'DELETE /api/documents/:id (IAM: docs:Delete)',
              publish: 'POST /api/documents/:id/publish (IAM: docs:Update)',
              archive: 'POST /api/documents/:id/archive (IAM: docs:Update)',
              revisions: 'GET /api/documents/:id/revisions (IAM: docs:Read)',
              search: 'GET /api/documents/search (IAM: docs:Read)',
              stats: 'GET /api/documents/stats (IAM: docs:Read)',
              myDocs: 'GET /api/documents/my (IAM: docs:Read)'
            },
            tags: {
              list: 'GET /api/tags (IAM: docs:Read)',
              get: 'GET /api/tags/:id (IAM: docs:Read)',
              create: 'POST /api/tags (IAM: docs:Create)',
              update: 'PUT /api/tags/:id (IAM: docs:Update)',
              delete: 'DELETE /api/tags/:id (IAM: docs:Delete)',
              search: 'GET /api/tags/search (IAM: docs:Read)',
              popular: 'GET /api/tags/popular (IAM: docs:Read)',
              stats: 'GET /api/tags/stats (IAM: docs:Read)',
              byDocument: 'GET /api/tags/document/:id (IAM: docs:Read)'
            }
      }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

export default app;
