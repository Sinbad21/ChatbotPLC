import { describe, it, expect, beforeAll } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  TokenPayload,
  RefreshTokenPayload,
} from './jwt';

describe('JWT Module', () => {
  beforeAll(() => {
    // Ensure test secrets are set
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing';
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const payload: TokenPayload = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'USER',
      };

      const token = generateAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include payload data in the token', () => {
      const payload: TokenPayload = {
        userId: 'user456',
        email: 'user@test.com',
        role: 'ADMIN',
      };

      const token = generateAccessToken(payload);
      const decoded = decodeToken(token) as TokenPayload;

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should set expiration time', () => {
      const payload: TokenPayload = {
        userId: 'user789',
        email: 'exp@test.com',
        role: 'USER',
      };

      const token = generateAccessToken(payload);
      const decoded: any = decodeToken(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      // Token should expire in approximately 15 minutes (900 seconds)
      expect(decoded.exp - decoded.iat).toBeLessThanOrEqual(900);
      expect(decoded.exp - decoded.iat).toBeGreaterThanOrEqual(899);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT refresh token', () => {
      const payload: RefreshTokenPayload = {
        userId: 'user123',
        tokenId: 'token123',
      };

      const token = generateRefreshToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include userId and tokenId in the token', () => {
      const payload: RefreshTokenPayload = {
        userId: 'user456',
        tokenId: 'token456',
      };

      const token = generateRefreshToken(payload);
      const decoded = decodeToken(token) as RefreshTokenPayload;

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.tokenId).toBe(payload.tokenId);
    });

    it('should have longer expiration than access token', () => {
      const payload: RefreshTokenPayload = {
        userId: 'user789',
        tokenId: 'token789',
      };

      const token = generateRefreshToken(payload);
      const decoded: any = decodeToken(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      // Token should expire in approximately 7 days (604800 seconds)
      const expiryDuration = decoded.exp - decoded.iat;
      expect(expiryDuration).toBeGreaterThan(600000); // More than 7 days in seconds
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const payload: TokenPayload = {
        userId: 'user123',
        email: 'verify@test.com',
        role: 'USER',
      };

      const token = generateAccessToken(payload);
      const verified = verifyAccessToken(token);

      expect(verified).toBeDefined();
      expect(verified.userId).toBe(payload.userId);
      expect(verified.email).toBe(payload.email);
      expect(verified.role).toBe(payload.role);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyAccessToken(invalidToken)).toThrow('Invalid or expired token');
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'not-a-jwt';

      expect(() => verifyAccessToken(malformedToken)).toThrow('Invalid or expired token');
    });

    it('should throw error for empty token', () => {
      expect(() => verifyAccessToken('')).toThrow('Invalid or expired token');
    });

    it('should throw error for token with wrong secret', () => {
      // Create token with different secret
      const jwt = require('jsonwebtoken');
      const wrongToken = jwt.sign(
        { userId: 'user123', email: 'test@test.com', role: 'USER' },
        'wrong-secret'
      );

      expect(() => verifyAccessToken(wrongToken)).toThrow('Invalid or expired token');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const payload: RefreshTokenPayload = {
        userId: 'user123',
        tokenId: 'token123',
      };

      const token = generateRefreshToken(payload);
      const verified = verifyRefreshToken(token);

      expect(verified).toBeDefined();
      expect(verified.userId).toBe(payload.userId);
      expect(verified.tokenId).toBe(payload.tokenId);
    });

    it('should throw error for invalid refresh token', () => {
      const invalidToken = 'invalid.refresh.token';

      expect(() => verifyRefreshToken(invalidToken)).toThrow(
        'Invalid or expired refresh token'
      );
    });

    it('should throw error for access token used as refresh token', () => {
      const payload: TokenPayload = {
        userId: 'user123',
        email: 'test@test.com',
        role: 'USER',
      };
      const accessToken = generateAccessToken(payload);

      expect(() => verifyRefreshToken(accessToken)).toThrow(
        'Invalid or expired refresh token'
      );
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const payload: TokenPayload = {
        userId: 'user123',
        email: 'decode@test.com',
        role: 'USER',
      };

      const token = generateAccessToken(payload);
      const decoded = decodeToken(token) as TokenPayload;

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should decode token even if expired', () => {
      // Create expired token using jwt directly
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: 'user123', email: 'test@test.com', role: 'USER' },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );

      const decoded = decodeToken(expiredToken);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe('user123');
    });

    it('should return null for invalid token format', () => {
      const invalidToken = 'not-a-valid-jwt';
      const decoded = decodeToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it('should include standard JWT claims', () => {
      const payload: TokenPayload = {
        userId: 'user123',
        email: 'claims@test.com',
        role: 'USER',
      };

      const token = generateAccessToken(payload);
      const decoded: any = decodeToken(token);

      expect(decoded.iat).toBeDefined(); // Issued at
      expect(decoded.exp).toBeDefined(); // Expiration time
      expect(typeof decoded.iat).toBe('number');
      expect(typeof decoded.exp).toBe('number');
    });
  });

  describe('Token Integration', () => {
    it('should create and verify access token end-to-end', () => {
      const payload: TokenPayload = {
        userId: 'integration-user',
        email: 'integration@test.com',
        role: 'ADMIN',
      };

      const token = generateAccessToken(payload);
      const verified = verifyAccessToken(token);

      expect(verified.userId).toBe(payload.userId);
      expect(verified.email).toBe(payload.email);
      expect(verified.role).toBe(payload.role);
    });

    it('should create and verify refresh token end-to-end', () => {
      const payload: RefreshTokenPayload = {
        userId: 'integration-user',
        tokenId: 'integration-token-id',
      };

      const token = generateRefreshToken(payload);
      const verified = verifyRefreshToken(token);

      expect(verified.userId).toBe(payload.userId);
      expect(verified.tokenId).toBe(payload.tokenId);
    });

    it('should handle multiple tokens independently', () => {
      const user1: TokenPayload = {
        userId: 'user1',
        email: 'user1@test.com',
        role: 'USER',
      };

      const user2: TokenPayload = {
        userId: 'user2',
        email: 'user2@test.com',
        role: 'ADMIN',
      };

      const token1 = generateAccessToken(user1);
      const token2 = generateAccessToken(user2);

      const verified1 = verifyAccessToken(token1);
      const verified2 = verifyAccessToken(token2);

      expect(verified1.userId).toBe('user1');
      expect(verified2.userId).toBe('user2');
      expect(verified1.role).toBe('USER');
      expect(verified2.role).toBe('ADMIN');
    });
  });
});
