"use client";

import { useState, useEffect } from "react";
import { useReviewBot } from "@/hooks/useReviewBot";
import ReviewBotWizard from "@/components/review-bot/ReviewBotWizard";
import { ReviewBotWizardConfig } from "@/types/review-bot";
import {
 Star,
 MessageSquare,
 TrendingUp,
 ExternalLink,
 Settings,
 Link2,
 MousePointerClick,
 Users,
 ThumbsUp,
} from "lucide-react";

// Stripe icon
const StripeIcon = ({ size = 24, className = "" }) => (
 <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-2.904 0-5.093-1.226-6.939-2.423l-.555 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
 </svg>
);

// Shopify icon
const ShopifyIcon = ({ size = 24, className = "" }) => (
 <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
  <path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104zm-2.71-17.636c0-.076-.006-.137-.006-.2 0-.625-.164-1.089-.428-1.452l-2.065 17.78 4.918-1.034-2.006-14.655c-.157-.205-.315-.37-.413-.439zM9.653 5.165c-.157-.068-.319-.107-.488-.107-.058 0-.117.005-.176.012l-.721.149-.28.07c-.055.014-.115.03-.18.05-.103.03-.216.066-.336.11a12.045 12.045 0 00-.697.27l-.252.109c-.112.05-.228.104-.35.164l-.268.135-.31.168-.157.089c-.276.159-.558.337-.84.536l-.132.096-.21.158c-.138.107-.276.22-.413.34-.17.148-.34.306-.505.474l-.166.176a8.97 8.97 0 00-.593.713l-.168.23-.255.38-.092.126.197-.192.022-.023c.07-.074.137-.15.201-.228l.006-.007a4.53 4.53 0 00.35-.493l.025-.042c.048-.082.093-.166.135-.252l.032-.064c.04-.083.077-.167.111-.253l.028-.07c.033-.086.063-.174.09-.263l.02-.065c.027-.093.05-.188.07-.284l.01-.049c.02-.103.036-.208.048-.314l.003-.027a4.07 4.07 0 00.023-.408c0-.071-.002-.142-.007-.213l-.002-.04a3.923 3.923 0 00-.034-.324l-.006-.043a3.742 3.742 0 00-.152-.639l-.016-.048a3.568 3.568 0 00-.117-.304l-.023-.053a3.48 3.48 0 00-.147-.292l-.032-.057a3.392 3.392 0 00-.179-.273l-.042-.058a3.315 3.315 0 00-.212-.257l-.052-.058a3.23 3.23 0 00-.245-.236l-.063-.055a3.14 3.14 0 00-.28-.214l-.073-.051a3.052 3.052 0 00-.316-.189l-.08-.044a2.987 2.987 0 00-.352-.166l-.083-.034a2.911 2.911 0 00-.38-.128l-.075-.022a2.847 2.847 0 00-.412-.094l-.047-.008a2.79 2.79 0 00-.45-.056h-.004a5.636 5.636 0 00-.458-.016c-.083 0-.166.002-.248.007l-.059.003c-.077.005-.153.012-.228.02l-.064.007c-.071.009-.142.019-.212.032l-.065.011a2.58 2.58 0 00-.448.107l-.054.016c-.061.02-.121.04-.18.063l-.044.017c.038-.085.071-.173.099-.264l.005-.016c.028-.092.05-.187.067-.283l.002-.013c.016-.099.027-.2.032-.302v-.007c.004-.104.002-.21-.006-.316l-.002-.015a3.247 3.247 0 00-.045-.316z"/>
 </svg>
);

// WooCommerce icon
const WooCommerceIcon = ({ size = 24, className = "" }) => (
 <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
  <path d="M2.227 4.857A2.228 2.228 0 000 7.094v7.457c0 1.236 1.001 2.237 2.237 2.237h4.558l-1.26 3.27 4.116-3.27h12.122A2.227 2.227 0 0024 14.551V7.094a2.227 2.227 0 00-2.227-2.237H2.227z"/>
 </svg>
);

interface ReviewBotStats {
 totalRequests: number;
 totalResponses: number;
 responseRate: number;
 positiveRate: number;
 googleClicks: number;
 googleClickRate: number;
}

export default function ReviewBotPage() {
 const [showWizard, setShowWizard] = useState(false);
 const [showSettings, setShowSettings] = useState(false);
 const [showSnippet, setShowSnippet] = useState(false);
 
 const { reviewBot, loading, createReviewBot, fetchReviewBots } = useReviewBot();

 useEffect(() => {
  fetchReviewBots();
 }, [fetchReviewBots]);

 const handleWizardComplete = async (config: ReviewBotWizardConfig) => {
  const newBot = await createReviewBot(config);
  if (newBot) {
   setShowWizard(false);
  }
 };

 // Loading state
 if (loading && !showWizard) {
  return (
   <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-charcoal"></div>
   </div>
  );
 }

 // Empty state - no Review Bot configured
 if (!reviewBot && !showWizard) {
  return (
   <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="flex items-center justify-between">
     <div>
      <h1 className="text-2xl font-bold text-charcoal">Review Bot</h1>
      <p className="text-silver-700 mt-1">Raccogli recensioni Google automaticamente</p>
     </div>
    </div>

    {/* Empty State Card */}
    <div className="bg-pearl-50 border border-silver-200/70 rounded-2xl p-12 text-center">
     <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/30 flex items-center justify-center">
      <Star size={40} className="text-yellow-400" />
     </div>

     <h2 className="text-2xl font-bold text-charcoal mb-3">
      Inizia a raccogliere recensioni Google
     </h2>

     <p className="text-silver-700 mb-8 max-w-2xl mx-auto">
      Configura il Review Bot per inviare automaticamente richieste di recensione ai tuoi clienti
      dopo un acquisto su Stripe, WooCommerce o Shopify.
     </p>

     {/* Features Grid */}
     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
      <div className="bg-pearl-100/70 border border-silver-200/70 rounded-xl p-6">
       <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-pearl-100 flex items-center justify-center">
        <MessageSquare size={24} className="text-silver-700" />
       </div>
       <h3 className="text-charcoal font-semibold mb-2">SMS Automatici</h3>
       <p className="text-sm text-silver-700">Invia richieste via SMS dopo ogni acquisto</p>
      </div>

      <div className="bg-pearl-100/70 border border-silver-200/70 rounded-xl p-6">
       <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-pearl-100 flex items-center justify-center">
        <MousePointerClick size={24} className="text-charcoal" />
       </div>
       <h3 className="text-charcoal font-semibold mb-2">Link Diretto Google</h3>
       <p className="text-sm text-silver-700">Link per lasciare recensioni con un click</p>
      </div>

      <div className="bg-pearl-100/70 border border-silver-200/70 rounded-xl p-6">
       <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-emerald-500/20 flex items-center justify-center">
        <TrendingUp size={24} className="text-emerald-400" />
       </div>
       <h3 className="text-charcoal font-semibold mb-2">Analytics Dettagliati</h3>
       <p className="text-sm text-silver-700">Analytics e metriche</p>
      </div>
     </div>

     {/* Supported Platforms */}
     <div className="flex items-center justify-center gap-6 mb-8">
      <div className="flex items-center gap-2 text-silver-700">
       <StripeIcon size={20} className="text-[#635BFF]" />
       <span className="text-sm">Stripe</span>
      </div>
      <div className="flex items-center gap-2 text-silver-700">
       <WooCommerceIcon size={20} className="text-[#96588a]" />
       <span className="text-sm">WooCommerce</span>
      </div>
      <div className="flex items-center gap-2 text-silver-700">
       <ShopifyIcon size={20} className="text-[#96bf48]" />
       <span className="text-sm">Shopify</span>
      </div>
     </div>

     <button
      onClick={() => setShowWizard(true)}
      className="px-8 py-3 bg-charcoal text-pearl rounded-xl font-medium hover:bg-charcoal/90 transition-all shadow-lg "
     >
      Configura Review Bot
     </button>
    </div>
   </div>
  );
 }

 // Active Review Bot Dashboard
 return (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
   {/* Header */}
   <div className="flex items-center justify-between">
    <div>
     <h1 className="text-2xl font-bold text-charcoal">Review Bot</h1>
     <p className="text-silver-700 mt-1">{reviewBot?.businessName}</p>
    </div>
    <div className="flex gap-3">
     <button
      onClick={() => setShowSettings(true)}
      className="px-4 py-2 border border-silver-200/70 text-silver-700 rounded-xl hover:bg-pearl-100 transition-all inline-flex items-center gap-2"
     >
      <Settings size={18} />
      Impostazioni
     </button>
     <button
      onClick={() => setShowSnippet(true)}
      className="px-4 py-2 bg-charcoal text-pearl rounded-xl font-medium hover:bg-charcoal/90 transition-all shadow-lg inline-flex items-center gap-2"
     >
      <Link2 size={18} />
      Copia Widget
     </button>
    </div>
   </div>

   {/* Stats Grid */}
   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <StatCard
     label="Richieste Inviate"
     value={reviewBot?.totalRequests || 0}
     icon={MessageSquare}
     color="purple"
     trend={+12}
    />
    <StatCard
     label="Risposte Ricevute"
     value={reviewBot?.totalResponses || 0}
     icon={Users}
     color="fuchsia"
     subtitle={`${reviewBot?.responseRate || 0}% tasso risposta`}
    />
    <StatCard
     label="Recensioni Positive"
     value={Math.floor((reviewBot?.totalResponses || 0) * ((reviewBot?.positiveRate || 0) / 100))}
     icon={ThumbsUp}
     color="emerald"
     subtitle={`${reviewBot?.positiveRate || 0}% positive`}
    />
    <StatCard
     label="Click su Google"
     value={reviewBot?.totalGoogleClicks || 0}
     icon={MousePointerClick}
     color="yellow"
     subtitle={`${reviewBot?.googleClickRate || 0}% click rate`}
    />
   </div>

   {/* Main Content Grid */}
   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Recent Activity */}
    <div className="lg:col-span-2 bg-pearl-50 border border-silver-200/70 rounded-2xl p-6">
     <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
      <TrendingUp size={20} className="text-charcoal" />
      Attività  Recente
     </h2>

     <div className="space-y-3">
      <ActivityItem
       rating={5}
       name="Marco R."
       time="5 min fa"
       clickedGoogle={true}
      />
      <ActivityItem
       rating={4}
       name="Laura B."
       time="23 min fa"
       clickedGoogle={false}
       feedback="Ottimo servizio!"
      />
      <ActivityItem
       rating={3}
       name="Giuseppe T."
       time="1h fa"
       clickedGoogle={false}
       feedback="Consegna un po' lenta"
      />
      <ActivityItem
       rating={5}
       name="Anna S."
       time="2h fa"
       clickedGoogle={true}
      />
     </div>

     <button className="mt-4 w-full py-2 border border-silver-200/70 text-silver-700 rounded-xl hover:bg-pearl-100 transition-all text-sm">
      Vedi tutto
     </button>
    </div>

    {/* eCommerce Connections */}
    <div className="bg-pearl-50 border border-silver-200/70 rounded-2xl p-6">
     <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
      <Link2 size={20} className="text-charcoal" />
      Connessioni eCommerce
     </h2>

     <div className="space-y-3">
      <ConnectionItem
       icon={StripeIcon}
       name="Stripe"
       color="#635BFF"
       status="connected"
       lastSync="2 min fa"
      />
      <ConnectionItem
       icon={WooCommerceIcon}
       name="WooCommerce"
       color="#96588a"
       status="disconnected"
      />
      <ConnectionItem
       icon={ShopifyIcon}
       name="Shopify"
       color="#96bf48"
       status="disconnected"
      />
     </div>

     <button className="mt-4 w-full py-2 border border-silver-200/70 text-silver-700 rounded-xl hover:bg-pearl-100 transition-all text-sm">
      Aggiungi Connessione
     </button>
    </div>
   </div>

   {/* Widget Preview */}
   <div className="bg-pearl-50 border border-silver-200/70 rounded-2xl p-6">
    <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
     <ExternalLink size={20} className="text-charcoal" />
     Anteprima Widget
    </h2>

    <div className="bg-[#0a0a0f] rounded-xl p-8 flex items-center justify-center min-h-[300px] relative">
     <p className="text-silver-600 text-sm">Anteprima widget in arrivo...</p>

     {/* Mini widget preview placeholder */}
     <div className="absolute bottom-4 right-4 bg-gradient-to-br from-pearl-100/70 to-pearl-50 border border-silver-200/70 rounded-lg p-4 max-w-xs">
      <div className="flex items-center gap-2 mb-2">
       <Star size={16} className="text-yellow-400" fill="currentColor" />
       <span className="text-charcoal text-sm font-medium">Lascia una recensione</span>
      </div>
      <p className="text-silver-700 text-xs">
       Clicca qui per lasciare una recensione su Google
      </p>
     </div>
    </div>
   </div>

   {/* Modals */}
   <ReviewBotWizard 
    isOpen={showWizard} 
    onClose={() => setShowWizard(false)} 
    onComplete={handleWizardComplete} 
   />

   {showSettings && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
     <div className="bg-pearl-50 border border-silver-200/70 rounded-2xl p-6 max-w-2xl w-full">
      <h3 className="text-xl font-bold text-charcoal mb-4">Settings</h3>
      <p className="text-silver-700 mb-4">Settings component to be implemented</p>
      <button
       onClick={() => setShowSettings(false)}
       className="px-4 py-2 bg-charcoal text-pearl rounded-lg"
      >
       Close
      </button>
     </div>
    </div>
   )}

   {showSnippet && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
     <div className="bg-pearl-50 border border-silver-200/70 rounded-2xl p-6 max-w-2xl w-full">
      <h3 className="text-xl font-bold text-charcoal mb-4">Widget Snippet</h3>
      <p className="text-silver-700 mb-4">Widget snippet component to be implemented</p>
      <button
       onClick={() => setShowSnippet(false)}
       className="px-4 py-2 bg-charcoal text-pearl rounded-lg"
      >
       Close
      </button>
     </div>
    </div>
   )}
  </div>
 );
}

// Stat Card Component
function StatCard({
 label,
 value,
 icon: Icon,
 color,
 trend,
 subtitle
}: {
 label: string;
 value: number;
 icon: any;
 color: string;
 trend?: number;
 subtitle?: string;
}) {
 const colorClasses = {
  purple: "from-pearl-100/70 to-pearl-50 border-silver-200/70 text-silver-700",
  fuchsia: "from-pearl-100/70 to-pearl-50 border-silver-200/70 text-charcoal",
  emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400",
  yellow: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400",
 };

 return (
  <div className="bg-pearl-50 border border-silver-200/70 rounded-2xl p-6">
   <div className="flex items-center justify-between mb-3">
    <div className={`p-2 rounded-lg bg-gradient-to-br border ${colorClasses[color as keyof typeof colorClasses]}`}>
     <Icon size={20} />
    </div>
    {trend && (
     <span className={`text-xs font-bold ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
      {trend > 0 ? '+' : ''}{trend}%
     </span>
    )}
   </div>
   <p className="text-2xl font-bold text-charcoal mb-1">{value.toLocaleString()}</p>
   <p className="text-silver-700 text-sm">{label}</p>
   {subtitle && (
    <p className="text-silver-600 text-xs mt-1">{subtitle}</p>
   )}
  </div>
 );
}

// Connection Item Component
function ConnectionItem({
 icon: Icon,
 name,
 color,
 status,
 lastSync
}: {
 icon: any;
 name: string;
 color: string;
 status: 'connected' | 'disconnected';
 lastSync?: string;
}) {
 return (
  <div className="flex items-center justify-between py-3 border-b border-silver-200/70 last:border-0">
   <div className="flex items-center gap-3">
    <div
     className="p-2 rounded-lg"
     style={{ background: `${color}20` }}
    >
     <Icon size={20} style={{ color }} />
    </div>
    <div>
     <p className="text-charcoal font-medium">{name}</p>
     {lastSync && (
      <p className="text-silver-600 text-xs">Sync: {lastSync}</p>
     )}
    </div>
   </div>
   <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${
    status === 'connected'
     ? 'bg-pearl-100 text-charcoal border-silver-200/70'
     : 'bg-pearl-100/70 text-silver-700 border-silver-200/70'
   }`}>
    {status}
   </span>
  </div>
 );
}

// Activity Item Component
function ActivityItem({
 rating,
 name,
 time,
 clickedGoogle,
 feedback
}: {
 rating: number;
 name: string;
 time: string;
 clickedGoogle?: boolean;
 feedback?: string;
}) {
 return (
  <div className="flex items-start gap-4 py-3 border-b border-silver-200/70 last:border-0">
   <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => (
     <Star
      key={i}
      size={14}
      className={i < rating ? "text-yellow-400" : "text-silver-300"}
      fill={i < rating ? "currentColor" : "none"}
     />
    ))}
   </div>
   <div className="flex-1">
    <div className="flex items-center justify-between mb-1">
     <p className="text-charcoal font-medium text-sm">{name}</p>
     <span className="text-silver-600 text-xs">{time}</span>
    </div>
    {feedback && (
     <p className="text-silver-700 text-sm mb-2">{feedback}</p>
    )}
    {clickedGoogle && (
     <span className="text-xs text-emerald-400">✓“ Google Review</span>
    )}
   </div>
  </div>
 );
}



