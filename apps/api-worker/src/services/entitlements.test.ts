/**
 * Unit tests for Entitlements Service
 *
 * Tests combinations of:
 * - Plan limits (maxBots, maxConversations)
 * - Addons (extraBots, unlimitedConversations, whiteLabel)
 * - Feature flags
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getWorkspaceEntitlements,
  canCreateBot,
  canCreateConversation,
  hasFeature,
  ADDON_CODES,
  type Entitlements,
} from './entitlements';

// Mock Prisma client
const mockPrisma = {
  organization: {
    findUnique: vi.fn(),
  },
  conversation: {
    count: vi.fn(),
  },
  userAddon: {
    findMany: vi.fn(),
  },
};

describe('Entitlements Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: start of current month
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15'));
  });

  describe('getWorkspaceEntitlements', () => {
    it('returns free plan defaults when no subscription exists', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_test',
        subscriptions: [],
        _count: { bots: 0 },
      });
      mockPrisma.conversation.count.mockResolvedValue(50);
      mockPrisma.userAddon.findMany.mockResolvedValue([]);

      const entitlements = await getWorkspaceEntitlements(
        mockPrisma as any,
        'org_test'
      );

      expect(entitlements.plan.id).toBe('free');
      expect(entitlements.plan.name).toBe('Free');
      expect(entitlements.bots.limit).toBe(1);
      expect(entitlements.bots.extraSlots).toBe(0);
      expect(entitlements.conversations.limit).toBe(1000);
      expect(entitlements.conversations.isUnlimited).toBe(false);
      expect(entitlements.features.whiteLabel).toBe(false);
    });

    it('returns plan limits from active subscription', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_test',
        subscriptions: [
          {
            id: 'sub_123',
            status: 'ACTIVE',
            plan: {
              id: 'plan_pro',
              name: 'Professional',
              maxBots: 3,
              maxConversations: 10000,
              features: { analytics: true },
            },
            currentPeriodEnd: new Date('2026-02-15'),
            stripeSubscriptionId: 'stripe_sub_xxx',
          },
        ],
        _count: { bots: 2 },
      });
      mockPrisma.conversation.count.mockResolvedValue(5000);
      mockPrisma.userAddon.findMany.mockResolvedValue([]);

      const entitlements = await getWorkspaceEntitlements(
        mockPrisma as any,
        'org_test'
      );

      expect(entitlements.plan.id).toBe('plan_pro');
      expect(entitlements.plan.name).toBe('Professional');
      expect(entitlements.bots.limit).toBe(3);
      expect(entitlements.bots.current).toBe(2);
      expect(entitlements.bots.reached).toBe(false);
      expect(entitlements.conversations.limit).toBe(10000);
      expect(entitlements.conversations.percentage).toBe(50);
    });

    it('calculates extraBotSlots from addon quantity', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_test',
        subscriptions: [
          {
            id: 'sub_123',
            status: 'ACTIVE',
            plan: {
              id: 'plan_starter',
              name: 'Starter',
              maxBots: 1,
              maxConversations: 1000,
              features: {},
            },
            currentPeriodEnd: new Date('2026-02-15'),
            stripeSubscriptionId: null,
          },
        ],
        _count: { bots: 3 },
      });
      mockPrisma.conversation.count.mockResolvedValue(100);
      mockPrisma.userAddon.findMany.mockResolvedValue([
        {
          id: 'ua_1',
          status: 'ACTIVE',
          quantity: 5,
          addon: {
            id: 'addon_extra_bot',
            slug: ADDON_CODES.EXTRA_BOT_SLOTS,
            name: 'Extra Bot Slots',
          },
        },
      ]);

      const entitlements = await getWorkspaceEntitlements(
        mockPrisma as any,
        'org_test'
      );

      expect(entitlements.bots.limit).toBe(6); // 1 base + 5 extra
      expect(entitlements.bots.extraSlots).toBe(5);
      expect(entitlements.bots.current).toBe(3);
      expect(entitlements.bots.reached).toBe(false);
      expect(entitlements.addons).toHaveLength(1);
      expect(entitlements.addons[0].quantity).toBe(5);
    });

    it('sets unlimited conversations when addon is active', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_test',
        subscriptions: [
          {
            id: 'sub_123',
            status: 'ACTIVE',
            plan: {
              id: 'plan_starter',
              name: 'Starter',
              maxBots: 1,
              maxConversations: 1000,
              features: {},
            },
            currentPeriodEnd: new Date('2026-02-15'),
            stripeSubscriptionId: null,
          },
        ],
        _count: { bots: 1 },
      });
      mockPrisma.conversation.count.mockResolvedValue(99999);
      mockPrisma.userAddon.findMany.mockResolvedValue([
        {
          id: 'ua_2',
          status: 'ACTIVE',
          quantity: 1,
          addon: {
            id: 'addon_unlimited',
            slug: ADDON_CODES.UNLIMITED_CONVERSATIONS,
            name: 'Unlimited Conversations',
          },
        },
      ]);

      const entitlements = await getWorkspaceEntitlements(
        mockPrisma as any,
        'org_test'
      );

      expect(entitlements.conversations.limit).toBe('unlimited');
      expect(entitlements.conversations.isUnlimited).toBe(true);
      expect(entitlements.conversations.reached).toBe(false);
      expect(entitlements.conversations.percentage).toBe(0);
    });

    it('sets whiteLabel false by default', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_test',
        subscriptions: [],
        _count: { bots: 0 },
      });
      mockPrisma.conversation.count.mockResolvedValue(0);
      mockPrisma.userAddon.findMany.mockResolvedValue([]);

      const entitlements = await getWorkspaceEntitlements(
        mockPrisma as any,
        'org_test'
      );

      expect(entitlements.features.whiteLabel).toBe(false);
    });

    it('sets whiteLabel true when addon is active', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_test',
        subscriptions: [],
        _count: { bots: 0 },
      });
      mockPrisma.conversation.count.mockResolvedValue(0);
      mockPrisma.userAddon.findMany.mockResolvedValue([
        {
          id: 'ua_wl',
          status: 'ACTIVE',
          quantity: 1,
          addon: {
            id: 'addon_wl',
            slug: ADDON_CODES.WHITE_LABEL,
            name: 'White Label',
          },
        },
      ]);

      const entitlements = await getWorkspaceEntitlements(
        mockPrisma as any,
        'org_test'
      );

      expect(entitlements.features.whiteLabel).toBe(true);
    });

    it('marks bots.reached when at limit', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_test',
        subscriptions: [
          {
            id: 'sub_123',
            status: 'ACTIVE',
            plan: {
              id: 'plan_starter',
              name: 'Starter',
              maxBots: 1,
              maxConversations: 1000,
              features: {},
            },
            currentPeriodEnd: new Date('2026-02-15'),
            stripeSubscriptionId: null,
          },
        ],
        _count: { bots: 1 },
      });
      mockPrisma.conversation.count.mockResolvedValue(100);
      mockPrisma.userAddon.findMany.mockResolvedValue([]);

      const entitlements = await getWorkspaceEntitlements(
        mockPrisma as any,
        'org_test'
      );

      expect(entitlements.bots.current).toBe(1);
      expect(entitlements.bots.limit).toBe(1);
      expect(entitlements.bots.reached).toBe(true);
      expect(entitlements.bots.percentage).toBe(100);
    });

    it('throws error when organization not found', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);
      mockPrisma.conversation.count.mockResolvedValue(0);
      mockPrisma.userAddon.findMany.mockResolvedValue([]);

      await expect(
        getWorkspaceEntitlements(mockPrisma as any, 'org_nonexistent')
      ).rejects.toThrow('Organization not found');
    });
  });

  describe('canCreateBot', () => {
    it('returns allowed=true when under limit', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_test',
        subscriptions: [
          {
            id: 'sub_123',
            status: 'ACTIVE',
            plan: { id: 'plan', name: 'Plan', maxBots: 3, maxConversations: 1000, features: {} },
            currentPeriodEnd: new Date('2026-02-15'),
            stripeSubscriptionId: null,
          },
        ],
        _count: { bots: 1 },
      });
      mockPrisma.conversation.count.mockResolvedValue(0);
      mockPrisma.userAddon.findMany.mockResolvedValue([]);

      const result = await canCreateBot(mockPrisma as any, 'org_test');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('returns allowed=false with reason when at limit', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_test',
        subscriptions: [
          {
            id: 'sub_123',
            status: 'ACTIVE',
            plan: { id: 'plan', name: 'Plan', maxBots: 1, maxConversations: 1000, features: {} },
            currentPeriodEnd: new Date('2026-02-15'),
            stripeSubscriptionId: null,
          },
        ],
        _count: { bots: 1 },
      });
      mockPrisma.conversation.count.mockResolvedValue(0);
      mockPrisma.userAddon.findMany.mockResolvedValue([]);

      const result = await canCreateBot(mockPrisma as any, 'org_test');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Bot limit reached');
    });
  });

  describe('canCreateConversation', () => {
    it('returns allowed=true when unlimited', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_test',
        subscriptions: [],
        _count: { bots: 0 },
      });
      mockPrisma.conversation.count.mockResolvedValue(999999);
      mockPrisma.userAddon.findMany.mockResolvedValue([
        {
          id: 'ua_unl',
          status: 'ACTIVE',
          quantity: 1,
          addon: { id: 'a', slug: ADDON_CODES.UNLIMITED_CONVERSATIONS, name: 'Unlimited' },
        },
      ]);

      const result = await canCreateConversation(mockPrisma as any, 'org_test');

      expect(result.allowed).toBe(true);
    });

    it('returns allowed=false when at limit', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_test',
        subscriptions: [
          {
            id: 'sub_123',
            status: 'ACTIVE',
            plan: { id: 'plan', name: 'Plan', maxBots: 1, maxConversations: 100, features: {} },
            currentPeriodEnd: new Date('2026-02-15'),
            stripeSubscriptionId: null,
          },
        ],
        _count: { bots: 0 },
      });
      mockPrisma.conversation.count.mockResolvedValue(100);
      mockPrisma.userAddon.findMany.mockResolvedValue([]);

      const result = await canCreateConversation(mockPrisma as any, 'org_test');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('conversation limit reached');
    });
  });

  describe('hasFeature', () => {
    it('returns false for disabled features', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_test',
        subscriptions: [],
        _count: { bots: 0 },
      });
      mockPrisma.conversation.count.mockResolvedValue(0);
      mockPrisma.userAddon.findMany.mockResolvedValue([]);

      const result = await hasFeature(mockPrisma as any, 'org_test', 'whiteLabel');

      expect(result).toBe(false);
    });

    it('returns true when feature addon is active', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_test',
        subscriptions: [],
        _count: { bots: 0 },
      });
      mockPrisma.conversation.count.mockResolvedValue(0);
      mockPrisma.userAddon.findMany.mockResolvedValue([
        {
          id: 'ua_byok',
          status: 'ACTIVE',
          quantity: 1,
          addon: { id: 'a', slug: ADDON_CODES.BYOK, name: 'BYOK' },
        },
      ]);

      const result = await hasFeature(mockPrisma as any, 'org_test', 'byok');

      expect(result).toBe(true);
    });
  });
});
