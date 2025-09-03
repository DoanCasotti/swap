const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

describe('Auth Controller Tests', () => {
  let mockClient;
  let mockPool;
  let authController;

  beforeAll(() => {
    // Setup environment
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_ACCESS_EXPIRY = '15m';
    process.env.JWT_REFRESH_EXPIRY = '7d';

    // Create mocks
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };

    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient)
    };

    // Mock the Pool constructor to return our mockPool
    jest.doMock('pg', () => ({
      Pool: jest.fn().mockImplementation(() => mockPool)
    }));

    // Mock logger
    jest.doMock('../utils/logger', () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }));

    // Import after mocking
    authController = require('../controllers/authController');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.query.mockReset();
    mockClient.release.mockReset();
    mockPool.connect.mockResolvedValue(mockClient);
  });

  describe('Registration', () => {
    test('should register new user successfully', async () => {
      // Setup mocks
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // Check existing user
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: '123', 
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            role: 'user',
            created_at: new Date()
          }] 
        }) // Insert user
        .mockResolvedValueOnce({ rows: [] }); // Insert refresh token

      const req = {
        body: {
          email: 'test@example.com',
          password: 'TestPass123!',
          firstName: 'Test',
          lastName: 'User'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await authController.register(req, res);

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User registered successfully'
        })
      );
    });

    test('should handle validation errors', async () => {
      const req = {
        body: {
          email: 'invalid-email',
          password: 'weak',
          firstName: 'Test',
          lastName: 'User'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await authController.register(req, res);

      expect(mockClient.release).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should handle existing user', async () => {
      mockClient.query.mockResolvedValueOnce({ 
        rows: [{ id: '456' }] 
      });

      const req = {
        body: {
          email: 'existing@example.com',
          password: 'TestPass123!',
          firstName: 'Test',
          lastName: 'User'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await authController.register(req, res);

      expect(mockClient.release).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Email already registered'
      });
    });
  });

  describe('Login', () => {
    test('should login user successfully', async () => {
      const hashedPassword = await bcrypt.hash('TestPass123!', 12);
      
      mockClient.query
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: '123',
            email: 'test@example.com',
            password_hash: hashedPassword,
            first_name: 'Test',
            last_name: 'User',
            role: 'user',
            is_active: true
          }] 
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const req = {
        body: {
          email: 'test@example.com',
          password: 'TestPass123!'
        }
      };

      const res = {
        json: jest.fn()
      };

      await authController.login(req, res);

      expect(mockClient.release).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful'
        })
      );
    });

    test('should reject invalid credentials', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const req = {
        body: {
          email: 'nonexistent@example.com',
          password: 'TestPass123!'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await authController.login(req, res);

      expect(mockClient.release).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid credentials'
      });
    });
  });

  describe('Logout', () => {
    test('should logout successfully', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const req = {
        body: {
          refreshToken: 'some-token'
        },
        user: {
          userId: '123'
        }
      };

      const res = {
        json: jest.fn()
      };

      await authController.logout(req, res);

      expect(mockClient.release).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Logout successful'
      });
    });
  });
});