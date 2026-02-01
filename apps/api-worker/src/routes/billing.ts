/**
 * Stripe Billing Webhook Handler
 * 
 * POST /api/billing/webhook
 * 
 * Handles Stripe webhook events with:
 * - Signature verification
 * - Idempotent event processing (StripeWebhookEvent table)
 * - Transactional subscription/addon updates
 * - Audit logging for all events
 * 
 * Supported events:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */

import { Hono } from 'hono';
import { getPrisma } from '../db';
import {
  getAddonCodeFromStripePriceId,
  getPlanIdFromStripePriceId,
  initStripeConfig,
  isStripeConfigured,
} from '../lib/stripe-mapping';

/**
 * Error class for recoverable errors that should trigger Stripe retry
 * Examples: DB connection issues, network timeouts, lock contention
 */
export class RecoverableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecoverableError';
  }
}

/**
 * Determine if an error is recoverable (should trigger Stripe retry)
 * 
 * Recoverable errors:
 * - Database connection errors
 * - Network timeouts
 * - Lock contention / deadlocks
 * - Rate limiting
 * 
 * Non-recoverable errors:
 * - Subscription not found (data issue, won't fix on retry)
 * - Invalid data format
 * - Business logic errors
 */
function isRecoverableError(error: unknown): boolean {
  if (error instanceof RecoverableError) {
    return true;
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();
    
    // Prisma/DB connection errors
    if (
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('econnreset') ||
      message.includes('socket') ||
      message.includes('deadlock') ||
      message.includes('lock wait') ||
      name.includes('prisma') && message.includes('timed out')
    ) {
      return true;
    }
    
    // Rate limiting
    if (
      message.includes('rate limit') ||
      message.includes('too many requests')
    ) {
      return true;
    }
  }
  
  return false;
}

type Bindings = {
  DATABASE_URL: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  [key: string]: string | undefined;
};

const billingRoutes = new Hono<{ Bindings: Bindings }>();

// Stripe event types we handle
const HANDLED_EVENT_TYPES = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
] as const;

type HandledEventType = typeof HANDLED_EVENT_TYPES[number];

/**
 * Verify Stripe webhook signature
 * Uses Web Crypto API for Cloudflare Workers compatibility
 */
async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = signature.split(',');
    const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
    const v1Signature = parts.find(p => p.startsWith('v1='))?.split('=')[1];

    if (!timestamp || !v1Signature) {
      console.error('[Stripe] Missing timestamp or signature');
      return false;
    }

    // Check timestamp (reject events older than 5 minutes)
    const eventTime = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - eventTime > 300) {
      console.error('[Stripe] Event timestamp too old');
      return false;
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`;
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
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return expectedSignature === v1Signature;
  } catch (error) {
    console.error('[Stripe] Signature verification error:', error);
    return false;
  }
}

/**
 * Map Stripe subscription status to internal status
 */
function mapStripeStatus(stripeStatus: string): 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'TRIALING' | 'PAUSED' {
  const statusMap: Record<string, 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'TRIALING' | 'PAUSED'> = {
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
}

/**
 * POST /api/billing/webhook
 * 
 * Stripe webhook endpoint with idempotent processing
 */
billingRoutes.post('/webhook', async (c) => {
  // Initialize Stripe config from environment before processing
  initStripeConfig(c.env);
  
  // Verify Stripe is properly configured with price IDs
  if (!isStripeConfigured()) {
    console.warn('[Webhook] Stripe price IDs not configured in environment');
    // Don't fail - the webhook still works for logging, just won't match prices
  }
  
  const prisma = getPrisma(c.env);
  
  // Get raw body and signature
  const payload = await c.req.text();
  const signature = c.req.header('stripe-signature');
  
  if (!signature) {
    console.error('[Webhook] Missing Stripe signature');
    return c.json({ error: 'Missing signature' }, 400);
  }

  // Verify signature
  const webhookSecret = c.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Webhook] STRIPE_WEBHOOK_SECRET not configured');
    return c.json({ error: 'Webhook not configured' }, 500);
  }

  const isValid = await verifyStripeSignature(payload, signature, webhookSecret);
  if (!isValid) {
    console.error('[Webhook] Invalid signature');
    return c.json({ error: 'Invalid signature' }, 400);
  }

  // Parse event
  let event: {
    id: string;
    type: string;
    created: number;
    data: { object: Record<string, unknown> };
  };
  
  try {
    event = JSON.parse(payload);
  } catch (error) {
    console.error('[Webhook] Invalid JSON payload');
    return c.json({ error: 'Invalid payload' }, 400);
  }

  const eventId = event.id;
  const eventType = event.type;
  const stripeCreatedAt = new Date(event.created * 1000);

  console.log(`[Webhook] Processing event: ${eventType} (${eventId})`);

  // Check idempotency - has this event been processed before?
  const existingEvent = await prisma.stripeWebhookEvent.findUnique({
    where: { eventId },
  });

  let webhookEvent: { id: string };

  if (existingEvent) {
    // Check if event was successfully processed or intentionally ignored
    if (existingEvent.status === 'PROCESSED' || existingEvent.status === 'IGNORED') {
      // Truly processed - return success (idempotent)
      console.log(`[Webhook] Event ${eventId} already processed (status: ${existingEvent.status})`);
      return c.json({ 
        received: true, 
        status: 'already_processed',
        originalStatus: existingEvent.status,
      });
    }
    
    // Event exists but is FAILED or PENDING without completion - retry processing
    console.log(`[Webhook] Event ${eventId} found with status ${existingEvent.status}, retrying processing`);
    webhookEvent = { id: existingEvent.id };
    
    // Reset status to PENDING for retry
    await prisma.stripeWebhookEvent.update({
      where: { id: existingEvent.id },
      data: { status: 'PENDING', processedAt: null, error: null },
    });
  } else {
    // Create new event record (pending)
    webhookEvent = await prisma.stripeWebhookEvent.create({
      data: {
        eventId,
        eventType,
        payloadJson: event as unknown as Record<string, unknown>,
        status: 'PENDING',
        stripeCreatedAt,
      },
    });
  }

  // Check if we handle this event type
  if (!HANDLED_EVENT_TYPES.includes(eventType as HandledEventType)) {
    // Mark as ignored
    await prisma.stripeWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: { status: 'IGNORED', processedAt: new Date() },
    });
    console.log(`[Webhook] Event type ${eventType} not handled, marking as ignored`);
    return c.json({ received: true, status: 'ignored' });
  }

  try {
    // Process event based on type
    await processStripeEvent(prisma, event, webhookEvent.id);

    // Mark as processed
    await prisma.stripeWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: { status: 'PROCESSED', processedAt: new Date() },
    });

    console.log(`[Webhook] Event ${eventId} processed successfully`);
    return c.json({ received: true, status: 'processed' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const recoverable = isRecoverableError(error);
    
    console.error(
      `[Webhook] Error processing event ${eventId} (recoverable: ${recoverable}):`,
      errorMessage
    );

    // Mark as failed with recoverable flag in metadata
    await prisma.stripeWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: { 
        status: 'FAILED', 
        processedAt: new Date(), 
        error: `${recoverable ? '[RECOVERABLE] ' : ''}${errorMessage}`,
      },
    });

    // Return 5xx for recoverable errors to trigger Stripe retry
    // Return 2xx for non-recoverable errors (won't fix on retry)
    if (recoverable) {
      console.log(`[Webhook] Returning 500 for recoverable error, Stripe will retry`);
      return c.json(
        { received: false, status: 'failed', error: errorMessage, recoverable: true },
        500
      );
    }

    // Non-recoverable: return 200 to prevent useless retries
    console.log(`[Webhook] Returning 200 for non-recoverable error, no retry needed`);
    return c.json({ received: true, status: 'failed', error: errorMessage, recoverable: false });
  }
});

/**
 * Process Stripe event and update database
 */
async function processStripeEvent(
  prisma: ReturnType<typeof getPrisma>,
  event: { id: string; type: string; data: { object: Record<string, unknown> } },
  webhookEventId: string
): Promise<void> {
  const eventType = event.type as HandledEventType;
  const data = event.data.object;

  switch (eventType) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionChange(prisma, data, webhookEventId);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(prisma, data, webhookEventId);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(prisma, data, webhookEventId);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(prisma, data, webhookEventId);
      break;
  }
}

/**
 * Handle subscription created/updated events
 */
async function handleSubscriptionChange(
  prisma: ReturnType<typeof getPrisma>,
  data: Record<string, unknown>,
  webhookEventId: string
): Promise<void> {
  const stripeSubscriptionId = data.id as string;
  const stripeCustomerId = data.customer as string;
  const status = mapStripeStatus(data.status as string);
  const currentPeriodStart = new Date((data.current_period_start as number) * 1000);
  const currentPeriodEnd = new Date((data.current_period_end as number) * 1000);
  const cancelAtPeriodEnd = data.cancel_at_period_end as boolean;
  const items = (data.items as { data: Array<{ price: { id: string }; quantity: number }> })?.data || [];

  // Find organization by Stripe customer ID (stored in subscription or organization metadata)
  const existingSub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
    include: { organization: true },
  });

  if (!existingSub) {
    // New subscription - need to find organization by metadata or create mapping
    // For now, log and skip - this requires customer ID mapping
    console.warn(`[Webhook] No existing subscription found for ${stripeSubscriptionId}`);
    
    // Create audit log for tracking
    // Note: We can't create full audit log without organizationId
    console.log(`[Webhook] Subscription ${stripeSubscriptionId} created but no org mapping exists`);
    return;
  }

  const organizationId = existingSub.organizationId;

  // Determine plan from subscription items
  let planId = existingSub.planId;
  const addonUpdates: Array<{ addonCode: string; quantity: number }> = [];

  for (const item of items) {
    const priceId = item.price.id;
    const quantity = item.quantity || 1;

    // Check if this is a plan price
    const foundPlanId = getPlanIdFromStripePriceId(priceId);
    if (foundPlanId) {
      // Find the actual plan record
      const plan = await prisma.plan.findFirst({
        where: { stripePriceId: priceId },
      });
      if (plan) {
        planId = plan.id;
      }
    }

    // Check if this is an addon price
    const addonCode = getAddonCodeFromStripePriceId(priceId);
    if (addonCode) {
      addonUpdates.push({ addonCode, quantity });
    }
  }

  // Update subscription in transaction
  await prisma.$transaction(async (tx) => {
    // Update subscription
    await tx.subscription.update({
      where: { id: existingSub.id },
      data: {
        planId,
        status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd,
      },
    });

    // Update subscription addons
    for (const { addonCode, quantity } of addonUpdates) {
      // Find addon by slug
      const addon = await tx.addon.findUnique({
        where: { slug: addonCode },
      });

      if (addon) {
        // Upsert subscription addon
        await tx.subscriptionAddon.upsert({
          where: {
            subscriptionId_addonId: {
              subscriptionId: existingSub.id,
              addonId: addon.id,
            },
          },
          create: {
            subscriptionId: existingSub.id,
            addonId: addon.id,
            quantity,
            status: 'ACTIVE',
          },
          update: {
            quantity,
            status: 'ACTIVE',
          },
        });
      }
    }

    // Create audit log
    await tx.auditLog.create({
      data: {
        organizationId,
        action: 'subscription.updated',
        resource: 'subscription',
        resourceId: existingSub.id,
        source: 'billing',
        stripeEventId: webhookEventId,
        metadata: {
          stripeSubscriptionId,
          status,
          planId,
          addons: addonUpdates,
        },
      },
    });
  });

  console.log(`[Webhook] Updated subscription ${stripeSubscriptionId} for org ${organizationId}`);
}

/**
 * Handle subscription deleted event
 */
async function handleSubscriptionDeleted(
  prisma: ReturnType<typeof getPrisma>,
  data: Record<string, unknown>,
  webhookEventId: string
): Promise<void> {
  const stripeSubscriptionId = data.id as string;

  const existingSub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
  });

  if (!existingSub) {
    console.warn(`[Webhook] Subscription ${stripeSubscriptionId} not found for deletion`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Mark subscription as canceled
    await tx.subscription.update({
      where: { id: existingSub.id },
      data: { status: 'CANCELED' },
    });

    // Deactivate all subscription addons
    await tx.subscriptionAddon.updateMany({
      where: { subscriptionId: existingSub.id },
      data: { status: 'CANCELED' },
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        organizationId: existingSub.organizationId,
        action: 'subscription.deleted',
        resource: 'subscription',
        resourceId: existingSub.id,
        source: 'billing',
        stripeEventId: webhookEventId,
        metadata: { stripeSubscriptionId },
      },
    });
  });

  console.log(`[Webhook] Canceled subscription ${stripeSubscriptionId}`);
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(
  prisma: ReturnType<typeof getPrisma>,
  data: Record<string, unknown>,
  webhookEventId: string
): Promise<void> {
  const stripeSubscriptionId = data.subscription as string;
  const amountPaid = (data.amount_paid as number) / 100; // Convert from cents
  const currency = data.currency as string;

  if (!stripeSubscriptionId) {
    // One-time payment, not subscription
    console.log('[Webhook] Payment succeeded for non-subscription invoice');
    return;
  }

  const existingSub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
  });

  if (!existingSub) {
    console.warn(`[Webhook] Subscription ${stripeSubscriptionId} not found for payment`);
    return;
  }

  // Ensure subscription is active
  await prisma.$transaction(async (tx) => {
    await tx.subscription.update({
      where: { id: existingSub.id },
      data: { status: 'ACTIVE' },
    });

    // Record payment
    await tx.payment.create({
      data: {
        organizationId: existingSub.organizationId,
        amount: amountPaid,
        currency: currency.toUpperCase(),
        status: 'SUCCEEDED',
        stripePaymentId: data.payment_intent as string,
        metadata: { invoiceId: data.id },
      },
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        organizationId: existingSub.organizationId,
        action: 'payment.succeeded',
        resource: 'payment',
        resourceId: data.id as string,
        source: 'billing',
        stripeEventId: webhookEventId,
        metadata: { amount: amountPaid, currency },
      },
    });
  });

  console.log(`[Webhook] Payment succeeded for subscription ${stripeSubscriptionId}`);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(
  prisma: ReturnType<typeof getPrisma>,
  data: Record<string, unknown>,
  webhookEventId: string
): Promise<void> {
  const stripeSubscriptionId = data.subscription as string;
  const amountDue = (data.amount_due as number) / 100;
  const currency = data.currency as string;

  if (!stripeSubscriptionId) {
    console.log('[Webhook] Payment failed for non-subscription invoice');
    return;
  }

  const existingSub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
  });

  if (!existingSub) {
    console.warn(`[Webhook] Subscription ${stripeSubscriptionId} not found for failed payment`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Mark subscription as past due
    await tx.subscription.update({
      where: { id: existingSub.id },
      data: { status: 'PAST_DUE' },
    });

    // Record failed payment
    await tx.payment.create({
      data: {
        organizationId: existingSub.organizationId,
        amount: amountDue,
        currency: currency.toUpperCase(),
        status: 'FAILED',
        stripePaymentId: data.payment_intent as string,
        metadata: { invoiceId: data.id },
      },
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        organizationId: existingSub.organizationId,
        action: 'payment.failed',
        resource: 'payment',
        resourceId: data.id as string,
        source: 'billing',
        stripeEventId: webhookEventId,
        metadata: { amount: amountDue, currency },
      },
    });
  });

  console.log(`[Webhook] Payment failed for subscription ${stripeSubscriptionId}`);
}

export { billingRoutes };
