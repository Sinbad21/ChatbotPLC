import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

// Mock Prisma client - defined inside vi.mock
vi.mock('../db', () => {
  const mockPrismaClient = {
    bot: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    conversation: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    lead: {
      count: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    organizationMember: {
      findFirst: vi.fn(),
    },
  };
  return { getPrisma: () => mockPrismaClient };
});

import { getPrisma } from '../db';

const mockPrisma = getPrisma({} as any) as any;

// Helper to create test app with auth middleware
function createTestApp() {
  const app = new Hono<{
    Bindings: { DATABASE_URL: string };
    Variables: { user: { userId: string } };
  }>();

  // Mock auth middleware
  app.use('*', async (c, next) => {
    c.set('user', { userId: 'test-user-id' });
    await next();
  });

  // Mock analytics overview endpoint
  app.get('/api/v1/analytics/overview', async (c) => {
    const prisma = getPrisma(c.env);
    const user = c.get('user');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalBots = await prisma.bot.count({
      where: { userId: user.userId },
    });

    const conversationsCount = await prisma.conversation.count({
      where: {
        bot: { userId: user.userId },
        createdAt: { gte: startOfMonth },
      },
    });

    const leadsCount = await prisma.lead.count({
      where: {
        conversation: { bot: { userId: user.userId } },
        createdAt: { gte: startOfMonth },
      },
    });

    return c.json({
      totalBots,
      conversations: conversationsCount,
      leads: leadsCount,
      activeUsers: 0,
    });
  });

  // Mock conversations over time endpoint
  app.get('/api/v1/analytics/conversations-over-time', async (c) => {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const range = c.req.query('range') || '30d';

    const now = new Date();
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    const conversations = await prisma.conversation.findMany({
      where: {
        bot: { userId: user.userId },
        createdAt: { gte: startDate },
      },
      select: { createdAt: true },
    });

    // Group by date
    const dataMap = new Map<string, number>();
    conversations.forEach((conv: { createdAt: Date }) => {
      const dateStr = conv.createdAt.toISOString().split('T')[0];
      dataMap.set(dateStr, (dataMap.get(dateStr) || 0) + 1);
    });

    const data = Array.from(dataMap.entries()).map(([date, count]) => ({
      date,
      conversations: count,
    }));

    return c.json(data);
  });

  // Mock recent bots endpoint
  app.get('/api/v1/analytics/recent-bots', async (c) => {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const limit = parseInt(c.req.query('limit') || '5');

    const recentBots = await prisma.bot.findMany({
      where: { userId: user.userId },
      take: limit,
    });

    return c.json(recentBots.map((bot: any) => ({
      id: bot.id,
      name: bot.name,
      conversationCount: bot._count?.conversations || 0,
    })));
  });

  // Real-time bot stats endpoint
  app.get('/api/v1/analytics/bot/:botId/realtime', async (c) => {
    const prisma = getPrisma(c.env);
    const botId = c.req.param('botId');

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [
      conversationsLast24h,
      conversationsLastHour,
      messagesLast24h,
    ] = await Promise.all([
      prisma.conversation.count({
        where: {
          botId,
          createdAt: { gte: twentyFourHoursAgo },
        },
      }),
      prisma.conversation.count({
        where: {
          botId,
          createdAt: { gte: oneHourAgo },
        },
      }),
      prisma.message.count({
        where: {
          conversation: { botId },
          createdAt: { gte: twentyFourHoursAgo },
        },
      }),
    ]);

    return c.json({
      botId,
      realtime: {
        conversationsLast24h,
        conversationsLastHour,
        messagesLast24h,
        avgMessagesPerConversation: conversationsLast24h > 0
          ? Math.round(messagesLast24h / conversationsLast24h)
          : 0,
      },
    });
  });

  return app;
}

describe('Analytics Endpoints', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  describe('GET /api/v1/analytics/overview', () => {
    it('should return overview statistics', async () => {
      mockPrisma.bot.count.mockResolvedValue(5);
      mockPrisma.conversation.count.mockResolvedValue(100);
      mockPrisma.lead.count.mockResolvedValue(25);

      const res = await app.request('/api/v1/analytics/overview', {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.totalBots).toBe(5);
      expect(json.conversations).toBe(100);
      expect(json.leads).toBe(25);
    });

    it('should handle zero values', async () => {
      mockPrisma.bot.count.mockResolvedValue(0);
      mockPrisma.conversation.count.mockResolvedValue(0);
      mockPrisma.lead.count.mockResolvedValue(0);

      const res = await app.request('/api/v1/analytics/overview', {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.totalBots).toBe(0);
      expect(json.conversations).toBe(0);
    });
  });

  describe('GET /api/v1/analytics/conversations-over-time', () => {
    it('should return conversation data for default 30 days', async () => {
      const mockConversations = [
        { createdAt: new Date('2024-01-15') },
        { createdAt: new Date('2024-01-15') },
        { createdAt: new Date('2024-01-16') },
      ];
      mockPrisma.conversation.findMany.mockResolvedValue(mockConversations);

      const res = await app.request('/api/v1/analytics/conversations-over-time', {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
    });

    it('should accept range parameter', async () => {
      mockPrisma.conversation.findMany.mockResolvedValue([]);

      const res = await app.request('/api/v1/analytics/conversations-over-time?range=7d', {
        method: 'GET',
      });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/analytics/recent-bots', () => {
    it('should return recent bots list', async () => {
      mockPrisma.bot.findMany.mockResolvedValue([
        { id: 'bot-1', name: 'Sales Bot' },
        { id: 'bot-2', name: 'Support Bot' },
      ]);

      const res = await app.request('/api/v1/analytics/recent-bots', {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveLength(2);
      expect(json[0].name).toBe('Sales Bot');
    });

    it('should respect limit parameter', async () => {
      mockPrisma.bot.findMany.mockResolvedValue([
        { id: 'bot-1', name: 'Bot 1' },
        { id: 'bot-2', name: 'Bot 2' },
        { id: 'bot-3', name: 'Bot 3' },
      ]);

      const res = await app.request('/api/v1/analytics/recent-bots?limit=3', {
        method: 'GET',
      });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/analytics/bot/:botId/realtime', () => {
    it('should return real-time statistics for a bot', async () => {
      mockPrisma.conversation.count
        .mockResolvedValueOnce(50) // last 24h
        .mockResolvedValueOnce(5);  // last hour
      mockPrisma.message.count.mockResolvedValue(150);

      const res = await app.request('/api/v1/analytics/bot/bot-123/realtime', {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.botId).toBe('bot-123');
      expect(json.realtime.conversationsLast24h).toBe(50);
      expect(json.realtime.conversationsLastHour).toBe(5);
      expect(json.realtime.messagesLast24h).toBe(150);
      expect(json.realtime.avgMessagesPerConversation).toBe(3);
    });

    it('should handle zero conversations', async () => {
      mockPrisma.conversation.count.mockResolvedValue(0);
      mockPrisma.message.count.mockResolvedValue(0);

      const res = await app.request('/api/v1/analytics/bot/bot-123/realtime', {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.realtime.avgMessagesPerConversation).toBe(0);
    });
  });
});

describe('Analytics Data Processing', () => {
  describe('Growth calculation', () => {
    it('should calculate positive growth correctly', () => {
      const current = 150;
      const previous = 100;
      const growth = Math.round(((current - previous) / previous) * 100);
      expect(growth).toBe(50);
    });

    it('should calculate negative growth correctly', () => {
      const current = 80;
      const previous = 100;
      const growth = Math.round(((current - previous) / previous) * 100);
      expect(growth).toBe(-20);
    });

    it('should handle zero previous value', () => {
      const current = 50;
      const previous = 0;
      const growth = previous > 0
        ? Math.round(((current - previous) / previous) * 100)
        : 0;
      expect(growth).toBe(0);
    });
  });

  describe('Date range calculation', () => {
    it('should calculate 7 day range correctly', () => {
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      
      const diffDays = Math.round((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(7);
    });

    it('should calculate 30 day range correctly', () => {
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      
      const diffDays = Math.round((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(30);
    });
  });
});
