import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';

type Bindings = {
  DATABASE_URL: string;
  STRIPE_WEBHOOK_SECRET?: string;
};

const webhooksEcommerceRoutes = new Hono<{ Bindings: Bindings }>();

// Helper to get Prisma client
function getPrisma(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

// Helper to create HMAC signature (for WooCommerce and Shopify)
async function createHmacSignature(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.trim().toLowerCase();
  if (cleaned.length % 2 !== 0) return new Uint8Array();
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    const byte = Number.parseInt(cleaned.slice(i, i + 2), 16);
    if (Number.isNaN(byte)) return new Uint8Array();
    bytes[i / 2] = byte;
  }
  return bytes;
}

function timingSafeEqualHex(aHex: string, bHex: string): boolean {
  const a = hexToBytes(aHex);
  const b = hexToBytes(bHex);
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

// Stripe expects v1 signature as hex(HMAC_SHA256(secret, ${timestamp}.))
async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return bytesToHex(new Uint8Array(signature));
}

// Helper to verify Stripe signature
async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = signature.split(',');
    const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
    const v1Signature = parts.find(p => p.startsWith('v1='))?.split('=')[1];

    if (!timestamp || !v1Signature) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = await hmacSha256Hex(secret, signedPayload);
    
    // Compare signatures (timing-safe comparison would be better in production)
    return timingSafeEqualHex(v1Signature, expectedSignature);
  } catch {
    return false;
  }
}

// Helper to create review request
async function createReviewRequest(
  prisma: PrismaClient,
  reviewBotId: string,
  data: {
    orderId?: string;
    orderAmount?: number;
    currency?: string;
    customerEmail?: string;
    customerName?: string;
    customerPhone?: string;
    platform: string;
    metadata?: any;
  }
) {
  const sessionId = `${data.platform.toLowerCase()}_${data.orderId || Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  return prisma.reviewRequest.create({
    data: {
      reviewBotId,
      sessionId,
      orderId: data.orderId || null,
      orderAmount: data.orderAmount || null,
      currency: data.currency || null,
      customerEmail: data.customerEmail || null,
      customerName: data.customerName || null,
      customerPhone: data.customerPhone || null,
      platform: data.platform,
      status: 'PENDING',
      metadata: data.metadata || {},
    },
  });
}

// ============================================
// STRIPE WEBHOOK
// ============================================
webhooksEcommerceRoutes.post('/stripe/review', async (c) => {
  try {
    const prisma = getPrisma(c.env.DATABASE_URL);
    const rawBody = await c.req.text();
    const signature = c.req.header('stripe-signature');

    if (!signature) {
      return c.json({ error: 'Missing stripe-signature header' }, 400);
    }

    // Parse event
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    // Supported events
    const supportedEvents = [
      'checkout.session.completed',
      'payment_intent.succeeded',
      'charge.succeeded',
    ];

    if (!supportedEvents.includes(event.type)) {
      return c.json({ received: true, skipped: true, reason: 'Event type not supported' });
    }

    const eventData = event.data.object;

    // Extract customer data based on event type
    let customerEmail: string | undefined;
    let customerName: string | undefined;
    let orderId: string | undefined;
    let amount: number | undefined;
    let currency: string | undefined;

    if (event.type === 'checkout.session.completed') {
      customerEmail = eventData.customer_email || eventData.customer_details?.email;
      customerName = eventData.customer_details?.name;
      orderId = eventData.id;
      amount = eventData.amount_total ? eventData.amount_total / 100 : undefined;
      currency = eventData.currency?.toUpperCase();
    } else if (event.type === 'payment_intent.succeeded') {
      customerEmail = eventData.receipt_email;
      orderId = eventData.id;
      amount = eventData.amount ? eventData.amount / 100 : undefined;
      currency = eventData.currency?.toUpperCase();
    } else if (event.type === 'charge.succeeded') {
      customerEmail = eventData.billing_details?.email || eventData.receipt_email;
      customerName = eventData.billing_details?.name;
      orderId = eventData.id;
      amount = eventData.amount ? eventData.amount / 100 : undefined;
      currency = eventData.currency?.toUpperCase();
    }
    // Find eCommerce connections for Stripe (multi-tenant safe selection)
    const connections = await prisma.ecommerceConnection.findMany({
      where: {
        platform: 'STRIPE',
        isActive: true,
      },
      include: {
        reviewBot: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!connections.length) {
      console.log('[Stripe Webhook] No active Stripe connection found');
      return c.json({ received: true, skipped: true, reason: 'No connection found' });
    }

    // Select the connection whose webhookSecret validates the signature
    let selected = connections.find((conn: any) => conn.reviewBot) as any;

    const candidates = connections.filter((conn: any) => conn.reviewBot && conn.webhookSecret);
    if (candidates.length > 0) {
      selected = null;
      for (const conn of candidates) {
        const isValid = await verifyStripeSignature(rawBody, signature, conn.webhookSecret);
        if (isValid) {
          selected = conn;
          break;
        }
      }
      if (!selected) {
        console.error('[Stripe Webhook] Invalid signature (no matching connection)');
        return c.json({ error: 'Invalid signature' }, 401);
      }
    } else if (c.env.STRIPE_WEBHOOK_SECRET) {
      const isValid = await verifyStripeSignature(rawBody, signature, c.env.STRIPE_WEBHOOK_SECRET);
      if (!isValid) {
        console.error('[Stripe Webhook] Invalid signature (env secret)');
        return c.json({ error: 'Invalid signature' }, 401);
      }
    }

    if (!selected || !selected.reviewBot) {
      console.log('[Stripe Webhook] No usable Stripe connection found');
      return c.json({ received: true, skipped: true, reason: 'No connection found' });
    }

    // Create review request
    const reviewRequest = await createReviewRequest(prisma, selected.reviewBotId, {
      orderId,
      orderAmount: amount,
      currency,
      customerEmail,
      customerName,
      platform: 'STRIPE',
      metadata: {
        stripeEventType: event.type,
        stripeEventId: event.id,
      },
    });

    console.log(`[Stripe Webhook] Created review request: ${reviewRequest.id}`);

    return c.json({
      received: true,
      reviewRequestId: reviewRequest.id,
    });
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

// ============================================
// WOOCOMMERCE WEBHOOK
// ============================================
webhooksEcommerceRoutes.post('/woocommerce/review', async (c) => {
  try {
    const prisma = getPrisma(c.env.DATABASE_URL);
    const rawBody = await c.req.text();
    const signature = c.req.header('x-wc-webhook-signature');
    const source = c.req.header('x-wc-webhook-source');
    const topic = c.req.header('x-wc-webhook-topic');

    // Parse body
    let order: any;
    try {
      order = JSON.parse(rawBody);
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    // Supported topics
    const supportedTopics = ['order.completed', 'order.processing', 'order.created'];
    
    if (topic && !supportedTopics.includes(topic)) {
      return c.json({ received: true, skipped: true, reason: 'Topic not supported' });
    }

    // For order.created, only process if status is processing or completed
    if (topic === 'order.created') {
      const status = order.status?.toLowerCase();
      if (status !== 'processing' && status !== 'completed') {
        return c.json({ received: true, skipped: true, reason: 'Order status not eligible' });
      }
    }

    // Find connection by shop domain
    const connection = await prisma.ecommerceConnection.findFirst({
      where: {
        platform: 'WOOCOMMERCE',
        isActive: true,
        ...(source ? { shopDomain: { contains: source.replace(/^https?:\/\//, '').replace(/\/$/, '') } } : {}),
      },
      include: {
        reviewBot: true,
      },
    });

    if (!connection || !connection.reviewBot) {
      console.log('[WooCommerce Webhook] No active connection found');
      return c.json({ received: true, skipped: true, reason: 'No connection found' });
    }

    // Verify signature
    if (connection.webhookSecret && signature) {
      const expectedSignature = await createHmacSignature(connection.webhookSecret, rawBody);
      if (signature !== expectedSignature) {
        console.error('[WooCommerce Webhook] Invalid signature');
        return c.json({ error: 'Invalid signature' }, 401);
      }
    }

    // Extract customer data
    const billing = order.billing || {};
    const customerEmail = billing.email;
    const customerName = [billing.first_name, billing.last_name].filter(Boolean).join(' ');
    const customerPhone = billing.phone;

    // Create review request
    const reviewRequest = await createReviewRequest(prisma, connection.reviewBotId, {
      orderId: order.id?.toString() || order.number?.toString(),
      orderAmount: parseFloat(order.total) || undefined,
      currency: order.currency?.toUpperCase(),
      customerEmail,
      customerName,
      customerPhone,
      platform: 'WOOCOMMERCE',
      metadata: {
        orderNumber: order.number,
        orderStatus: order.status,
        paymentMethod: order.payment_method,
        wooTopic: topic,
      },
    });

    console.log(`[WooCommerce Webhook] Created review request: ${reviewRequest.id}`);

    return c.json({
      received: true,
      reviewRequestId: reviewRequest.id,
    });
  } catch (error) {
    console.error('[WooCommerce Webhook] Error:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

// ============================================
// SHOPIFY WEBHOOK
// ============================================
webhooksEcommerceRoutes.post('/shopify/review', async (c) => {
  try {
    const prisma = getPrisma(c.env.DATABASE_URL);
    const rawBody = await c.req.text();
    const hmacHeader = c.req.header('x-shopify-hmac-sha256');
    const shopDomain = c.req.header('x-shopify-shop-domain');
    const topic = c.req.header('x-shopify-topic');

    // Parse body
    let order: any;
    try {
      order = JSON.parse(rawBody);
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    // Supported topics
    const supportedTopics = ['orders/paid', 'orders/fulfilled', 'orders/create'];
    
    if (topic && !supportedTopics.includes(topic)) {
      return c.json({ received: true, skipped: true, reason: 'Topic not supported' });
    }

    // For orders/create, only process if financial_status is paid
    if (topic === 'orders/create') {
      if (order.financial_status !== 'paid') {
        return c.json({ received: true, skipped: true, reason: 'Order not paid yet' });
      }
    }

    // Find connection by shop domain
    const connection = await prisma.ecommerceConnection.findFirst({
      where: {
        platform: 'SHOPIFY',
        isActive: true,
        ...(shopDomain ? { shopDomain: { contains: shopDomain } } : {}),
      },
      include: {
        reviewBot: true,
      },
    });

    if (!connection || !connection.reviewBot) {
      console.log('[Shopify Webhook] No active connection found');
      return c.json({ received: true, skipped: true, reason: 'No connection found' });
    }

    // Verify HMAC signature
    if (connection.webhookSecret && hmacHeader) {
      const expectedHmac = await createHmacSignature(connection.webhookSecret, rawBody);
      if (hmacHeader !== expectedHmac) {
        console.error('[Shopify Webhook] Invalid HMAC signature');
        return c.json({ error: 'Invalid signature' }, 401);
      }
    }

    // Extract customer data
    const customer = order.customer || {};
    const customerEmail = customer.email || order.email;
    const customerName = [customer.first_name, customer.last_name].filter(Boolean).join(' ');
    const customerPhone = customer.phone || order.phone;

    // Create review request
    const reviewRequest = await createReviewRequest(prisma, connection.reviewBotId, {
      orderId: order.order_number?.toString() || order.id?.toString(),
      orderAmount: parseFloat(order.total_price) || undefined,
      currency: order.currency?.toUpperCase(),
      customerEmail,
      customerName,
      customerPhone,
      platform: 'SHOPIFY',
      metadata: {
        shopifyOrderId: order.id,
        orderNumber: order.order_number,
        orderName: order.name,
        financialStatus: order.financial_status,
        fulfillmentStatus: order.fulfillment_status,
        tags: order.tags,
        shopifyTopic: topic,
      },
    });

    console.log(`[Shopify Webhook] Created review request: ${reviewRequest.id}`);

    return c.json({
      received: true,
      reviewRequestId: reviewRequest.id,
    });
  } catch (error) {
    console.error('[Shopify Webhook] Error:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

export { webhooksEcommerceRoutes };
