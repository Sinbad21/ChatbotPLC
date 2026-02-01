/**
 * Stripe Price ID Mapping - Single Source of Truth
 * 
 * This file centralizes all Stripe Price ID mappings to avoid string-magic
 * and ensure type safety across the billing system.
 * 
 * Price IDs are read from environment variables at runtime.
 * Set the following env vars in your Cloudflare Workers / .dev.vars:
 * 
 * STRIPE_PRICE_STARTER_MONTHLY=price_1xxx...
 * STRIPE_PRICE_STARTER_YEARLY=price_1xxx...
 * STRIPE_PRICE_PRO_MONTHLY=price_1xxx...
 * etc.
 * 
 * Naming convention:
 * - STRIPE_PRICE_{PLAN/ADDON}_{MONTHLY|YEARLY}
 */

import { ADDON_CODES, type AddonCode } from './addon-codes';

// ============================================
// ENVIRONMENT CONFIGURATION
// ============================================

/**
 * Type for the Stripe environment configuration
 * This should be passed from the Worker's env bindings
 */
export interface StripeEnvConfig {
  // Plan prices
  STRIPE_PRICE_STARTER_MONTHLY?: string;
  STRIPE_PRICE_STARTER_YEARLY?: string;
  STRIPE_PRICE_PRO_MONTHLY?: string;
  STRIPE_PRICE_PRO_YEARLY?: string;
  STRIPE_PRICE_ENT_MONTHLY?: string;
  STRIPE_PRICE_ENT_YEARLY?: string;
  
  // Addon prices
  STRIPE_PRICE_WHITE_LABEL_MONTHLY?: string;
  STRIPE_PRICE_WHITE_LABEL_YEARLY?: string;
  STRIPE_PRICE_EXTRA_BOT_MONTHLY?: string;
  STRIPE_PRICE_EXTRA_BOT_YEARLY?: string;
  STRIPE_PRICE_UNLIMITED_CONV_MONTHLY?: string;
  STRIPE_PRICE_UNLIMITED_CONV_YEARLY?: string;
  STRIPE_PRICE_BYOK_MONTHLY?: string;
  STRIPE_PRICE_SSO_MONTHLY?: string;
  STRIPE_PRICE_AUDIT_MONTHLY?: string;
  STRIPE_PRICE_REPORTING_MONTHLY?: string;
  STRIPE_PRICE_EXTRA_WS_MONTHLY?: string;
  STRIPE_PRICE_VOICE_MONTHLY?: string;
  STRIPE_PRICE_REVIEW_MONTHLY?: string;
  STRIPE_PRICE_PRIORITY_MONTHLY?: string;
  STRIPE_PRICE_DOMAIN_MONTHLY?: string;
  STRIPE_PRICE_WHATSAPP_MONTHLY?: string;
  STRIPE_PRICE_TELEGRAM_MONTHLY?: string;
  STRIPE_PRICE_SLACK_MONTHLY?: string;
  STRIPE_PRICE_DISCORD_MONTHLY?: string;
  STRIPE_PRICE_STRIPE_INT_MONTHLY?: string;
  STRIPE_PRICE_WOO_MONTHLY?: string;
  STRIPE_PRICE_SHOPIFY_MONTHLY?: string;
  STRIPE_PRICE_GCAL_MONTHLY?: string;
  STRIPE_PRICE_AI_10K_MONTHLY?: string;
  STRIPE_PRICE_GPT4_MONTHLY?: string;
  
  // Product IDs (optional, for reference)
  STRIPE_PRODUCT_STARTER?: string;
  STRIPE_PRODUCT_PRO?: string;
  STRIPE_PRODUCT_ENT?: string;
  
  [key: string]: string | undefined;
}

/**
 * Global env config holder - must be initialized before using mapping functions
 * Call initStripeConfig(env) at worker startup
 */
let stripeEnv: StripeEnvConfig | null = null;

/**
 * Initialize Stripe configuration from environment
 * Call this once at worker startup with the env bindings
 */
export function initStripeConfig(env: StripeEnvConfig): void {
  stripeEnv = env;
}

/**
 * Get current Stripe env config (throws if not initialized)
 */
function getEnv(): StripeEnvConfig {
  if (!stripeEnv) {
    throw new Error(
      'Stripe config not initialized. Call initStripeConfig(env) at worker startup.'
    );
  }
  return stripeEnv;
}

/**
 * Check if Stripe is properly configured (has at least one price ID)
 */
export function isStripeConfigured(): boolean {
  if (!stripeEnv) return false;
  
  // Check if at least one plan price is configured
  return !!(
    stripeEnv.STRIPE_PRICE_STARTER_MONTHLY ||
    stripeEnv.STRIPE_PRICE_PRO_MONTHLY ||
    stripeEnv.STRIPE_PRICE_ENT_MONTHLY
  );
}

// ============================================
// PLAN MAPPINGS (Dynamic from env)
// ============================================

export interface StripePlanMapping {
  planId: string;           // Internal plan ID (from database)
  planName: string;         // Human-readable name
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  stripeProductId: string | null;
}

/**
 * Get plan mappings dynamically from environment
 * Returns mapping with actual Stripe Price IDs from env vars
 */
export function getPlanToStripe(): Record<string, StripePlanMapping> {
  const env = getEnv();
  
  return {
    free: {
      planId: 'free',
      planName: 'Free',
      stripePriceIdMonthly: null, // Free plan has no Stripe price
      stripePriceIdYearly: null,
      stripeProductId: null,
    },
    starter: {
      planId: 'starter',
      planName: 'Chatbot Starter',
      stripePriceIdMonthly: env.STRIPE_PRICE_STARTER_MONTHLY || null,
      stripePriceIdYearly: env.STRIPE_PRICE_STARTER_YEARLY || null,
      stripeProductId: env.STRIPE_PRODUCT_STARTER || null,
    },
    professional: {
      planId: 'professional',
      planName: 'Chatbot Professional',
      stripePriceIdMonthly: env.STRIPE_PRICE_PRO_MONTHLY || null,
      stripePriceIdYearly: env.STRIPE_PRICE_PRO_YEARLY || null,
      stripeProductId: env.STRIPE_PRODUCT_PRO || null,
    },
    enterprise: {
      planId: 'enterprise',
      planName: 'Chatbot Enterprise',
      stripePriceIdMonthly: env.STRIPE_PRICE_ENT_MONTHLY || null,
      stripePriceIdYearly: env.STRIPE_PRICE_ENT_YEARLY || null,
      stripeProductId: env.STRIPE_PRODUCT_ENT || null,
    },
  };
}

/**
 * @deprecated Use getPlanToStripe() for dynamic env-based mapping
 * Kept for backwards compatibility during migration
 */
export const PLAN_TO_STRIPE: Record<string, StripePlanMapping> = {
  free: {
    planId: 'free',
    planName: 'Free',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeProductId: null,
  },
  starter: {
    planId: 'starter',
    planName: 'Chatbot Starter',
    stripePriceIdMonthly: null, // Set via env
    stripePriceIdYearly: null,
    stripeProductId: null,
  },
  professional: {
    planId: 'professional',
    planName: 'Chatbot Professional',
    stripePriceIdMonthly: null, // Set via env
    stripePriceIdYearly: null,
    stripeProductId: null,
  },
  enterprise: {
    planId: 'enterprise',
    planName: 'Chatbot Enterprise',
    stripePriceIdMonthly: null, // Set via env
    stripePriceIdYearly: null,
    stripeProductId: null,
  },
};

// ============================================
// ADDON MAPPINGS (Dynamic from env)
// ============================================

export interface StripeAddonMapping {
  addonCode: AddonCode;
  addonName: string;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  stripeProductId: string | null;
  isQuantityBased: boolean; // true = can purchase multiple (e.g., extra bot slots)
}

/**
 * Get addon mappings dynamically from environment
 * Returns mapping with actual Stripe Price IDs from env vars
 */
export function getAddonToStripe(): Record<AddonCode, StripeAddonMapping> {
  const env = getEnv();
  
  return {
    [ADDON_CODES.WHITE_LABEL]: {
      addonCode: ADDON_CODES.WHITE_LABEL,
      addonName: 'White Label',
      stripePriceIdMonthly: env.STRIPE_PRICE_WHITE_LABEL_MONTHLY || null,
      stripePriceIdYearly: env.STRIPE_PRICE_WHITE_LABEL_YEARLY || null,
      stripeProductId: null,
      isQuantityBased: false,
    },
    [ADDON_CODES.EXTRA_BOT_SLOTS]: {
      addonCode: ADDON_CODES.EXTRA_BOT_SLOTS,
      addonName: 'Extra Bot Slots',
      stripePriceIdMonthly: env.STRIPE_PRICE_EXTRA_BOT_MONTHLY || null,
      stripePriceIdYearly: env.STRIPE_PRICE_EXTRA_BOT_YEARLY || null,
      stripeProductId: null,
      isQuantityBased: true,
    },
    [ADDON_CODES.UNLIMITED_CONVERSATIONS]: {
      addonCode: ADDON_CODES.UNLIMITED_CONVERSATIONS,
      addonName: 'Unlimited Conversations',
      stripePriceIdMonthly: env.STRIPE_PRICE_UNLIMITED_CONV_MONTHLY || null,
      stripePriceIdYearly: env.STRIPE_PRICE_UNLIMITED_CONV_YEARLY || null,
      stripeProductId: null,
      isQuantityBased: false,
    },
    [ADDON_CODES.BYOK]: {
      addonCode: ADDON_CODES.BYOK,
      addonName: 'BYOK (Bring Your Own Key)',
      stripePriceIdMonthly: env.STRIPE_PRICE_BYOK_MONTHLY || null,
      stripePriceIdYearly: null,
      stripeProductId: null,
      isQuantityBased: false,
    },
    [ADDON_CODES.SSO_SAML]: {
      addonCode: ADDON_CODES.SSO_SAML,
      addonName: 'SSO SAML',
      stripePriceIdMonthly: env.STRIPE_PRICE_SSO_MONTHLY || null,
      stripePriceIdYearly: null,
      stripeProductId: null,
      isQuantityBased: false,
    },
    [ADDON_CODES.AUDIT_LOG]: {
      addonCode: ADDON_CODES.AUDIT_LOG,
      addonName: 'Audit Log',
      stripePriceIdMonthly: env.STRIPE_PRICE_AUDIT_MONTHLY || null,
      stripePriceIdYearly: null,
      stripeProductId: null,
      isQuantityBased: false,
    },
    [ADDON_CODES.CUSTOM_REPORTING]: {
      addonCode: ADDON_CODES.CUSTOM_REPORTING,
      addonName: 'Custom Reporting',
      stripePriceIdMonthly: env.STRIPE_PRICE_REPORTING_MONTHLY || null,
      stripePriceIdYearly: null,
      stripeProductId: null,
      isQuantityBased: false,
    },
    [ADDON_CODES.EXTRA_WORKSPACE]: {
      addonCode: ADDON_CODES.EXTRA_WORKSPACE,
      addonName: 'Extra Workspace',
      stripePriceIdMonthly: env.STRIPE_PRICE_EXTRA_WS_MONTHLY || null,
      stripePriceIdYearly: null,
      stripeProductId: null,
      isQuantityBased: true,
    },
    [ADDON_CODES.VOICE_RECEPTIONIST]: {
      addonCode: ADDON_CODES.VOICE_RECEPTIONIST,
      addonName: 'Voice Receptionist',
      stripePriceIdMonthly: env.STRIPE_PRICE_VOICE_MONTHLY || null,
      stripePriceIdYearly: null,
      stripeProductId: null,
      isQuantityBased: false,
    },
    [ADDON_CODES.REVIEW_BOT]: {
      addonCode: ADDON_CODES.REVIEW_BOT,
      addonName: 'Review Bot',
      stripePriceIdMonthly: env.STRIPE_PRICE_REVIEW_MONTHLY || null,
      stripePriceIdYearly: null,
      stripeProductId: null,
      isQuantityBased: false,
    },
    [ADDON_CODES.PRIORITY_SUPPORT]: {
      addonCode: ADDON_CODES.PRIORITY_SUPPORT,
      addonName: 'Priority Support',
      stripePriceIdMonthly: env.STRIPE_PRICE_PRIORITY_MONTHLY || null,
      stripePriceIdYearly: null,
      stripeProductId: null,
      isQuantityBased: false,
    },
    [ADDON_CODES.CUSTOM_DOMAIN]: {
      addonCode: ADDON_CODES.CUSTOM_DOMAIN,
      addonName: 'Custom Domain',
      stripePriceIdMonthly: env.STRIPE_PRICE_DOMAIN_MONTHLY || null,
      stripePriceIdYearly: null,
      stripeProductId: null,
      isQuantityBased: false,
    },
    // Channel addons
    [ADDON_CODES.WHATSAPP_CHANNEL]: {
      addonCode: ADDON_CODES.WHATSAPP_CHANNEL,
      addonName: 'WhatsApp Channel',
      stripePriceIdMonthly: env.STRIPE_PRICE_WHATSAPP_MONTHLY || null,
      stripePriceIdYearly: null,
      stripeProductId: null,
      isQuantityBased: false,
    },
    [ADDON_CODES.TELEGRAM_CHANNEL]: {
      addonCode: ADDON_CODES.TELEGRAM_CHANNEL,
      addonName: 'Telegram Channel',
      stripePriceIdMonthly: env.STRIPE_PRICE_TELEGRAM_MONTHLY || null,
      stripePriceIdYearly: null,
      stripeProductId: null,
      isQuantityBased: false,
    },
    [ADDON_CODES.SLACK_CHANNEL]: {
      addonCode: ADDON_CODES.SLACK_CHANNEL,
      addonName: 'Slack Channel',
      stripePriceIdMonthly: env.STRIPE_PRICE_SLACK_MONTHLY || null,
      stripePriceIdYearly: null,
      stripeProductId: null,
      isQuantityBased: false,
    },
    [ADDON_CODES.DISCORD_CHANNEL]: {
      addonCode: ADDON_CODES.DISCORD_CHANNEL,
      addonName: 'Discord Channel',
      stripePriceIdMonthly: env.STRIPE_PRICE_DISCORD_MONTHLY || null,
      stripePriceIdYearly: null,
      stripeProductId: null,
      isQuantityBased: false,
    },
    // Integration addons
    [ADDON_CODES.STRIPE_INTEGRATION]: {
      addonCode: ADDON_CODES.STRIPE_INTEGRATION,
      addonName: 'Stripe Integration',
      stripePriceIdMonthly: env.STRIPE_PRICE_STRIPE_INT_MONTHLY || null,
      stripePriceIdYearly: null,
      stripeProductId: null,
      isQuantityBased: false,
    },
    [ADDON_CODES.WOOCOMMERCE_INTEGRATION]: {
      addonCode: ADDON_CODES.WOOCOMMERCE_INTEGRATION,
      addonName: 'WooCommerce Integration',
      stripePriceIdMonthly: env.STRIPE_PRICE_WOO_MONTHLY || null,
      stripePriceIdYearly: null,
      stripeProductId: null,
      isQuantityBased: false,
    },
    [ADDON_CODES.SHOPIFY_INTEGRATION]: {
      addonCode: ADDON_CODES.SHOPIFY_INTEGRATION,
      addonName: 'Shopify Integration',
      stripePriceIdMonthly: env.STRIPE_PRICE_SHOPIFY_MONTHLY || null,
      stripePriceIdYearly: null,
      stripeProductId: null,
      isQuantityBased: false,
    },
    [ADDON_CODES.GOOGLE_CALENDAR_INTEGRATION]: {
      addonCode: ADDON_CODES.GOOGLE_CALENDAR_INTEGRATION,
      addonName: 'Google Calendar Integration',
      stripePriceIdMonthly: env.STRIPE_PRICE_GCAL_MONTHLY || null,
      stripePriceIdYearly: null,
      stripeProductId: null,
      isQuantityBased: false,
    },
    // AI addons
    [ADDON_CODES.EXTRA_AI_CREDITS_10K]: {
      addonCode: ADDON_CODES.EXTRA_AI_CREDITS_10K,
      addonName: 'Extra AI Credits (10K)',
      stripePriceIdMonthly: env.STRIPE_PRICE_AI_10K_MONTHLY || null,
      stripePriceIdYearly: null,
      stripeProductId: null,
      isQuantityBased: true,
    },
    [ADDON_CODES.GPT4_ACCESS]: {
      addonCode: ADDON_CODES.GPT4_ACCESS,
      addonName: 'GPT-4 Access',
      stripePriceIdMonthly: env.STRIPE_PRICE_GPT4_MONTHLY || null,
      stripePriceIdYearly: null,
      stripeProductId: null,
      isQuantityBased: false,
    },
  };
}

/**
 * @deprecated Use getAddonToStripe() for dynamic env-based mapping
 * Kept for backwards compatibility - returns empty mappings
 */
export const ADDON_TO_STRIPE: Record<AddonCode, StripeAddonMapping> = {
  [ADDON_CODES.WHITE_LABEL]: {
    addonCode: ADDON_CODES.WHITE_LABEL,
    addonName: 'White Label',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeProductId: null,
    isQuantityBased: false,
  },
  [ADDON_CODES.EXTRA_BOT_SLOTS]: {
    addonCode: ADDON_CODES.EXTRA_BOT_SLOTS,
    addonName: 'Extra Bot Slots',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeProductId: null,
    isQuantityBased: true,
  },
  [ADDON_CODES.UNLIMITED_CONVERSATIONS]: {
    addonCode: ADDON_CODES.UNLIMITED_CONVERSATIONS,
    addonName: 'Unlimited Conversations',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeProductId: null,
    isQuantityBased: false,
  },
  [ADDON_CODES.BYOK]: {
    addonCode: ADDON_CODES.BYOK,
    addonName: 'BYOK (Bring Your Own Key)',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeProductId: null,
    isQuantityBased: false,
  },
  [ADDON_CODES.SSO_SAML]: {
    addonCode: ADDON_CODES.SSO_SAML,
    addonName: 'SSO SAML',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeProductId: null,
    isQuantityBased: false,
  },
  [ADDON_CODES.AUDIT_LOG]: {
    addonCode: ADDON_CODES.AUDIT_LOG,
    addonName: 'Audit Log',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeProductId: null,
    isQuantityBased: false,
  },
  [ADDON_CODES.CUSTOM_REPORTING]: {
    addonCode: ADDON_CODES.CUSTOM_REPORTING,
    addonName: 'Custom Reporting',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeProductId: null,
    isQuantityBased: false,
  },
  [ADDON_CODES.EXTRA_WORKSPACE]: {
    addonCode: ADDON_CODES.EXTRA_WORKSPACE,
    addonName: 'Extra Workspace',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeProductId: null,
    isQuantityBased: true,
  },
  [ADDON_CODES.VOICE_RECEPTIONIST]: {
    addonCode: ADDON_CODES.VOICE_RECEPTIONIST,
    addonName: 'Voice Receptionist',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeProductId: null,
    isQuantityBased: false,
  },
  [ADDON_CODES.REVIEW_BOT]: {
    addonCode: ADDON_CODES.REVIEW_BOT,
    addonName: 'Review Bot',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeProductId: null,
    isQuantityBased: false,
  },
  [ADDON_CODES.PRIORITY_SUPPORT]: {
    addonCode: ADDON_CODES.PRIORITY_SUPPORT,
    addonName: 'Priority Support',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeProductId: null,
    isQuantityBased: false,
  },
  [ADDON_CODES.CUSTOM_DOMAIN]: {
    addonCode: ADDON_CODES.CUSTOM_DOMAIN,
    addonName: 'Custom Domain',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeProductId: null,
    isQuantityBased: false,
  },
  [ADDON_CODES.WHATSAPP_CHANNEL]: {
    addonCode: ADDON_CODES.WHATSAPP_CHANNEL,
    addonName: 'WhatsApp Channel',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeProductId: null,
    isQuantityBased: false,
  },
  [ADDON_CODES.TELEGRAM_CHANNEL]: {
    addonCode: ADDON_CODES.TELEGRAM_CHANNEL,
    addonName: 'Telegram Channel',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeProductId: null,
    isQuantityBased: false,
  },
  [ADDON_CODES.SLACK_CHANNEL]: {
    addonCode: ADDON_CODES.SLACK_CHANNEL,
    addonName: 'Slack Channel',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeProductId: null,
    isQuantityBased: false,
  },
  [ADDON_CODES.DISCORD_CHANNEL]: {
    addonCode: ADDON_CODES.DISCORD_CHANNEL,
    addonName: 'Discord Channel',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeProductId: null,
    isQuantityBased: false,
  },
  [ADDON_CODES.STRIPE_INTEGRATION]: {
    addonCode: ADDON_CODES.STRIPE_INTEGRATION,
    addonName: 'Stripe Integration',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeProductId: null,
    isQuantityBased: false,
  },
  [ADDON_CODES.WOOCOMMERCE_INTEGRATION]: {
    addonCode: ADDON_CODES.WOOCOMMERCE_INTEGRATION,
    addonName: 'WooCommerce Integration',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeProductId: null,
    isQuantityBased: false,
  },
  [ADDON_CODES.SHOPIFY_INTEGRATION]: {
    addonCode: ADDON_CODES.SHOPIFY_INTEGRATION,
    addonName: 'Shopify Integration',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeProductId: null,
    isQuantityBased: false,
  },
  [ADDON_CODES.GOOGLE_CALENDAR_INTEGRATION]: {
    addonCode: ADDON_CODES.GOOGLE_CALENDAR_INTEGRATION,
    addonName: 'Google Calendar Integration',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeProductId: null,
    isQuantityBased: false,
  },
  [ADDON_CODES.EXTRA_AI_CREDITS_10K]: {
    addonCode: ADDON_CODES.EXTRA_AI_CREDITS_10K,
    addonName: 'Extra AI Credits (10K)',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeProductId: null,
    isQuantityBased: true,
  },
  [ADDON_CODES.GPT4_ACCESS]: {
    addonCode: ADDON_CODES.GPT4_ACCESS,
    addonName: 'GPT-4 Access',
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    stripeProductId: null,
    isQuantityBased: false,
  },
};

// ============================================
// LOOKUP FUNCTIONS (Dynamic - use env-based mappings)
// ============================================

/**
 * Get Stripe Price ID from plan ID (uses dynamic env config)
 */
export function getStripePriceIdForPlan(
  planId: string,
  interval: 'monthly' | 'yearly' = 'monthly'
): string | null {
  const mappings = getPlanToStripe();
  const mapping = mappings[planId.toLowerCase()];
  if (!mapping) return null;
  return interval === 'monthly' 
    ? mapping.stripePriceIdMonthly 
    : mapping.stripePriceIdYearly;
}

/**
 * Get Stripe Price ID from addon code (uses dynamic env config)
 */
export function getStripePriceIdForAddon(
  addonCode: AddonCode,
  interval: 'monthly' | 'yearly' = 'monthly'
): string | null {
  const mappings = getAddonToStripe();
  const mapping = mappings[addonCode];
  if (!mapping) return null;
  return interval === 'monthly'
    ? mapping.stripePriceIdMonthly
    : mapping.stripePriceIdYearly;
}

/**
 * Reverse lookup: Get plan ID from Stripe Price ID (uses dynamic env config)
 */
export function getPlanIdFromStripePriceId(stripePriceId: string): string | null {
  const mappings = getPlanToStripe();
  for (const [planId, mapping] of Object.entries(mappings)) {
    if (
      mapping.stripePriceIdMonthly === stripePriceId ||
      mapping.stripePriceIdYearly === stripePriceId
    ) {
      return planId;
    }
  }
  return null;
}

/**
 * Reverse lookup: Get addon code from Stripe Price ID (uses dynamic env config)
 */
export function getAddonCodeFromStripePriceId(stripePriceId: string): AddonCode | null {
  const mappings = getAddonToStripe();
  for (const [addonCode, mapping] of Object.entries(mappings)) {
    if (
      mapping.stripePriceIdMonthly === stripePriceId ||
      mapping.stripePriceIdYearly === stripePriceId
    ) {
      return addonCode as AddonCode;
    }
  }
  return null;
}

/**
 * Check if a Stripe Price ID is for a plan (vs addon)
 */
export function isPlanPriceId(stripePriceId: string): boolean {
  return getPlanIdFromStripePriceId(stripePriceId) !== null;
}

/**
 * Check if a Stripe Price ID is for an addon
 */
export function isAddonPriceId(stripePriceId: string): boolean {
  return getAddonCodeFromStripePriceId(stripePriceId) !== null;
}
