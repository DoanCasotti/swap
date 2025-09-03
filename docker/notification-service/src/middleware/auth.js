const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('Authentication failed: No token provided', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path
    });
    return res.status(401).json({ 
      error: 'Access denied. No token provided.' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    logger.info('Authentication successful', {
      userId: decoded.userId,
      endpoint: req.path
    });
    next();
  } catch (error) {
    logger.warn('Authentication failed: Invalid token', {
      error: error.message,
      ip: req.ip,
      endpoint: req.path
    });
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired' 
      });
    }
    
    return res.status(403).json({ 
      error: 'Invalid token' 
    });
  }
};

const authenticateWebhook = (req, res, next) => {
  const webhookSecret = process.env.WEBHOOK_SECRET;
  const signature = req.headers['x-webhook-signature'];

  if (!webhookSecret) {
    logger.error('Webhook secret not configured');
    return res.status(500).json({ 
      error: 'Server configuration error' 
    });
  }

  if (!signature) {
    logger.warn('Webhook authentication failed: No signature provided', {
      ip: req.ip,
      endpoint: req.path
    });
    return res.status(401).json({ 
      error: 'Webhook signature required' 
    });
  }

  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== `sha256=${expectedSignature}`) {
    logger.warn('Webhook authentication failed: Invalid signature', {
      ip: req.ip,
      endpoint: req.path,
      providedSignature: signature
    });
    return res.status(401).json({ 
      error: 'Invalid webhook signature' 
    });
  }

  logger.info('Webhook authentication successful', {
    endpoint: req.path,
    ip: req.ip
  });
  
  next();
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    logger.info('Optional authentication successful', {
      userId: decoded.userId,
      endpoint: req.path
    });
  } catch (error) {
    logger.info('Optional authentication failed, continuing without auth', {
      error: error.message,
      endpoint: req.path
    });
  }
  
  next();
};

const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Access denied. Authentication required.' 
      });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      logger.warn('Authorization failed: Insufficient permissions', {
        userId: req.user.userId,
        userRole: req.user.role,
        requiredRoles: roles,
        endpoint: req.path
      });
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authenticateWebhook,
  optionalAuth,
  authorize
};