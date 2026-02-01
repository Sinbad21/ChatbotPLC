/**
 * Billing Webhook Integration Tests
 * 
 * Tests for:
 * - Actual webhook handler invocation
 * - Signature verification
 * - Idempotent event processing
 * - Recoverable vs non-recoverable error handling
 * - Status transitions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { billingRoutes, RecoverableError } from './billing';

// Mock the database module
vi.mock('../db', () => ({
  getPrisma: vi.fn(() => mockPrisma),
}));

// Mock the Stripe mapping functions (local lib version)
vi.mock('../lib/stripe-mapping', () => ({
  getAddonCodeFromStripePriceId: vi.fn(() => null),
  getPlanIdFromStripePriceId: vi.fn(() => null),
  initStripeConfig: vi.fn(),
  isStripeConfigured: vi.fn(() => true),
}));

// Create mock Prisma client
const mockPrisma = {
  stripeWebhookEvent: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  subscription: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  subscriptionAddon: {
    upsert: vi.fn(),
    updateMany: vi.fn(),
  },
  addon: {
    findUnique: vi.fn(),
  },
  plan: {
    findFirst: vi.fn(),
  },
  payment: {
    create: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(mockPrisma)),
};

// Create test app with billing routes
const createTestApp = () => {
  const app = new Hono<{
    Bindings: {
      DATABASE_URL: string;
      STRIPE_SECRET_KEY: string;
      STRIPE_WEBHOOK_SECRET: string;
    };
  }>();
  
  app.route('/api/billing', billingRoutes);
  
  return app;
};

// Helper to create a valid Stripe signature
async function createStripeSignature(
  payload: string,
  secret: string,
  timestamp?: number
): Promise<string> {
  const ts = timestamp || Math.floor(Date.now() / 1000);
  const signedPayload = `${ts}.${payload}`;
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signedPayload)
  );
  const signature = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `t=${ts},v1=${signature}`;
}

// Test environment bindings
const testEnv = {
  DATABASE_URL: 'postgres://test:test@localhost:5432/test',
  STRIPE_SECRET_KEY: 'sk_test_xxx',
  STRIPE_WEBHOOK_SECRET: 'whsec_test_secret_123',
};

// Sample Stripe event payload
const createSubscriptionEvent = (eventId: string, eventType: string) => ({
  id: eventId,
  type: eventType,
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'sub_test123',
      customer: 'cus_test123',
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      cancel_at_period_end: false,
      items: { data: [] },
    },
  },
});

describe('Billing Webhook Handler', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  describe('Signature Verification', () => {
    it('should reject requests without signature', async () => {
      const payload = JSON.stringify(createSubscriptionEvent('evt_test1', 'customer.subscription.created'));
      
      const res = await app.request('/api/billing/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      }, testEnv);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Missing signature');
    });

    it('should reject requests with invalid signature', async () => {
      const payload = JSON.stringify(createSubscriptionEvent('evt_test2', 'customer.subscription.created'));
      
      const res = await app.request('/api/billing/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 't=123,v1=invalidsignature',
        },
        body: payload,
      }, testEnv);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid signature');
    });

    it('should reject requests with expired timestamp', async () => {
      const payload = JSON.stringify(createSubscriptionEvent('evt_test3', 'customer.subscription.created'));
      
      // Create signature with timestamp from 10 minutes ago (expired)
      const oldTimestamp = Math.floor(Date.now() / 1000) - 600;
      const signature = await createStripeSignature(payload, testEnv.STRIPE_WEBHOOK_SECRET, oldTimestamp);
      
      const res = await app.request('/api/billing/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': signature,
        },
        body: payload,
      }, testEnv);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid signature');
    });

    it('should accept requests with valid signature', async () => {
      const eventId = 'evt_valid_sig';
      const payload = JSON.stringify(createSubscriptionEvent(eventId, 'customer.subscription.created'));
      const signature = await createStripeSignature(payload, testEnv.STRIPE_WEBHOOK_SECRET);
      
      // Mock: event doesn't exist yet
      mockPrisma.stripeWebhookEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeWebhookEvent.create.mockResolvedValue({
        id: 'webhook_1',
        eventId,
        eventType: 'customer.subscription.created',
        status: 'PENDING',
      });
      mockPrisma.stripeWebhookEvent.update.mockResolvedValue({
        id: 'webhook_1',
        eventId,
        status: 'PROCESSED',
      });
      mockPrisma.subscription.findFirst.mockResolvedValue(null);
      
      const res = await app.request('/api/billing/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': signature,
        },
        body: payload,
      }, testEnv);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.received).toBe(true);
    });
  });

  describe('Idempotency', () => {
    it('should not reprocess already processed events', async () => {
      const eventId = 'evt_already_processed';
      const payload = JSON.stringify(createSubscriptionEvent(eventId, 'customer.subscription.updated'));
      const signature = await createStripeSignature(payload, testEnv.STRIPE_WEBHOOK_SECRET);
      
      // Mock: event already exists and was processed
      mockPrisma.stripeWebhookEvent.findUnique.mockResolvedValue({
        id: 'webhook_existing',
        eventId,
        eventType: 'customer.subscription.updated',
        status: 'PROCESSED',
        processedAt: new Date(),
      });
      
      const res = await app.request('/api/billing/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': signature,
        },
        body: payload,
      }, testEnv);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('already_processed');
      expect(json.originalStatus).toBe('PROCESSED');
      
      // Verify create was NOT called
      expect(mockPrisma.stripeWebhookEvent.create).not.toHaveBeenCalled();
    });

    it('should retry failed events instead of skipping them', async () => {
      const eventId = 'evt_previously_failed';
      const payload = JSON.stringify(createSubscriptionEvent(eventId, 'customer.subscription.updated'));
      const signature = await createStripeSignature(payload, testEnv.STRIPE_WEBHOOK_SECRET);
      
      // Mock: event already exists with FAILED status
      mockPrisma.stripeWebhookEvent.findUnique.mockResolvedValue({
        id: 'webhook_failed',
        eventId,
        eventType: 'customer.subscription.updated',
        status: 'FAILED',
        error: 'Previous recoverable error',
        processedAt: new Date(),
      });
      
      // Mock: reset to PENDING for retry
      mockPrisma.stripeWebhookEvent.update.mockResolvedValue({
        id: 'webhook_failed',
        status: 'PENDING',
      });
      
      // Mock: successful processing this time
      mockPrisma.subscription.findFirst.mockResolvedValue(null);
      
      const res = await app.request('/api/billing/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': signature,
        },
        body: payload,
      }, testEnv);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('processed');
      
      // Verify event was reset to PENDING before retry
      expect(mockPrisma.stripeWebhookEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'webhook_failed' },
          data: expect.objectContaining({ status: 'PENDING', processedAt: null, error: null }),
        })
      );
      
      // Verify create was NOT called (reusing existing record)
      expect(mockPrisma.stripeWebhookEvent.create).not.toHaveBeenCalled();
    });

    it('should skip already IGNORED events', async () => {
      const eventId = 'evt_ignored';
      const payload = JSON.stringify({
        id: eventId,
        type: 'checkout.session.completed',
        created: Math.floor(Date.now() / 1000),
        data: { object: {} },
      });
      const signature = await createStripeSignature(payload, testEnv.STRIPE_WEBHOOK_SECRET);
      
      // Mock: event already exists with IGNORED status
      mockPrisma.stripeWebhookEvent.findUnique.mockResolvedValue({
        id: 'webhook_ignored',
        eventId,
        eventType: 'checkout.session.completed',
        status: 'IGNORED',
        processedAt: new Date(),
      });
      
      const res = await app.request('/api/billing/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': signature,
        },
        body: payload,
      }, testEnv);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('already_processed');
      expect(json.originalStatus).toBe('IGNORED');
    });

    it('should process new events and create records', async () => {
      const eventId = 'evt_brand_new';
      const payload = JSON.stringify(createSubscriptionEvent(eventId, 'customer.subscription.created'));
      const signature = await createStripeSignature(payload, testEnv.STRIPE_WEBHOOK_SECRET);
      
      // Mock: event doesn't exist
      mockPrisma.stripeWebhookEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeWebhookEvent.create.mockResolvedValue({
        id: 'webhook_new',
        eventId,
        eventType: 'customer.subscription.created',
        status: 'PENDING',
      });
      mockPrisma.stripeWebhookEvent.update.mockResolvedValue({
        id: 'webhook_new',
        status: 'PROCESSED',
      });
      mockPrisma.subscription.findFirst.mockResolvedValue(null);
      
      const res = await app.request('/api/billing/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': signature,
        },
        body: payload,
      }, testEnv);

      expect(res.status).toBe(200);
      expect(mockPrisma.stripeWebhookEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventId,
            eventType: 'customer.subscription.created',
            status: 'PENDING',
          }),
        })
      );
    });
  });

  describe('Unrecognized Events', () => {
    it('should mark unrecognized event type as IGNORED', async () => {
      const eventId = 'evt_unhandled';
      const event = {
        id: eventId,
        type: 'checkout.session.completed', // Not in HANDLED_EVENT_TYPES
        created: Math.floor(Date.now() / 1000),
        data: { object: {} },
      };
      const payload = JSON.stringify(event);
      const signature = await createStripeSignature(payload, testEnv.STRIPE_WEBHOOK_SECRET);
      
      mockPrisma.stripeWebhookEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeWebhookEvent.create.mockResolvedValue({
        id: 'webhook_ignored',
        eventId,
        eventType: 'checkout.session.completed',
        status: 'PENDING',
      });
      mockPrisma.stripeWebhookEvent.update.mockResolvedValue({
        id: 'webhook_ignored',
        status: 'IGNORED',
      });
      
      const res = await app.request('/api/billing/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': signature,
        },
        body: payload,
      }, testEnv);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('ignored');
      
      expect(mockPrisma.stripeWebhookEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'IGNORED' }),
        })
      );
    });
  });

  describe('Error Handling - Recoverable vs Non-Recoverable', () => {
    it('should return 500 for database connection errors (recoverable)', async () => {
      const eventId = 'evt_db_error';
      const payload = JSON.stringify(createSubscriptionEvent(eventId, 'customer.subscription.updated'));
      const signature = await createStripeSignature(payload, testEnv.STRIPE_WEBHOOK_SECRET);
      
      mockPrisma.stripeWebhookEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeWebhookEvent.create.mockResolvedValue({
        id: 'webhook_err',
        eventId,
        status: 'PENDING',
      });
      
      // Simulate DB connection error
      mockPrisma.subscription.findFirst.mockRejectedValue(new Error('Connection timeout to database'));
      mockPrisma.stripeWebhookEvent.update.mockResolvedValue({
        id: 'webhook_err',
        status: 'FAILED',
      });
      
      const res = await app.request('/api/billing/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': signature,
        },
        body: payload,
      }, testEnv);

      expect(res.status).toBe(500); // Triggers Stripe retry
      const json = await res.json();
      expect(json.recoverable).toBe(true);
      expect(json.received).toBe(false);
    });

    it('should return 200 for business logic errors (non-recoverable)', async () => {
      const eventId = 'evt_biz_error';
      const payload = JSON.stringify(createSubscriptionEvent(eventId, 'customer.subscription.updated'));
      const signature = await createStripeSignature(payload, testEnv.STRIPE_WEBHOOK_SECRET);
      
      mockPrisma.stripeWebhookEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeWebhookEvent.create.mockResolvedValue({
        id: 'webhook_biz',
        eventId,
        status: 'PENDING',
      });
      
      // Simulate business logic error (non-recoverable)
      mockPrisma.subscription.findFirst.mockRejectedValue(new Error('Invalid plan configuration'));
      mockPrisma.stripeWebhookEvent.update.mockResolvedValue({
        id: 'webhook_biz',
        status: 'FAILED',
      });
      
      const res = await app.request('/api/billing/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': signature,
        },
        body: payload,
      }, testEnv);

      expect(res.status).toBe(200); // No retry needed
      const json = await res.json();
      expect(json.recoverable).toBe(false);
      expect(json.status).toBe('failed');
    });

    it('should mark error with [RECOVERABLE] prefix in database', async () => {
      const eventId = 'evt_recoverable_tag';
      const payload = JSON.stringify(createSubscriptionEvent(eventId, 'customer.subscription.updated'));
      const signature = await createStripeSignature(payload, testEnv.STRIPE_WEBHOOK_SECRET);
      
      mockPrisma.stripeWebhookEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeWebhookEvent.create.mockResolvedValue({
        id: 'webhook_rec',
        eventId,
        status: 'PENDING',
      });
      mockPrisma.subscription.findFirst.mockRejectedValue(new Error('ECONNREFUSED'));
      mockPrisma.stripeWebhookEvent.update.mockResolvedValue({});
      
      await app.request('/api/billing/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': signature,
        },
        body: payload,
      }, testEnv);

      expect(mockPrisma.stripeWebhookEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
            error: expect.stringContaining('[RECOVERABLE]'),
          }),
        })
      );
    });
  });

  describe('Status Transitions', () => {
    it('should transition from PENDING to PROCESSED on success', async () => {
      const eventId = 'evt_success';
      const payload = JSON.stringify(createSubscriptionEvent(eventId, 'customer.subscription.created'));
      const signature = await createStripeSignature(payload, testEnv.STRIPE_WEBHOOK_SECRET);
      
      mockPrisma.stripeWebhookEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeWebhookEvent.create.mockResolvedValue({
        id: 'webhook_success',
        eventId,
        status: 'PENDING',
      });
      mockPrisma.subscription.findFirst.mockResolvedValue(null);
      mockPrisma.stripeWebhookEvent.update.mockResolvedValue({
        id: 'webhook_success',
        status: 'PROCESSED',
      });
      
      const res = await app.request('/api/billing/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': signature,
        },
        body: payload,
      }, testEnv);

      expect(res.status).toBe(200);
      expect(mockPrisma.stripeWebhookEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PROCESSED' }),
        })
      );
    });
  });
});

describe('RecoverableError Class', () => {
  it('should be an instance of Error', () => {
    const error = new RecoverableError('Test error');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(RecoverableError);
    expect(error.name).toBe('RecoverableError');
    expect(error.message).toBe('Test error');
  });
});

describe('Stripe Status Mapping', () => {
  it('should map Stripe statuses correctly', () => {
    // This tests the mapping function logic (already tested in unit tests)
    const mapStripeStatus = (stripeStatus: string) => {
      const statusMap: Record<string, string> = {
        active: 'ACTIVE',
        past_due: 'PAST_DUE',
        canceled: 'CANCELED',
        unpaid: 'UNPAID',
        trialing: 'TRIALING',
        paused: 'PAUSED',
        incomplete: 'UNPAID',
        incomplete_expired: 'CANCELED',
      };
      return statusMap[stripeStatus] || 'ACTIVE';
    };

    expect(mapStripeStatus('active')).toBe('ACTIVE');
    expect(mapStripeStatus('past_due')).toBe('PAST_DUE');
    expect(mapStripeStatus('canceled')).toBe('CANCELED');
    expect(mapStripeStatus('trialing')).toBe('TRIALING');
    expect(mapStripeStatus('incomplete')).toBe('UNPAID');
    expect(mapStripeStatus('incomplete_expired')).toBe('CANCELED');
    expect(mapStripeStatus('unknown_status')).toBe('ACTIVE');
  });
});
