# Logging Strategy with Pino

This document explains the logging strategy for the ChatBot Studio API using Pino.

## Overview

We use **Pino** for logging because it's:
- **Fast**: One of the fastest Node.js loggers
- **Structured**: JSON-based structured logging
- **Production-ready**: Excellent for log aggregation systems
- **Developer-friendly**: Pretty printing in development

## Setup

### 1. Install Dependencies

Already included in package.json:
```json
{
  "pino": "^8.16.2",
  "pino-http": "^8.5.1",
  "pino-pretty": "^10.2.3"
}
```

### 2. Add HTTP Logger to Express App

In your `index.ts` or `app.ts`:

```typescript
import express from 'express';
import { httpLogger, logStartup, logShutdown } from './utils/logger';

const app = express();

// Add HTTP request logging middleware (early in middleware chain)
app.use(httpLogger);

// ... other middleware and routes ...

// Start server
const port = parseInt(process.env.PORT || '3001', 10);
app.listen(port, () => {
  logStartup({
    port,
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logShutdown('SIGTERM received');
  process.exit(0);
});
```

## Usage Examples

### Basic Logging

```typescript
import { logger } from '../utils/logger';

// Info level
logger.info('User registered successfully');

// Debug level (only in development)
logger.debug({ userId: '123', email: 'user@example.com' }, 'User details');

// Warning level
logger.warn({ attempts: 5 }, 'Multiple failed login attempts');

// Error level
logger.error({ error: err }, 'Failed to process payment');
```

### Module-Specific Loggers

```typescript
import { loggers } from '../utils/logger';

// Database operations
loggers.database.info('Connected to database');
loggers.database.error({ error }, 'Database query failed');

// Authentication
loggers.auth.info({ userId }, 'User logged in');
loggers.auth.warn({ ip }, 'Suspicious login attempt');

// Bot operations
loggers.bots.info({ botId }, 'Bot created successfully');

// Chat operations
loggers.chat.info({ conversationId }, 'New message received');

// Analytics
loggers.analytics.info({ metric: 'views', value: 100 }, 'Metrics updated');
```

### Utility Functions

#### 1. Log User Actions (Audit Trail)

```typescript
import { logUserAction } from '../utils/logger';

logUserAction(
  'user-123',
  'CREATE',
  'bot',
  { botId: 'bot-456', name: 'Customer Support Bot' }
);

logUserAction(
  'user-123',
  'DELETE',
  'document',
  { documentId: 'doc-789' }
);
```

#### 2. Log Security Events

```typescript
import { logSecurityEvent } from '../utils/logger';

logSecurityEvent(
  'multiple_failed_logins',
  'high',
  {
    userId: 'user-123',
    ip: '192.168.1.1',
    attempts: 10,
  }
);

logSecurityEvent(
  'password_reset_requested',
  'low',
  { email: 'user@example.com' }
);
```

#### 3. Log External API Calls

```typescript
import { logExternalAPI } from '../utils/logger';

const startTime = Date.now();

try {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    // ...
  });

  logExternalAPI(
    'OpenAI',
    'POST',
    '/v1/chat/completions',
    response.status,
    Date.now() - startTime
  );
} catch (error) {
  logExternalAPI(
    'OpenAI',
    'POST',
    '/v1/chat/completions',
    undefined,
    Date.now() - startTime,
    error
  );
}
```

#### 4. Log Database Queries (Performance)

```typescript
import { logDatabaseQuery } from '../utils/logger';

const startTime = Date.now();

try {
  const users = await prisma.user.findMany();
  logDatabaseQuery('findMany', 'User', Date.now() - startTime);
} catch (error) {
  logDatabaseQuery('findMany', 'User', Date.now() - startTime, error);
}
```

#### 5. Log Performance Metrics

```typescript
import { logPerformance } from '../utils/logger';

const startTime = Date.now();

// ... some operation ...

logPerformance(
  'generate_bot_response',
  Date.now() - startTime,
  {
    botId: 'bot-123',
    messageLength: 150,
    tokensUsed: 450,
  }
);
```

#### 6. Log Business Events

```typescript
import { logBusinessEvent } from '../utils/logger';

logBusinessEvent('subscription_created', {
  userId: 'user-123',
  plan: 'PROFESSIONAL',
  amount: 49.99,
});

logBusinessEvent('bot_published', {
  botId: 'bot-456',
  organizationId: 'org-789',
});
```

#### 7. Log Errors with Context

```typescript
import { logError } from '../utils/logger';

try {
  // ... some operation ...
} catch (error) {
  logError(error as Error, {
    userId: req.user?.userId,
    requestId: req.id,
    url: req.url,
    method: req.method,
    botId: req.params.botId,
  });
  throw error;
}
```

## Logging Levels

Pino supports the following log levels (in order of severity):

- **`trace`** (60): Very detailed debugging information
- **`debug`** (50): Debug information (only in development)
- **`info`** (40): General information (default)
- **`warn`** (50): Warning messages
- **`error`** (60): Error messages
- **`fatal`** (70): Fatal errors that crash the application

Set log level via environment variable:
```bash
LOG_LEVEL=debug npm run dev
```

## Environment-Specific Behavior

### Development
- Pretty-printed, colorized output
- Log level: `debug`
- Shows all logs including debug info
- Human-readable format

### Production
- JSON format (for log aggregation)
- Log level: `info`
- No debug logs
- Structured logging for tools like ELK, Splunk, DataDog

### Test
- Log level: `silent` (no logs during tests)
- Prevents test output pollution

## Integration with Error Handling

Combine logging with the error handling system:

```typescript
import { asyncHandler, NotFoundError } from '../middleware/errors';
import { logError, logUserAction } from '../utils/logger';

router.delete('/bots/:id', asyncHandler(async (req, res) => {
  const bot = await prisma.bot.findUnique({
    where: { id: req.params.id },
  });

  if (!bot) {
    throw new NotFoundError('Bot not found');
  }

  try {
    await prisma.bot.delete({
      where: { id: req.params.id },
    });

    // Log successful action
    logUserAction(
      req.user!.userId,
      'DELETE',
      'bot',
      { botId: req.params.id, name: bot.name }
    );

    res.json({ message: 'Bot deleted successfully' });
  } catch (error) {
    // Log error with context
    logError(error as Error, {
      userId: req.user!.userId,
      botId: req.params.id,
      operation: 'delete_bot',
    });
    throw error;
  }
}));
```

## HTTP Request Logging

The `httpLogger` middleware automatically logs all HTTP requests with:

- Request method, URL, query params
- Response status code
- User information (if authenticated)
- IP address and User-Agent
- Request/response headers
- Request duration

Example log output:

```json
{
  "level": "info",
  "time": "2025-01-15T10:30:00.000Z",
  "msg": "GET /api/v1/bots 200",
  "req": {
    "id": "req-123",
    "method": "GET",
    "url": "/api/v1/bots",
    "query": {},
    "headers": {
      "host": "localhost:3001",
      "user-agent": "Mozilla/5.0"
    }
  },
  "res": {
    "statusCode": 200,
    "headers": {
      "content-type": "application/json"
    }
  },
  "userId": "user-123",
  "userEmail": "user@example.com",
  "ip": "127.0.0.1",
  "responseTime": 45
}
```

## Log Aggregation

In production, logs should be sent to a log aggregation service:

### Option 1: ELK Stack (Elasticsearch, Logstash, Kibana)

```bash
# Pipe logs to Logstash
node dist/index.js | logstash -f logstash.conf
```

### Option 2: Cloud Services

- **DataDog**: Use `pino-datadog` transport
- **Loggly**: Use `pino-loggly` transport
- **CloudWatch**: Use `pino-cloudwatch` transport

Example with DataDog:

```typescript
import pino from 'pino';
import { pinoDatadog } from 'pino-datadog';

const logger = pino({
  // ... other options
}, pinoDatadog({
  apiKey: process.env.DATADOG_API_KEY,
  ddsource: 'nodejs',
  service: 'chatbot-api',
}));
```

## Best Practices

1. **Use structured logging** - Always log objects, not just strings
   ```typescript
   // ❌ Bad
   logger.info(`User ${userId} created bot ${botId}`);

   // ✅ Good
   logger.info({ userId, botId }, 'User created bot');
   ```

2. **Log at appropriate levels**
   - `info`: Normal operations (user actions, API calls)
   - `warn`: Issues that don't break functionality
   - `error`: Errors that require attention
   - `debug`: Detailed debugging information (dev only)

3. **Include context** - Add relevant data to logs
   ```typescript
   logger.info({
     userId,
     botId,
     conversationId,
     messageCount,
   }, 'Conversation started');
   ```

4. **Don't log sensitive data** - Never log passwords, tokens, credit cards
   ```typescript
   // ❌ Bad
   logger.info({ password: req.body.password }, 'Login attempt');

   // ✅ Good
   logger.info({ email: req.body.email }, 'Login attempt');
   ```

5. **Use utility functions** - For consistency and easier analysis
   ```typescript
   // Use logUserAction instead of manual logging
   logUserAction(userId, 'UPDATE', 'bot', { botId, changes });
   ```

6. **Performance logging** - Track slow operations
   ```typescript
   if (duration > 1000) {
     logger.warn({ operation, duration }, 'Slow operation detected');
   }
   ```

## Monitoring and Alerts

Set up alerts for:

- **Error rate spikes**: Monitor `level: "error"` logs
- **Slow operations**: Track `duration` in performance logs
- **Security events**: Alert on `type: "security_event"` with high/critical severity
- **Failed external API calls**: Monitor external API logs with errors
- **Database query performance**: Alert on slow database queries

## Testing with Logs

In tests, logs are silenced by default (`silent` level). To see logs during tests:

```bash
LOG_LEVEL=info npm test
```

Or conditionally log in specific tests:

```typescript
import { logger } from '../utils/logger';

describe('Some test', () => {
  it('should log test info', () => {
    logger.level = 'info'; // Enable logging for this test
    // ... test code ...
  });
});
```

## Migration from Morgan

If you're currently using Morgan:

1. Remove Morgan middleware
2. Add Pino HTTP logger
3. Benefit from structured logging and better performance

Before:
```typescript
import morgan from 'morgan';
app.use(morgan('combined'));
```

After:
```typescript
import { httpLogger } from './utils/logger';
app.use(httpLogger);
```

That's it! Pino provides much more detailed and structured logging.
