/**
 * Entitlements Route
 * 
 * GET /api/v1/entitlements - Get workspace entitlements for the authenticated user
 */

import { Hono } from 'hono';
import { getWorkspaceEntitlements } from '../services/entitlements';
import { getPrisma } from '../db';

type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  [key: string]: string | undefined;
};

type Variables = {
  user: {
    userId: string;
    email: string;
  };
};

const entitlementsRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * GET /api/v1/entitlements
 * 
 * Returns the complete entitlements for the user's current organization.
 * This is the single source of truth for:
 * - Bot limits and usage
 * - Conversation limits and usage
 * - Feature flags (white label, BYOK, etc.)
 * - Active addons
 * - Subscription status
 */
entitlementsRoutes.get('/', async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');

    // Get user's primary organization
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!membership) {
      return c.json({ error: 'No organization found for this user' }, 404);
    }

    const entitlements = await getWorkspaceEntitlements(prisma, membership.organizationId);

    return c.json(entitlements);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GET /api/v1/entitlements] Error:', message);
    
    // Handle specific errors with appropriate status codes
    if (message.includes('Organization not found')) {
      return c.json({ error: 'Organization not found or not provisioned', message }, 404);
    }
    
    return c.json({ error: 'Failed to fetch entitlements', message }, 500);
  }
});

/**
 * GET /api/v1/entitlements/check/:feature
 * 
 * Quick check if a specific feature is enabled.
 * Returns { enabled: true/false, entitlements: {...} }
 */
entitlementsRoutes.get('/check/:feature', async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');
    const feature = c.req.param('feature');

    const validFeatures = [
      'whiteLabel',
      'byok',
      'ssoSaml',
      'auditLog',
      'customReporting',
      'voiceReceptionist',
      'reviewBot',
      'leadDiscovery',
    ];

    if (!validFeatures.includes(feature)) {
      return c.json({ error: `Invalid feature: ${feature}. Valid features: ${validFeatures.join(', ')}` }, 400);
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!membership) {
      return c.json({ error: 'No organization found for this user' }, 404);
    }

    const entitlements = await getWorkspaceEntitlements(prisma, membership.organizationId);
    const enabled = entitlements.features[feature as keyof typeof entitlements.features] ?? false;

    return c.json({ feature, enabled, entitlements });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GET /api/v1/entitlements/check] Error:', message);
    return c.json({ error: 'Failed to check feature', message }, 500);
  }
});

/**
 * GET /api/v1/entitlements/can-create-bot
 * 
 * Quick check if the user can create a new bot.
 * Returns { allowed: true/false, reason?: string, entitlements: {...} }
 */
entitlementsRoutes.get('/can-create-bot', async (c) => {
  try {
    const prisma = getPrisma(c.env);
    const user = c.get('user');

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.userId },
      select: { organizationId: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!membership) {
      return c.json({ error: 'No organization found for this user' }, 404);
    }

    const entitlements = await getWorkspaceEntitlements(prisma, membership.organizationId);
    const allowed = !entitlements.bots.reached;
    const reason = allowed
      ? undefined
      : `Bot limit reached (${entitlements.bots.current}/${entitlements.bots.limit}). Upgrade your plan or add extra bot slots.`;

    return c.json({ allowed, reason, entitlements });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GET /api/v1/entitlements/can-create-bot] Error:', message);
    return c.json({ error: 'Failed to check bot creation', message }, 500);
  }
});

export { entitlementsRoutes };
