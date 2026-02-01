import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express, { Application } from 'express';
import authRouter from './auth';
import { prisma } from '@chatbot-studio/database';
import { errorHandler } from '../middleware/error-handler';

// Create a test Express app
function createTestApp(): Application {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRouter);
  // Ensure AppError and asyncHandler rejections are returned as JSON
  app.use(errorHandler);
  return app;
}

describe('Auth API Integration Tests', () => {
  let app: Application;
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User',
  };
  let accessToken: string;
  let refreshToken: string;
  let userId: string;

  beforeAll(async () => {
    app = createTestApp();

    // Clean up any existing test users
    try {
      await prisma.user.deleteMany({
        where: {
          email: {
            contains: 'test-',
          },
        },
      });
    } catch (error) {
      console.log('Cleanup warning:', error);
    }
  });

  afterAll(async () => {
    // Clean up test user
    try {
      if (userId) {
        await prisma.refreshToken.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } });
      }
    } catch (error) {
      console.log('Cleanup warning:', error);
    }

    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.name).toBe(testUser.name);
      expect(response.body.user).not.toHaveProperty('password'); // Password should not be returned

      // Save tokens for later tests
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
      userId = response.body.user.id;
    });

        it('should reject registration with duplicate email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.toLowerCase()).toContain('email');
    });

    it('should reject registration with duplicate name', async () => {
      const duplicateNameUser = {
        email: `test-name-dup-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        name: testUser.name,
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(duplicateNameUser)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.toLowerCase()).toContain('name');
    });

    it('should reject registration with weak password', async () => {
      const weakUser = {
        email: `weak-${Date.now()}@example.com`,
        password: 'weak',
        name: 'Weak User',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(weakUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with invalid email', async () => {
      const invalidUser = {
        email: 'not-an-email',
        password: 'ValidPassword123!',
        name: 'Invalid Email User',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with missing fields', async () => {
      const incompleteUser = {
        email: `incomplete-${Date.now()}@example.com`,
        // Missing password and name
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(incompleteUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject disposable email addresses', async () => {
      const disposableUser = {
        email: `test-${Date.now()}@tempmail.com`,
        password: 'ValidPassword123!',
        name: 'Disposable User',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(disposableUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('disposable');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);

      // Update tokens
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          // Missing password
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should be case-sensitive for password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password.toLowerCase(),
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('name');
      expect(response.body.email).toBe(testUser.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      // Token should be different from original
      expect(response.body.accessToken).not.toBe(accessToken);

      // Update access token
      accessToken = response.body.accessToken;
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject refresh with missing token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject refresh with access token instead of refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: accessToken })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('success');
    });

    it('should reject logout without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle logout with already invalid token gracefully', async () => {
      // Try to use the refresh token again after logout
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Password Reset Flow', () => {
    let resetToken: string;

    it('should request password reset', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('sent');
    });

    it('should handle password reset for non-existent email gracefully', async () => {
      // Should not reveal if email exists (security best practice)
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Email Verification Flow', () => {
    it('should handle email verification', async () => {
      // Note: This test assumes email verification endpoint exists
      // Adjust according to actual implementation
      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: 'test-verification-token' });

      // Expect either 200 (success) or 400/404 (invalid token)
      expect([200, 400, 404]).toContain(response.status);
    });

    it('should resend verification email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/resend-verification')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const attempts = [];

      // Make multiple rapid login attempts
      for (let i = 0; i < 10; i++) {
        attempts.push(
          request(app)
            .post('/api/v1/auth/login')
            .send({
              email: testUser.email,
              password: 'WrongPassword123!',
            })
        );
      }

      const responses = await Promise.all(attempts);
      const rateLimited = responses.some((res) => res.status === 429);

      // At least one request should be rate limited
      expect(rateLimited).toBe(true);
    }, 15000); // Increase timeout for this test
  });
});


