require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { authenticateToken, authenticateWebhook } = require('./middleware/auth');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 8081;

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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Webhook-Signature']
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
    service: 'notification-service',
    version: process.env.APP_VERSION || '1.0.0'
  });
});

// Webhook endpoint for receiving transaction events
app.post('/webhook/transaction', authenticateWebhook, (req, res) => {
  const { event, data } = req.body;
  
  logger.info('Webhook received', {
    event,
    transactionId: data?.id,
    userId: data?.user_id
  });

  // Process webhook event
  switch (event) {
    case 'transaction.created':
      handleTransactionCreated(data);
      break;
    case 'transaction.completed':
      handleTransactionCompleted(data);
      break;
    case 'transaction.failed':
      handleTransactionFailed(data);
      break;
    default:
      logger.warn('Unknown webhook event', { event });
  }

  res.json({
    message: 'Webhook processed successfully',
    event,
    timestamp: new Date().toISOString()
  });
});

// Send notification endpoint
app.post('/notify', authenticateToken, (req, res) => {
  const { user_id, message, type = 'info' } = req.body;
  
  if (!user_id || !message) {
    return res.status(400).json({
      error: 'Missing required fields: user_id, message'
    });
  }

  const notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user_id,
    message,
    type,
    status: 'sent',
    created_at: new Date().toISOString()
  };

  logger.info('Notification sent', {
    notificationId: notification.id,
    userId: user_id,
    type,
    sentBy: req.user?.userId
  });

  res.status(201).json(notification);
});

// Get user notifications
app.get('/notifications/:user_id', authenticateToken, (req, res) => {
  const { user_id } = req.params;
  
  // Authorization check - users can only see their own notifications
  if (req.user.userId !== user_id && req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied. You can only view your own notifications.'
    });
  }

  // Placeholder notifications
  const notifications = [
    {
      id: 'notif_001',
      user_id,
      message: 'Transaction completed successfully.',
      type: 'success',
      status: 'read',
      created_at: '2024-01-01T10:00:00Z'
    },
    {
      id: 'notif_002',
      user_id,
      message: 'New login detected from new device.',
      type: 'security',
      status: 'unread',
      created_at: '2024-01-01T11:00:00Z'
    }
  ];

  logger.info('Notifications retrieved', {
    userId: user_id,
    count: notifications.length,
    requestedBy: req.user.userId
  });

  res.json(notifications);
});

// Webhook event handlers
function handleTransactionCreated(data) {
  logger.info('Processing transaction created event', {
    transactionId: data.id,
    userId: data.user_id,
    amount: data.amount
  });
  
  // Send notification to user
  const notification = {
    user_id: data.user_id,
    message: `Transaction ${data.id} for ${data.amount} ${data.currency} has been created and is being processed.`,
    type: 'transaction',
    created_at: new Date().toISOString()
  };
  
  // In a real implementation, you would store this in database
  logger.info('Transaction notification queued', notification);
}

function handleTransactionCompleted(data) {
  logger.info('Processing transaction completed event', {
    transactionId: data.id,
    userId: data.user_id
  });
  
  const notification = {
    user_id: data.user_id,
    message: `Transaction ${data.id} completed successfully!`,
    type: 'success',
    created_at: new Date().toISOString()
  };
  
  logger.info('Transaction completion notification queued', notification);
}

function handleTransactionFailed(data) {
  logger.info('Processing transaction failed event', {
    transactionId: data.id,
    userId: data.user_id,
    reason: data.failure_reason
  });
  
  const notification = {
    user_id: data.user_id,
    message: `Transaction ${data.id} failed: ${data.failure_reason}`,
    type: 'error',
    created_at: new Date().toISOString()
  };
  
  logger.error('Transaction failure notification queued', notification);
}

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
  logger.info('Notification Service started', {
    port: PORT,
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION || '1.0.0'
  });
});

module.exports = app;