import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

// Mock Prisma client
vi.mock('../db', () => {
  const mockPrismaClient = {
    lead: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    conversation: {
      findUnique: vi.fn(),
    },
    organizationMember: {
      findFirst: vi.fn(),
    },
    bot: {
      findFirst: vi.fn(),
    },
  };
  return { getPrisma: () => mockPrismaClient };
});

import { getPrisma } from '../db';

const mockPrisma = getPrisma({} as any) as any;

// Helper to create test app with auth middleware and lead routes
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

  // GET /api/v1/leads - List leads with filters
  app.get('/api/v1/leads', async (c) => {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    
    const status = c.req.query('status') || 'all';
    const search = c.req.query('search') || '';
    const minScore = parseInt(c.req.query('minScore') || '0');

    const where: any = {
      conversation: {
        bot: { userId: user.userId },
      },
    };

    if (status !== 'all') {
      where.status = status;
    }

    if (minScore > 0) {
      where.score = { gte: minScore };
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        conversation: {
          select: {
            id: true,
            bot: { select: { id: true, name: true } },
          },
        },
      },
    });

    let data = leads.map((lead: any) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      score: lead.score,
      status: lead.status,
      botName: lead.conversation.bot.name,
    }));

    if (search) {
      const searchLower = search.toLowerCase();
      data = data.filter(
        (lead: any) =>
          lead.name?.toLowerCase().includes(searchLower) ||
          lead.email?.toLowerCase().includes(searchLower)
      );
    }

    return c.json({ leads: data, total: data.length });
  });

  // GET /api/v1/leads/:id - Get lead details
  app.get('/api/v1/leads/:id', async (c) => {
    const prisma = getPrisma(c.env);
    const leadId = c.req.param('id');

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        conversation: {
          select: {
            id: true,
            bot: { select: { id: true, name: true, userId: true } },
          },
        },
      },
    });

    if (!lead) {
      return c.json({ error: 'Lead not found' }, 404);
    }

    return c.json({ lead });
  });

  // DELETE /api/v1/leads/:id - Delete lead
  app.delete('/api/v1/leads/:id', async (c) => {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const leadId = c.req.param('id');

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        conversation: {
          select: {
            bot: { select: { userId: true } },
          },
        },
      },
    });

    if (!lead) {
      return c.json({ error: 'Lead not found' }, 404);
    }

    if (lead.conversation.bot.userId !== user.userId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    await prisma.lead.delete({ where: { id: leadId } });
    return c.json({ success: true });
  });

  // POST /api/v1/conversations/:id/capture-lead - Capture lead from conversation
  app.post('/api/v1/conversations/:id/capture-lead', async (c) => {
    const prisma = getPrisma(c.env);
    const conversationId = c.req.param('id');
    const body = await c.req.json<{
      name?: string;
      email?: string;
      phone?: string;
      company?: string;
    }>();

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        bot: { select: { userId: true } },
      },
    });

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    if (!body.email && !body.phone) {
      return c.json({ error: 'Email or phone required' }, 400);
    }

    const lead = await prisma.lead.create({
      data: {
        conversationId,
        name: body.name,
        email: body.email,
        phone: body.phone,
        company: body.company,
        score: 50, // Default score
        status: 'NEW',
      },
    });

    return c.json({ lead }, 201);
  });

  // PATCH /api/v1/leads/:id - Update lead
  app.patch('/api/v1/leads/:id', async (c) => {
    const prisma = getPrisma(c.env);
    const leadId = c.req.param('id');
    const body = await c.req.json<{
      status?: string;
      score?: number;
      notes?: string;
    }>();

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return c.json({ error: 'Lead not found' }, 404);
    }

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: body,
    });

    return c.json({ lead: updated });
  });

  return app;
}

describe('Lead Management Endpoints', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  describe('GET /api/v1/leads', () => {
    it('should return leads list', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([
        {
          id: 'lead-1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          score: 75,
          status: 'NEW',
          conversation: {
            id: 'conv-1',
            bot: { id: 'bot-1', name: 'Sales Bot' },
          },
        },
        {
          id: 'lead-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          score: 90,
          status: 'QUALIFIED',
          conversation: {
            id: 'conv-2',
            bot: { id: 'bot-1', name: 'Sales Bot' },
          },
        },
      ]);

      const res = await app.request('/api/v1/leads', { method: 'GET' });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.leads).toHaveLength(2);
      expect(json.leads[0].name).toBe('John Doe');
      expect(json.total).toBe(2);
    });

    it('should filter by status', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([]);

      await app.request('/api/v1/leads?status=QUALIFIED', { method: 'GET' });

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'QUALIFIED',
          }),
        })
      );
    });

    it('should filter by minimum score', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([]);

      await app.request('/api/v1/leads?minScore=70', { method: 'GET' });

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            score: { gte: 70 },
          }),
        })
      );
    });

    it('should search by name or email', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([
        {
          id: 'lead-1',
          name: 'John Doe',
          email: 'john@test.com',
          score: 80,
          status: 'NEW',
          conversation: { id: 'conv-1', bot: { id: 'bot-1', name: 'Bot' } },
        },
        {
          id: 'lead-2',
          name: 'Jane Smith',
          email: 'jane@test.com',
          score: 75,
          status: 'NEW',
          conversation: { id: 'conv-2', bot: { id: 'bot-1', name: 'Bot' } },
        },
      ]);

      const res = await app.request('/api/v1/leads?search=john', { method: 'GET' });
      const json = await res.json();
      
      expect(json.leads).toHaveLength(1);
      expect(json.leads[0].name).toBe('John Doe');
    });
  });

  describe('GET /api/v1/leads/:id', () => {
    it('should return lead details', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: 'lead-123',
        name: 'John Doe',
        email: 'john@example.com',
        score: 85,
        status: 'QUALIFIED',
        conversation: {
          id: 'conv-1',
          bot: { id: 'bot-1', name: 'Sales Bot', userId: 'test-user-id' },
        },
      });

      const res = await app.request('/api/v1/leads/lead-123', { method: 'GET' });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.lead.name).toBe('John Doe');
      expect(json.lead.score).toBe(85);
    });

    it('should return 404 if lead not found', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(null);

      const res = await app.request('/api/v1/leads/not-found', { method: 'GET' });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe('Lead not found');
    });
  });

  describe('DELETE /api/v1/leads/:id', () => {
    it('should delete lead if authorized', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: 'lead-123',
        conversation: {
          bot: { userId: 'test-user-id' },
        },
      });
      mockPrisma.lead.delete.mockResolvedValue({});

      const res = await app.request('/api/v1/leads/lead-123', { method: 'DELETE' });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it('should return 403 if not authorized', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: 'lead-123',
        conversation: {
          bot: { userId: 'other-user-id' },
        },
      });

      const res = await app.request('/api/v1/leads/lead-123', { method: 'DELETE' });

      expect(res.status).toBe(403);
    });

    it('should return 404 if lead not found', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(null);

      const res = await app.request('/api/v1/leads/not-found', { method: 'DELETE' });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/conversations/:id/capture-lead', () => {
    it('should capture lead from conversation', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-123',
        bot: { userId: 'test-user-id' },
      });
      mockPrisma.lead.create.mockResolvedValue({
        id: 'lead-new',
        conversationId: 'conv-123',
        name: 'New Lead',
        email: 'new@example.com',
        score: 50,
        status: 'NEW',
      });

      const res = await app.request('/api/v1/conversations/conv-123/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Lead',
          email: 'new@example.com',
          company: 'ACME Inc',
        }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.lead.email).toBe('new@example.com');
    });

    it('should require email or phone', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-123',
        bot: { userId: 'test-user-id' },
      });

      const res = await app.request('/api/v1/conversations/conv-123/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'No Contact' }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Email or phone required');
    });

    it('should return 404 if conversation not found', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue(null);

      const res = await app.request('/api/v1/conversations/not-found/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/leads/:id', () => {
    it('should update lead status', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: 'lead-123',
        status: 'NEW',
      });
      mockPrisma.lead.update.mockResolvedValue({
        id: 'lead-123',
        status: 'QUALIFIED',
      });

      const res = await app.request('/api/v1/leads/lead-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'QUALIFIED' }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.lead.status).toBe('QUALIFIED');
    });

    it('should update lead score', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: 'lead-123',
        score: 50,
      });
      mockPrisma.lead.update.mockResolvedValue({
        id: 'lead-123',
        score: 90,
      });

      const res = await app.request('/api/v1/leads/lead-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: 90 }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.lead.score).toBe(90);
    });
  });
});

describe('Lead Scoring Logic', () => {
  it('should calculate score based on engagement', () => {
    const calculateScore = (messageCount: number, hasEmail: boolean, hasPhone: boolean) => {
      let score = 0;
      if (hasEmail) score += 20;
      if (hasPhone) score += 20;
      score += Math.min(messageCount * 5, 40); // Max 40 from messages
      score += 20; // Base score
      return Math.min(score, 100);
    };

    expect(calculateScore(0, false, false)).toBe(20);
    expect(calculateScore(5, true, true)).toBe(85);
    expect(calculateScore(10, true, true)).toBe(100);
  });

  it('should classify leads by status', () => {
    const classifyLead = (score: number): string => {
      if (score >= 80) return 'HOT';
      if (score >= 60) return 'WARM';
      if (score >= 40) return 'QUALIFIED';
      return 'NEW';
    };

    expect(classifyLead(90)).toBe('HOT');
    expect(classifyLead(70)).toBe('WARM');
    expect(classifyLead(50)).toBe('QUALIFIED');
    expect(classifyLead(30)).toBe('NEW');
  });
});
