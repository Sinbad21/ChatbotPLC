'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { GlassCard } from '@/components/dashboard/ui';

interface Bot {
 id: string;
 name: string;
 description: string | null;
 published: boolean;
 _count: {
  conversations: number;
  documents: number;
 };
}

export default function BotsListPage() {
 const { t } = useTranslation();
 const [bots, setBots] = useState<Bot[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');

 useEffect(() => {
  fetchBots();
 }, []);

 const fetchBots = async () => {
  try {
   const apiUrl = process.env.NEXT_PUBLIC_API_URL;

   if (!apiUrl) {
    setError(t('bots.configError'));
    setLoading(false);
    return;
   }

   const response = await fetch(`${apiUrl}/api/v1/bots`, {
    credentials: 'include',
   });

   if (!response.ok) {
    if (response.status === 401) {
     window.location.href = '/auth/login';
     return;
    }
    throw new Error(t('bots.failedToFetch'));
   }

   const data = await response.json();
   setBots(data);
  } catch (err: any) {
   setError(err.message || t('bots.failedToLoad'));
  } finally {
   setLoading(false);
  }
 };

 return (
  <div>
   <div className="flex items-center justify-between mb-8">
    <h1 className="text-3xl font-bold text-charcoal font-serif">{t('bots.myBots')}</h1>
    <Link
     href="/dashboard/create-bot"
     className="px-6 py-3 bg-charcoal text-white rounded-lg hover:bg-charcoal/90 font-medium transition-all shadow-lg"
    >
     {t('bots.createNew')}
    </Link>
   </div>

   {error && (
    <div className="bg-red-950/50 border border-red-800 text-red-400 px-4 py-3 rounded-lg mb-6">
     {error}
    </div>
   )}

   {loading ? (
    <div className="text-center py-12">
     <div className="text-platinum-400">{t('bots.loadingBots')}</div>
    </div>
   ) : bots.length === 0 ? (
    <GlassCard className="text-center" hoverEffect={false}>
     <div className="text-silver-500 mb-4">
      <svg
       className="mx-auto h-12 w-12"
       fill="none"
       viewBox="0 0 24 24"
       stroke="currentColor"
      >
       <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
       />
      </svg>
     </div>
     <h3 className="text-lg font-semibold text-charcoal mb-2">{t('bots.noBots')}</h3>
     <p className="text-silver-600 mb-6">
      {t('bots.getStarted')}
     </p>
     <Link
      href="/dashboard/create-bot"
      className="inline-block px-6 py-3 bg-charcoal text-white rounded-lg hover:bg-charcoal/90 font-medium transition-all shadow-lg"
     >
      {t('bots.createYourFirstBot')}
     </Link>
    </GlassCard>
   ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
     {bots.map((bot) => (
      <GlassCard key={bot.id}>
       <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
         <h3 className="text-lg font-semibold text-charcoal mb-2">{bot.name}</h3>
         <p className="text-sm text-silver-600 line-clamp-2">{bot.description}</p>
        </div>
        <span
         className={`px-3 py-1 rounded-full text-xs font-medium ${
          bot.published
           ? 'bg-silver-100/70 text-silver-700'
           : 'bg-silver-100/70 text-silver-700'
         }`}
        >
         {bot.published ? t('bots.published') : t('bots.draft')}
        </span>
       </div>

       <div className="flex items-center gap-4 text-sm text-silver-600 mb-4">
        <div>
         {t('bots.conversationsCount').replace('{count}', (bot._count?.conversations || 0).toString())}
        </div>
        <div>
         {t('bots.documentsCount').replace('{count}', (bot._count?.documents || 0).toString())}
        </div>
       </div>

       <Link
        href={`/dashboard/bot/${bot.id}`}
        className="block w-full px-4 py-2 bg-charcoal text-white text-center rounded-lg hover:bg-charcoal/90 font-medium transition-all shadow-lg "
       >
        {t('bots.viewDetails')}
       </Link>
      </GlassCard>
     ))}
    </div>
   )}
  </div>
 );
}



