import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express, { Application } from 'express';
import analyticsRouter from './analytics';
import { prisma } from '@chatbot-studio/database';
import { generateAccessToken } from '@chatbot-studio/auth';

// Create a test Express app
function createTestApp(): Application {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/analytics', analyticsRouter);
  return app;
}

describe('Analytics API Integration Tests', () => {
  let app: Application;
  let accessToken: string;
  let testUserId: string;
  let testOrganizationId: string;
  let testBotId: string;

  beforeAll(async () => {
    app = createTestApp();

    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: `analytics-test-${Date.now()}@example.com`,
        password: 'hashed-password',
        name: 'Analytics Test User',
        emailVerified: true,
      },
    });

    testUserId = testUser.id;
    // Create a test organization (required by Bot model)
    const testOrganization = await prisma.organization.create({
      data: {
        name: 'Analytics Test Organization',
        slug: `analytics-test-org-${Date.now()}`,
      },
    });

    testOrganizationId = testOrganization.id;

    await prisma.organizationMember.create({
      data: {
        organizationId: testOrganizationId,
        userId: testUserId,
        role: 'OWNER',
      },
    });

    // Generate access token for test user
    accessToken = generateAccessToken({
      userId: testUser.id,
      email: testUser.email,
      role: 'USER',
    });

    // Create a test bot
    const testBot = await prisma.bot.create({
      data: {
        name: 'Test Analytics Bot',
        description: 'Bot for testing analytics',
        organizationId: testOrganizationId,
        userId: testUserId,
        systemPrompt: 'Test prompt',
        welcomeMessage: 'Welcome',
        published: true,
      },
    });

    testBotId = testBot.id;

    // Create some test conversations
    for (let i = 0; i < 5; i++) {
      const conversation = await prisma.conversation.create({
        data: {
          botId: testBotId,
          userId: testUserId,
          sessionId: `analytics-test-session-${i}-${Date.now()}`,
        },
      });

      // Add messages to conversation
      await prisma.message.createMany({
        data: [
          {
            conversationId: conversation.id,
            content: `User message ${i}`,
            role: 'USER',
            userId: testUserId,
          },
          {
            conversationId: conversation.id,
            content: `Bot response ${i}`,
            role: 'ASSISTANT',
          },
        ],
      });
    }

    // Create some test leads
    const conversations = await prisma.conversation.findMany({
      where: { botId: testBotId },
      take: 3,
    });

    for (const conversation of conversations) {
      await prisma.lead.create({
        data: {
          email: `lead-${conversation.id}@example.com`,
          name: `Lead ${conversation.id}`,
          conversationId: conversation.id,
        },
      });
    }
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (testBotId) {
        // Delete in correct order due to foreign key constraints
        await prisma.lead.deleteMany({ where: { conversation: { botId: testBotId } } });
        await prisma.message.deleteMany({ where: { conversation: { botId: testBotId } } });
        await prisma.conversation.deleteMany({ where: { botId: testBotId } });
        await prisma.bot.delete({ where: { id: testBotId } });
      if (testOrganizationId) {
        await prisma.organizationMember.deleteMany({ where: { organizationId: testOrganizationId } });
        await prisma.organization.delete({ where: { id: testOrganizationId } });
      }
      }
      if (testUserId) {
        await prisma.refreshToken.deleteMany({ where: { userId: testUserId } });
        await prisma.user.delete({ where: { id: testUserId } });
      }
    } catch (error) {
      console.log('Cleanup warning:', error);
    }

    await prisma.$disconnect();
  });

  describe('GET /api/v1/analytics/overview', () => {
    it('should return analytics overview with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalBots');
      expect(response.body).toHaveProperty('botsThisMonth');
      expect(response.body).toHaveProperty('conversations');
      expect(response.body).toHaveProperty('conversationsGrowth');
      expect(response.body).toHaveProperty('leads');
      expect(response.body).toHaveProperty('leadsGrowth');
      expect(response.body).toHaveProperty('activeUsers');
      expect(response.body).toHaveProperty('activeUsersGrowth');

      // Check data types
      expect(typeof response.body.totalBots).toBe('number');
      expect(typeof response.body.conversations).toBe('number');
      expect(typeof response.body.leads).toBe('number');
      expect(typeof response.body.activeUsers).toBe('number');

      // Check that we have the expected test data
      expect(response.body.totalBots).toBeGreaterThan(0);
      expect(response.body.conversations).toBeGreaterThanOrEqual(5);
      expect(response.body.leads).toBeGreaterThanOrEqual(3);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/overview')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should filter by botId when provided', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/overview?botId=${testBotId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('conversations');
      expect(response.body.conversations).toBeGreaterThanOrEqual(0);
    });

    it('should handle date range filtering', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(`/api/v1/analytics/overview?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('conversations');
      expect(response.body).toHaveProperty('leads');
    });

    it('should return zero values for user with no data', async () => {
      // Create a new user with no bots/conversations
      const newUser = await prisma.user.create({
        data: {
          email: `empty-${Date.now()}@example.com`,
          password: 'password',
          name: 'Empty User',
        },
      });

      const emptyUserToken = generateAccessToken({
        userId: newUser.id,
        email: newUser.email,
        role: 'USER',
      });

      const response = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${emptyUserToken}`)
        .expect(200);

      expect(response.body.totalBots).toBe(0);
      expect(response.body.conversations).toBe(0);
      expect(response.body.leads).toBe(0);
      expect(response.body.activeUsers).toBe(0);

      // Cleanup
      await prisma.user.delete({ where: { id: newUser.id } });
    });
  });

  describe('GET /api/v1/analytics/recent-bots', () => {
    it('should return recent bots with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/recent-bots')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check bot structure
      const bot = response.body[0];
      expect(bot).toHaveProperty('id');
      expect(bot).toHaveProperty('name');
      expect(bot).toHaveProperty('description');
      expect(bot).toHaveProperty('lastActive');
      expect(bot).toHaveProperty('lastActiveDate');
      expect(bot).toHaveProperty('conversationCount');
      expect(bot).toHaveProperty('published');
    });

    it('should respect limit parameter', async () => {
      const limit = 2;
      const response = await request(app)
        .get(`/api/v1/analytics/recent-bots?limit=${limit}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(limit);
    });

    it('should default to 5 bots when limit not specified', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/recent-bots')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });

    it('should format lastActive as human-readable text', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/recent-bots')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const bot = response.body[0];
      expect(bot.lastActive).toBeDefined();
      expect(typeof bot.lastActive).toBe('string');
      // Should contain time-related words
      const validTimeWords = ['Just now', 'hour', 'day', 'ago'];
      const hasValidTimeWord = validTimeWords.some((word) =>
        bot.lastActive.includes(word)
      );
      expect(hasValidTimeWord).toBe(true);
    });

    it('should include conversation count', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/recent-bots')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const bot = response.body[0];
      expect(typeof bot.conversationCount).toBe('number');
      expect(bot.conversationCount).toBeGreaterThanOrEqual(0);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/recent-bots')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return empty array for user with no bots', async () => {
      const newUser = await prisma.user.create({
        data: {
          email: `nobots-${Date.now()}@example.com`,
          password: 'password',
          name: 'No Bots User',
        },
      });

      const token = generateAccessToken({
        userId: newUser.id,
        email: newUser.email,
        role: 'USER',
      });

      const response = await request(app)
        .get('/api/v1/analytics/recent-bots')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);

      // Cleanup
      await prisma.user.delete({ where: { id: newUser.id } });
    });

    it('should handle large limit values gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/recent-bots?limit=1000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Should return all bots, but not crash
    });

    it('should handle invalid limit values', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/recent-bots?limit=invalid')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Should fall back to default limit
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/v1/analytics/metrics', () => {
    it('should return metrics with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/metrics')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Metrics table might be empty initially
    });

    it('should filter metrics by botId', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/metrics?botId=${testBotId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should limit metrics to 30 entries', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/metrics')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(30);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/metrics')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Analytics Data Consistency', () => {
    it('should return consistent bot counts', async () => {
      const overviewResponse = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const recentBotsResponse = await request(app)
        .get('/api/v1/analytics/recent-bots?limit=100')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Total bots should match or exceed recent bots count
      expect(overviewResponse.body.totalBots).toBeGreaterThanOrEqual(
        recentBotsResponse.body.length
      );
    });

    it('should handle concurrent requests', async () => {
      const requests = [
        request(app)
          .get('/api/v1/analytics/overview')
          .set('Authorization', `Bearer ${accessToken}`),
        request(app)
          .get('/api/v1/analytics/recent-bots')
          .set('Authorization', `Bearer ${accessToken}`),
        request(app)
          .get('/api/v1/analytics/metrics')
          .set('Authorization', `Bearer ${accessToken}`),
      ];

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });
});
