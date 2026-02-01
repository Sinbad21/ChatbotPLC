/**
 * Rate Limiting Middleware
 * Prevents spam bookings from the same IP address
 * Supports both in-memory (dev) and Cloudflare KV (production) storage
 */

import type { Context, Next } from 'hono';

// In-memory store for rate limiting (fallback when KV not available)
const ipBookingAttempts = new Map<string, { count: number; resetAt: number }>();

// Cloudflare KV namespace interface
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Lazy cleanup of expired entries (called when getting data)
 * Note: setInterval is not allowed in Cloudflare Workers global scope
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [ip, data] of ipBookingAttempts.entries()) {
    if (now > data.resetAt) {
      ipBookingAttempts.delete(ip);
    }
  }
}

interface RateLimitConfig {
  maxAttempts: number; // Maximum booking attempts
  windowMs: number;    // Time window in milliseconds
  message?: string;    // Custom error message
}

const defaultConfig: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Troppi tentativi di prenotazione. Riprova tra un\'ora.',
};

/**
 * Get client IP address from request
 */
function getClientIP(c: Context): string {
  // Try various headers used by proxies/load balancers
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list
    return forwarded.split(',')[0].trim();
  }

  const realIP = c.req.header('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = c.req.header('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback (this won't work well on Cloudflare Workers)
  return 'unknown';
}

/**
 * Storage abstraction layer - uses KV if available, falls back to in-memory
 */
async function getRateLimitData(
  ip: string,
  kv?: KVNamespace
): Promise<{ count: number; resetAt: number } | null> {
  if (kv) {
    try {
      const data = await kv.get(`rate_limit:${ip}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('KV get error:', error);
      // Fall back to in-memory
      cleanupExpiredEntries(); // Lazy cleanup
      return ipBookingAttempts.get(ip) || null;
    }
  }
  // Perform lazy cleanup of in-memory store
  cleanupExpiredEntries();
  return ipBookingAttempts.get(ip) || null;
}

async function setRateLimitData(
  ip: string,
  data: { count: number; resetAt: number },
  kv?: KVNamespace
): Promise<void> {
  if (kv) {
    try {
      const ttl = Math.ceil((data.resetAt - Date.now()) / 1000);
      await kv.put(`rate_limit:${ip}`, JSON.stringify(data), { expirationTtl: ttl });
    } catch (error) {
      console.error('KV put error:', error);
      // Fall back to in-memory
      ipBookingAttempts.set(ip, data);
    }
  } else {
    ipBookingAttempts.set(ip, data);
  }
}

/**
 * Rate limit middleware for booking endpoints
 */
export function rateLimitBooking(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };

  return async (c: Context, next: Next) => {
    const ip = getClientIP(c);

    // Try to get Cloudflare KV namespace from context (if bound in wrangler.toml)
    const kv = (c.env as any)?.RATE_LIMIT_KV as KVNamespace | undefined;

    if (ip === 'unknown') {
      // If we can't determine IP, allow the request but log it
      console.warn('Rate limit: Unable to determine client IP');
      return next();
    }

    const now = Date.now();
    const existing = await getRateLimitData(ip, kv);

    if (existing) {
      if (now > existing.resetAt) {
        // Window has expired, reset counter
        await setRateLimitData(ip, {
          count: 1,
          resetAt: now + finalConfig.windowMs,
        }, kv);
        return next();
      } else {
        // Window is still active
        if (existing.count >= finalConfig.maxAttempts) {
          // Rate limit exceeded
          const retryAfter = Math.ceil((existing.resetAt - now) / 1000); // seconds

          return c.json(
            {
              error: finalConfig.message,
              retryAfter,
            },
            429,
            {
              'Retry-After': retryAfter.toString(),
              'X-RateLimit-Limit': finalConfig.maxAttempts.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': existing.resetAt.toString(),
            }
          );
        } else {
          // Increment counter
          existing.count++;
          await setRateLimitData(ip, existing, kv);
          const remaining = finalConfig.maxAttempts - existing.count;

          // Add rate limit headers
          c.header('X-RateLimit-Limit', finalConfig.maxAttempts.toString());
          c.header('X-RateLimit-Remaining', remaining.toString());
          c.header('X-RateLimit-Reset', existing.resetAt.toString());

          return next();
        }
      }
    } else {
      // First attempt from this IP
      await setRateLimitData(ip, {
        count: 1,
        resetAt: now + finalConfig.windowMs,
      }, kv);

      // Add rate limit headers
      c.header('X-RateLimit-Limit', finalConfig.maxAttempts.toString());
      c.header('X-RateLimit-Remaining', (finalConfig.maxAttempts - 1).toString());
      c.header('X-RateLimit-Reset', (now + finalConfig.windowMs).toString());

      return next();
    }
  };
}

/**
 * Get current rate limit status for an IP
 */
export function getRateLimitStatus(ip: string): {
  attempts: number;
  remaining: number;
  resetAt: number;
} | null {
  const existing = ipBookingAttempts.get(ip);
  if (!existing) {
    return null;
  }

  return {
    attempts: existing.count,
    remaining: Math.max(0, defaultConfig.maxAttempts - existing.count),
    resetAt: existing.resetAt,
  };
}

/**
 * Clear rate limit for a specific IP (useful for testing or admin override)
 */
export function clearRateLimit(ip: string): void {
  ipBookingAttempts.delete(ip);
}

/**
 * Clear all rate limits (useful for testing)
 */
export function clearAllRateLimits(): void {
  ipBookingAttempts.clear();
}
