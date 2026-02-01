/**
 * Entitlement System - Centralized source of truth for workspace limits and features
 *
 * This service aggregates:
 * - Base plan limits (maxBots, maxConversations)
 * - Active addons (extra bots, unlimited conversations, white label, etc.)
 * - Current usage (bot count, monthly conversations)
 *
 * Usage:
 *   const entitlements = await getWorkspaceEntitlements(prisma, organizationId);
 *   if (entitlements.bots.reached) { // block bot creation }
 */

import type { PrismaClient } from '@prisma/client';

// Addon codes for lookups - must match slugs in database seed
// TODO: Import from @chatbot-studio/database once package is built
// import { ADDON_CODES } from '@chatbot-studio/database';
export const ADDON_CODES = {
  EXTRA_BOT_SLOTS: 'extra-bot-slot',
  UNLIMITED_CONVERSATIONS: 'unlimited-conversations',
  WHITE_LABEL: 'white-label',
  BYOK: 'byok',
  SSO_SAML: 'sso-saml',
  AUDIT_LOG: 'audit-log',
  CUSTOM_REPORTING: 'custom-reporting',
  EXTRA_WORKSPACE: 'extra-workspace',
  VOICE_RECEPTIONIST: 'voice-receptionist',
  REVIEW_BOT: 'review-bot',
} as const;

export interface Entitlements {
  plan: {
    id: string;
    name: string;
    features: Record<string, unknown>;
  };
  bots: {
    current: number;
    limit: number;
    extraSlots: number;
    percentage: number;
    reached: boolean;
  };
  conversations: {
    current: number;
    limit: number | 'unlimited';
    percentage: number;
    reached: boolean;
    resetsAt: string;
    isUnlimited: boolean;
  };
  features: {
    whiteLabel: boolean;
    byok: boolean;
    ssoSaml: boolean;
    auditLog: boolean;
    customReporting: boolean;
    voiceReceptionist: boolean;
    reviewBot: boolean;
    leadDiscovery: boolean;
  };
  subscription: {
    status: string;
    currentPeriodEnd: string | null;
    stripeSubscriptionId: string | null;
  } | null;
  addons: Array<{
    id: string;
    slug: string;
    name: string;
    quantity: number;
    status: string;
  }>;
}

// Default free plan values
const FREE_PLAN_DEFAULTS = {
  maxBots: 1,
  maxConversations: 1000,
  features: {},
};

/**
 * Get all entitlements for a workspace (organization)
 * This is the single source of truth for limits, features, and usage
 */
export async function getWorkspaceEntitlements(
  prisma: PrismaClient,
  organizationId: string
): Promise<Entitlements> {
  // Fetch organization with subscription, plan, addons, and bot count in parallel
  const [orgData, monthlyConversations, userAddons] = await Promise.all([
    // Get org with active subscription, subscription addons, and bot count
    prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { 
            plan: true,
            // Include SubscriptionAddons from the subscription
            addons: {
              where: { status: 'ACTIVE' },
              include: { addon: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: { select: { bots: true } },
      },
    }),
    // Get monthly conversation count
    getMonthlyConversationCount(prisma, organizationId),
    // Get active addons for this organization (legacy UserAddon - fallback)
    prisma.userAddon.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
      include: {
        addon: true,
      },
    }),
  ]);

  if (!orgData) {
    throw new Error(`Organization not found: ${organizationId}`);
  }

  // Extract plan data
  const activeSub = orgData.subscriptions?.[0] ?? null;
  const plan = activeSub?.plan ?? null;

  const planId = plan?.id ?? 'free';
  const planName = plan?.name ?? 'Free';
  const planFeatures = (plan?.features as Record<string, unknown>) ?? FREE_PLAN_DEFAULTS.features;
  const baseBotLimit = plan?.maxBots ?? FREE_PLAN_DEFAULTS.maxBots;
  const baseConversationLimit = plan?.maxConversations ?? FREE_PLAN_DEFAULTS.maxConversations;

  // Build addon map from multiple sources (SubscriptionAddon takes priority over UserAddon)
  // This supports both new SubscriptionAddon model and legacy UserAddon
  type AddonEntry = { slug: string; quantity: number; id: string; name: string; status: string };
  const addonMap = new Map<string, AddonEntry>();
  
  // First, add UserAddons (legacy, lower priority)
  for (const ua of userAddons) {
    addonMap.set(ua.addon.slug, {
      slug: ua.addon.slug,
      quantity: ua.quantity,
      id: ua.id,
      name: ua.addon.name,
      status: ua.status,
    });
  }
  
  // Then, override with SubscriptionAddons (higher priority, newer model)
  const subscriptionAddons = (activeSub as any)?.addons ?? [];
  for (const sa of subscriptionAddons) {
    addonMap.set(sa.addon.slug, {
      slug: sa.addon.slug,
      quantity: sa.quantity,
      id: sa.id,
      name: sa.addon.name,
      status: sa.status,
    });
  }

  // Extra bot slots
  const extraBotAddon = addonMap.get(ADDON_CODES.EXTRA_BOT_SLOTS);
  const extraBotSlots = extraBotAddon?.quantity ?? 0;
  const totalBotLimit = baseBotLimit + extraBotSlots;

  // Unlimited conversations addon
  const unlimitedConvsAddon = addonMap.get(ADDON_CODES.UNLIMITED_CONVERSATIONS);
  const hasUnlimitedConversations = !!unlimitedConvsAddon;

  // Feature addons
  const hasWhiteLabel = !!addonMap.get(ADDON_CODES.WHITE_LABEL);
  const hasByok = !!addonMap.get(ADDON_CODES.BYOK);
  const hasSsoSaml = !!addonMap.get(ADDON_CODES.SSO_SAML);
  const hasAuditLog = !!addonMap.get(ADDON_CODES.AUDIT_LOG);
  const hasCustomReporting = !!addonMap.get(ADDON_CODES.CUSTOM_REPORTING);
  const hasVoiceReceptionist = !!addonMap.get(ADDON_CODES.VOICE_RECEPTIONIST);
  const hasReviewBot = !!addonMap.get(ADDON_CODES.REVIEW_BOT) || (planFeatures.reviewBot === true);

  // Lead discovery from plan features
  const hasLeadDiscovery = planFeatures.leadDiscovery === true || planName.toLowerCase() !== 'free';

  // Current usage
  const currentBots = orgData._count.bots;
  const currentConversations = monthlyConversations.count;

  // Calculate percentages and reached status
  const botsPercentage = Math.min(100, Math.round((currentBots / totalBotLimit) * 100));
  const botsReached = currentBots >= totalBotLimit;

  const convsPercentage = hasUnlimitedConversations
    ? 0
    : Math.min(100, Math.round((currentConversations / baseConversationLimit) * 100));
  const convsReached = hasUnlimitedConversations ? false : currentConversations >= baseConversationLimit;

  // Build addons array for UI (from merged addonMap)
  const addonsArray = Array.from(addonMap.values()).map((entry) => ({
    id: entry.id,
    slug: entry.slug,
    name: entry.name,
    quantity: entry.quantity,
    status: entry.status,
  }));

  return {
    plan: {
      id: planId,
      name: planName,
      features: planFeatures,
    },
    bots: {
      current: currentBots,
      limit: totalBotLimit,
      extraSlots: extraBotSlots,
      percentage: botsPercentage,
      reached: botsReached,
    },
    conversations: {
      current: currentConversations,
      limit: hasUnlimitedConversations ? 'unlimited' : baseConversationLimit,
      percentage: convsPercentage,
      reached: convsReached,
      resetsAt: monthlyConversations.resetsAt,
      isUnlimited: hasUnlimitedConversations,
    },
    features: {
      whiteLabel: hasWhiteLabel,
      byok: hasByok,
      ssoSaml: hasSsoSaml,
      auditLog: hasAuditLog,
      customReporting: hasCustomReporting,
      voiceReceptionist: hasVoiceReceptionist,
      reviewBot: hasReviewBot,
      leadDiscovery: hasLeadDiscovery,
    },
    subscription: activeSub
      ? {
          status: activeSub.status,
          currentPeriodEnd: activeSub.currentPeriodEnd?.toISOString() ?? null,
          stripeSubscriptionId: activeSub.stripeSubscriptionId ?? null,
        }
      : null,
    addons: addonsArray,
  };
}

/**
 * Get monthly conversation count for an organization
 * 
 * Usage period: Current calendar month (1st of month 00:00:00 UTC to end of month)
 * This is NOT aligned to billing period - it resets on the 1st of each month.
 * 
 * TODO: Consider aligning to subscription billing period (currentPeriodStart/End)
 * for more accurate usage tracking relative to billing cycles.
 */
async function getMonthlyConversationCount(
  prisma: PrismaClient,
  organizationId: string
): Promise<{ count: number; resetsAt: string }> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const nextMonth = new Date(startOfMonth);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const count = await prisma.conversation.count({
    where: {
      bot: { organizationId },
      createdAt: { gte: startOfMonth },
    },
  });

  return {
    count,
    resetsAt: nextMonth.toISOString(),
  };
}

/**
 * Quick check if bot creation is allowed
 */
export async function canCreateBot(
  prisma: PrismaClient,
  organizationId: string
): Promise<{ allowed: boolean; reason?: string; entitlements: Entitlements }> {
  const entitlements = await getWorkspaceEntitlements(prisma, organizationId);

  if (entitlements.bots.reached) {
    return {
      allowed: false,
      reason: `Bot limit reached (${entitlements.bots.current}/${entitlements.bots.limit}). Upgrade your plan or add extra bot slots.`,
      entitlements,
    };
  }

  return { allowed: true, entitlements };
}

/**
 * Quick check if conversation creation is allowed
 */
export async function canCreateConversation(
  prisma: PrismaClient,
  organizationId: string
): Promise<{ allowed: boolean; reason?: string; entitlements: Entitlements }> {
  const entitlements = await getWorkspaceEntitlements(prisma, organizationId);

  if (entitlements.conversations.reached) {
    return {
      allowed: false,
      reason: `Monthly conversation limit reached (${entitlements.conversations.current}/${entitlements.conversations.limit}). Upgrade to unlimited.`,
      entitlements,
    };
  }

  return { allowed: true, entitlements };
}

/**
 * Check if a specific feature is enabled
 */
export async function hasFeature(
  prisma: PrismaClient,
  organizationId: string,
  feature: keyof Entitlements['features']
): Promise<boolean> {
  const entitlements = await getWorkspaceEntitlements(prisma, organizationId);
  return entitlements.features[feature];
}
