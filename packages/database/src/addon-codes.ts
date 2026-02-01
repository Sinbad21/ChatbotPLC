/**
 * Addon Codes - Shared constants for addon identification
 * 
 * These codes MUST match the `slug` field in the Addon table (see seed-products.ts)
 * Using constants prevents bugs when marketing slugs change.
 * 
 * Usage:
 *   import { ADDON_CODES } from '@chatbot-studio/database';
 *   const whiteLabel = await prisma.addon.findUnique({ where: { slug: ADDON_CODES.WHITE_LABEL } });
 */

export const ADDON_CODES = {
  // Feature addons
  WHITE_LABEL: 'white-label',
  EXTRA_BOT_SLOTS: 'extra-bot-slot',
  UNLIMITED_CONVERSATIONS: 'unlimited-conversations',
  BYOK: 'byok',
  SSO_SAML: 'sso-saml',
  AUDIT_LOG: 'audit-log',
  CUSTOM_REPORTING: 'custom-reporting',
  EXTRA_WORKSPACE: 'extra-workspace',
  VOICE_RECEPTIONIST: 'voice-receptionist',
  REVIEW_BOT: 'review-bot',
  PRIORITY_SUPPORT: 'priority-support',
  CUSTOM_DOMAIN: 'custom-domain',

  // Channel addons
  WHATSAPP_CHANNEL: 'whatsapp-channel',
  TELEGRAM_CHANNEL: 'telegram-channel',
  SLACK_CHANNEL: 'slack-channel',
  DISCORD_CHANNEL: 'discord-channel',

  // Integration addons
  STRIPE_INTEGRATION: 'stripe-integration',
  WOOCOMMERCE_INTEGRATION: 'woocommerce-integration',
  SHOPIFY_INTEGRATION: 'shopify-integration',
  GOOGLE_CALENDAR_INTEGRATION: 'google-calendar-integration',

  // AI addons
  EXTRA_AI_CREDITS_10K: 'extra-ai-credits-10k',
  GPT4_ACCESS: 'gpt4-access',
} as const;

export type AddonCode = typeof ADDON_CODES[keyof typeof ADDON_CODES];

// Quantity-based addon codes (can be purchased multiple times)
const QUANTITY_BASED_ADDONS: readonly string[] = [
  ADDON_CODES.EXTRA_BOT_SLOTS,
  ADDON_CODES.EXTRA_WORKSPACE,
  ADDON_CODES.EXTRA_AI_CREDITS_10K,
];

// Feature toggle addon codes (boolean on/off)
const FEATURE_TOGGLE_ADDONS: readonly string[] = [
  ADDON_CODES.WHITE_LABEL,
  ADDON_CODES.UNLIMITED_CONVERSATIONS,
  ADDON_CODES.BYOK,
  ADDON_CODES.SSO_SAML,
  ADDON_CODES.AUDIT_LOG,
  ADDON_CODES.CUSTOM_REPORTING,
  ADDON_CODES.VOICE_RECEPTIONIST,
  ADDON_CODES.REVIEW_BOT,
  ADDON_CODES.PRIORITY_SUPPORT,
  ADDON_CODES.CUSTOM_DOMAIN,
  ADDON_CODES.GPT4_ACCESS,
];

/**
 * Check if an addon is quantity-based (can be purchased multiple times)
 */
export function isQuantityBasedAddon(code: string): boolean {
  return QUANTITY_BASED_ADDONS.includes(code);
}

/**
 * Check if an addon is a feature toggle (boolean on/off)
 */
export function isFeatureToggleAddon(code: string): boolean {
  return FEATURE_TOGGLE_ADDONS.includes(code);
}
