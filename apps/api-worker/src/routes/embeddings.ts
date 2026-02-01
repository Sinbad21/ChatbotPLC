/**
 * Embeddings Routes for RAG
 * 
 * Provides endpoints to:
 * - Generate embeddings for existing documents
 * - Reindex documents
 * - Check embedding status
 */

import { Hono } from 'hono';
import { getPrisma } from '../db';
import { processDocumentEmbeddings, documentNeedsEmbedding } from '../services/embeddings';

type Bindings = {
  DATABASE_URL: string;
  OPENAI_API_KEY: string;
  JWT_SECRET: string;
};

export const embeddingsRoutes = new Hono<{ Bindings: Bindings }>();

/**
 * POST /api/v1/documents/:documentId/embed
 * Generate embeddings for a specific document
 */
embeddingsRoutes.post('/:documentId/embed', async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const documentId = c.req.param('documentId');

    console.log(`📄 [Embeddings] Processing document: ${documentId}`);

    // Get document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        title: true,
        content: true,
        metadata: true,
        status: true,
      },
    });

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    if (document.status !== 'COMPLETED') {
      return c.json({ error: 'Document is still processing' }, 400);
    }

    // Generate embeddings
    const embeddingsData = await processDocumentEmbeddings(
      document.id,
      document.content,
      c.env.OPENAI_API_KEY
    );

    // Update document with embeddings in metadata
    await prisma.document.update({
      where: { id: documentId },
      data: {
        metadata: embeddingsData as any,
      },
    });

    console.log(`✅ [Embeddings] Document ${documentId} embedded: ${embeddingsData.chunks.length} chunks`);

    return c.json({
      success: true,
      documentId,
      chunksCount: embeddingsData.chunks.length,
    });

  } catch (error: any) {
    console.error('[Embeddings] Error:', error);
    return c.json({
      error: 'Failed to generate embeddings',
      message: error.message,
    }, 500);
  }
});

/**
 * POST /api/v1/bots/:botId/documents/embed-all
 * Generate embeddings for all documents of a bot
 */
embeddingsRoutes.post('/bot/:botId/embed-all', async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const botId = c.req.param('botId');

    console.log(`📚 [Embeddings] Batch embedding for bot: ${botId}`);

    // Get all documents that need embedding
    const documents = await prisma.document.findMany({
      where: {
        botId,
        status: 'COMPLETED',
        excluded: false,
      },
      select: {
        id: true,
        title: true,
        content: true,
        metadata: true,
      },
    });

    const results = {
      total: documents.length,
      processed: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const doc of documents) {
      // Check if already has embeddings
      if (!documentNeedsEmbedding(doc.metadata)) {
        console.log(`⏭️ [Embeddings] Skipping ${doc.title} (already embedded)`);
        results.skipped++;
        continue;
      }

      try {
        const embeddingsData = await processDocumentEmbeddings(
          doc.id,
          doc.content,
          c.env.OPENAI_API_KEY
        );

        await prisma.document.update({
          where: { id: doc.id },
          data: {
            metadata: embeddingsData as any,
          },
        });

        results.processed++;
        console.log(`✅ [Embeddings] ${doc.title}: ${embeddingsData.chunks.length} chunks`);

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        results.failed++;
        results.errors.push(`${doc.title}: ${error.message}`);
        console.error(`❌ [Embeddings] Failed: ${doc.title}`, error);
      }
    }

    console.log(`📊 [Embeddings] Batch complete:`, results);

    return c.json({
      success: true,
      ...results,
    });

  } catch (error: any) {
    console.error('[Embeddings] Batch error:', error);
    return c.json({
      error: 'Batch embedding failed',
      message: error.message,
    }, 500);
  }
});

/**
 * GET /api/v1/bots/:botId/documents/embedding-status
 * Check embedding status for all documents of a bot
 */
embeddingsRoutes.get('/bot/:botId/embedding-status', async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const botId = c.req.param('botId');

    const documents = await prisma.document.findMany({
      where: {
        botId,
        status: 'COMPLETED',
        excluded: false,
      },
      select: {
        id: true,
        title: true,
        metadata: true,
      },
    });

    const status = documents.map(doc => {
      const metadata = doc.metadata as any;
      const hasEmbeddings = !documentNeedsEmbedding(metadata);
      const chunksCount = hasEmbeddings ? metadata?.chunks?.length || 0 : 0;

      return {
        id: doc.id,
        title: doc.title,
        hasEmbeddings,
        chunksCount,
      };
    });

    const embedded = status.filter(s => s.hasEmbeddings).length;
    const needsEmbedding = status.filter(s => !s.hasEmbeddings).length;

    return c.json({
      total: documents.length,
      embedded,
      needsEmbedding,
      documents: status,
    });

  } catch (error: any) {
    console.error('[Embeddings] Status error:', error);
    return c.json({
      error: 'Failed to get status',
      message: error.message,
    }, 500);
  }
});

export function registerEmbeddingsRoutes(app: Hono<{ Bindings: Bindings }>) {
  app.route('/api/v1/embeddings', embeddingsRoutes);
}
