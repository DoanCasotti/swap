const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { Pool } = require('pg');
const jwt = require('../utils/jwt');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  role: Joi.string().valid('user', 'admin').default('user')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

class AuthController {
  async register(req, res) {
    const client = await pool.connect();
    
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        logger.warn('Registration validation failed', {
          error: error.details[0].message,
          email: req.body.email
        });
        return res.status(400).json({ 
          error: error.details[0].message 
        });
      }

      const { email, password, firstName, lastName, role } = value;

      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        logger.warn('Registration failed: Email already exists', { email });
        return res.status(409).json({ 
          error: 'Email already registered' 
        });
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const result = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
         RETURNING id, email, first_name, last_name, role, created_at`,
        [email, hashedPassword, firstName, lastName, role]
      );

      const user = result.rows[0];
      const tokens = jwt.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      await client.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, tokens.refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
      );

      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        role: user.role
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          createdAt: user.created_at
        },
        tokens
      });

    } catch (error) {
      logger.error('Registration failed', {
        error: error.message,
        stack: error.stack,
        email: req.body.email
      });
      res.status(500).json({ 
        error: 'Registration failed' 
      });
    } finally {
      client.release();
    }
  }

  async login(req, res) {
    const client = await pool.connect();
    
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        logger.warn('Login validation failed', {
          error: error.details[0].message,
          email: req.body.email
        });
        return res.status(400).json({ 
          error: error.details[0].message 
        });
      }

      const { email, password } = value;

      const result = await client.query(
        'SELECT id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        logger.warn('Login failed: User not found', { email });
        return res.status(401).json({ 
          error: 'Invalid credentials' 
        });
      }

      const user = result.rows[0];

      if (!user.is_active) {
        logger.warn('Login failed: Account deactivated', {
          userId: user.id,
          email: user.email
        });
        return res.status(401).json({ 
          error: 'Account deactivated' 
        });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        logger.warn('Login failed: Invalid password', {
          userId: user.id,
          email: user.email
        });
        return res.status(401).json({ 
          error: 'Invalid credentials' 
        });
      }

      const tokens = jwt.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      await client.query(
        'DELETE FROM refresh_tokens WHERE user_id = $1 AND expires_at < NOW()',
        [user.id]
      );

      await client.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, tokens.refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
      );

      await client.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email
      });

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        },
        tokens
      });

    } catch (error) {
      logger.error('Login failed', {
        error: error.message,
        stack: error.stack,
        email: req.body.email
      });
      res.status(500).json({ 
        error: 'Login failed' 
      });
    } finally {
      client.release();
    }
  }

  async refresh(req, res) {
    const client = await pool.connect();
    
    try {
      const { error, value } = refreshSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: error.details[0].message 
        });
      }

      const { refreshToken } = value;
      const verification = jwt.verifyRefreshToken(refreshToken);

      if (!verification.valid) {
        logger.warn('Token refresh failed: Invalid refresh token');
        return res.status(401).json({ 
          error: 'Invalid refresh token' 
        });
      }

      const tokenResult = await client.query(
        'SELECT user_id, expires_at FROM refresh_tokens WHERE token = $1',
        [refreshToken]
      );

      if (tokenResult.rows.length === 0) {
        logger.warn('Token refresh failed: Refresh token not found');
        return res.status(401).json({ 
          error: 'Invalid refresh token' 
        });
      }

      const tokenData = tokenResult.rows[0];
      
      if (new Date() > new Date(tokenData.expires_at)) {
        await client.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
        logger.warn('Token refresh failed: Refresh token expired');
        return res.status(401).json({ 
          error: 'Refresh token expired' 
        });
      }

      const userResult = await client.query(
        'SELECT id, email, role, is_active FROM users WHERE id = $1',
        [tokenData.user_id]
      );

      if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
        await client.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
        logger.warn('Token refresh failed: User not found or inactive');
        return res.status(401).json({ 
          error: 'Invalid refresh token' 
        });
      }

      const user = userResult.rows[0];
      const newTokens = jwt.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      await client.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
      await client.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, newTokens.refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
      );

      logger.info('Token refreshed successfully', {
        userId: user.id,
        email: user.email
      });

      res.json({
        message: 'Token refreshed successfully',
        tokens: newTokens
      });

    } catch (error) {
      logger.error('Token refresh failed', {
        error: error.message,
        stack: error.stack
      });
      res.status(500).json({ 
        error: 'Token refresh failed' 
      });
    } finally {
      client.release();
    }
  }

  async logout(req, res) {
    const client = await pool.connect();
    
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await client.query(
          'DELETE FROM refresh_tokens WHERE token = $1',
          [refreshToken]
        );
      }

      if (req.user) {
        await client.query(
          'DELETE FROM refresh_tokens WHERE user_id = $1',
          [req.user.userId]
        );

        logger.info('User logged out successfully', {
          userId: req.user.userId
        });
      }

      res.json({
        message: 'Logout successful'
      });

    } catch (error) {
      logger.error('Logout failed', {
        error: error.message,
        stack: error.stack
      });
      res.status(500).json({ 
        error: 'Logout failed' 
      });
    } finally {
      client.release();
    }
  }
}

module.exports = new AuthController();