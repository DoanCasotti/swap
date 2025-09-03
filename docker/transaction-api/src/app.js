require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const authController = require('./controllers/authController');
const { authenticateToken, authorize } = require('./middleware/auth');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'transaction-api',
    version: process.env.APP_VERSION || '1.0.0'
  });
});

// Authentication routes
app.post('/auth/register', authController.register.bind(authController));
app.post('/auth/login', authController.login.bind(authController));
app.post('/auth/refresh', authController.refresh.bind(authController));
app.post('/auth/logout', authenticateToken, authController.logout.bind(authController));

// Protected transaction routes (placeholder)
app.post('/transactions', authenticateToken, (req, res) => {
  const { user_id, amount, currency } = req.body;
  
  if (!user_id || !amount || !currency) {
    return res.status(400).json({
      error: 'Missing required fields: user_id, amount, currency'
    });
  }

  const transaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user_id,
    amount: parseFloat(amount),
    currency,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  logger.info('Transaction created', {
    transactionId: transaction.id,
    userId: req.user.userId,
    amount: transaction.amount,
    currency: transaction.currency
  });

  res.status(201).json(transaction);
});

app.get('/transactions/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  // Placeholder response
  const transaction = {
    id,
    user_id: req.user.userId,
    amount: 100.50,
    currency: 'USD',
    status: 'completed',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:01:00Z'
  };

  logger.info('Transaction retrieved', {
    transactionId: id,
    userId: req.user.userId
  });

  res.json(transaction);
});

// Admin routes
app.get('/admin/users', authenticateToken, authorize(['admin']), (req, res) => {
  res.json({
    message: 'Admin endpoint - users list',
    userId: req.user.userId,
    role: req.user.role
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.userId
  });

  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info('Transaction API started', {
    port: PORT,
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION || '1.0.0'
  });
});

module.exports = app;