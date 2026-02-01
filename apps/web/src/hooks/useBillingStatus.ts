'use client';

import { useState, useEffect, useCallback } from 'react';
import { buildAuthHeaders } from '@/lib/authHeaders';

/**
 * Billing Status - subscription and addon information for the workspace
 */
export interface BillingStatus {
  workspace: {
    id: string;
    name: string;
  };
  hasStripeCustomer: boolean;
  subscription: {
    id: string;
    status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'PAUSED';
    plan: {
      id: string;
      code: string; // Stable slug for UI lookup (e.g., 'professional', 'starter')
      name: string;
      interval: 'month' | 'year';
      limits: {
        maxBots: number;
        maxConversations: number;
      };
    };
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    stripeSubscriptionId: string | null;
  } | null;
  addons: Array<{
    id: string;
    slug: string;
    name: string;
    category: string;
    quantity: number;
    status: string;
    currentPeriodEnd: string | null;
  }>;
  billing: {
    nextBillingDate: string | null;
    estimatedMonthlyTotal: number;
    currency: string;
    isNormalized: boolean;
  };
  isPaid: boolean;
  isTrialing: boolean;
  isPastDue: boolean;
  willCancel: boolean;
}

interface UseBillingStatusResult {
  billingStatus: BillingStatus | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch billing status for a workspace
 * 
 * Returns subscription info, active addons, and billing summary.
 * 
 * @param workspaceId - The workspace ID to fetch billing for
 * 
 * @example
 * ```tsx
 * const { billingStatus, loading } = useBillingStatus(workspaceId);
 * 
 * if (billingStatus?.isPaid) {
 *   // Show paid features
 * }
 * 
 * if (billingStatus?.willCancel) {
 *   // Show "subscription ending" warning
 * }
 * ```
 */
export function useBillingStatus(workspaceId: string | null): UseBillingStatusResult {
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBillingStatus = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('API URL not configured');
      }

      const res = await fetch(`${apiUrl}/api/billing/status?workspaceId=${workspaceId}`, {
        credentials: 'include',
        headers: buildAuthHeaders(),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to fetch billing status: ${res.status}`);
      }

      const data: BillingStatus = await res.json();
      setBillingStatus(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useBillingStatus] Error:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchBillingStatus();
  }, [fetchBillingStatus]);

  return {
    billingStatus,
    loading,
    error,
    refetch: fetchBillingStatus,
  };
}

/**
 * Opens Stripe Checkout for a new subscription
 */
export async function openCheckout(
  workspaceId: string,
  planCode: string,
  interval: 'monthly' | 'yearly' = 'monthly',
  addons: Array<{ addonCode: string; quantity: number }> = []
): Promise<void> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error('API URL not configured');
  }

  const res = await fetch(`${apiUrl}/api/billing/checkout`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      ...buildAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workspaceId,
      planCode,
      interval,
      addons,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create checkout session');
  }

  const { url } = await res.json();
  window.location.href = url;
}

/**
 * Opens Stripe Billing Portal for subscription management
 */
export async function openBillingPortal(workspaceId: string): Promise<void> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error('API URL not configured');
  }

  const res = await fetch(`${apiUrl}/api/billing/portal?workspaceId=${workspaceId}`, {
    credentials: 'include',
    headers: buildAuthHeaders(),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    
    if (data.code === 'NO_STRIPE_CUSTOMER') {
      throw new Error('No billing account found. Please complete a checkout first.');
    }
    
    throw new Error(data.error || 'Failed to open billing portal');
  }

  const { url } = await res.json();
  window.location.href = url;
}
