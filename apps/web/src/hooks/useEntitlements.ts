'use client';

import { useState, useEffect, useCallback } from 'react';
import { buildAuthHeaders } from '@/lib/authHeaders';

/**
 * Entitlements - centralized source of truth for workspace limits and features
 */
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

interface UseEntitlementsResult {
  entitlements: Entitlements | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and cache workspace entitlements
 * 
 * This is the single source of truth for:
 * - Bot limits and usage (entitlements.bots.reached, entitlements.bots.limit)
 * - Conversation limits and usage (entitlements.conversations)
 * - Feature flags (entitlements.features.whiteLabel, etc.)
 * - Active addons (entitlements.addons)
 * 
 * @example
 * ```tsx
 * const { entitlements, loading } = useEntitlements();
 * 
 * if (entitlements?.bots.reached) {
 *   // Show upgrade CTA
 * }
 * 
 * if (entitlements?.conversations.isUnlimited) {
 *   // Show "∞" instead of limit
 * }
 * ```
 */
export function useEntitlements(): UseEntitlementsResult {
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntitlements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('API URL not configured');
      }

      const res = await fetch(`${apiUrl}/api/v1/entitlements`, {
        credentials: 'include',
        headers: buildAuthHeaders(),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to fetch entitlements: ${res.status}`);
      }

      const data: Entitlements = await res.json();
      setEntitlements(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useEntitlements] Error:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntitlements();
  }, [fetchEntitlements]);

  return {
    entitlements,
    loading,
    error,
    refetch: fetchEntitlements,
  };
}

/**
 * Format the conversation limit for display
 * Returns "∞" for unlimited, otherwise the number
 */
export function formatConversationLimit(limit: number | 'unlimited'): string {
  return limit === 'unlimited' ? '∞' : limit.toLocaleString();
}

/**
 * Check if user can create a bot based on entitlements
 */
export function canCreateBot(entitlements: Entitlements | null): boolean {
  if (!entitlements) return false;
  return !entitlements.bots.reached;
}

/**
 * Check if user can start a conversation based on entitlements
 */
export function canStartConversation(entitlements: Entitlements | null): boolean {
  if (!entitlements) return false;
  return !entitlements.conversations.reached;
}

/**
 * Check if a specific feature is enabled
 */
export function hasFeature(
  entitlements: Entitlements | null,
  feature: keyof Entitlements['features']
): boolean {
  if (!entitlements) return false;
  return entitlements.features[feature] ?? false;
}
