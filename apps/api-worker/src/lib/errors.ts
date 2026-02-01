/**
 * Standardized API Error Classes
 * 
 * Provides consistent error handling across all API endpoints.
 * All errors extend APIError and include:
 * - HTTP status code
 * - Error code (machine-readable)
 * - User-friendly message
 * - Optional details for debugging
 */

export class APIError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, any>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: Record<string, any>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Distinguishes from programming errors
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
      statusCode: this.statusCode,
    };
  }
}

// 400 Bad Request - Invalid input
export class BadRequestError extends APIError {
  constructor(message: string = 'Bad request', details?: Record<string, any>) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

// 400 Validation Error - Schema validation failed
export class ValidationError extends APIError {
  constructor(message: string = 'Validation failed', details?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

// 401 Unauthorized - Authentication required
export class UnauthorizedError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

// 401 Invalid Token - Token expired or invalid
export class InvalidTokenError extends APIError {
  constructor(message: string = 'Invalid or expired token') {
    super(message, 401, 'INVALID_TOKEN');
  }
}

// 403 Forbidden - Insufficient permissions
export class ForbiddenError extends APIError {
  constructor(message: string = 'Insufficient permissions', details?: Record<string, any>) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

// 403 Plan Required - Feature requires upgrade
export class PlanRequiredError extends APIError {
  constructor(requiredPlan: string = 'Advanced', feature: string = 'this feature') {
    super(
      `${feature} requires ${requiredPlan} or higher plan`,
      403,
      'PLAN_REQUIRED',
      { requiredPlan, upgrade: true }
    );
  }
}

// 404 Not Found - Resource doesn't exist
export class NotFoundError extends APIError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND', { resource });
  }
}

// 409 Conflict - Resource already exists or conflict
export class ConflictError extends APIError {
  constructor(message: string = 'Resource conflict', details?: Record<string, any>) {
    super(message, 409, 'CONFLICT', details);
  }
}

// 409 Duplicate - Entity already exists
export class DuplicateError extends APIError {
  constructor(field: string = 'entity') {
    super(`${field} already exists`, 409, 'DUPLICATE', { field });
  }
}

// 422 Unprocessable Entity - Business logic error
export class UnprocessableError extends APIError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 422, 'UNPROCESSABLE_ENTITY', details);
  }
}

// 429 Too Many Requests - Rate limit exceeded
export class RateLimitError extends APIError {
  constructor(retryAfter?: number) {
    super(
      'Too many requests. Please try again later.',
      429,
      'RATE_LIMIT_EXCEEDED',
      retryAfter ? { retryAfter } : undefined
    );
  }
}

// 500 Internal Server Error - Unexpected error
export class InternalError extends APIError {
  constructor(message: string = 'An unexpected error occurred') {
    super(message, 500, 'INTERNAL_ERROR');
  }
}

// 502 Bad Gateway - External service error
export class ExternalServiceError extends APIError {
  constructor(service: string = 'External service') {
    super(`${service} is temporarily unavailable`, 502, 'EXTERNAL_SERVICE_ERROR', { service });
  }
}

// 503 Service Unavailable - System maintenance
export class ServiceUnavailableError extends APIError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

/**
 * Helper to convert Prisma errors to APIError
 */
export function fromPrismaError(error: any): APIError {
  const code = error.code;
  
  switch (code) {
    case 'P2002':
      // Unique constraint violation
      const fields = error.meta?.target || ['field'];
      return new DuplicateError(Array.isArray(fields) ? fields.join(', ') : fields);
    
    case 'P2003':
      // Foreign key constraint failed
      return new ConflictError('Referenced resource does not exist or has been deleted', {
        code: 'P2003',
      });
    
    case 'P2025':
      // Record not found
      return new NotFoundError('Record');
    
    case 'P2016':
      // Query interpretation error
      return new BadRequestError('Invalid query parameters', { code: 'P2016' });
    
    case 'P2024':
      // Connection pool timeout
      return new ServiceUnavailableError('Database connection timeout');
    
    default:
      if (code?.startsWith('P20')) {
        return new BadRequestError('Database constraint error', { code });
      }
      return new InternalError('Database error');
  }
}

/**
 * Helper to convert Zod validation errors
 */
export function fromZodError(error: any): ValidationError {
  const issues = error.errors || error.issues || [];
  const details: Record<string, string[]> = {};
  
  for (const issue of issues) {
    const path = issue.path?.join('.') || 'value';
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(issue.message);
  }
  
  return new ValidationError('Validation failed', { fields: details });
}

/**
 * Type guard to check if error is an APIError
 */
export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}
