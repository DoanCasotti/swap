const jwt = require('jsonwebtoken');
const { authenticateToken, optionalAuth, authorize } = require('../middleware/auth');

// Mock logger
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    
    req = {
      headers: {},
      ip: '127.0.0.1',
      path: '/test',
      get: jest.fn().mockReturnValue('test-agent')
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    test('should authenticate valid token', () => {
      const payload = { userId: '123', email: 'test@example.com', role: 'user' };
      const token = jwt.sign(payload, process.env.JWT_SECRET);
      
      req.headers['authorization'] = `Bearer ${token}`;

      authenticateToken(req, res, next);

      expect(req.user).toEqual(expect.objectContaining(payload));
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject request without token', () => {
      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. No token provided.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject invalid token', () => {
      req.headers['authorization'] = 'Bearer invalid-token';

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject expired token', () => {
      const payload = { userId: '123', email: 'test@example.com', role: 'user' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '-1h' });
      
      req.headers['authorization'] = `Bearer ${token}`;

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token expired'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle malformed authorization header', () => {
      req.headers['authorization'] = 'InvalidFormat';

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. No token provided.'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    test('should authenticate valid token when provided', () => {
      const payload = { userId: '123', email: 'test@example.com', role: 'user' };
      const token = jwt.sign(payload, process.env.JWT_SECRET);
      
      req.headers['authorization'] = `Bearer ${token}`;

      optionalAuth(req, res, next);

      expect(req.user).toEqual(expect.objectContaining(payload));
      expect(next).toHaveBeenCalled();
    });

    test('should continue without authentication when no token provided', () => {
      optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should continue without authentication when invalid token provided', () => {
      req.headers['authorization'] = 'Bearer invalid-token';

      optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    test('should authorize user with correct role', () => {
      req.user = { userId: '123', role: 'admin' };
      
      const middleware = authorize(['admin']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should authorize user when no roles specified', () => {
      req.user = { userId: '123', role: 'user' };
      
      const middleware = authorize();
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject user without authentication', () => {
      const middleware = authorize(['admin']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Authentication required.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject user with incorrect role', () => {
      req.user = { userId: '123', role: 'user' };
      
      const middleware = authorize(['admin']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Insufficient permissions.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should authorize user with one of multiple allowed roles', () => {
      req.user = { userId: '123', role: 'moderator' };
      
      const middleware = authorize(['admin', 'moderator']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});