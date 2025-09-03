const jwt = require('jsonwebtoken');
const logger = require('./logger');

class JWTManager {
  constructor() {
    this.secret = process.env.JWT_SECRET;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET;
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
    
    if (!this.secret || !this.refreshSecret) {
      throw new Error('JWT secrets not configured');
    }
  }

  generateAccessToken(payload) {
    try {
      const token = jwt.sign(payload, this.secret, {
        expiresIn: this.accessTokenExpiry,
        issuer: 'transaction-api',
        audience: 'fintech-platform'
      });
      
      logger.info('Access token generated', {
        userId: payload.userId,
        expiresIn: this.accessTokenExpiry
      });
      
      return token;
    } catch (error) {
      logger.error('Failed to generate access token', {
        error: error.message,
        userId: payload.userId
      });
      throw new Error('Token generation failed');
    }
  }

  generateRefreshToken(payload) {
    try {
      const token = jwt.sign(payload, this.refreshSecret, {
        expiresIn: this.refreshTokenExpiry,
        issuer: 'transaction-api',
        audience: 'fintech-platform'
      });
      
      logger.info('Refresh token generated', {
        userId: payload.userId,
        expiresIn: this.refreshTokenExpiry
      });
      
      return token;
    } catch (error) {
      logger.error('Failed to generate refresh token', {
        error: error.message,
        userId: payload.userId
      });
      throw new Error('Refresh token generation failed');
    }
  }

  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'transaction-api',
        audience: 'fintech-platform'
      });
      
      return { valid: true, decoded };
    } catch (error) {
      logger.warn('Access token verification failed', {
        error: error.message,
        tokenType: 'access'
      });
      
      return { valid: false, error: error.message };
    }
  }

  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refreshSecret, {
        issuer: 'transaction-api',
        audience: 'fintech-platform'
      });
      
      return { valid: true, decoded };
    } catch (error) {
      logger.warn('Refresh token verification failed', {
        error: error.message,
        tokenType: 'refresh'
      });
      
      return { valid: false, error: error.message };
    }
  }

  generateTokenPair(payload) {
    const tokenPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role || 'user'
    };

    return {
      accessToken: this.generateAccessToken(tokenPayload),
      refreshToken: this.generateRefreshToken({ userId: payload.userId }),
      tokenType: 'Bearer',
      expiresIn: this.accessTokenExpiry
    };
  }

  refreshAccessToken(refreshToken) {
    const verification = this.verifyRefreshToken(refreshToken);
    
    if (!verification.valid) {
      throw new Error('Invalid refresh token');
    }

    return this.generateAccessToken({
      userId: verification.decoded.userId
    });
  }
}

module.exports = new JWTManager();