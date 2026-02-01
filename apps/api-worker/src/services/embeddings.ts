/**
 * Embeddings Service for RAG (Retrieval-Augmented Generation)
 * 
 * Uses OpenAI's text-embedding-3-small model to generate embeddings
 * and performs cosine similarity search for semantic retrieval.
 * 
 * Note: This implementation stores embeddings in PostgreSQL as JSON arrays.
 * For production with large datasets, consider using pgvector extension
 * or a dedicated vector database like Pinecone, Qdrant, or Cloudflare Vectorize.
 */

import type { PrismaClient } from '@prisma/client';

// OpenAI embedding model - 1536 dimensions, good balance of quality/cost
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

// Chunking configuration
const CHUNK_SIZE = 1000; // characters
const CHUNK_OVERLAP = 200; // characters overlap between chunks
const MAX_CHUNKS_PER_QUERY = 5; // top-k chunks to retrieve

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  content: string;
  chunkIndex: number;
  embedding?: number[];
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
}

/**
 * Generate embedding for text using OpenAI API
 */
export async function generateEmbedding(
  text: string,
  openaiApiKey: string
): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text.slice(0, 8000), // Limit input to avoid token limits
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('[Embeddings] OpenAI API error:', error);
    throw new Error(`Failed to generate embedding: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Split text into overlapping chunks for better retrieval
 */
export function chunkText(
  text: string,
  chunkSize: number = CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP
): string[] {
  const chunks: string[] = [];
  
  // Clean and normalize text
  const cleanText = text
    .replace(/\s+/g, ' ')
    .trim();
  
  // Return empty array for empty/whitespace-only text
  if (cleanText.length === 0) {
    return [];
  }
  
  if (cleanText.length <= chunkSize) {
    return [cleanText];
  }

  let start = 0;
  while (start < cleanText.length) {
    let end = Math.min(start + chunkSize, cleanText.length);
    
    // Try to break at sentence boundary
    if (end < cleanText.length) {
      const lastPeriod = cleanText.lastIndexOf('.', end);
      const lastNewline = cleanText.lastIndexOf('\n', end);
      const lastSpace = cleanText.lastIndexOf(' ', end);
      
      // Prefer breaking at sentence, then newline, then space
      if (lastPeriod > start + chunkSize / 2) {
        end = lastPeriod + 1;
      } else if (lastNewline > start + chunkSize / 2) {
        end = lastNewline + 1;
      } else if (lastSpace > start + chunkSize / 2) {
        end = lastSpace + 1;
      }
    }
    
    const chunk = cleanText.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    
    start = end - overlap;
    if (start >= cleanText.length - overlap) {
      break;
    }
  }

  return chunks;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search for relevant chunks using semantic similarity
 * 
 * For now, this loads all chunks into memory and computes similarity.
 * For production with many documents, migrate to pgvector or a vector DB.
 */
export async function searchRelevantChunks(
  query: string,
  botId: string,
  prisma: PrismaClient,
  openaiApiKey: string,
  topK: number = MAX_CHUNKS_PER_QUERY
): Promise<SearchResult[]> {
  console.log(`🔍 [RAG] Searching for relevant chunks for query: "${query.slice(0, 50)}..."`);

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query, openaiApiKey);

  // Get all document chunks for this bot
  // Note: This is stored in Document.metadata as a temporary solution
  // For production, create a separate DocumentChunk table with proper indexing
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

  const allChunks: DocumentChunk[] = [];

  for (const doc of documents) {
    const metadata = doc.metadata as any;
    
    // Check if document has pre-computed chunks with embeddings
    if (metadata?.chunks && Array.isArray(metadata.chunks)) {
      for (const chunk of metadata.chunks) {
        if (chunk.embedding && Array.isArray(chunk.embedding)) {
          allChunks.push({
            id: `${doc.id}-${chunk.index}`,
            documentId: doc.id,
            documentTitle: doc.title,
            content: chunk.content,
            chunkIndex: chunk.index,
            embedding: chunk.embedding,
          });
        }
      }
    } else {
      // Fallback: Create a single chunk from the full document
      // This will be less accurate but ensures backwards compatibility
      console.log(`⚠️ [RAG] Document ${doc.title} has no embeddings, using full content`);
      allChunks.push({
        id: `${doc.id}-0`,
        documentId: doc.id,
        documentTitle: doc.title,
        content: doc.content.slice(0, CHUNK_SIZE),
        chunkIndex: 0,
        // No embedding - will be filtered out
      });
    }
  }

  // Filter chunks that have embeddings and compute similarity
  const chunksWithEmbeddings = allChunks.filter(c => c.embedding);
  
  if (chunksWithEmbeddings.length === 0) {
    console.log('⚠️ [RAG] No embedded chunks found, falling back to full documents');
    // Return empty - caller will fall back to full document concatenation
    return [];
  }

  console.log(`📊 [RAG] Computing similarity for ${chunksWithEmbeddings.length} chunks`);

  // Compute similarity scores
  const results: SearchResult[] = chunksWithEmbeddings.map(chunk => ({
    chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding!),
  }));

  // Sort by score descending and take top-k
  results.sort((a, b) => b.score - a.score);
  const topResults = results.slice(0, topK);

  console.log(`✅ [RAG] Found ${topResults.length} relevant chunks (scores: ${topResults.map(r => r.score.toFixed(3)).join(', ')})`);

  return topResults;
}

/**
 * Process a document: chunk it and generate embeddings
 * Returns updated metadata with chunks and embeddings
 */
export async function processDocumentEmbeddings(
  documentId: string,
  content: string,
  openaiApiKey: string
): Promise<{ chunks: Array<{ index: number; content: string; embedding: number[] }> }> {
  console.log(`📄 [RAG] Processing embeddings for document ${documentId}`);

  // Split into chunks
  const textChunks = chunkText(content);
  console.log(`📦 [RAG] Split into ${textChunks.length} chunks`);

  // Generate embeddings for each chunk
  const chunksWithEmbeddings = [];
  
  for (let i = 0; i < textChunks.length; i++) {
    const chunkContent = textChunks[i];
    
    try {
      const embedding = await generateEmbedding(chunkContent, openaiApiKey);
      chunksWithEmbeddings.push({
        index: i,
        content: chunkContent,
        embedding,
      });
      console.log(`✅ [RAG] Generated embedding for chunk ${i + 1}/${textChunks.length}`);
    } catch (error) {
      console.error(`❌ [RAG] Failed to generate embedding for chunk ${i}:`, error);
      // Continue with other chunks
    }
    
    // Small delay to avoid rate limits
    if (i < textChunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`✅ [RAG] Processed ${chunksWithEmbeddings.length}/${textChunks.length} chunks`);

  return { chunks: chunksWithEmbeddings };
}

/**
 * Build context from search results for the LLM prompt
 */
export function buildContextFromChunks(searchResults: SearchResult[]): string {
  if (searchResults.length === 0) {
    return '';
  }

  let context = '\n\n# Relevant Knowledge Base Excerpts\n\n';
  
  // Group by document
  const byDocument = new Map<string, SearchResult[]>();
  for (const result of searchResults) {
    const docId = result.chunk.documentId;
    if (!byDocument.has(docId)) {
      byDocument.set(docId, []);
    }
    byDocument.get(docId)!.push(result);
  }

  // Format context with document titles
  for (const [docId, results] of byDocument) {
    const docTitle = results[0].chunk.documentTitle;
    context += `## From: ${docTitle}\n\n`;
    
    // Sort chunks by their original order in the document
    results.sort((a, b) => a.chunk.chunkIndex - b.chunk.chunkIndex);
    
    for (const result of results) {
      context += `${result.chunk.content}\n\n`;
    }
  }

  return context;
}

/**
 * Check if a document needs embedding (new or updated)
 */
export function documentNeedsEmbedding(metadata: any): boolean {
  if (!metadata || !metadata.chunks) {
    return true;
  }
  
  if (!Array.isArray(metadata.chunks) || metadata.chunks.length === 0) {
    return true;
  }
  
  // Check if at least one chunk has an embedding
  return !metadata.chunks.some((c: any) => c.embedding && Array.isArray(c.embedding));
}
