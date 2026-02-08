'use client';

import { useTranslation } from '@/lib/i18n';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Onboarding from '@/components/dashboard/Onboarding';
import PlanUsageCard from '@/components/dashboard/PlanUsageCard';
import { ensureClientUser } from '@/lib/ensureClientUser';
interface AnalyticsData {
 totalBots: number;
 botsThisMonth: number;
 conversations: number;
 conversationsGrowth: number;
 leads: number;
 leadsGrowth: number;
 activeUsers: number;
 activeUsersGrowth: number;
}

interface RecentBot {
 id: string;
 name: string;
 description: string | null;
 lastActive: string;
 lastActiveDate: string;
 conversationCount: number;
 isPublished: boolean;
}

interface BotWithCounts {
 id: string;
 _count: {
  documents: number;
 };
}

export default function DashboardPage() {
 const { t } = useTranslation();
 const router = useRouter();
 const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
 const [recentBots, setRecentBots] = useState<RecentBot[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [showOnboarding, setShowOnboarding] = useState(false);
 const [userName, setUserName] = useState<string | undefined>();
 const [hasDocuments, setHasDocuments] = useState(false);

 // Check if onboarding should be shown
 useEffect(() => {
  const dismissed = localStorage.getItem('onboarding_dismissed');
  void (async () => {
   const user = await ensureClientUser();
   if (user?.name) setUserName(user.name);
  })();
  if (!dismissed) {
   setShowOnboarding(true);
  }
 }, []);

 const handleDismissOnboarding = () => {
  localStorage.setItem('onboarding_dismissed', 'true');
  setShowOnboarding(false);
 };

 useEffect(() => {
  const fetchDashboardData = async () => {
   try {
    // Fetch analytics overview (auth via httpOnly cookies)
    const analyticsResponse = await fetch('/api/v1/analytics/overview', {
     credentials: 'include',
     headers: { 'Content-Type': 'application/json' },
    });
    if (!analyticsResponse.ok) {
     if (analyticsResponse.status === 401) {
      router.push('/auth/login');
      return;
     }
     throw new Error('Failed to fetch analytics data');
    }
    const analyticsData = await analyticsResponse.json();
    setAnalytics(analyticsData);

    // Fetch recent bots
    const botsResponse = await fetch('/api/v1/analytics/recent-bots?limit=3', {
     credentials: 'include',
     headers: { 'Content-Type': 'application/json' },
    });
    if (!botsResponse.ok) {
     throw new Error('Failed to fetch recent bots');
    }
    const botsData = await botsResponse.json();
    setRecentBots(botsData);

    // Fetch all bots to check for documents (for onboarding)
    const allBotsResponse = await fetch('/api/v1/bots', {
     credentials: 'include',
     headers: { 'Content-Type': 'application/json' },
    });
    if (allBotsResponse.ok) {
     const allBotsData: BotWithCounts[] = await allBotsResponse.json();
     const hasAnyDocuments = allBotsData.some(bot => (bot._count?.documents ?? 0) > 0);
     setHasDocuments(hasAnyDocuments);
    }

    setLoading(false);
   } catch (err) {
    console.error('Error fetching dashboard data:', err);
    setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    setLoading(false);
   }
  };

  fetchDashboardData();
 }, [router]);

 if (loading) {
  return (
   <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-silver-400 mx-auto mb-4"></div>
     <p className="text-silver-600">Loading dashboard...</p>
    </div>
   </div>
  );
 }

 if (error) {
  return (
   <div className="glass-effect border border-red-500/20 rounded-2xl p-6">
    <h2 className="text-red-400 font-semibold mb-2">Error Loading Dashboard</h2>
    <p className="text-red-300/70">{error}</p>
   </div>
  );
 }

 if (!analytics) {
  return null;
 }

 const formatGrowth = (growth: number) => {
  const isPositive = growth >= 0;
  const color = isPositive ? 'text-emerald' : 'text-red-600';
  const sign = isPositive ? '+' : '';
  return { text: `${sign}${growth}%`, color };
 };

 return (
  <div>
   {/* Onboarding Wizard */}
   {showOnboarding && (
    <Onboarding
     userName={userName}
     hasBots={(analytics?.totalBots ?? 0) > 0}
     hasDocuments={hasDocuments}
     hasConversations={(analytics?.conversations ?? 0) > 0}
     onDismiss={handleDismissOnboarding}
    />
   )}

   <h1 className="text-3xl font-bold mb-8 text-charcoal">{t('dashboard.title')}</h1>

   {/* Stats */}
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <div className="glass-effect border border-silver-200/70 p-6 rounded-2xl min-w-0">
     <div className="text-sm text-silver-600 font-medium mb-2">{t('dashboard.stats.totalBots')}</div>
     <div className="text-3xl font-bold text-charcoal truncate">{analytics.totalBots}</div>
     <div className="text-xs text-charcoal/70 font-medium mt-1">
      {t('dashboard.growth.thisMonth').replace('{count}', analytics.botsThisMonth.toString())}
     </div>
    </div>

    <div className="glass-effect border border-silver-200/70 p-6 rounded-2xl min-w-0">
     <div className="text-sm text-silver-600 font-medium mb-2">{t('dashboard.stats.conversations')}</div>
     <div className="text-3xl font-bold text-charcoal truncate">{analytics.conversations.toLocaleString()}</div>
     <div className={`text-xs font-medium mt-1 ${formatGrowth(analytics.conversationsGrowth).color}`}>
      {formatGrowth(analytics.conversationsGrowth).text} vs last month
     </div>
    </div>

    <div className="glass-effect border border-silver-200/70 p-6 rounded-2xl min-w-0">
     <div className="text-sm text-silver-600 font-medium mb-2">{t('dashboard.stats.leadsCaptured')}</div>
     <div className="text-3xl font-bold text-emerald-400 truncate">{analytics.leads}</div>
     <div className={`text-xs font-medium mt-1 ${formatGrowth(analytics.leadsGrowth).color}`}>
      {formatGrowth(analytics.leadsGrowth).text} vs last month
     </div>
    </div>

    <div className="glass-effect border border-silver-200/70 p-6 rounded-2xl min-w-0">
     <div className="text-sm text-silver-600 font-medium mb-2">{t('dashboard.stats.activeUsers')}</div>
     <div className="text-3xl font-bold text-charcoal truncate">{analytics.activeUsers}</div>
     <div className={`text-xs font-medium mt-1 ${formatGrowth(analytics.activeUsersGrowth).color}`}>
      {formatGrowth(analytics.activeUsersGrowth).text} vs last month
     </div>
    </div>
   </div>

   {/* Plan Usage */}
    <div className="mb-8">
     <PlanUsageCard />
    </div>

    {/* Recent Activity */}
   <div className="glass-effect border border-silver-200/70 rounded-2xl p-6">
    <h2 className="text-xl font-bold text-charcoal mb-4">{t('dashboard.recentBots')}</h2>
    {recentBots.length === 0 ? (
     <p className="text-silver-600 text-center py-8">
      No bots yet. Create your first bot to get started!
     </p>
    ) : (
     <div className="space-y-4">
      {recentBots.map((bot) => (
       <div key={bot.id} className="flex items-center justify-between border-b border-silver-200/70 pb-4 last:border-b-0">
        <div>
         <h3 className="font-semibold text-charcoal">{bot.name}</h3>
         <p className="text-sm text-silver-600">
          Last active: {bot.lastActive} • {bot.conversationCount} conversation{bot.conversationCount !== 1 ? 's' : ''}
         </p>
        </div>
        <button
         onClick={() => router.push(`/dashboard/bot/${bot.id}`)}
         className="px-6 py-3 bg-charcoal text-white rounded-lg hover:bg-charcoal/90 font-medium transition-all shadow-lg "
        >
         {t('dashboard.view')}
        </button>
       </div>
      ))}
     </div>
    )}
   </div>
  </div>
 );
}




