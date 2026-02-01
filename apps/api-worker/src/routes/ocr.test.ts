import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

// Mock Prisma client - defined inside vi.mock to avoid hoisting issues
vi.mock('@chatbot/database', () => {
  const mockPrismaClient = {
    bot: {
      findUnique: vi.fn(),
    },
    conversation: {
      findUnique: vi.fn(),
    },
    mediaUpload: {
      create: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
    oCRResult: {
      findUnique: vi.fn(),
      aggregate: vi.fn(),
    },
    oCRMatch: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  };
  return { prisma: mockPrismaClient };
});

vi.mock('../services/ocr/ocr-service', () => ({
  OCRService: class MockOCRService {
    processImage = vi.fn();
    findMatches = vi.fn();
    addMatchToDocuments = vi.fn();
    trackMatchFeedback = vi.fn();
  },
  GoogleVisionOCRProvider: class {},
  TesseractOCRProvider: class {},
}));

import ocrApp from './ocr';
import { prisma } from '@chatbot/database';

// Get mock reference
const mockPrisma = prisma as any;

// Create test app
function createTestApp() {
  const app = new Hono();
  app.route('/ocr', ocrApp);
  return app;
}

describe('OCR Routes', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  describe('POST /ocr/upload', () => {
    it('should require file in form data', async () => {
      const formData = new FormData();
      formData.append('conversationId', 'conv-123');
      formData.append('botId', 'bot-123');

      const res = await app.request('/ocr/upload', {
        method: 'POST',
        body: formData,
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('No file provided');
    });

    it('should require conversationId and botId', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const formData = new FormData();
      formData.append('file', file);

      const res = await app.request('/ocr/upload', {
        method: 'POST',
        body: formData,
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('conversationId and botId required');
    });

    it('should reject invalid file types', async () => {
      const file = new File(['test'], 'test.exe', { type: 'application/octet-stream' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', 'conv-123');
      formData.append('botId', 'bot-123');

      mockPrisma.bot.findUnique.mockResolvedValue({
        id: 'bot-123',
        organization: { subscription: { plan: 'advanced' } },
      });

      const res = await app.request('/ocr/upload', {
        method: 'POST',
        body: formData,
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Invalid file type');
    });

    it('should reject files over 5MB', async () => {
      // Create a file larger than 5MB
      const largeContent = new ArrayBuffer(6 * 1024 * 1024);
      const file = new File([largeContent], 'large.png', { type: 'image/png' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', 'conv-123');
      formData.append('botId', 'bot-123');

      mockPrisma.bot.findUnique.mockResolvedValue({
        id: 'bot-123',
        organization: { subscription: { plan: 'advanced' } },
      });

      const res = await app.request('/ocr/upload', {
        method: 'POST',
        body: formData,
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('File too large');
    });

    it('should require Advanced/Custom plan for OCR', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', 'conv-123');
      formData.append('botId', 'bot-123');

      mockPrisma.bot.findUnique.mockResolvedValue({
        id: 'bot-123',
        organization: { subscription: { plan: 'free' } },
      });

      const res = await app.request('/ocr/upload', {
        method: 'POST',
        body: formData,
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('Advanced or Custom plan');
      expect(json.upgrade).toBe(true);
    });
  });

  describe('GET /ocr/results/:id', () => {
    it('should return OCR result if found', async () => {
      mockPrisma.oCRResult.findUnique.mockResolvedValue({
        id: 'ocr-123',
        text: 'Extracted text content',
        confidence: 0.95,
        mediaUpload: {
          fileName: 'test.png',
          url: 'https://example.com/test.png',
          status: 'COMPLETED',
        },
      });

      const res = await app.request('/ocr/results/ocr-123', {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.result.text).toBe('Extracted text content');
      expect(json.result.confidence).toBe(0.95);
    });

    it('should return 404 if OCR result not found', async () => {
      mockPrisma.oCRResult.findUnique.mockResolvedValue(null);

      const res = await app.request('/ocr/results/not-found', {
        method: 'GET',
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe('OCR result not found');
    });
  });

  describe('GET /ocr/matches/:ocrResultId', () => {
    it('should return matches for OCR result', async () => {
      mockPrisma.oCRMatch.findMany.mockResolvedValue([
        {
          id: 'match-1',
          confidence: 0.92,
          matchedText: 'Product name',
          rank: 1,
          knowledge: { id: 'k-1', sourceUrl: 'https://example.com/doc1' },
        },
        {
          id: 'match-2',
          confidence: 0.85,
          matchedText: 'Similar product',
          rank: 2,
          knowledge: { id: 'k-2', sourceUrl: 'https://example.com/doc2' },
        },
      ]);

      const res = await app.request('/ocr/matches/ocr-123', {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.matches).toHaveLength(2);
      expect(json.matches[0].rank).toBe(1);
    });
  });

  describe('GET /ocr/stats/:botId', () => {
    it('should return OCR statistics for bot', async () => {
      mockPrisma.bot.findUnique.mockResolvedValue({
        id: 'bot-123',
        organization: { subscription: { plan: 'advanced' } },
      });
      mockPrisma.mediaUpload.count
        .mockResolvedValueOnce(100) // totalUploads
        .mockResolvedValueOnce(95)  // successfulOCR
        .mockResolvedValueOnce(5);  // failedOCR
      mockPrisma.oCRMatch.count
        .mockResolvedValueOnce(500) // totalMatches
        .mockResolvedValueOnce(50); // addedToDocs
      mockPrisma.oCRResult.aggregate
        .mockResolvedValueOnce({ _avg: { confidence: 0.89 } })
        .mockResolvedValueOnce({ _avg: { processingTime: 1200 } });

      const res = await app.request('/ocr/stats/bot-123', {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.stats.totalUploads).toBe(100);
      expect(json.stats.successfulOCR).toBe(95);
      expect(json.stats.averageConfidence).toBe(0.89);
    });

    it('should reject stats request for free plan', async () => {
      mockPrisma.bot.findUnique.mockResolvedValue({
        id: 'bot-123',
        organization: { subscription: { plan: 'free' } },
      });

      const res = await app.request('/ocr/stats/bot-123', {
        method: 'GET',
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('Advanced or Custom plan');
    });
  });

  describe('DELETE /ocr/uploads/:id', () => {
    it('should delete upload if found and authorized', async () => {
      mockPrisma.mediaUpload.findUnique.mockResolvedValue({
        id: 'upload-123',
        botId: 'bot-123',
      });
      mockPrisma.bot.findUnique.mockResolvedValue({
        id: 'bot-123',
        organization: { subscription: { plan: 'advanced' } },
      });
      mockPrisma.mediaUpload.delete.mockResolvedValue({});

      const res = await app.request('/ocr/uploads/upload-123', {
        method: 'DELETE',
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it('should return 404 if upload not found', async () => {
      mockPrisma.mediaUpload.findUnique.mockResolvedValue(null);

      const res = await app.request('/ocr/uploads/not-found', {
        method: 'DELETE',
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe('Upload not found');
    });
  });
});
