/**
 * Tests for the Embeddings Service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chunkText, cosineSimilarity, documentNeedsEmbedding, buildContextFromChunks } from '../services/embeddings';

describe('Embeddings Service', () => {
  describe('chunkText', () => {
    it('should return single chunk for short text', () => {
      const text = 'This is a short text.';
      const chunks = chunkText(text, 1000, 200);
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(text);
    });

    it('should split long text into overlapping chunks', () => {
      const text = 'A'.repeat(2500);
      const chunks = chunkText(text, 1000, 200);
      
      expect(chunks.length).toBeGreaterThan(1);
      // Check overlap
      expect(chunks[0].length).toBe(1000);
    });

    it('should handle empty text', () => {
      const chunks = chunkText('   ');
      expect(chunks).toHaveLength(0);
    });

    it('should normalize whitespace', () => {
      const text = 'Hello    world\n\n\ntest';
      const chunks = chunkText(text);
      
      expect(chunks[0]).toBe('Hello world test');
    });

    it('should try to break at sentence boundaries', () => {
      const text = 'This is sentence one. This is sentence two. This is sentence three. ' + 'Extra content. '.repeat(50);
      const chunks = chunkText(text, 100, 20);
      
      // First chunk should end with a period
      expect(chunks[0].endsWith('.') || chunks[0].endsWith(' ')).toBe(true);
    });
  });

  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const v = [0.1, 0.2, 0.3, 0.4];
      const similarity = cosineSimilarity(v, v);
      
      expect(similarity).toBeCloseTo(1, 5);
    });

    it('should return 0 for orthogonal vectors', () => {
      const v1 = [1, 0, 0];
      const v2 = [0, 1, 0];
      const similarity = cosineSimilarity(v1, v2);
      
      expect(similarity).toBeCloseTo(0, 5);
    });

    it('should return -1 for opposite vectors', () => {
      const v1 = [1, 0, 0];
      const v2 = [-1, 0, 0];
      const similarity = cosineSimilarity(v1, v2);
      
      expect(similarity).toBeCloseTo(-1, 5);
    });

    it('should throw for vectors of different lengths', () => {
      const v1 = [1, 0];
      const v2 = [1, 0, 0];
      
      expect(() => cosineSimilarity(v1, v2)).toThrow('Vectors must have same length');
    });

    it('should compute correct similarity for similar vectors', () => {
      const v1 = [0.5, 0.5, 0.5];
      const v2 = [0.6, 0.4, 0.5];
      const similarity = cosineSimilarity(v1, v2);
      
      // Should be close to 1 but not exactly 1
      expect(similarity).toBeGreaterThan(0.9);
      expect(similarity).toBeLessThan(1);
    });
  });

  describe('documentNeedsEmbedding', () => {
    it('should return true for null metadata', () => {
      expect(documentNeedsEmbedding(null)).toBe(true);
    });

    it('should return true for empty metadata', () => {
      expect(documentNeedsEmbedding({})).toBe(true);
    });

    it('should return true for metadata without chunks', () => {
      expect(documentNeedsEmbedding({ other: 'data' })).toBe(true);
    });

    it('should return true for empty chunks array', () => {
      expect(documentNeedsEmbedding({ chunks: [] })).toBe(true);
    });

    it('should return true for chunks without embeddings', () => {
      expect(documentNeedsEmbedding({ 
        chunks: [{ index: 0, content: 'test' }] 
      })).toBe(true);
    });

    it('should return false for chunks with embeddings', () => {
      expect(documentNeedsEmbedding({ 
        chunks: [{ index: 0, content: 'test', embedding: [0.1, 0.2] }] 
      })).toBe(false);
    });
  });

  describe('buildContextFromChunks', () => {
    it('should return empty string for empty results', () => {
      const context = buildContextFromChunks([]);
      expect(context).toBe('');
    });

    it('should format chunks with document titles', () => {
      const results = [
        {
          chunk: {
            id: 'doc1-0',
            documentId: 'doc1',
            documentTitle: 'Test Document',
            content: 'This is the content.',
            chunkIndex: 0,
          },
          score: 0.95,
        },
      ];

      const context = buildContextFromChunks(results);
      
      expect(context).toContain('# Relevant Knowledge Base Excerpts');
      expect(context).toContain('## From: Test Document');
      expect(context).toContain('This is the content.');
    });

    it('should group chunks by document', () => {
      const results = [
        {
          chunk: {
            id: 'doc1-0',
            documentId: 'doc1',
            documentTitle: 'Document A',
            content: 'Content A1',
            chunkIndex: 0,
          },
          score: 0.95,
        },
        {
          chunk: {
            id: 'doc1-1',
            documentId: 'doc1',
            documentTitle: 'Document A',
            content: 'Content A2',
            chunkIndex: 1,
          },
          score: 0.90,
        },
        {
          chunk: {
            id: 'doc2-0',
            documentId: 'doc2',
            documentTitle: 'Document B',
            content: 'Content B1',
            chunkIndex: 0,
          },
          score: 0.85,
        },
      ];

      const context = buildContextFromChunks(results);
      
      // Should have two document headers
      expect(context.match(/## From:/g)?.length).toBe(2);
      expect(context).toContain('## From: Document A');
      expect(context).toContain('## From: Document B');
    });

    it('should order chunks by their original index within each document', () => {
      const results = [
        {
          chunk: {
            id: 'doc1-2',
            documentId: 'doc1',
            documentTitle: 'Test Doc',
            content: 'Third chunk',
            chunkIndex: 2,
          },
          score: 0.95,
        },
        {
          chunk: {
            id: 'doc1-0',
            documentId: 'doc1',
            documentTitle: 'Test Doc',
            content: 'First chunk',
            chunkIndex: 0,
          },
          score: 0.85,
        },
      ];

      const context = buildContextFromChunks(results);
      
      const firstPos = context.indexOf('First chunk');
      const thirdPos = context.indexOf('Third chunk');
      
      // First chunk should appear before third chunk in context
      expect(firstPos).toBeLessThan(thirdPos);
    });
  });
});
