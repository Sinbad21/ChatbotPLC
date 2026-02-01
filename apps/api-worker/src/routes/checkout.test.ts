/**
 * Checkout & Portal Integration Tests
 * 
 * Tests for:
 * - Plan/addon code validation
 * - Line items creation with quantity
 * - Portal 409 when no customer exists
 * - Auth: non-admin cannot create sessions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { checkoutRoutes, CheckoutRequestSchema, PortalRequestSchema } from './checkout';

// Mock the database module
vi.mock('../db', () => ({
  getPrisma: vi.fn(() => mockPrisma),
}));

// Mock Stripe SDK with a class that returns mockStripe
vi.mock('stripe', () => {
  return {
    default: class MockStripe {
      constructor() {
        return mockStripe;
      }
    },
  };
});

// Mock the Stripe mapping functions (local lib version)
vi.mock('../lib/stripe-mapping', () => ({
  initStripeConfig: vi.fn(),
  getStripePriceIdForPlan: vi.fn((planCode: string, interval: string) => {
    const prices: Record<string, string> = {
      'starter-monthly': 'price_starter_monthly',
      'starter-yearly': 'price_starter_yearly',
      'professional-monthly': 'price_professional_monthly',
      'enterprise-monthly': 'price_enterprise_monthly',
    };
    return prices[`${planCode}-${interval}`] || null;
  }),
  getStripePriceIdForAddon: vi.fn((addonCode: string, interval: string) => {
    const prices: Record<string, string> = {
      'white-label-monthly': 'price_white_label_monthly',
      'extra-bot-slots-monthly': 'price_extra_bot_monthly',
    };
    return prices[`${addonCode}-${interval}`] || null;
  }),
  getPlanToStripe: vi.fn(() => ({
    free: { planId: 'free', planName: 'Free' },
    starter: { planId: 'starter', planName: 'Starter' },
    professional: { planId: 'professional', planName: 'Professional' },
    enterprise: { planId: 'enterprise', planName: 'Enterprise' },
  })),
  getAddonToStripe: vi.fn(() => ({
    'white-label': { addonCode: 'white-label', addonName: 'White Label' },
    'extra-bot-slots': { addonCode: 'extra-bot-slots', addonName: 'Extra Bot Slots' },
  })),
}));

// Create mock Prisma client
const mockPrisma = {
  organizationMember: {
    findUnique: vi.fn(),
  },
  organization: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
  subscription: {
    findFirst: vi.fn(),
  },
  userAddon: {
    findMany: vi.fn(),
  },
};

// Create mock Stripe client
const mockStripe = {
  customers: {
    create: vi.fn(),
  },
  checkout: {
    sessions: {
      create: vi.fn(),
    },
  },
  billingPortal: {
    sessions: {
      create: vi.fn(),
    },
  },
};

// Test environment bindings
const testEnv = {
  DATABASE_URL: 'postgres://test:test@localhost:5432/test',
  JWT_SECRET: 'test-secret',
  STRIPE_SECRET_KEY: 'sk_test_xxx',
  APP_URL: 'https://app.test.com',
};

// Create test app with checkout routes
const createTestApp = () => {
  const app = new Hono<{
    Bindings: typeof testEnv;
    Variables: { user: { userId: string; email: string } };
  }>();
  
  // Mock auth middleware - sets user
  app.use('*', async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (authHeader === 'Bearer admin-token') {
      c.set('user', { userId: 'user_admin', email: 'admin@test.com' });
    } else if (authHeader === 'Bearer member-token') {
      c.set('user', { userId: 'user_member', email: 'member@test.com' });
    } else if (authHeader === 'Bearer viewer-token') {
      c.set('user', { userId: 'user_viewer', email: 'viewer@test.com' });
    } else {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
  });
  
  app.route('/api/billing', checkoutRoutes);
  
  return app;
};

describe('Zod Schema Validation', () => {
  describe('CheckoutRequestSchema', () => {
    it('should validate valid checkout request', () => {
      const result = CheckoutRequestSchema.safeParse({
        workspaceId: 'ws_123',
        planCode: 'starter',
        interval: 'monthly',
        addons: [{ addonCode: 'white-label', quantity: 1 }],
      });
      
      expect(result.success).toBe(true);
    });

    it('should reject empty workspaceId', () => {
      const result = CheckoutRequestSchema.safeParse({
        workspaceId: '',
        planCode: 'starter',
      });
      
      expect(result.success).toBe(false);
    });

    it('should default interval to monthly', () => {
      const result = CheckoutRequestSchema.safeParse({
        workspaceId: 'ws_123',
        planCode: 'starter',
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.interval).toBe('monthly');
      }
    });

    it('should default addons to empty array', () => {
      const result = CheckoutRequestSchema.safeParse({
        workspaceId: 'ws_123',
        planCode: 'starter',
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.addons).toEqual([]);
      }
    });
  });

  describe('PortalRequestSchema', () => {
    it('should validate valid portal request', () => {
      const result = PortalRequestSchema.safeParse({
        workspaceId: 'ws_123',
      });
      
      expect(result.success).toBe(true);
    });

    it('should reject empty workspaceId', () => {
      const result = PortalRequestSchema.safeParse({
        workspaceId: '',
      });
      
      expect(result.success).toBe(false);
    });
  });
});

describe('POST /api/billing/checkout', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  describe('Authorization', () => {
    it('should reject non-members', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);
      
      const res = await app.request('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token',
        },
        body: JSON.stringify({
          workspaceId: 'ws_123',
          planCode: 'starter',
        }),
      }, testEnv);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('Not a member');
    });

    it('should reject MEMBER role (non-admin)', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        role: 'MEMBER',
      });
      
      const res = await app.request('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer member-token',
        },
        body: JSON.stringify({
          workspaceId: 'ws_123',
          planCode: 'starter',
        }),
      }, testEnv);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('Insufficient permissions');
    });

    it('should reject VIEWER role', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        role: 'VIEWER',
      });
      
      const res = await app.request('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer viewer-token',
        },
        body: JSON.stringify({
          workspaceId: 'ws_123',
          planCode: 'starter',
        }),
      }, testEnv);

      expect(res.status).toBe(403);
    });

    it('should allow ADMIN role', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'ADMIN' });
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'ws_123',
        name: 'Test Org',
        stripeCustomerId: 'cus_existing',
      });
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test',
        url: 'https://checkout.stripe.com/test',
      });
      mockPrisma.auditLog.create.mockResolvedValue({});
      
      const res = await app.request('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token',
        },
        body: JSON.stringify({
          workspaceId: 'ws_123',
          planCode: 'starter',
        }),
      }, testEnv);

      expect(res.status).toBe(200);
    });

    it('should allow OWNER role', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'OWNER' });
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'ws_123',
        name: 'Test Org',
        stripeCustomerId: 'cus_existing',
      });
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test',
        url: 'https://checkout.stripe.com/test',
      });
      mockPrisma.auditLog.create.mockResolvedValue({});
      
      const res = await app.request('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token',
        },
        body: JSON.stringify({
          workspaceId: 'ws_123',
          planCode: 'starter',
        }),
      }, testEnv);

      expect(res.status).toBe(200);
    });
  });

  describe('Plan/Addon Validation', () => {
    beforeEach(() => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'ADMIN' });
    });

    it('should reject unmapped plan code', async () => {
      const res = await app.request('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token',
        },
        body: JSON.stringify({
          workspaceId: 'ws_123',
          planCode: 'nonexistent-plan',
        }),
      }, testEnv);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Invalid plan code');
    });

    it('should reject free plan in checkout', async () => {
      const res = await app.request('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token',
        },
        body: JSON.stringify({
          workspaceId: 'ws_123',
          planCode: 'free',
        }),
      }, testEnv);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Free plan cannot be purchased');
    });

    it('should reject unmapped addon code', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'ws_123',
        name: 'Test Org',
      });
      
      const res = await app.request('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token',
        },
        body: JSON.stringify({
          workspaceId: 'ws_123',
          planCode: 'starter',
          addons: [{ addonCode: 'nonexistent-addon', quantity: 1 }],
        }),
      }, testEnv);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Invalid addon codes');
    });
  });

  describe('Line Items Creation', () => {
    beforeEach(() => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'ADMIN' });
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'ws_123',
        name: 'Test Org',
        stripeCustomerId: 'cus_existing',
      });
      mockPrisma.auditLog.create.mockResolvedValue({});
    });

    it('should create line items with correct quantity for addons', async () => {
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test',
        url: 'https://checkout.stripe.com/test',
      });

      await app.request('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token',
        },
        body: JSON.stringify({
          workspaceId: 'ws_123',
          planCode: 'starter',
          addons: [
            { addonCode: 'extra-bot-slots', quantity: 5 },
          ],
        }),
      }, testEnv);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            { price: 'price_starter_monthly', quantity: 1 },
            { price: 'price_extra_bot_monthly', quantity: 5 },
          ]),
        })
      );
    });

    it('should include metadata with workspaceId and planCode', async () => {
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test',
        url: 'https://checkout.stripe.com/test',
      });

      await app.request('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token',
        },
        body: JSON.stringify({
          workspaceId: 'ws_123',
          planCode: 'professional',
        }),
      }, testEnv);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            workspaceId: 'ws_123',
            planCode: 'professional',
          }),
        })
      );
    });
  });
});

describe('GET /api/billing/portal', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
    mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'ADMIN' });
  });

  it('should return 409 when no Stripe customer exists', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'ws_123',
      stripeCustomerId: null, // No customer
    });

    const res = await app.request('/api/billing/portal?workspaceId=ws_123', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer admin-token',
      },
    }, testEnv);

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain('No billing account found');
    expect(json.code).toBe('NO_STRIPE_CUSTOMER');
  });

  it('should return portal URL when customer exists', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'ws_123',
      stripeCustomerId: 'cus_existing',
    });
    mockStripe.billingPortal.sessions.create.mockResolvedValue({
      id: 'bps_test',
      url: 'https://billing.stripe.com/portal/test',
    });
    mockPrisma.auditLog.create.mockResolvedValue({});

    const res = await app.request('/api/billing/portal?workspaceId=ws_123', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer admin-token',
      },
    }, testEnv);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toBe('https://billing.stripe.com/portal/test');
  });

  it('should reject non-admin users', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'MEMBER' });

    const res = await app.request('/api/billing/portal?workspaceId=ws_123', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer member-token',
      },
    }, testEnv);

    expect(res.status).toBe(403);
  });
});

describe('Audit Logging', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
    mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'ADMIN' });
  });

  it('should create audit log for checkout session', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'ws_123',
      name: 'Test Org',
      stripeCustomerId: 'cus_existing',
    });
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_audit_test',
      url: 'https://checkout.stripe.com/test',
    });
    mockPrisma.auditLog.create.mockResolvedValue({});

    await app.request('/api/billing/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin-token',
      },
      body: JSON.stringify({
        workspaceId: 'ws_123',
        planCode: 'starter',
      }),
    }, testEnv);

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'ws_123',
        userId: 'user_admin',
        action: 'checkout.session.created',
        resource: 'billing',
        resourceId: 'cs_audit_test',
        source: 'billing',
      }),
    });
  });

  it('should create audit log for portal session', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'ws_123',
      stripeCustomerId: 'cus_existing',
    });
    mockStripe.billingPortal.sessions.create.mockResolvedValue({
      id: 'bps_audit_test',
      url: 'https://billing.stripe.com/portal/test',
    });
    mockPrisma.auditLog.create.mockResolvedValue({});

    await app.request('/api/billing/portal?workspaceId=ws_123', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer admin-token',
      },
    }, testEnv);

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'ws_123',
        userId: 'user_admin',
        action: 'portal.session.created',
        resource: 'billing',
        source: 'billing',
      }),
    });
  });
});

describe('GET /api/billing/status', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
    mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'ADMIN' });
  });

  it('should return billing status with active subscription', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'ws_123',
      name: 'Test Org',
      plan: 'starter',
      stripeCustomerId: 'cus_existing',
    });
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub_123',
      organizationId: 'ws_123',
      status: 'ACTIVE',
      currentPeriodStart: new Date('2025-01-01'),
      currentPeriodEnd: new Date('2025-02-01'),
      cancelAtPeriodEnd: false,
      stripeSubscriptionId: 'sub_stripe_123',
      plan: {
        id: 'plan_starter',
        name: 'Starter',
        price: 29,
        interval: 'month',
        maxBots: 3,
        maxConversations: 5000,
      },
    });
    mockPrisma.userAddon.findMany.mockResolvedValue([]);

    const res = await app.request('/api/billing/status?workspaceId=ws_123', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer admin-token',
      },
    }, testEnv);

    expect(res.status).toBe(200);
    const json = await res.json();
    
    expect(json.workspace.id).toBe('ws_123');
    expect(json.hasStripeCustomer).toBe(true);
    expect(json.subscription).not.toBeNull();
    expect(json.subscription.status).toBe('ACTIVE');
    expect(json.subscription.plan.name).toBe('Starter');
    expect(json.isPaid).toBe(true);
    expect(json.isTrialing).toBe(false);
    expect(json.willCancel).toBe(false);
  });

  it('should return status with active addons and quantity', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'ws_123',
      name: 'Test Org',
      plan: 'professional',
      stripeCustomerId: 'cus_existing',
    });
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub_123',
      status: 'ACTIVE',
      currentPeriodEnd: new Date('2025-02-01'),
      cancelAtPeriodEnd: false,
      plan: {
        id: 'plan_pro',
        name: 'Professional',
        price: 79,
        interval: 'month',
        maxBots: 10,
        maxConversations: 20000,
      },
    });
    mockPrisma.userAddon.findMany.mockResolvedValue([
      {
        id: 'ua_1',
        quantity: 5,
        status: 'ACTIVE',
        currentPeriodEnd: new Date('2025-02-01'),
        addon: {
          id: 'addon_1',
          name: 'Extra Bot Slots',
          slug: 'extra-bot-slots',
          priceMonthly: 10,
          priceYearly: 100,
          category: 'CAPACITY',
        },
      },
    ]);

    const res = await app.request('/api/billing/status?workspaceId=ws_123', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer admin-token',
      },
    }, testEnv);

    expect(res.status).toBe(200);
    const json = await res.json();
    
    expect(json.addons).toHaveLength(1);
    expect(json.addons[0].slug).toBe('extra-bot-slots');
    expect(json.addons[0].quantity).toBe(5);
    // 79 (plan) + 10 * 5 (addon) = 129
    expect(json.billing.estimatedMonthlyTotal).toBe(129);
  });

  it('should return null subscription for free tier', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'ws_123',
      name: 'Test Org',
      plan: 'free',
      stripeCustomerId: null,
    });
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    mockPrisma.userAddon.findMany.mockResolvedValue([]);

    const res = await app.request('/api/billing/status?workspaceId=ws_123', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer admin-token',
      },
    }, testEnv);

    expect(res.status).toBe(200);
    const json = await res.json();
    
    expect(json.subscription).toBeNull();
    expect(json.hasStripeCustomer).toBe(false);
    expect(json.isPaid).toBe(false);
    expect(json.addons).toEqual([]);
  });

  it('should reject non-admin users', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'VIEWER' });

    const res = await app.request('/api/billing/status?workspaceId=ws_123', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer viewer-token',
      },
    }, testEnv);

    expect(res.status).toBe(403);
  });

  it('should return willCancel true when cancel scheduled', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'ws_123',
      name: 'Test Org',
      stripeCustomerId: 'cus_existing',
    });
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub_123',
      status: 'ACTIVE',
      currentPeriodEnd: new Date('2025-02-01'),
      cancelAtPeriodEnd: true, // Scheduled to cancel
      plan: {
        id: 'plan_starter',
        name: 'Starter',
        price: 29,
        interval: 'month',
        maxBots: 3,
        maxConversations: 5000,
      },
    });
    mockPrisma.userAddon.findMany.mockResolvedValue([]);

    const res = await app.request('/api/billing/status?workspaceId=ws_123', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer admin-token',
      },
    }, testEnv);

    expect(res.status).toBe(200);
    const json = await res.json();
    
    expect(json.willCancel).toBe(true);
    expect(json.isPaid).toBe(true);
  });

  it('should normalize yearly plan price to monthly equivalent', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'ws_123',
      name: 'Test Org',
      stripeCustomerId: 'cus_existing',
    });
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub_123',
      status: 'ACTIVE',
      currentPeriodEnd: new Date('2026-01-01'),
      cancelAtPeriodEnd: false,
      plan: {
        id: 'plan_pro_yearly',
        name: 'Professional Yearly',
        price: 790, // Yearly price
        interval: 'year',
        maxBots: 10,
        maxConversations: 20000,
      },
    });
    mockPrisma.userAddon.findMany.mockResolvedValue([]);

    const res = await app.request('/api/billing/status?workspaceId=ws_123', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer admin-token',
      },
    }, testEnv);

    expect(res.status).toBe(200);
    const json = await res.json();
    
    // 790 / 12 = 65.83 (rounded to 2 decimals)
    expect(json.billing.estimatedMonthlyTotal).toBeCloseTo(65.83, 1);
    expect(json.billing.isNormalized).toBe(true);
    // Plan code should be normalized (strip "Yearly" suffix)
    expect(json.subscription.plan.code).toBe('professional');
  });

  it('should derive stable plan code from plan name with various formats', async () => {
    const testCases = [
      { name: 'Starter', expectedCode: 'starter' },
      { name: 'Professional Yearly', expectedCode: 'professional' },
      { name: 'Enterprise Monthly', expectedCode: 'enterprise' },
      { name: 'Pro Plan Annual', expectedCode: 'pro-plan' },
    ];

    for (const { name, expectedCode } of testCases) {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'ws_123',
        name: 'Test Org',
        stripeCustomerId: 'cus_existing',
      });
      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: 'sub_123',
        status: 'ACTIVE',
        currentPeriodEnd: new Date('2026-01-01'),
        cancelAtPeriodEnd: false,
        plan: {
          id: 'plan_test',
          name,
          price: 100,
          interval: 'month',
          maxBots: 5,
          maxConversations: 10000,
        },
      });
      mockPrisma.userAddon.findMany.mockResolvedValue([]);

      const res = await app.request('/api/billing/status?workspaceId=ws_123', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer admin-token',
        },
      }, testEnv);

      const json = await res.json();
      expect(json.subscription.plan.code).toBe(expectedCode);
    }
  });
});
