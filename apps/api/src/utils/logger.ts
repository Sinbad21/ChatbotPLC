import pino from 'pino';
import pinoHttp from 'pino-http';

/**
 * Logger configuration based on environment
 */
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

/**
 * Pretty print configuration for development
 */
const prettyPrintOptions = isDevelopment
  ? {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          singleLine: false,
          messageFormat: '{levelLabel} - {msg}',
        },
      },
    }
  : {};

/**
 * Main logger instance
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : isTest ? 'silent' : 'info'),
  formatters: {
    level: (label) => {
      return { level: label };
    },
    bindings: (bindings) => {
      return {
        pid: bindings.pid,
        host: bindings.hostname,
        node_version: process.version,
      };
    },
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  ...prettyPrintOptions,
});

/**
 * HTTP request logger middleware
 */
export const httpLogger = pinoHttp({
  logger,
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    if (res.statusCode >= 300) return 'info';
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
  },
  customProps: (req, res) => ({
    userId: (req as any).user?.userId,
    userEmail: (req as any).user?.email,
    ip: (req as any).ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  }),
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
      headers: {
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: {
        'content-type': res.getHeader('content-type'),
        'content-length': res.getHeader('content-length'),
      },
    }),
  },
  // Don't log health check endpoints in production
  autoLogging: {
    ignore: (req) => {
      if (isProduction && req.url === '/health') return true;
      if (isProduction && req.url === '/metrics') return true;
      return false;
    },
  },
});

/**
 * Child logger creators for different modules
 */
export const createModuleLogger = (module: string) => {
  return logger.child({ module });
};

export const createServiceLogger = (service: string) => {
  return logger.child({ service });
};

/**
 * Log formatters for structured logging
 */
export const loggers = {
  // Database operations
  database: createModuleLogger('database'),

  // Authentication
  auth: createModuleLogger('auth'),

  // Bot operations
  bots: createModuleLogger('bots'),

  // Chat operations
  chat: createModuleLogger('chat'),

  // Document processing
  documents: createModuleLogger('documents'),

  // Analytics
  analytics: createModuleLogger('analytics'),

  // Email service
  email: createServiceLogger('email'),

  // External API calls
  external: createServiceLogger('external'),
};

/**
 * Utility logging functions
 */

// Log user actions (for audit trail)
export function logUserAction(
  userId: string,
  action: string,
  resource: string,
  details?: any
): void {
  logger.info({
    type: 'user_action',
    userId,
    action,
    resource,
    details,
  }, `User ${userId} performed ${action} on ${resource}`);
}

// Log security events
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: any
): void {
  const logFn = severity === 'critical' || severity === 'high' ? logger.error : logger.warn;

  logFn({
    type: 'security_event',
    event,
    severity,
    details,
  }, `Security event: ${event}`);
}

// Log API calls to external services
export function logExternalAPI(
  service: string,
  method: string,
  url: string,
  statusCode?: number,
  duration?: number,
  error?: any
): void {
  if (error) {
    loggers.external.error({
      service,
      method,
      url,
      error: error.message || error,
      statusCode,
      duration,
    }, `External API error: ${service}`);
  } else {
    loggers.external.info({
      service,
      method,
      url,
      statusCode,
      duration,
    }, `External API call: ${service}`);
  }
}

// Log database queries (for performance monitoring)
export function logDatabaseQuery(
  operation: string,
  model: string,
  duration: number,
  error?: any
): void {
  if (error) {
    loggers.database.error({
      operation,
      model,
      duration,
      error: error.message || error,
    }, `Database error: ${operation} on ${model}`);
  } else {
    if (duration > 1000) {
      loggers.database.warn({
        operation,
        model,
        duration,
      }, `Slow database query: ${operation} on ${model} took ${duration}ms`);
    } else {
      loggers.database.debug({
        operation,
        model,
        duration,
      }, `Database query: ${operation} on ${model}`);
    }
  }
}

// Log performance metrics
export function logPerformance(
  operation: string,
  duration: number,
  metadata?: any
): void {
  logger.info({
    type: 'performance',
    operation,
    duration,
    ...metadata,
  }, `Performance: ${operation} took ${duration}ms`);
}

// Log business events
export function logBusinessEvent(
  event: string,
  data: any
): void {
  logger.info({
    type: 'business_event',
    event,
    data,
  }, `Business event: ${event}`);
}

/**
 * Error logging with context
 */
export function logError(
  error: Error,
  context?: {
    userId?: string;
    requestId?: string;
    url?: string;
    method?: string;
    [key: string]: any;
  }
): void {
  logger.error({
    type: 'error',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
  }, `Error occurred: ${error.message}`);
}

/**
 * Startup/shutdown logging
 */
export function logStartup(config: {
  port: number;
  environment: string;
  version?: string;
}): void {
  logger.info({
    type: 'startup',
    ...config,
  }, `Server started on port ${config.port} (${config.environment})`);
}

export function logShutdown(reason?: string): void {
  logger.info({
    type: 'shutdown',
    reason,
  }, `Server shutting down${reason ? `: ${reason}` : ''}`);
}

/**
 * Development helpers
 */
export function logDebug(message: string, data?: any): void {
  if (isDevelopment) {
    logger.debug(data || {}, message);
  }
}

export default logger;
