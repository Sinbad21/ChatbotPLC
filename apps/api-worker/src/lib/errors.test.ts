import { describe, it, expect } from 'vitest';
import {
  APIError,
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  InvalidTokenError,
  ForbiddenError,
  PlanRequiredError,
  NotFoundError,
  ConflictError,
  DuplicateError,
  UnprocessableError,
  RateLimitError,
  InternalError,
  ExternalServiceError,
  ServiceUnavailableError,
  fromPrismaError,
  fromZodError,
  isAPIError,
} from './errors';

describe('API Error Classes', () => {
  describe('APIError base class', () => {
    it('should create error with default values', () => {
      const error = new APIError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(true);
    });

    it('should create error with custom values', () => {
      const error = new APIError('Custom error', 418, 'TEAPOT', { teapot: true });
      expect(error.statusCode).toBe(418);
      expect(error.code).toBe('TEAPOT');
      expect(error.details).toEqual({ teapot: true });
    });

    it('should serialize to JSON correctly', () => {
      const error = new APIError('Test', 400, 'TEST_CODE', { foo: 'bar' });
      const json = error.toJSON();
      expect(json.error.code).toBe('TEST_CODE');
      expect(json.error.message).toBe('Test');
      expect(json.error.details).toEqual({ foo: 'bar' });
      expect(json.statusCode).toBe(400);
    });
  });

  describe('BadRequestError', () => {
    it('should have 400 status code', () => {
      const error = new BadRequestError('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
    });
  });

  describe('ValidationError', () => {
    it('should have 400 status code and VALIDATION_ERROR code', () => {
      const error = new ValidationError('Field invalid', { field: 'email' });
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'email' });
    });
  });

  describe('UnauthorizedError', () => {
    it('should have 401 status code', () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe('Authentication required');
    });
  });

  describe('InvalidTokenError', () => {
    it('should have 401 status code and INVALID_TOKEN code', () => {
      const error = new InvalidTokenError();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('ForbiddenError', () => {
    it('should have 403 status code', () => {
      const error = new ForbiddenError('Not allowed');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });
  });

  describe('PlanRequiredError', () => {
    it('should have 403 status code and upgrade flag', () => {
      const error = new PlanRequiredError('Enterprise', 'API access');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('PLAN_REQUIRED');
      expect(error.details?.requiredPlan).toBe('Enterprise');
      expect(error.details?.upgrade).toBe(true);
    });
  });

  describe('NotFoundError', () => {
    it('should have 404 status code', () => {
      const error = new NotFoundError('User');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('User not found');
    });
  });

  describe('ConflictError', () => {
    it('should have 409 status code', () => {
      const error = new ConflictError('Resource already exists');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });
  });

  describe('DuplicateError', () => {
    it('should have 409 status code and field info', () => {
      const error = new DuplicateError('email');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('DUPLICATE');
      expect(error.message).toBe('email already exists');
      expect(error.details?.field).toBe('email');
    });
  });

  describe('UnprocessableError', () => {
    it('should have 422 status code', () => {
      const error = new UnprocessableError('Cannot process request');
      expect(error.statusCode).toBe(422);
      expect(error.code).toBe('UNPROCESSABLE_ENTITY');
    });
  });

  describe('RateLimitError', () => {
    it('should have 429 status code', () => {
      const error = new RateLimitError(60);
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.details?.retryAfter).toBe(60);
    });
  });

  describe('InternalError', () => {
    it('should have 500 status code', () => {
      const error = new InternalError('Something went wrong');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('ExternalServiceError', () => {
    it('should have 502 status code', () => {
      const error = new ExternalServiceError('Stripe');
      expect(error.statusCode).toBe(502);
      expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
      expect(error.message).toContain('Stripe');
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should have 503 status code', () => {
      const error = new ServiceUnavailableError();
      expect(error.statusCode).toBe(503);
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
    });
  });
});

describe('Error Converters', () => {
  describe('fromPrismaError', () => {
    it('should convert P2002 to DuplicateError', () => {
      const prismaError = { code: 'P2002', meta: { target: ['email'] } };
      const apiError = fromPrismaError(prismaError);
      expect(apiError.statusCode).toBe(409);
      expect(apiError.code).toBe('DUPLICATE');
    });

    it('should convert P2003 to ConflictError', () => {
      const prismaError = { code: 'P2003' };
      const apiError = fromPrismaError(prismaError);
      expect(apiError.statusCode).toBe(409);
      expect(apiError.code).toBe('CONFLICT');
    });

    it('should convert P2025 to NotFoundError', () => {
      const prismaError = { code: 'P2025' };
      const apiError = fromPrismaError(prismaError);
      expect(apiError.statusCode).toBe(404);
      expect(apiError.code).toBe('NOT_FOUND');
    });

    it('should convert P2024 to ServiceUnavailableError', () => {
      const prismaError = { code: 'P2024' };
      const apiError = fromPrismaError(prismaError);
      expect(apiError.statusCode).toBe(503);
      expect(apiError.code).toBe('SERVICE_UNAVAILABLE');
    });

    it('should convert unknown P20xx to BadRequestError', () => {
      const prismaError = { code: 'P2099' };
      const apiError = fromPrismaError(prismaError);
      expect(apiError.statusCode).toBe(400);
      expect(apiError.code).toBe('BAD_REQUEST');
    });

    it('should convert unknown errors to InternalError', () => {
      const prismaError = { code: 'UNKNOWN' };
      const apiError = fromPrismaError(prismaError);
      expect(apiError.statusCode).toBe(500);
      expect(apiError.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('fromZodError', () => {
    it('should convert Zod issues to ValidationError', () => {
      const zodError = {
        issues: [
          { path: ['email'], message: 'Invalid email format' },
          { path: ['password'], message: 'Must be at least 8 characters' },
        ],
      };
      const apiError = fromZodError(zodError);
      expect(apiError.statusCode).toBe(400);
      expect(apiError.code).toBe('VALIDATION_ERROR');
      expect(apiError.details?.fields?.email).toContain('Invalid email format');
      expect(apiError.details?.fields?.password).toContain('Must be at least 8 characters');
    });

    it('should handle nested paths', () => {
      const zodError = {
        issues: [
          { path: ['address', 'city'], message: 'Required' },
        ],
      };
      const apiError = fromZodError(zodError);
      expect(apiError.details?.fields?.['address.city']).toContain('Required');
    });
  });

  describe('isAPIError', () => {
    it('should return true for APIError instances', () => {
      expect(isAPIError(new APIError('test'))).toBe(true);
      expect(isAPIError(new NotFoundError('User'))).toBe(true);
      expect(isAPIError(new ValidationError('Invalid'))).toBe(true);
    });

    it('should return false for non-APIError', () => {
      expect(isAPIError(new Error('test'))).toBe(false);
      expect(isAPIError('string error')).toBe(false);
      expect(isAPIError(null)).toBe(false);
      expect(isAPIError(undefined)).toBe(false);
    });
  });
});
