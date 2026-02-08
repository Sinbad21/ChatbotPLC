/**
 * Error Handler Middleware
 * 
 * Provides centralized error handling for all API routes.
 * Converts various error types to standardized API responses.
 */

import { Context } from 'hono';
import { 
  APIError, 
  isAPIError, 
  fromPrismaError, 
  fromZodError,
  InternalError 
} from '../lib/errors';
import { ZodError } from 'zod';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
  requestId?: string;
}

/**
 * Get allowed origins for CORS
 */
function getAllowedOrigins(c: Context): string[] {
  const hardcoded = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://plcassistant.gabrypiritore.workers.dev',
    'https://plcassistant-web.gabrypiritore.workers.dev',
    'https://omnical.studio',
    'https://www.omnical.studio',
    'https://chatbot-5o5.pages.dev',
    'https://chatbot-studio.pages.dev',
    'https://chatbot-studio-29k.pages.dev',
  ];

  // Also read env vars like the main CORS middleware
  const env = (c as any).env || {};
  const fromEnvRaw = (env.FRONTEND_URLS || env.FRONTEND_URL || '') as string;
  const fromEnv = fromEnvRaw.split(',').map((o: string) => o.trim()).filter(Boolean);
  const fromAppUrl = env.APP_URL ? [String(env.APP_URL).trim()].filter(Boolean) : [];

  return Array.from(new Set([...hardcoded, ...fromEnv, ...fromAppUrl]));
}

/**
 * Set CORS headers on response
 */
function setCorsHeaders(c: Context): void {
  const origin = c.req.header('Origin');
  const allowed = getAllowedOrigins(c);

  if (origin && allowed.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
  } else {
    c.header('Access-Control-Allow-Origin', allowed[0]);
  }

  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Vary', 'Origin');
}

/**
 * Determine if error should be logged in detail
 */
function shouldLogDetails(error: APIError): boolean {
  // Log 5xx errors in detail, not 4xx
  return error.statusCode >= 500;
}

/**
 * Format error for API response
 */
function formatErrorResponse(error: APIError, requestId?: string): ErrorResponse {
  return {
    error: {
      code: error.code,
      message: error.message,
      ...(error.details && { details: error.details }),
    },
    timestamp: new Date().toISOString(),
    ...(requestId && { requestId }),
  };
}

/**
 * Convert unknown error to APIError
 */
function toAPIError(err: unknown): APIError {
  // Already an APIError
  if (isAPIError(err)) {
    return err;
  }

  // Zod validation error
  if (err instanceof ZodError) {
    return fromZodError(err);
  }

  // Prisma error (has error code starting with P)
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as any).code;
    if (typeof code === 'string' && code.startsWith('P')) {
      return fromPrismaError(err);
    }
  }

  // Standard Error
  if (err instanceof Error) {
    // Check for specific error messages
    const message = err.message.toLowerCase();
    
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return new APIError(err.message, 401, 'UNAUTHORIZED');
    }
    
    if (message.includes('forbidden') || message.includes('permission')) {
      return new APIError(err.message, 403, 'FORBIDDEN');
    }
    
    if (message.includes('not found')) {
      return new APIError(err.message, 404, 'NOT_FOUND');
    }
    
    if (message.includes('already exists') || message.includes('duplicate')) {
      return new APIError(err.message, 409, 'CONFLICT');
    }
    
    if (message.includes('rate limit') || message.includes('too many')) {
      return new APIError(err.message, 429, 'RATE_LIMIT_EXCEEDED');
    }

    // Generic internal error
    return new InternalError(err.message);
  }

  // Unknown error type
  return new InternalError('An unexpected error occurred');
}

/**
 * Global error handler for Hono app
 * 
 * Usage:
 * ```ts
 * app.onError(errorHandler);
 * ```
 */
export function errorHandler(err: Error, c: Context): Response {
  const requestId = c.req.header('X-Request-ID') || crypto.randomUUID();
  const apiError = toAPIError(err);

  // Set CORS headers (important for browser clients)
  setCorsHeaders(c);

  // Log error details
  if (shouldLogDetails(apiError)) {
    console.error(`[Error ${requestId}]`, {
      code: apiError.code,
      message: apiError.message,
      statusCode: apiError.statusCode,
      path: c.req.path,
      method: c.req.method,
      stack: apiError.stack,
    });
  } else {
    console.warn(`[Error ${requestId}] ${apiError.code}: ${apiError.message}`);
  }

  // Return formatted response
  const response = formatErrorResponse(apiError, requestId);
  return c.json(response, apiError.statusCode);
}

/**
 * Async error wrapper for route handlers
 * 
 * Catches async errors and forwards them to the error handler.
 * 
 * Usage:
 * ```ts
 * app.get('/api/resource', asyncHandler(async (c) => {
 *   const data = await someAsyncOperation();
 *   return c.json(data);
 * }));
 * ```
 */
export function asyncHandler<T extends Context>(
  handler: (c: T) => Promise<Response>
): (c: T) => Promise<Response> {
  return async (c: T) => {
    try {
      return await handler(c);
    } catch (err) {
      throw toAPIError(err);
    }
  };
}

export { APIError, toAPIError };
