import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

// Mock Prisma client
const mockPrismaClient = {
  organizationMember: {
    findFirst: vi.fn(),
  },
  bot: {
    findFirst: vi.fn(),
  },
  document: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  intent: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  fAQ: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock('../db', () => ({
  getPrisma: () => mockPrismaClient,
}));

import { registerKnowledgeRoutes } from './knowledge';

// Test app setup
function createTestApp() {
  const app = new Hono<{
    Bindings: { DATABASE_URL: string };
    Variables: { user: { userId: string } };
  }>();

  // Mock auth middleware
  const mockAuthMiddleware = async (c: any, next: any) => {
    c.set('user', { userId: 'test-user-id' });
    await next();
  };

  registerKnowledgeRoutes(app, mockAuthMiddleware);
  return app;
}

describe('Knowledge Routes - Documents', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  describe('GET /api/bots/:botId/documents', () => {
    it('should return documents for a bot', async () => {
      const mockDocs = [
        { id: 'doc-1', title: 'Doc 1', content: 'Content 1', createdAt: new Date() },
        { id: 'doc-2', title: 'Doc 2', content: 'Content 2', createdAt: new Date() },
      ];

      mockPrismaClient.organizationMember.findFirst.mockResolvedValue({
        organizationId: 'org-123',
      });
      mockPrismaClient.bot.findFirst.mockResolvedValue({ id: 'bot-123' });
      mockPrismaClient.document.findMany.mockResolvedValue(mockDocs);

      const res = await app.request('/api/bots/bot-123/documents', {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.documents).toHaveLength(2);
      expect(json.documents[0].title).toBe('Doc 1');
    });

    it('should return 403 if user has no organization', async () => {
      mockPrismaClient.organizationMember.findFirst.mockResolvedValue(null);

      const res = await app.request('/api/bots/bot-123/documents', {
        method: 'GET',
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('User has no organization assigned');
    });

    it('should return 404 if bot not found', async () => {
      mockPrismaClient.organizationMember.findFirst.mockResolvedValue({
        organizationId: 'org-123',
      });
      mockPrismaClient.bot.findFirst.mockResolvedValue(null);

      const res = await app.request('/api/bots/bot-123/documents', {
        method: 'GET',
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe('Bot not found');
    });
  });

  describe('POST /api/bots/:botId/documents', () => {
    it('should create a document', async () => {
      const newDoc = {
        id: 'doc-new',
        botId: 'bot-123',
        title: 'New Document',
        content: 'New content',
      };

      mockPrismaClient.organizationMember.findFirst.mockResolvedValue({
        organizationId: 'org-123',
      });
      mockPrismaClient.bot.findFirst.mockResolvedValue({ id: 'bot-123' });
      mockPrismaClient.document.create.mockResolvedValue(newDoc);

      const res = await app.request('/api/bots/bot-123/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Document', content: 'New content' }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.title).toBe('New Document');
    });

    it('should return 400 if title or content missing', async () => {
      const res = await app.request('/api/bots/bot-123/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Missing content' }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('title and content are required');
    });

    it('should handle foreign key error (bot deleted)', async () => {
      mockPrismaClient.organizationMember.findFirst.mockResolvedValue({
        organizationId: 'org-123',
      });
      mockPrismaClient.bot.findFirst.mockResolvedValue({ id: 'bot-123' });
      mockPrismaClient.document.create.mockRejectedValue({
        code: 'P2003',
        message: 'Foreign key constraint failed',
      });

      const res = await app.request('/api/bots/bot-123/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test', content: 'Content' }),
      });

      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.code).toBe('P2003');
    });
  });

  describe('DELETE /api/documents/:docId', () => {
    it('should delete a document', async () => {
      mockPrismaClient.document.findUnique.mockResolvedValue({
        id: 'doc-123',
        bot: { organizationId: 'org-123' },
      });
      mockPrismaClient.organizationMember.findFirst.mockResolvedValue({
        organizationId: 'org-123',
      });
      mockPrismaClient.document.delete.mockResolvedValue({});

      const res = await app.request('/api/documents/doc-123', {
        method: 'DELETE',
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it('should return 404 if document not found', async () => {
      mockPrismaClient.document.findUnique.mockResolvedValue(null);

      const res = await app.request('/api/documents/doc-missing', {
        method: 'DELETE',
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe('Document not found');
    });

    it('should return 403 if document belongs to different organization', async () => {
      mockPrismaClient.document.findUnique.mockResolvedValue({
        id: 'doc-123',
        bot: { organizationId: 'other-org' },
      });
      mockPrismaClient.organizationMember.findFirst.mockResolvedValue({
        organizationId: 'org-123',
      });

      const res = await app.request('/api/documents/doc-123', {
        method: 'DELETE',
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('Forbidden');
    });
  });
});

describe('Knowledge Routes - Intents', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  describe('GET /api/bots/:botId/intents', () => {
    it('should return intents for a bot', async () => {
      const mockIntents = [
        { id: 'int-1', name: 'greeting', trainingPhrases: ['hi', 'hello'], response: 'Hello!' },
        { id: 'int-2', name: 'farewell', trainingPhrases: ['bye'], response: 'Goodbye!' },
      ];

      mockPrismaClient.organizationMember.findFirst.mockResolvedValue({
        organizationId: 'org-123',
      });
      mockPrismaClient.bot.findFirst.mockResolvedValue({ id: 'bot-123' });
      mockPrismaClient.intent.findMany.mockResolvedValue(mockIntents);

      const res = await app.request('/api/bots/bot-123/intents', {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      // API returns array directly, not wrapped in { intents: [...] }
      expect(json).toHaveLength(2);
      expect(json[0].name).toBe('greeting');
    });
  });

  describe('POST /api/bots/:botId/intents', () => {
    it('should create an intent', async () => {
      const newIntent = {
        id: 'int-new',
        botId: 'bot-123',
        name: 'support',
        trainingPhrases: ['help', 'support'],
        response: 'How can I help?',
      };

      mockPrismaClient.organizationMember.findFirst.mockResolvedValue({
        organizationId: 'org-123',
      });
      mockPrismaClient.bot.findFirst.mockResolvedValue({ id: 'bot-123' });
      mockPrismaClient.intent.create.mockResolvedValue(newIntent);

      const res = await app.request('/api/bots/bot-123/intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'support',
          trainingPhrases: ['help', 'support'],
          response: 'How can I help?',
        }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.name).toBe('support');
    });

    it('should return 400 if required fields missing', async () => {
      const res = await app.request('/api/bots/bot-123/intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'test' }),
      });

      expect(res.status).toBe(400);
    });
  });
});

describe('Knowledge Routes - FAQs', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  describe('GET /api/bots/:botId/faqs', () => {
    it('should return FAQs for a bot', async () => {
      const mockFaqs = [
        { id: 'faq-1', question: 'What is this?', answer: 'A chatbot.' },
        { id: 'faq-2', question: 'How to use?', answer: 'Just chat!' },
      ];

      mockPrismaClient.organizationMember.findFirst.mockResolvedValue({
        organizationId: 'org-123',
      });
      mockPrismaClient.bot.findFirst.mockResolvedValue({ id: 'bot-123' });
      mockPrismaClient.fAQ.findMany.mockResolvedValue(mockFaqs);

      const res = await app.request('/api/bots/bot-123/faqs', {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      // API returns array directly
      expect(json).toHaveLength(2);
    });
  });

  describe('POST /api/bots/:botId/faqs', () => {
    it('should create a FAQ', async () => {
      const newFaq = {
        id: 'faq-new',
        botId: 'bot-123',
        question: 'New question?',
        answer: 'New answer.',
      };

      mockPrismaClient.organizationMember.findFirst.mockResolvedValue({
        organizationId: 'org-123',
      });
      mockPrismaClient.bot.findFirst.mockResolvedValue({ id: 'bot-123' });
      mockPrismaClient.fAQ.create.mockResolvedValue(newFaq);

      const res = await app.request('/api/bots/bot-123/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'New question?',
          answer: 'New answer.',
        }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.question).toBe('New question?');
    });
  });

  describe('DELETE /api/faqs/:faqId', () => {
    it('should delete a FAQ', async () => {
      mockPrismaClient.fAQ.findUnique.mockResolvedValue({
        id: 'faq-123',
        bot: { organizationId: 'org-123' },
      });
      mockPrismaClient.organizationMember.findFirst.mockResolvedValue({
        organizationId: 'org-123',
      });
      mockPrismaClient.fAQ.delete.mockResolvedValue({});

      const res = await app.request('/api/faqs/faq-123', {
        method: 'DELETE',
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });
});
