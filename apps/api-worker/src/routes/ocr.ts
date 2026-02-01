/**
 * OCR and Image Upload API Endpoints
 * Handles image upload, OCR processing, and fuzzy matching
 */

import { Hono } from 'hono';
import { OCRService, GoogleVisionOCRProvider, TesseractOCRProvider } from '../services/ocr/ocr-service';
import { prisma } from '@chatbot/database';
import { z } from 'zod';

const app = new Hono();

// Validation schemas
const uploadSchema = z.object({
  conversationId: z.string(),
  botId: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.number().max(5 * 1024 * 1024), // 5MB max
});

const processSchema = z.object({
  mediaUploadId: z.string(),
  provider: z.enum(['tesseract', 'google-vision']).default('google-vision'),
});

const matchSchema = z.object({
  ocrResultId: z.string(),
  botId: z.string(),
  threshold: z.number().min(0).max(1).default(0.7),
  maxResults: z.number().int().min(1).max(20).default(10),
  includePartialMatches: z.boolean().default(true),
});

const addToDocsSchema = z.object({
  matchId: z.string(),
  botId: z.string(),
});

const feedbackSchema = z.object({
  matchId: z.string(),
  clicked: z.boolean(),
});

// Allowed mime types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Check if user has access to OCR feature (Advanced/Custom plans)
 */
async function checkOCRAccess(botId: string): Promise<boolean> {
  const bot = await prisma.bot.findUnique({
    where: { id: botId },
    include: {
      organization: {
        include: { subscription: true },
      },
    },
  });

  if (!bot) {
    return false;
  }

  const allowedPlans = ['advanced', 'custom', 'enterprise'];
  const plan = bot.organization.subscription?.plan?.toLowerCase() || 'free';

  return allowedPlans.includes(plan);
}

/**
 * Initialize OCR service based on provider
 */
function getOCRService(provider: string, env: any): OCRService {
  if (provider === 'google-vision') {
    const apiKey = env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      throw new Error('Google Vision API key not configured');
    }
    return new OCRService(new GoogleVisionOCRProvider(apiKey));
  }

  // Default to Tesseract
  return new OCRService(new TesseractOCRProvider());
}

/**
 * POST /ocr/upload
 * Upload an image for OCR processing
 */
app.post('/upload', async (c) => {
  try {
    // Parse multipart form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const conversationId = formData.get('conversationId') as string;
    const botId = formData.get('botId') as string;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    if (!conversationId || !botId) {
      return c.json({ error: 'conversationId and botId required' }, 400);
    }

    // Check plan access
    const hasAccess = await checkOCRAccess(botId);
    if (!hasAccess) {
      return c.json(
        {
          error: 'OCR feature requires Advanced or Custom plan',
          upgrade: true,
        },
        403
      );
    }

    // Validate file
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return c.json(
        {
          error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP',
        },
        400
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return c.json(
        {
          error: 'File too large. Maximum size is 5MB',
        },
        400
      );
    }

    // Get conversation and organization
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { bot: { include: { organization: true } } },
    });

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    // In production, upload to cloud storage (R2, S3, etc.)
    // For now, store metadata and process directly
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    // For production: Upload to R2/S3
    // const uploadUrl = await uploadToStorage(buffer, file.name, file.type);

    // Create media upload record
    const mediaUpload = await prisma.mediaUpload.create({
      data: {
        conversationId,
        organizationId: conversation.bot.organizationId,
        botId,
        url: `temp://${file.name}`, // In production: actual URL
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        status: 'PENDING',
        virusScanned: false, // In production: scan with ClamAV or VirusTotal
      },
    });

    // Return upload ID for processing
    return c.json(
      {
        mediaUploadId: mediaUpload.id,
        status: 'uploaded',
        message: 'File uploaded successfully. Processing will begin shortly.',
      },
      201
    );
  } catch (error) {
    console.error('Upload error:', error);
    return c.json(
      {
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      500
    );
  }
});

/**
 * POST /ocr/process
 * Process an uploaded image with OCR
 */
app.post('/process', async (c) => {
  try {
    const body = processSchema.parse(await c.req.json());

    // Get media upload
    const mediaUpload = await prisma.mediaUpload.findUnique({
      where: { id: body.mediaUploadId },
      include: { bot: true },
    });

    if (!mediaUpload) {
      return c.json({ error: 'Media upload not found' }, 404);
    }

    if (mediaUpload.status === 'COMPLETED') {
      const existing = await prisma.oCRResult.findUnique({
        where: { mediaUploadId: body.mediaUploadId },
      });

      if (existing) {
        return c.json({
          ocrResultId: existing.id,
          status: 'completed',
          message: 'OCR already processed',
        });
      }
    }

    // Check plan access
    const hasAccess = await checkOCRAccess(mediaUpload.botId);
    if (!hasAccess) {
      return c.json(
        {
          error: 'OCR feature requires Advanced or Custom plan',
          upgrade: true,
        },
        403
      );
    }

    // In production, fetch the image from storage
    // For now, simulate with placeholder
    // const imageBuffer = await fetchFromStorage(mediaUpload.url);

    // Placeholder: In production, fetch actual image
    // For demo purposes, we'll create a minimal buffer
    // In real implementation, you would fetch from R2/S3
    const imageBuffer = Buffer.from('placeholder');

    // Process with OCR
    const ocrService = getOCRService(body.provider, c.env);
    const ocrResultId = await ocrService.processImage(
      body.mediaUploadId,
      imageBuffer,
      mediaUpload.mimeType
    );

    return c.json({
      ocrResultId,
      status: 'processing',
      message: 'OCR processing started',
    });
  } catch (error) {
    console.error('OCR process error:', error);
    return c.json(
      {
        error: error instanceof Error ? error.message : 'OCR processing failed',
      },
      500
    );
  }
});

/**
 * GET /ocr/results/:id
 * Get OCR result
 */
app.get('/results/:id', async (c) => {
  try {
    const resultId = c.req.param('id');

    const result = await prisma.oCRResult.findUnique({
      where: { id: resultId },
      include: {
        mediaUpload: {
          select: {
            fileName: true,
            url: true,
            status: true,
          },
        },
      },
    });

    if (!result) {
      return c.json({ error: 'OCR result not found' }, 404);
    }

    return c.json({ result });
  } catch (error) {
    console.error('Get OCR result error:', error);
    return c.json({ error: 'Failed to get OCR result' }, 500);
  }
});

/**
 * POST /ocr/match
 * Find fuzzy matches for OCR result in knowledge base
 */
app.post('/match', async (c) => {
  try {
    const body = matchSchema.parse(await c.req.json());

    // Check plan access
    const hasAccess = await checkOCRAccess(body.botId);
    if (!hasAccess) {
      return c.json(
        {
          error: 'OCR feature requires Advanced or Custom plan',
          upgrade: true,
        },
        403
      );
    }

    // Get OCR result
    const ocrResult = await prisma.oCRResult.findUnique({
      where: { id: body.ocrResultId },
    });

    if (!ocrResult) {
      return c.json({ error: 'OCR result not found' }, 404);
    }

    // Perform fuzzy matching
    const ocrService = getOCRService('tesseract', c.env);
    const matches = await ocrService.findMatches(body.ocrResultId, body.botId, {
      threshold: body.threshold,
      maxResults: body.maxResults,
      includePartialMatches: body.includePartialMatches,
    });

    return c.json({
      matches,
      total: matches.length,
      threshold: body.threshold,
    });
  } catch (error) {
    console.error('Match error:', error);
    return c.json(
      {
        error: error instanceof Error ? error.message : 'Matching failed',
      },
      500
    );
  }
});

/**
 * GET /ocr/matches/:ocrResultId
 * Get all matches for an OCR result
 */
app.get('/matches/:ocrResultId', async (c) => {
  try {
    const ocrResultId = c.req.param('ocrResultId');

    const matches = await prisma.oCRMatch.findMany({
      where: { ocrResultId },
      include: {
        knowledge: {
          select: {
            id: true,
            sourceUrl: true,
            metadata: true,
          },
        },
      },
      orderBy: { rank: 'asc' },
    });

    return c.json({ matches });
  } catch (error) {
    console.error('Get matches error:', error);
    return c.json({ error: 'Failed to get matches' }, 500);
  }
});

/**
 * POST /ocr/matches/:matchId/add-to-docs
 * Add a match result to knowledge base as new document
 */
app.post('/matches/:matchId/add-to-docs', async (c) => {
  try {
    const matchId = c.req.param('matchId');
    const body = addToDocsSchema.parse({ matchId, ...(await c.req.json()) });

    // Check plan access
    const hasAccess = await checkOCRAccess(body.botId);
    if (!hasAccess) {
      return c.json(
        {
          error: 'OCR feature requires Advanced or Custom plan',
          upgrade: true,
        },
        403
      );
    }

    const ocrService = getOCRService('tesseract', c.env);
    const knowledgeId = await ocrService.addMatchToDocuments(matchId, body.botId);

    return c.json({
      success: true,
      knowledgeId,
      message: 'Successfully added to documents',
    });
  } catch (error) {
    console.error('Add to docs error:', error);
    return c.json(
      {
        error: error instanceof Error ? error.message : 'Failed to add to documents',
      },
      500
    );
  }
});

/**
 * POST /ocr/matches/:matchId/feedback
 * Track user feedback on match (clicked, helpful, etc.)
 */
app.post('/matches/:matchId/feedback', async (c) => {
  try {
    const matchId = c.req.param('matchId');
    const body = feedbackSchema.parse({ matchId, ...(await c.req.json()) });

    const ocrService = getOCRService('tesseract', c.env);
    await ocrService.trackMatchFeedback(matchId, body.clicked);

    return c.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    return c.json({ error: 'Failed to record feedback' }, 500);
  }
});

/**
 * GET /ocr/stats/:botId
 * Get OCR usage statistics for a bot
 */
app.get('/stats/:botId', async (c) => {
  try {
    const botId = c.req.param('botId');

    // Check plan access
    const hasAccess = await checkOCRAccess(botId);
    if (!hasAccess) {
      return c.json(
        {
          error: 'OCR feature requires Advanced or Custom plan',
          upgrade: true,
        },
        403
      );
    }

    // Get statistics
    const totalUploads = await prisma.mediaUpload.count({
      where: { botId },
    });

    const successfulOCR = await prisma.mediaUpload.count({
      where: { botId, status: 'COMPLETED' },
    });

    const failedOCR = await prisma.mediaUpload.count({
      where: { botId, status: 'FAILED' },
    });

    const totalMatches = await prisma.oCRMatch.count({
      where: {
        ocrResult: {
          mediaUpload: {
            botId,
          },
        },
      },
    });

    const addedToDocs = await prisma.oCRMatch.count({
      where: {
        ocrResult: {
          mediaUpload: {
            botId,
          },
        },
        addedToDocs: true,
      },
    });

    // Average confidence
    const avgConfidence = await prisma.oCRResult.aggregate({
      where: {
        mediaUpload: {
          botId,
        },
      },
      _avg: {
        confidence: true,
      },
    });

    // Average processing time
    const avgProcessingTime = await prisma.oCRResult.aggregate({
      where: {
        mediaUpload: {
          botId,
        },
      },
      _avg: {
        processingTime: true,
      },
    });

    return c.json({
      stats: {
        totalUploads,
        successfulOCR,
        failedOCR,
        totalMatches,
        addedToDocs,
        averageConfidence: avgConfidence._avg.confidence || 0,
        averageProcessingTime: avgProcessingTime._avg.processingTime || 0,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return c.json({ error: 'Failed to get statistics' }, 500);
  }
});

/**
 * DELETE /ocr/uploads/:id
 * Delete a media upload and associated OCR data
 */
app.delete('/uploads/:id', async (c) => {
  try {
    const uploadId = c.req.param('id');

    const upload = await prisma.mediaUpload.findUnique({
      where: { id: uploadId },
    });

    if (!upload) {
      return c.json({ error: 'Upload not found' }, 404);
    }

    // Check plan access
    const hasAccess = await checkOCRAccess(upload.botId);
    if (!hasAccess) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // In production, also delete from storage (R2/S3)
    // await deleteFromStorage(upload.url);

    // Delete from database (cascade will handle OCR results and matches)
    await prisma.mediaUpload.delete({
      where: { id: uploadId },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete upload error:', error);
    return c.json({ error: 'Failed to delete upload' }, 500);
  }
});

export default app;
