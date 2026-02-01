'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { useEntitlements, formatConversationLimit } from '@/hooks/useEntitlements';

export default function PlanUsageCard() {
  const { t } = useTranslation();
  const { entitlements, loading } = useEntitlements();

  if (loading) {
    return (
      <div className="glass-effect border border-silver-200/70 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-silver-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-silver-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-silver-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (!entitlements) return null;

  const { plan, bots, conversations } = entitlements;
  const isFreePlan = plan.name.toLowerCase() === 'free';
  const botsNearLimit = bots.percentage >= 80;
  const conversationsNearLimit = !conversations.isUnlimited && conversations.percentage >= 80;
  const showUpgradePrompt = isFreePlan && (botsNearLimit || conversationsNearLimit);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-amber-500';
    return 'bg-indigo-500';
  };

  return (
    <div className="glass-effect border border-silver-200/70 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-charcoal">
            {t('planUsage.title')}
          </h3>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
            isFreePlan 
              ? 'bg-silver-100 text-silver-700' 
              : 'bg-indigo-100 text-indigo-700'
          }`}>
            {plan.name}
          </span>
        </div>
        {isFreePlan && (
          <Link
            href="/pricing"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          >
            {t('planUsage.upgradePlan')}
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {/* Bots Usage */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-silver-600">{t('planUsage.bots')}</span>
            <span className={`font-medium ${botsNearLimit ? 'text-amber-600' : 'text-charcoal'}`}>
              {bots.current} / {bots.limit}
              {bots.extraSlots > 0 && (
                <span className="text-xs text-silver-500 ml-1">(+{bots.extraSlots} extra)</span>
              )}
            </span>
          </div>
          <div className="h-2 bg-silver-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressColor(bots.percentage)} transition-all duration-300`}
              style={{ width: `${bots.percentage}%` }}
            />
          </div>
        </div>

        {/* Conversations Usage */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-silver-600">{t('planUsage.monthlyConversations')}</span>
            <span className={`font-medium ${conversationsNearLimit ? 'text-amber-600' : 'text-charcoal'}`}>
              {formatNumber(conversations.current)} / {formatConversationLimit(conversations.limit)}
            </span>
          </div>
          <div className="h-2 bg-silver-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${conversations.isUnlimited ? 'bg-emerald-500' : getProgressColor(conversations.percentage)} transition-all duration-300`}
              style={{ width: conversations.isUnlimited ? '100%' : `${conversations.percentage}%` }}
            />
          </div>
          <p className="text-xs text-silver-500 mt-1">
            {conversations.isUnlimited 
              ? t('planUsage.unlimited') || 'Unlimited'
              : `${t('planUsage.resetsOn')} ${new Date(conversations.resetsAt).toLocaleDateString()}`
            }
          </p>
        </div>
      </div>

      {/* Upgrade Prompt */}
      {showUpgradePrompt && (
        <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
          <p className="text-sm text-indigo-800 mb-2">
            {t('planUsage.upgradePrompt')}
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            {t('planUsage.viewPlans')}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
