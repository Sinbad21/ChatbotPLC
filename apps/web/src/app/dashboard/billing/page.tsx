'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  CreditCard, 
  Check, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Calendar,
  Package,
  TrendingUp,
  Crown,
  Zap,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { ensureClientUser } from '@/lib/ensureClientUser';
import { 
  useBillingStatus, 
  openBillingPortal, 
  openCheckout,
  type BillingStatus 
} from '@/hooks/useBillingStatus';

// Plan display configuration
const PLAN_CONFIG: Record<string, { 
  icon: React.ReactNode; 
  color: string; 
  bgColor: string;
  features: string[];
}> = {
  free: {
    icon: <Package className="w-6 h-6" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    features: ['1 Bot', '100 conversations/month', 'Basic support'],
  },
  starter: {
    icon: <Zap className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    features: ['3 Bots', '5,000 conversations/month', 'Email support', 'Analytics'],
  },
  professional: {
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    features: ['10 Bots', '20,000 conversations/month', 'Priority support', 'Advanced analytics', 'Integrations'],
  },
  enterprise: {
    icon: <Crown className="w-6 h-6" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    features: ['Unlimited Bots', 'Unlimited conversations', 'Dedicated support', 'Custom integrations', 'SLA'],
  },
};

export default function BillingPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  const { billingStatus, loading: billingLoading, error: billingError, refetch } = useBillingStatus(workspaceId);

  // Load user and workspace
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await ensureClientUser();
        if (user?.organizationId) {
          setWorkspaceId(user.organizationId);
        }
      } catch (err) {
        console.error('Failed to load user:', err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // Handle checkout success/cancel from URL params
  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'success') {
      setMessage({ type: 'success', text: 'Subscription activated successfully!' });
      refetch();
    } else if (checkout === 'cancelled') {
      setMessage({ type: 'warning', text: 'Checkout was cancelled.' });
    }
  }, [searchParams, refetch]);

  // Auto-hide messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleManageBilling = async () => {
    if (!workspaceId) return;
    
    setActionLoading('portal');
    try {
      await openBillingPortal(workspaceId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open billing portal';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpgrade = async (planCode: string) => {
    if (!workspaceId) return;
    
    setActionLoading(planCode);
    try {
      await openCheckout(workspaceId, planCode, 'monthly');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start checkout';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || billingLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading billing information...</span>
        </div>
      </div>
    );
  }

  if (billingError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Failed to load billing</h3>
              <p className="text-red-600 mt-1">{billingError}</p>
              <button 
                onClick={() => refetch()}
                className="mt-4 flex items-center gap-2 text-red-700 hover:text-red-800 font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Use plan.code (stable slug) for config lookup, not display name
  const currentPlanCode = billingStatus?.subscription?.plan?.code || 'free';
  const planConfig = PLAN_CONFIG[currentPlanCode] || PLAN_CONFIG.free;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
            <p className="text-gray-600 mt-1">Manage your subscription, addons, and billing</p>
          </div>
          {billingStatus?.hasStripeCustomer && (
            <button
              onClick={handleManageBilling}
              disabled={actionLoading === 'portal'}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'portal' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              Manage Billing
            </button>
          )}
        </div>

        {/* Messages */}
        {message && (
          <div className={`rounded-xl p-4 flex items-start gap-3 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' :
            message.type === 'warning' ? 'bg-amber-50 border border-amber-200' :
            'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : message.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <span className={
              message.type === 'success' ? 'text-green-800' :
              message.type === 'warning' ? 'text-amber-800' :
              'text-red-800'
            }>{message.text}</span>
          </div>
        )}

        {/* Cancellation Warning */}
        {billingStatus?.willCancel && billingStatus.subscription && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 font-medium">Subscription ending</p>
              <p className="text-amber-700 text-sm mt-1">
                Your subscription will end on {new Date(billingStatus.subscription.currentPeriodEnd).toLocaleDateString()}.
                You can reactivate it from the billing portal.
              </p>
            </div>
          </div>
        )}

        {/* Past Due Warning */}
        {billingStatus?.isPastDue && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Payment past due</p>
              <p className="text-red-700 text-sm mt-1">
                Your last payment failed. Please update your payment method to avoid service interruption.
              </p>
              <button 
                onClick={handleManageBilling}
                className="mt-2 text-red-800 font-medium underline hover:no-underline"
              >
                Update payment method →
              </button>
            </div>
          </div>
        )}

        {/* Current Plan Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${planConfig.bgColor}`}>
                <div className={planConfig.color}>{planConfig.icon}</div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    {billingStatus?.subscription?.plan?.name || 'Free Plan'}
                  </h2>
                  {billingStatus?.isTrialing && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                      Trial
                    </span>
                  )}
                  {billingStatus?.isPaid && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mt-1">
                  {billingStatus?.subscription?.plan?.interval === 'year' ? 'Billed yearly' : 'Billed monthly'}
                </p>
              </div>
            </div>
            
            {billingStatus?.billing && billingStatus.isPaid && (
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  €{billingStatus.billing.estimatedMonthlyTotal.toFixed(2)}
                  <span className="text-sm font-normal text-gray-500">/mo</span>
                </p>
                {billingStatus.billing.isNormalized && (
                  <p className="text-xs text-gray-500">Yearly plan, shown as monthly</p>
                )}
              </div>
            )}
          </div>

          {/* Plan Features */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Plan includes:</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {planConfig.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-600">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Plan Limits */}
          {billingStatus?.subscription?.plan?.limits && (
            <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Bot Limit</p>
                <p className="text-xl font-bold text-gray-900">
                  {billingStatus.subscription.plan.limits.maxBots === -1 
                    ? '∞' 
                    : billingStatus.subscription.plan.limits.maxBots}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Conversations/mo</p>
                <p className="text-xl font-bold text-gray-900">
                  {billingStatus.subscription.plan.limits.maxConversations === -1 
                    ? '∞' 
                    : billingStatus.subscription.plan.limits.maxConversations.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Next Billing */}
          {billingStatus?.billing?.nextBillingDate && !billingStatus.willCancel && (
            <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-3 text-gray-600">
              <Calendar className="w-5 h-5" />
              <span>
                Next billing date: <strong>{new Date(billingStatus.billing.nextBillingDate).toLocaleDateString()}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Active Addons */}
        {billingStatus?.addons && billingStatus.addons.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Addons</h3>
            <div className="space-y-3">
              {billingStatus.addons.map((addon) => (
                <div 
                  key={addon.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Package className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{addon.name}</p>
                      <p className="text-sm text-gray-500">{addon.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">×{addon.quantity}</p>
                    <p className="text-sm text-gray-500">
                      {addon.status === 'ACTIVE' ? 'Active' : addon.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upgrade Options (only for free users) */}
        {!billingStatus?.isPaid && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upgrade Your Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['starter', 'professional', 'enterprise'].map((planId) => {
                const config = PLAN_CONFIG[planId];
                return (
                  <div 
                    key={planId}
                    className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${config.bgColor} inline-block`}>
                      <div className={config.color}>{config.icon}</div>
                    </div>
                    <h4 className="font-semibold text-gray-900 mt-3 capitalize">{planId}</h4>
                    <ul className="mt-3 space-y-2">
                      {config.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                          <Check className="w-3 h-3 text-green-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleUpgrade(planId)}
                      disabled={actionLoading === planId}
                      className="mt-4 w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {actionLoading === planId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                      Upgrade
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Stripe Customer Info */}
        {!billingStatus?.hasStripeCustomer && billingStatus?.isPaid !== true && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">No billing account yet</h3>
            <p className="text-gray-600 mt-1 mb-4">
              Upgrade to a paid plan to unlock more features and capacity.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
