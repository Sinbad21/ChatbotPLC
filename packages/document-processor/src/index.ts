import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs/promises';

export interface ProcessedDocument {
  text: string;
  pageCount?: number;
  metadata?: Record<string, any>;
}

/**
 * Process PDF document
 */
export async function processPDF(filePath: string): Promise<ProcessedDocument> {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);

    return {
      text: data.text,
      pageCount: data.numpages,
      metadata: data.info,
    };
  } catch (error) {
    throw new Error(`Failed to process PDF: ${error}`);
  }
}

/**
 * Process DOCX document
 */
export async function processDOCX(filePath: string): Promise<ProcessedDocument> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });

    return {
      text: result.value,
      metadata: {
        messages: result.messages,
      },
    };
  } catch (error) {
    throw new Error(`Failed to process DOCX: ${error}`);
  }
}

/**
 * Process TXT document
 */
export async function processTXT(filePath: string): Promise<ProcessedDocument> {
  try {
    const text = await fs.readFile(filePath, 'utf-8');

    return {
      text,
    };
  } catch (error) {
    throw new Error(`Failed to process TXT: ${error}`);
  }
}

/**
 * Process document based on file type
 */
export async function processDocument(
  filePath: string,
  fileType: string
): Promise<ProcessedDocument> {
  const normalizedType = fileType.toLowerCase();

  switch (normalizedType) {
    case 'pdf':
    case 'application/pdf':
      return processPDF(filePath);

    case 'docx':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return processDOCX(filePath);

    case 'txt':
    case 'text/plain':
      return processTXT(filePath);

    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Extract chunks from text for RAG
 */
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }

  return chunks;
}
