'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Crown, Sparkles } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useEntitlements, formatConversationLimit } from '@/hooks/useEntitlements';

export default function PlanBadge() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { entitlements, loading, refetch } = useEntitlements();

  // Refresh data on route change
  useEffect(() => {
    refetch();
  }, [pathname, refetch]);

  // Extract values from entitlements (with fallbacks)
  const planName = entitlements?.plan?.name || 'Free';
  const botsUsed = entitlements?.bots?.current || 0;
  const botsLimit = entitlements?.bots?.limit || 1;
  const convsUsed = entitlements?.conversations?.current || 0;
  const convsLimit = entitlements?.conversations?.limit ?? 1000;
  const isUnlimited = entitlements?.conversations?.isUnlimited || false;
  const botsReached = entitlements?.bots?.reached || false;
  const convsReached = entitlements?.conversations?.reached || false;

  const isFree = planName === 'Free';
  const isNearLimit = botsReached || (!isUnlimited && entitlements?.conversations?.percentage >= 90);


  return (
    <div className="mt-4 pt-4 border-t border-silver-200">
      <div className={`rounded-lg p-3 ${isFree ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
        <div className="flex items-center gap-2 mb-2">
          {isFree ? (
            <Sparkles size={14} className="text-amber-600" />
          ) : (
            <Crown size={14} className="text-emerald-600" />
          )}
          <span className={`text-xs font-bold uppercase tracking-wide ${isFree ? 'text-amber-700' : 'text-emerald-700'}`}>
            {loading ? '...' : planName}
          </span>
        </div>
        
        {/* Usage bars */}
        <div className="space-y-1.5">
          <div>
            <div className="flex justify-between text-[10px] text-silver-600 mb-0.5">
              <span>Bots</span>
              <span>{botsUsed}/{botsLimit}</span>
            </div>
            <div className="h-1.5 bg-silver-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${botsReached ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${entitlements?.bots?.percentage || 0}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-[10px] text-silver-600 mb-0.5">
              <span>Msgs</span>
              <span>{convsUsed}/{formatConversationLimit(convsLimit)}</span>
            </div>
            <div className="h-1.5 bg-silver-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${convsReached ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${isUnlimited ? 0 : (entitlements?.conversations?.percentage || 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Upgrade link for free users */}
        {isFree && (
          <Link 
            href="/dashboard/billing"
            className="mt-2 block text-center text-[10px] font-medium text-amber-700 hover:text-amber-800 underline"
          >
            {t('planUsage.upgrade') || 'Upgrade'}
          </Link>
        )}
        
        {/* Warning for near limit */}
        {!isFree && isNearLimit && (
          <p className="mt-2 text-[10px] text-amber-600 text-center">
            {t('planUsage.nearLimit') || 'Near limit'}
          </p>
        )}
      </div>
    </div>
  );
}
