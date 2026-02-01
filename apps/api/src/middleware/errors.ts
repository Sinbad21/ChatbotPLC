import { Request, Response, NextFunction } from 'express';

/**
 * Custom error classes for different types of errors
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: any[];

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', errors?: any[]) {
    super(message, 400, true, errors);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, true);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, true);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, true);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', errors: any[]) {
    super(message, 422, true, errors);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, true);
    Object.setPrototypeOf(this, TooManyRequestsError.prototype);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, false);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * Error response formatter
 */
interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  errors?: any[];
  stack?: string;
  timestamp: string;
  path: string;
}

function formatErrorResponse(
  error: AppError | Error,
  req: Request
): ErrorResponse {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (error instanceof AppError) {
    return {
      error: error.name,
      message: error.message,
      statusCode: error.statusCode,
      ...(error.errors && { errors: error.errors }),
      ...(isDevelopment && { stack: error.stack }),
      timestamp: new Date().toISOString(),
      path: req.path,
    };
  }

  // For unexpected errors
  return {
    error: 'InternalServerError',
    message: isDevelopment ? error.message : 'An unexpected error occurred',
    statusCode: 500,
    ...(isDevelopment && { stack: error.stack }),
    timestamp: new Date().toISOString(),
    path: req.path,
  };
}

/**
 * Global error handling middleware
 * Should be registered LAST in the middleware chain
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error for monitoring
  console.error('Error occurred:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Determine status code
  const statusCode = error instanceof AppError ? error.statusCode : 500;

  // Format and send error response
  const errorResponse = formatErrorResponse(error, req);

  res.status(statusCode).json(errorResponse);
}

/**
 * Handle 404 errors for undefined routes
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const error = new NotFoundError(`Route ${req.method} ${req.path} not found`);
  next(error);
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error middleware
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation error handler for express-validator
 */
export function handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  next();
}

/**
 * Database error handler
 * Converts Prisma errors to AppErrors
 */
export function handleDatabaseError(error: any): AppError {
  // Prisma unique constraint violation
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'field';
    return new ConflictError(`${field} already exists`);
  }

  // Prisma record not found
  if (error.code === 'P2025') {
    return new NotFoundError('Record not found');
  }

  // Prisma foreign key constraint violation
  if (error.code === 'P2003') {
    return new BadRequestError('Invalid reference to related record');
  }

  // Prisma connection error
  if (error.code === 'P1001' || error.code === 'P1002') {
    return new InternalServerError('Database connection error');
  }

  // Generic database error
  return new InternalServerError('Database operation failed');
}

/**
 * JWT error handler
 * Converts JWT errors to AppErrors
 */
export function handleJWTError(error: any): AppError {
  if (error.name === 'JsonWebTokenError') {
    return new UnauthorizedError('Invalid token');
  }

  if (error.name === 'TokenExpiredError') {
    return new UnauthorizedError('Token expired');
  }

  if (error.name === 'NotBeforeError') {
    return new UnauthorizedError('Token not active');
  }

  return new UnauthorizedError('Authentication failed');
}

/**
 * Multer error handler
 * Converts file upload errors to AppErrors
 */
export function handleMulterError(error: any): AppError {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new BadRequestError('File too large');
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return new BadRequestError('Too many files');
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new BadRequestError('Unexpected file field');
  }

  return new BadRequestError('File upload failed');
}

/**
 * Error recovery helper
 * Determines if error is operational (expected) or programmer error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Graceful shutdown on unhandled errors
 */
export function setupErrorHandlers(): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error(error.name, error.message);
    console.error(error.stack);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any) => {
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error(reason);
    process.exit(1);
  });

  // Handle SIGTERM
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
  });
}
