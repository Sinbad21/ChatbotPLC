/**
 * OCR Service with Text Extraction and Fuzzy Matching
 * Supports multiple OCR providers and fuzzy matching against knowledge base
 */

import { prisma } from '@chatbot/database';

export interface OCRProvider {
  name: string;
  extractText(imageBuffer: Buffer, mimeType: string): Promise<OCRResult>;
}

export interface OCRResult {
  text: string;
  confidence?: number;
  detectedLanguage?: string;
  processingTime: number;
}

export interface FuzzyMatchOptions {
  threshold?: number; // Minimum similarity score (0-1)
  maxResults?: number;
  includePartialMatches?: boolean;
}

export interface MatchResult {
  knowledgeId: string;
  matchedText: string;
  score: number;
  matchType: 'exact' | 'fuzzy' | 'partial';
  sourceUrl?: string;
  sourceTitle?: string;
  sourceExcerpt?: string;
}

/**
 * Tesseract.js OCR Provider (client-side compatible)
 */
export class TesseractOCRProvider implements OCRProvider {
  name = 'tesseract';

  async extractText(imageBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    const startTime = Date.now();

    // Note: In production, you would use Tesseract.js or a server-side OCR service
    // For now, this is a placeholder that would integrate with Tesseract

    try {
      // Convert buffer to base64 for processing
      const base64Image = imageBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      // In a real implementation, you would:
      // 1. Use Tesseract.js worker
      // 2. Or call an external OCR API (Google Vision, AWS Textract, Azure CV)

      // Placeholder response structure
      const text = await this.performOCR(dataUrl);
      const processingTime = Date.now() - startTime;

      return {
        text,
        confidence: 0.85, // Would come from actual OCR
        detectedLanguage: 'ita', // Would be detected
        processingTime,
      };
    } catch (error) {
      throw new Error(`OCR processing failed: ${error}`);
    }
  }

  private async performOCR(dataUrl: string): Promise<string> {
    // This is a placeholder - in production you would use actual OCR
    // Example with Tesseract.js:
    /*
    const { createWorker } = require('tesseract.js');
    const worker = await createWorker('ita');
    const { data: { text } } = await worker.recognize(dataUrl);
    await worker.terminate();
    return text;
    */

    throw new Error('OCR provider not configured. Set up Tesseract.js or external OCR service.');
  }
}

/**
 * Google Cloud Vision OCR Provider
 */
export class GoogleVisionOCRProvider implements OCRProvider {
  name = 'google-vision';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async extractText(imageBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      const base64Image = imageBuffer.toString('base64');

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [
              {
                image: { content: base64Image },
                features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Google Vision API error: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      const textAnnotations = data.responses[0]?.textAnnotations;

      if (!textAnnotations || textAnnotations.length === 0) {
        return {
          text: '',
          confidence: 0,
          processingTime: Date.now() - startTime,
        };
      }

      // First annotation contains full text
      const text = textAnnotations[0].description;
      const confidence =
        textAnnotations.reduce((sum: number, ann: any) => sum + (ann.confidence || 0), 0) /
        textAnnotations.length;

      return {
        text,
        confidence,
        detectedLanguage: textAnnotations[0].locale,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      throw new Error(`Google Vision OCR failed: ${error}`);
    }
  }
}

/**
 * Main OCR Service
 */
export class OCRService {
  private provider: OCRProvider;

  constructor(provider: OCRProvider) {
    this.provider = provider;
  }

  /**
   * Process image and extract text
   */
  async processImage(
    mediaUploadId: string,
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<string> {
    try {
      // Update status to processing
      await prisma.mediaUpload.update({
        where: { id: mediaUploadId },
        data: { status: 'PROCESSING' },
      });

      // Perform OCR
      const result = await this.provider.extractText(imageBuffer, mimeType);

      // Normalize text
      const normalizedText = this.normalizeText(result.text);
      const textNoSpaces = result.text.replace(/\s+/g, '').toLowerCase();

      // Save OCR result
      const ocrResult = await prisma.oCRResult.create({
        data: {
          mediaUploadId,
          text: result.text,
          confidence: result.confidence,
          normalizedText,
          textNoSpaces,
          provider: this.provider.name,
          processingTime: result.processingTime,
          detectedLang: result.detectedLanguage,
        },
      });

      // Update media upload status
      await prisma.mediaUpload.update({
        where: { id: mediaUploadId },
        data: { status: 'COMPLETED' },
      });

      return ocrResult.id;
    } catch (error) {
      // Update status to failed
      await prisma.mediaUpload.update({
        where: { id: mediaUploadId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Normalize text for better matching
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Calculate similarity score (0-1) between two strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1.0;

    const distance = this.levenshteinDistance(str1, str2);
    return 1 - distance / maxLen;
  }

  /**
   * Check if text contains substring with fuzzy matching
   */
  private fuzzyContains(haystack: string, needle: string, threshold: number): boolean {
    const needleLen = needle.length;

    // Sliding window approach
    for (let i = 0; i <= haystack.length - needleLen; i++) {
      const window = haystack.substring(i, i + needleLen);
      const similarity = this.calculateSimilarity(window, needle);

      if (similarity >= threshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find fuzzy matches in knowledge base
   */
  async findMatches(
    ocrResultId: string,
    botId: string,
    options: FuzzyMatchOptions = {}
  ): Promise<MatchResult[]> {
    const {
      threshold = 0.7,
      maxResults = 10,
      includePartialMatches = true,
    } = options;

    // Get OCR result
    const ocrResult = await prisma.oCRResult.findUnique({
      where: { id: ocrResultId },
    });

    if (!ocrResult) {
      throw new Error('OCR result not found');
    }

    // Get all knowledge entries for the bot
    const knowledgeEntries = await prisma.knowledge.findMany({
      where: { botId },
      select: {
        id: true,
        content: true,
        sourceUrl: true,
        metadata: true,
      },
    });

    const matches: MatchResult[] = [];

    // Split OCR text into sentences/chunks for partial matching
    const ocrChunks = this.splitIntoChunks(ocrResult.normalizedText, 50);

    for (const knowledge of knowledgeEntries) {
      const knowledgeNormalized = this.normalizeText(knowledge.content);

      // Exact match check
      if (knowledgeNormalized.includes(ocrResult.normalizedText)) {
        matches.push({
          knowledgeId: knowledge.id,
          matchedText: ocrResult.text,
          score: 1.0,
          matchType: 'exact',
          sourceUrl: knowledge.sourceUrl || undefined,
          sourceTitle: (knowledge.metadata as any)?.title,
          sourceExcerpt: this.extractExcerpt(knowledge.content, ocrResult.text, 200),
        });
        continue;
      }

      // Fuzzy full text match
      const fullSimilarity = this.calculateSimilarity(
        ocrResult.normalizedText,
        knowledgeNormalized
      );

      if (fullSimilarity >= threshold) {
        matches.push({
          knowledgeId: knowledge.id,
          matchedText: ocrResult.text,
          score: fullSimilarity,
          matchType: 'fuzzy',
          sourceUrl: knowledge.sourceUrl || undefined,
          sourceTitle: (knowledge.metadata as any)?.title,
          sourceExcerpt: this.extractExcerpt(knowledge.content, ocrResult.text, 200),
        });
        continue;
      }

      // Partial chunk matching
      if (includePartialMatches) {
        for (const chunk of ocrChunks) {
          if (chunk.length < 10) continue; // Skip very short chunks

          if (this.fuzzyContains(knowledgeNormalized, chunk, threshold * 0.8)) {
            matches.push({
              knowledgeId: knowledge.id,
              matchedText: chunk,
              score: threshold * 0.8,
              matchType: 'partial',
              sourceUrl: knowledge.sourceUrl || undefined,
              sourceTitle: (knowledge.metadata as any)?.title,
              sourceExcerpt: this.extractExcerpt(knowledge.content, chunk, 200),
            });
            break; // One partial match per knowledge entry
          }
        }
      }
    }

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    // Limit results
    const topMatches = matches.slice(0, maxResults);

    // Save matches to database
    for (let i = 0; i < topMatches.length; i++) {
      const match = topMatches[i];
      await prisma.oCRMatch.create({
        data: {
          ocrResultId,
          knowledgeId: match.knowledgeId,
          matchedText: match.matchedText,
          score: match.score,
          matchType: match.matchType,
          sourceUrl: match.sourceUrl,
          sourceTitle: match.sourceTitle,
          sourceExcerpt: match.sourceExcerpt,
          rank: i,
        },
      });
    }

    return topMatches;
  }

  /**
   * Split text into overlapping chunks
   */
  private splitIntoChunks(text: string, chunkSize: number): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += chunkSize / 2) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
    }

    return chunks;
  }

  /**
   * Extract excerpt around matched text
   */
  private extractExcerpt(
    content: string,
    matchedText: string,
    maxLength: number
  ): string {
    const normalizedContent = this.normalizeText(content);
    const normalizedMatch = this.normalizeText(matchedText);

    const index = normalizedContent.indexOf(normalizedMatch);

    if (index === -1) {
      // Match not found, return start of content
      return content.substring(0, maxLength) + '...';
    }

    // Calculate excerpt boundaries
    const start = Math.max(0, index - maxLength / 2);
    const end = Math.min(content.length, index + matchedText.length + maxLength / 2);

    let excerpt = content.substring(start, end);

    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';

    return excerpt;
  }

  /**
   * Add match result to knowledge base as a new document
   */
  async addMatchToDocuments(matchId: string, botId: string): Promise<string> {
    const match = await prisma.oCRMatch.findUnique({
      where: { id: matchId },
      include: {
        ocrResult: {
          include: {
            mediaUpload: true,
          },
        },
      },
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // Check if already added
    if (match.addedToDocs) {
      throw new Error('Match already added to documents');
    }

    // Create new knowledge entry
    const knowledge = await prisma.knowledge.create({
      data: {
        botId,
        content: match.ocrResult.text,
        sourceUrl: match.sourceUrl || match.ocrResult.mediaUpload.url,
        metadata: {
          addedFrom: 'ocr',
          originalMatchId: matchId,
          confidence: match.ocrResult.confidence,
          detectedLanguage: match.ocrResult.detectedLang,
          matchScore: match.score,
        },
      },
    });

    // Mark as added
    await prisma.oCRMatch.update({
      where: { id: matchId },
      data: { addedToDocs: true },
    });

    return knowledge.id;
  }

  /**
   * Track user feedback on match (clicked, helpful, etc.)
   */
  async trackMatchFeedback(matchId: string, clicked: boolean): Promise<void> {
    await prisma.oCRMatch.update({
      where: { id: matchId },
      data: { clicked },
    });
  }
}
