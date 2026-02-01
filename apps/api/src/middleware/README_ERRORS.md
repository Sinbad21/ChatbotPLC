# Error Handling System

This document explains how to use the comprehensive error handling system in the ChatBot Studio API.

## Overview

The error handling system provides:
- **Custom error classes** for different HTTP status codes
- **Automatic error formatting** with consistent response structure
- **Database error handling** for Prisma errors
- **JWT error handling** for authentication errors
- **File upload error handling** for Multer errors
- **Async error wrapper** to eliminate try-catch boilerplate

## Usage

### 1. Import Error Classes

```typescript
import {
  asyncHandler,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  ValidationError,
  handleDatabaseError,
  handleJWTError,
} from '../middleware/errors';
```

### 2. Use asyncHandler for Async Routes

Instead of wrapping routes in try-catch blocks, use `asyncHandler`:

```typescript
// ❌ Old way (verbose)
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// ✅ New way (clean)
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json(user);
}));
```

### 3. Throw Appropriate Errors

Use the custom error classes to throw specific errors:

```typescript
// 400 Bad Request
if (!req.body.email) {
  throw new BadRequestError('Email is required');
}

// 401 Unauthorized
if (!token) {
  throw new UnauthorizedError('No token provided');
}

// 403 Forbidden
if (user.role !== 'ADMIN') {
  throw new ForbiddenError('Admin access required');
}

// 404 Not Found
if (!resource) {
  throw new NotFoundError('Resource not found');
}

// 409 Conflict
if (existingUser) {
  throw new ConflictError('User already exists');
}

// 422 Validation Error
const errors = validationResult(req);
if (!errors.isEmpty()) {
  throw new ValidationError('Validation failed', errors.array());
}
```

### 4. Handle Database Errors

Catch Prisma errors and convert them to AppErrors:

```typescript
router.post('/users', asyncHandler(async (req, res) => {
  try {
    const user = await prisma.user.create({
      data: req.body,
    });
    res.status(201).json(user);
  } catch (error) {
    // Convert Prisma errors to AppErrors
    throw handleDatabaseError(error);
  }
}));
```

### 5. Handle JWT Errors

```typescript
import { verifyAccessToken } from '@chatbot-studio/auth';

router.get('/protected', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedError('No token provided');
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
  } catch (error) {
    throw handleJWTError(error);
  }

  res.json({ message: 'Protected resource' });
}));
```

## Error Response Format

All errors return a consistent JSON structure:

```json
{
  "error": "NotFoundError",
  "message": "User not found",
  "statusCode": 404,
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/api/v1/users/123",
  "stack": "Error: User not found\n    at ..." // Only in development
}
```

For validation errors, an `errors` array is included:

```json
{
  "error": "ValidationError",
  "message": "Validation failed",
  "statusCode": 422,
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password too weak"
    }
  ],
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/api/v1/auth/register"
}
```

## Setup in Express App

Add error handlers to your Express app (in `index.ts`):

```typescript
import express from 'express';
import {
  errorHandler,
  notFoundHandler,
  setupErrorHandlers,
} from './middleware/errors';

const app = express();

// ... your routes ...

// 404 handler (before global error handler)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Setup process-level error handlers
setupErrorHandlers();

export default app;
```

## Available Error Classes

| Class | Status Code | Use Case |
|-------|-------------|----------|
| `BadRequestError` | 400 | Invalid request data |
| `UnauthorizedError` | 401 | Missing or invalid authentication |
| `ForbiddenError` | 403 | Insufficient permissions |
| `NotFoundError` | 404 | Resource doesn't exist |
| `ConflictError` | 409 | Resource already exists |
| `ValidationError` | 422 | Input validation failed |
| `TooManyRequestsError` | 429 | Rate limit exceeded |
| `InternalServerError` | 500 | Unexpected server error |

## Best Practices

1. **Always use asyncHandler** for async routes to avoid try-catch boilerplate
2. **Throw specific errors** instead of generic ones
3. **Convert third-party errors** to AppErrors using helper functions
4. **Log errors** are automatically logged by the error handler
5. **Don't expose sensitive info** in production error messages
6. **Use validation middleware** for request validation
7. **Handle operational errors** gracefully without crashing the server

## Testing Error Handling

Example tests:

```typescript
import request from 'supertest';
import app from './app';

describe('Error Handling', () => {
  it('should return 404 for non-existent route', async () => {
    const response = await request(app)
      .get('/api/v1/nonexistent')
      .expect(404);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('NotFoundError');
  });

  it('should return 401 for missing token', async () => {
    const response = await request(app)
      .get('/api/v1/protected')
      .expect(401);

    expect(response.body.message).toContain('token');
  });
});
```

## Migration Guide

To migrate existing routes:

1. Import `asyncHandler` and error classes
2. Wrap async routes with `asyncHandler`
3. Replace `res.status().json({ error: ... })` with `throw new ErrorClass()`
4. Remove try-catch blocks (asyncHandler handles them)
5. Use error helper functions for third-party errors

Before:
```typescript
router.post('/bots', async (req, res) => {
  try {
    const bot = await prisma.bot.create({ data: req.body });
    res.json(bot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

After:
```typescript
router.post('/bots', asyncHandler(async (req, res) => {
  const bot = await prisma.bot.create({ data: req.body });
  res.json(bot);
}));
```

The error handling middleware will automatically catch any errors!
