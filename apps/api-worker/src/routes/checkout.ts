/**
 * Stripe Checkout & Portal Endpoints
 * 
 * POST /api/billing/checkout - Create Stripe Checkout Session
 * GET /api/billing/portal - Create Stripe Billing Portal Session
 * 
 * Authorization: workspace membership + OWNER or ADMIN role
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { getPrisma } from '../db';
import {
  initStripeConfig,
  getStripePriceIdForPlan,
  getStripePriceIdForAddon,
  getPlanToStripe,
  getAddonToStripe,
  type AddonCode,
} from '../lib/stripe-mapping';
import Stripe from 'stripe';

// ============================================
// TYPE DEFINITIONS
// ============================================

type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  APP_URL?: string;
  [key: string]: string | undefined;
};

type Variables = {
  user: {
    userId: string;
    email: string;
  };
};

// ============================================
// ZOD SCHEMAS
// ============================================

/**
 * Addon item schema with quantity support
 */
const AddonItemSchema = z.object({
  addonCode: z.string().min(1, 'Addon code is required'),
  quantity: z.number().int().min(1).default(1),
});

/**
 * POST /api/billing/checkout request body
 */
export const CheckoutRequestSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  planCode: z.string().min(1, 'Plan code is required'),
  interval: z.enum(['monthly', 'yearly']).default('monthly'),
  addons: z.array(AddonItemSchema).optional().default([]),
});

export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;

/**
 * GET /api/billing/portal query params
 */
export const PortalRequestSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
});

export type PortalRequest = z.infer<typeof PortalRequestSchema>;

/**
 * GET /api/billing/status query params
 */
export const StatusRequestSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
});

export type StatusRequest = z.infer<typeof StatusRequestSchema>;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get Stripe client (lazily created per request)
 */
function getStripe(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: '2024-12-18.acacia',
  });
}

/**
 * Check if user has billing permission (OWNER or ADMIN role)
 */
async function checkBillingPermission(
  prisma: ReturnType<typeof getPrisma>,
  userId: string,
  organizationId: string
): Promise<{ authorized: boolean; role?: string; error?: string }> {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    select: { role: true },
  });

  if (!membership) {
    return { authorized: false, error: 'Not a member of this workspace' };
  }

  // Only OWNER and ADMIN can manage billing
  const billingRoles = ['OWNER', 'ADMIN'];
  if (!billingRoles.includes(membership.role)) {
    return { 
      authorized: false, 
      role: membership.role,
      error: 'Insufficient permissions. Only OWNER or ADMIN can manage billing.' 
    };
  }

  return { authorized: true, role: membership.role };
}

/**
 * Validate plan code exists in mapping
 */
function validatePlanCode(planCode: string): { valid: boolean; error?: string } {
  const planMappings = getPlanToStripe();
  
  if (!planMappings[planCode.toLowerCase()]) {
    const validPlans = Object.keys(planMappings).filter(p => p !== 'free');
    return { 
      valid: false, 
      error: `Invalid plan code '${planCode}'. Valid plans: ${validPlans.join(', ')}` 
    };
  }
  
  // Free plan cannot be purchased via checkout
  if (planCode.toLowerCase() === 'free') {
    return { valid: false, error: 'Free plan cannot be purchased via checkout' };
  }
  
  return { valid: true };
}

/**
 * Validate addon codes exist in mapping
 */
function validateAddonCodes(
  addons: Array<{ addonCode: string; quantity: number }>
): { valid: boolean; errors: string[] } {
  const addonMappings = getAddonToStripe();
  const errors: string[] = [];
  
  for (const addon of addons) {
    if (!addonMappings[addon.addonCode as AddonCode]) {
      errors.push(`Invalid addon code '${addon.addonCode}'`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Get or create Stripe Customer for organization
 */
async function getOrCreateStripeCustomer(
  stripe: Stripe,
  prisma: ReturnType<typeof getPrisma>,
  organizationId: string,
  organizationName: string,
  userEmail: string
): Promise<string> {
  // Check if organization already has a Stripe customer
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { stripeCustomerId: true, name: true },
  });

  if (org?.stripeCustomerId) {
    return org.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    name: organizationName,
    email: userEmail,
    metadata: {
      organizationId,
      createdVia: 'checkout',
    },
  });

  // Store customer ID on organization
  await prisma.organization.update({
    where: { id: organizationId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// ============================================
// ROUTES
// ============================================

const checkoutRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * POST /checkout
 * 
 * Create a Stripe Checkout Session for subscription purchase
 */
checkoutRoutes.post('/checkout', async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env);
  
  // Initialize Stripe config from environment
  initStripeConfig(c.env);
  
  // Parse and validate request body
  let body: CheckoutRequest;
  try {
    const rawBody = await c.req.json();
    body = CheckoutRequestSchema.parse(rawBody);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ 
        error: 'Validation failed', 
        details: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
      }, 400);
    }
    return c.json({ error: 'Invalid request body' }, 400);
  }

  const { workspaceId, planCode, interval, addons } = body;

  // Check authorization
  const authCheck = await checkBillingPermission(prisma, user.userId, workspaceId);
  if (!authCheck.authorized) {
    console.log(`[Checkout] Authorization failed for user ${user.userId}: ${authCheck.error}`);
    return c.json({ error: authCheck.error }, 403);
  }

  // Validate plan code
  const planValidation = validatePlanCode(planCode);
  if (!planValidation.valid) {
    console.log(`[Checkout] Invalid plan code: ${planCode}`);
    return c.json({ error: planValidation.error }, 400);
  }

  // Validate addon codes
  const addonValidation = validateAddonCodes(addons);
  if (!addonValidation.valid) {
    console.log(`[Checkout] Invalid addon codes: ${addonValidation.errors.join(', ')}`);
    return c.json({ error: 'Invalid addon codes', details: addonValidation.errors }, 400);
  }

  // Get organization
  const organization = await prisma.organization.findUnique({
    where: { id: workspaceId },
    select: { id: true, name: true },
  });

  if (!organization) {
    return c.json({ error: 'Workspace not found' }, 404);
  }

  // Get Stripe price IDs
  const planPriceId = getStripePriceIdForPlan(planCode, interval);
  if (!planPriceId) {
    console.error(`[Checkout] No Stripe price ID configured for plan '${planCode}' (${interval})`);
    return c.json({ 
      error: 'Stripe not configured for this plan. Please contact support.',
      code: 'STRIPE_NOT_CONFIGURED'
    }, 500);
  }

  // Build line items
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price: planPriceId,
      quantity: 1,
    },
  ];

  // Add addon line items
  const addonsSerialized: Array<{ code: string; qty: number }> = [];
  for (const addon of addons) {
    const addonPriceId = getStripePriceIdForAddon(addon.addonCode as AddonCode, interval);
    if (!addonPriceId) {
      console.error(`[Checkout] No Stripe price ID for addon '${addon.addonCode}' (${interval})`);
      return c.json({ 
        error: `Stripe not configured for addon '${addon.addonCode}'. Please contact support.`,
        code: 'STRIPE_NOT_CONFIGURED'
      }, 500);
    }

    lineItems.push({
      price: addonPriceId,
      quantity: addon.quantity,
    });

    addonsSerialized.push({ code: addon.addonCode, qty: addon.quantity });
  }

  // Get or create Stripe customer
  const stripe = getStripe(c.env.STRIPE_SECRET_KEY);
  const stripeCustomerId = await getOrCreateStripeCustomer(
    stripe,
    prisma,
    organization.id,
    organization.name,
    user.email
  );

  // Build success and cancel URLs
  const appUrl = c.env.APP_URL || 'https://app.chatbotstudio.com';
  const successUrl = `${appUrl}/dashboard/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${appUrl}/dashboard/billing?checkout=cancelled`;

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      workspaceId,
      planCode,
      interval,
      addons: JSON.stringify(addonsSerialized),
    },
    subscription_data: {
      metadata: {
        workspaceId,
        planCode,
        interval,
        addons: JSON.stringify(addonsSerialized),
      },
    },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    tax_id_collection: { enabled: true },
  });

  // Audit log (no sensitive data)
  await prisma.auditLog.create({
    data: {
      organizationId: workspaceId,
      userId: user.userId,
      action: 'checkout.session.created',
      resource: 'billing',
      resourceId: session.id,
      source: 'billing',
      metadata: {
        planCode,
        interval,
        addonCount: addons.length,
        // Don't log addon details or prices
      },
    },
  });

  console.log(`[Checkout] Created session ${session.id} for workspace ${workspaceId}`);

  return c.json({ url: session.url });
});

/**
 * GET /portal
 * 
 * Create a Stripe Billing Portal Session for subscription management
 */
checkoutRoutes.get('/portal', async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env);

  // Parse and validate query params
  let query: PortalRequest;
  try {
    const workspaceId = c.req.query('workspaceId');
    query = PortalRequestSchema.parse({ workspaceId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ 
        error: 'Validation failed', 
        details: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
      }, 400);
    }
    return c.json({ error: 'Invalid query parameters' }, 400);
  }

  const { workspaceId } = query;

  // Check authorization
  const authCheck = await checkBillingPermission(prisma, user.userId, workspaceId);
  if (!authCheck.authorized) {
    console.log(`[Portal] Authorization failed for user ${user.userId}: ${authCheck.error}`);
    return c.json({ error: authCheck.error }, 403);
  }

  // Get organization with stripeCustomerId
  const organization = await prisma.organization.findUnique({
    where: { id: workspaceId },
    select: { id: true, stripeCustomerId: true },
  });

  if (!organization) {
    return c.json({ error: 'Workspace not found' }, 404);
  }

  // Check if customer exists
  if (!organization.stripeCustomerId) {
    console.log(`[Portal] No Stripe customer for workspace ${workspaceId}`);
    return c.json({ 
      error: 'No billing account found. Please complete a checkout first.',
      code: 'NO_STRIPE_CUSTOMER'
    }, 409);
  }

  const stripe = getStripe(c.env.STRIPE_SECRET_KEY);

  // Build return URL
  const appUrl = c.env.APP_URL || 'https://app.chatbotstudio.com';
  const returnUrl = `${appUrl}/dashboard/billing`;

  // Create Portal Session
  const session = await stripe.billingPortal.sessions.create({
    customer: organization.stripeCustomerId,
    return_url: returnUrl,
  });

  // Audit log (no sensitive data)
  await prisma.auditLog.create({
    data: {
      organizationId: workspaceId,
      userId: user.userId,
      action: 'portal.session.created',
      resource: 'billing',
      resourceId: session.id,
      source: 'billing',
      metadata: {
        // Minimal metadata, no sensitive info
      },
    },
  });

  console.log(`[Portal] Created session ${session.id} for workspace ${workspaceId}`);

  return c.json({ url: session.url });
});

// ============================================
// GET /api/billing/status - Get subscription status
// ============================================

/**
 * GET /api/billing/status
 * 
 * Returns complete billing status for a workspace:
 * - Current subscription (plan, status, renewal date)
 * - Active addons with quantities
 * - Stripe customer info
 * 
 * Authorization: workspace membership + OWNER or ADMIN role
 */
checkoutRoutes.get('/status', async (c) => {
  const prisma = getPrisma(c.env);
  const user = c.get('user');

  // Validate query params
  let query: StatusRequest;
  try {
    const workspaceId = c.req.query('workspaceId');
    query = StatusRequestSchema.parse({ workspaceId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ 
        error: 'Validation failed', 
        details: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
      }, 400);
    }
    return c.json({ error: 'Invalid query parameters' }, 400);
  }

  const { workspaceId } = query;

  // Check authorization
  const authCheck = await checkBillingPermission(prisma, user.userId, workspaceId);
  if (!authCheck.authorized) {
    console.log(`[Status] Authorization failed for user ${user.userId}: ${authCheck.error}`);
    return c.json({ error: authCheck.error }, 403);
  }

  // Get organization with billing data
  const organization = await prisma.organization.findUnique({
    where: { id: workspaceId },
    select: { 
      id: true, 
      name: true,
      plan: true, // Current plan code from organization
      stripeCustomerId: true,
    },
  });

  if (!organization) {
    return c.json({ error: 'Workspace not found' }, 404);
  }

  // Get active subscription
  const subscription = await prisma.subscription.findFirst({
    where: { 
      organizationId: workspaceId,
      status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
    },
    include: {
      plan: {
        select: {
          id: true,
          name: true,
          price: true,
          interval: true,
          maxBots: true,
          maxConversations: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get active addons
  const activeAddons = await prisma.userAddon.findMany({
    where: {
      organizationId: workspaceId,
      status: { in: ['ACTIVE', 'TRIALING'] },
    },
    include: {
      addon: {
        select: {
          id: true,
          name: true,
          slug: true,
          priceMonthly: true,
          priceYearly: true,
          category: true,
        },
      },
    },
  });

  // Calculate next billing date
  const nextBillingDate = subscription?.currentPeriodEnd || null;
  
  // Calculate total monthly cost (normalized for yearly plans)
  // Yearly prices are divided by 12 to get monthly equivalent
  let monthlyTotal = 0;
  let currency = 'EUR'; // Default currency
  
  if (subscription?.plan) {
    const planPrice = subscription.plan.price;
    const isYearly = subscription.plan.interval === 'year' || subscription.plan.interval === 'yearly';
    // Normalize yearly to monthly
    monthlyTotal += isYearly ? planPrice / 12 : planPrice;
  }
  
  for (const ua of activeAddons) {
    // Prefer yearly price if addon is on yearly billing, else use monthly
    const isAddonYearly = ua.currentPeriodEnd && subscription?.plan?.interval === 'year';
    const addonPrice = isAddonYearly 
      ? (Number(ua.addon.priceYearly) || Number(ua.addon.priceMonthly) * 12) / 12
      : Number(ua.addon.priceMonthly) || 0;
    monthlyTotal += addonPrice * (ua.quantity || 1);
    
    // Use addon currency if available (for multi-currency support)
    // Currently addons don't store currency, but this prepares for future
  }

  // Derive stable plan code from plan name (strip suffixes like "Yearly", "Monthly")
  const derivePlanCode = (planName: string): string => {
    return planName
      .toLowerCase()
      .replace(/\s+(yearly|monthly|annual|year|month)$/i, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  // Build response
  const response = {
    workspace: {
      id: organization.id,
      name: organization.name,
    },
    hasStripeCustomer: !!organization.stripeCustomerId,
    subscription: subscription ? {
      id: subscription.id,
      status: subscription.status,
      plan: {
        id: subscription.plan.id,
        code: derivePlanCode(subscription.plan.name), // Stable identifier for UI lookup
        name: subscription.plan.name,
        interval: subscription.plan.interval,
        limits: {
          maxBots: subscription.plan.maxBots,
          maxConversations: subscription.plan.maxConversations,
        },
      },
      currentPeriodStart: subscription.currentPeriodStart?.toISOString(),
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString(),
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
    } : null,
    addons: activeAddons.map(ua => ({
      id: ua.addon.id,
      slug: ua.addon.slug,
      name: ua.addon.name,
      category: ua.addon.category,
      quantity: ua.quantity,
      status: ua.status,
      currentPeriodEnd: ua.currentPeriodEnd?.toISOString() || null,
    })),
    billing: {
      nextBillingDate: nextBillingDate?.toISOString() || null,
      estimatedMonthlyTotal: Math.round(monthlyTotal * 100) / 100,
      currency, // Dynamic currency (prepared for multi-currency)
      isNormalized: subscription?.plan?.interval === 'year' || subscription?.plan?.interval === 'yearly',
    },
    // Quick access flags
    isPaid: !!subscription && subscription.status === 'ACTIVE',
    isTrialing: subscription?.status === 'TRIALING' || false,
    isPastDue: subscription?.status === 'PAST_DUE' || false,
    willCancel: subscription?.cancelAtPeriodEnd || false,
  };

  console.log(`[Status] Retrieved billing status for workspace ${workspaceId}`);

  return c.json(response);
});

export { checkoutRoutes };
