'use client';

import { useState } from 'react';
import {
 X,
 ArrowRight,
 ArrowLeft,
 Check,
 Star,
 Link2,
 Palette,
 MessageSquare,
 ExternalLink,
 Copy,
 Search
} from 'lucide-react';

// Stripe icon
const StripeIcon = ({ size = 24, className = "" }) => (
 <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
 </svg>
);

// Shopify icon
const ShopifyIcon = ({ size = 24, className = "" }) => (
 <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
  <path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zm-2.71-17.636c0-.076-.006-.137-.006-.2 0-.625-.164-1.089-.428-1.452l-2.065 17.78 4.918-1.034-2.006-14.655c-.157-.205-.315-.37-.413-.439z"/>
 </svg>
);

// WooCommerce icon
const WooCommerceIcon = ({ size = 24, className = "" }) => (
 <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
  <path d="M2.227 4.857A2.228 2.228 0 000 7.094v7.457c0 1.236 1.001 2.237 2.237 2.237h4.558l-1.26 3.27 4.116-3.27h12.122A2.227 2.227 0 0024 14.551V7.094a2.227 2.227 0 00-2.227-2.237H2.227z"/>
 </svg>
);

interface ReviewBotWizardProps {
 onClose: () => void;
 onComplete: (config: any) => void;
 editMode?: boolean;
 initialData?: any;
}

const STEPS = [
 { id: 'business', title: 'Business', icon: Star },
 { id: 'ecommerce', title: 'eCommerce', icon: Link2 },
 { id: 'messages', title: 'Messaggi', icon: MessageSquare },
 { id: 'widget', title: 'Widget', icon: Palette },
];

export function ReviewBotWizard({ onClose, onComplete, editMode, initialData }: ReviewBotWizardProps) {
 const [currentStep, setCurrentStep] = useState(0);
 const [config, setConfig] = useState({
  // Business
  businessName: initialData?.businessName || '',
  googlePlaceId: initialData?.googlePlaceId || '',
  googleReviewUrl: initialData?.googleReviewUrl || '',

  // eCommerce
  ecommercePlatform: initialData?.ecommercePlatform || '',
  stripeApiKey: '',
  wooUrl: '',
  wooConsumerKey: '',
  wooConsumerSecret: '',
  shopifyDomain: '',
  shopifyAccessToken: '',

  // Messages
  thankYouMessage: initialData?.thankYouMessage || ' Grazie per il tuo acquisto!',
  surveyQuestion: initialData?.surveyQuestion || 'Come valuteresti la tua esperienza?',
  positiveMessage: initialData?.positiveMessage || 'Fantastico! Ti andrebbe di condividere la tua opinione su Google? Ci aiuta tantissimo!',
  negativeMessage: initialData?.negativeMessage || 'Grazie per il feedback! Cosa possiamo migliorare?',
  completedMessage: initialData?.completedMessage || 'Grazie mille per il tuo tempo! ',

  // Widget
  surveyType: initialData?.surveyType || 'EMOJI',
  positiveThreshold: initialData?.positiveThreshold || 4,
  widgetColor: initialData?.widgetColor || '#6366f1',
  widgetPosition: initialData?.widgetPosition || 'bottom-right',
  delaySeconds: initialData?.delaySeconds || 2,
 });

 const updateConfig = (key: string, value: any) => {
  setConfig(prev => ({ ...prev, [key]: value }));
 };

 const nextStep = () => {
  if (currentStep < STEPS.length - 1) {
   setCurrentStep(prev => prev + 1);
  } else {
   handleComplete();
  }
 };

 const prevStep = () => {
  if (currentStep > 0) {
   setCurrentStep(prev => prev - 1);
  }
 };

 const handleComplete = () => {
  onComplete(config);
 };

 const progress = ((currentStep + 1) / STEPS.length) * 100;

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
   {/* Backdrop */}
   <div
    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
    onClick={onClose}
   />

   {/* Modal */}
   <div className="relative w-full max-w-2xl bg-gradient-to-br from-[#1a0b2e] to-[#0f0520] border border-silver-200/70 rounded-2xl shadow-2xl overflow-hidden">
    {/* Header */}
    <div className="sticky top-0 z-10 bg-[#1a0b2e]/95 backdrop-blur-md border-b border-silver-200/70 px-6 py-4">
     <div className="flex items-center justify-between">
      <div>
       <h2 className="text-xl font-bold text-charcoal">
        {editMode ? 'Modifica Review Bot' : 'Configura Review Bot'}
       </h2>
       <p className="text-silver-600 text-sm mt-1">
        Step {currentStep + 1} di {STEPS.length}: {STEPS[currentStep].title}
       </p>
      </div>
      <button
       onClick={onClose}
       className="p-2 text-silver-600 hover:text-charcoal hover:bg-pearl-100 rounded-lg transition-all"
      >
       <X size={20} />
      </button>
     </div>

     {/* Progress Bar */}
     <div className="mt-4 h-1 bg-pearl-100 rounded-full overflow-hidden">
      <div
       className="h-full bg-charcoal transition-all duration-500"
       style={{ width: `${progress}%` }}
      />
     </div>

     {/* Step Indicators */}
     <div className="flex justify-between mt-4">
      {STEPS.map((step, index) => {
       const Icon = step.icon;
       const isActive = index === currentStep;
       const isCompleted = index < currentStep;

       return (
        <div
         key={step.id}
         className={`flex items-center gap-2 ${
          isActive ? 'text-charcoal' : isCompleted ? 'text-silver-700' : 'text-silver-500'
         }`}
        >
         <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
          isActive
           ? 'border-charcoal bg-pearl-100'
           : isCompleted
            ? 'border-silver-300 bg-pearl-100'
            : 'border-silver-200/70'
         }`}>
          {isCompleted ? <Check size={16} /> : <Icon size={16} />}
         </div>
         <span className="text-sm hidden sm:inline">{step.title}</span>
        </div>
       );
      })}
     </div>
    </div>

    {/* Content */}
    <div className="p-6 max-h-[60vh] overflow-y-auto">
     {currentStep === 0 && (
      <StepBusiness config={config} updateConfig={updateConfig} />
     )}
     {currentStep === 1 && (
      <StepEcommerce config={config} updateConfig={updateConfig} />
     )}
     {currentStep === 2 && (
      <StepMessages config={config} updateConfig={updateConfig} />
     )}
     {currentStep === 3 && (
      <StepWidget config={config} updateConfig={updateConfig} />
     )}
    </div>

    {/* Footer */}
    <div className="sticky bottom-0 bg-[#1a0b2e]/95 backdrop-blur-md border-t border-silver-200/70 px-6 py-4 flex justify-between">
     <button
      onClick={prevStep}
      disabled={currentStep === 0}
      className="px-4 py-2 border border-silver-200/70 text-silver-700 rounded-xl hover:bg-pearl-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
     >
      <ArrowLeft size={18} />
      Indietro
     </button>

     <button
      onClick={nextStep}
      className="px-6 py-2 bg-charcoal text-white rounded-xl font-medium hover:bg-charcoal/90 transition-all shadow-lg inline-flex items-center gap-2"
     >
      {currentStep === STEPS.length - 1 ? (
       <>
        <Check size={18} />
        Completa
       </>
      ) : (
       <>
        Avanti
        <ArrowRight size={18} />
       </>
      )}
     </button>
    </div>
   </div>
  </div>
 );
}

// Step 1: Business Info
function StepBusiness({ config, updateConfig }: { config: any; updateConfig: (key: string, value: any) => void }) {
 const [searching, setSearching] = useState(false);

 const searchGooglePlace = async () => {
  if (!config.businessName) return;

  setSearching(true);
  // TODO: Implement Google Places API search
  // For now, generate a mock Place ID
  setTimeout(() => {
   const mockPlaceId = `ChIJ${Math.random().toString(36).substring(2, 15)}`;
   updateConfig('googlePlaceId', mockPlaceId);
   updateConfig('googleReviewUrl', `https://search.google.com/local/writereview?placeid=${mockPlaceId}`);
   setSearching(false);
  }, 1000);
 };

 return (
  <div className="space-y-6">
   <div>
    <h3 className="text-lg font-semibold text-charcoal mb-2">Informazioni Business</h3>
    <p className="text-silver-600 text-sm">
     Inserisci i dati della tua attività  per configurare il link alle recensioni Google.
    </p>
   </div>

   <div className="space-y-4">
    <div>
     <label className="block text-sm font-medium text-silver-700 mb-2">
      Nome Attività  *
     </label>
     <input
      type="text"
      value={config.businessName}
      onChange={(e) => updateConfig('businessName', e.target.value)}
      placeholder="Es. Pizzeria Da Mario"
      className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-xl text-charcoal placeholder:text-silver-500 focus:outline-none focus:border-silver-300 focus:ring-2 focus:ring-charcoal/10"
     />
    </div>

    <div className="flex gap-3">
     <div className="flex-1">
      <label className="block text-sm font-medium text-silver-700 mb-2">
       Google Place ID
      </label>
      <input
       type="text"
       value={config.googlePlaceId}
       onChange={(e) => updateConfig('googlePlaceId', e.target.value)}
       placeholder="ChIJ..."
       className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-xl text-charcoal placeholder:text-silver-500 focus:outline-none focus:border-silver-300"
      />
     </div>
     <button
      onClick={searchGooglePlace}
      disabled={!config.businessName || searching}
      className="self-end px-4 py-3 bg-pearl-100 border border-silver-200/70 text-silver-700 rounded-xl hover:bg-pearl-100 transition-all disabled:opacity-50 inline-flex items-center gap-2"
     >
      {searching ? (
       <div className="w-5 h-5 border-2 border-silver-300 border-t-transparent rounded-full animate-spin" />
      ) : (
       <Search size={18} />
      )}
      Cerca
     </button>
    </div>

    {config.googleReviewUrl && (
     <div>
      <label className="block text-sm font-medium text-silver-700 mb-2">
       Link Recensione Google
      </label>
      <div className="flex gap-2">
       <input
        type="text"
        value={config.googleReviewUrl}
        readOnly
        className="flex-1 px-4 py-3 bg-pearl-100/70 border border-silver-200/70 rounded-xl text-silver-600 text-sm"
       />
       <button
        onClick={() => navigator.clipboard.writeText(config.googleReviewUrl)}
        className="px-3 py-3 bg-pearl-100 border border-silver-200/70 text-silver-700 rounded-xl hover:bg-pearl-100 transition-all"
       >
        <Copy size={18} />
       </button>
       <a
        href={config.googleReviewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-3 bg-pearl-100 border border-silver-200/70 text-silver-700 rounded-xl hover:bg-pearl-100 transition-all"
       >
        <ExternalLink size={18} />
       </a>
      </div>
      <p className="text-silver-600 text-xs mt-2">
       Questo link verrà  mostrato ai clienti soddisfatti per lasciare una recensione.
      </p>
     </div>
    )}

    {/* Info Box */}
    <div className="p-4 bg-pearl-100/70 border border-silver-200/70 rounded-xl">
     <p className="text-silver-700 text-sm">
      ’¡ <strong>Tip:</strong> Puoi trovare il Place ID della tua attività  cercandola su
      <a
       href="https://developers.google.com/maps/documentation/places/web-service/place-id"
       target="_blank"
       rel="noopener noreferrer"
       className="text-charcoal hover:text-silver-700 ml-1"
      >
       Google Place ID Finder
      </a>
     </p>
    </div>
   </div>
  </div>
 );
}

// Step 2: eCommerce Connection
function StepEcommerce({ config, updateConfig }: { config: any; updateConfig: (key: string, value: any) => void }) {
 const platforms = [
  { id: 'stripe', name: 'Stripe', icon: StripeIcon, color: '#635BFF' },
  { id: 'woocommerce', name: 'WooCommerce', icon: WooCommerceIcon, color: '#96588a' },
  { id: 'shopify', name: 'Shopify', icon: ShopifyIcon, color: '#96bf48' },
 ];

 return (
  <div className="space-y-6">
   <div>
    <h3 className="text-lg font-semibold text-charcoal mb-2">Connetti eCommerce</h3>
    <p className="text-silver-600 text-sm">
     Seleziona la piattaforma da cui ricevere le notifiche di acquisto.
    </p>
   </div>

   {/* Platform Selection */}
   <div className="grid grid-cols-3 gap-4">
    {platforms.map((platform) => {
     const Icon = platform.icon;
     const isSelected = config.ecommercePlatform === platform.id;

     return (
      <button
       key={platform.id}
       onClick={() => updateConfig('ecommercePlatform', platform.id)}
       className={`p-4 rounded-xl border-2 transition-all ${
        isSelected
         ? 'border-charcoal bg-pearl-100/70'
         : 'border-silver-200/70 hover:border-silver-300 bg-pearl-100/70'
       }`}
      >
       <div className="flex flex-col items-center gap-2">
        <div
         className="p-3 rounded-lg"
         style={{ background: `${platform.color}20`, color: platform.color }}
        >
         <Icon size={28} className="text-current" />
        </div>
        <span className="text-charcoal font-medium">{platform.name}</span>
       </div>
      </button>
     );
    })}
   </div>

   {/* Platform-specific fields */}
   {config.ecommercePlatform === 'stripe' && (
    <div className="space-y-4 p-4 bg-pearl-100/70 rounded-xl border border-silver-200/70">
     <div>
      <label className="block text-sm font-medium text-silver-700 mb-2">
       Stripe Webhook Secret
      </label>
      <input
       type="password"
       value={config.stripeApiKey}
       onChange={(e) => updateConfig('stripeApiKey', e.target.value)}
       placeholder="whsec_..."
       className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-xl text-charcoal placeholder:text-silver-500 focus:outline-none focus:border-silver-300"
      />
      <p className="text-silver-600 text-xs mt-2">
       Trovi il webhook secret nella dashboard Stripe †’ Developers †’ Webhooks
      </p>
     </div>

     <div className="p-3 bg-[#635BFF]/10 border border-[#635BFF]/30 rounded-lg">
      <p className="text-sm text-silver-700 mb-2">
       <strong>Webhook URL da configurare in Stripe:</strong>
      </p>
      <code className="text-xs text-silver-700 bg-pearl-100 px-2 py-1 rounded">
       https://api.chatbotstudio.io/webhooks/stripe/review
      </code>
     </div>
    </div>
   )}

   {config.ecommercePlatform === 'woocommerce' && (
    <div className="space-y-4 p-4 bg-pearl-100/70 rounded-xl border border-silver-200/70">
     <div>
      <label className="block text-sm font-medium text-silver-700 mb-2">
       URL del tuo negozio WooCommerce
      </label>
      <input
       type="url"
       value={config.wooUrl}
       onChange={(e) => updateConfig('wooUrl', e.target.value)}
       placeholder="https://tuonegozio.com"
       className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-xl text-charcoal placeholder:text-silver-500 focus:outline-none focus:border-silver-300"
      />
     </div>
     <div className="grid grid-cols-2 gap-4">
      <div>
       <label className="block text-sm font-medium text-silver-700 mb-2">
        Consumer Key
       </label>
       <input
        type="password"
        value={config.wooConsumerKey}
        onChange={(e) => updateConfig('wooConsumerKey', e.target.value)}
        placeholder="ck_..."
        className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-xl text-charcoal placeholder:text-silver-500 focus:outline-none focus:border-silver-300"
       />
      </div>
      <div>
       <label className="block text-sm font-medium text-silver-700 mb-2">
        Consumer Secret
       </label>
       <input
        type="password"
        value={config.wooConsumerSecret}
        onChange={(e) => updateConfig('wooConsumerSecret', e.target.value)}
        placeholder="cs_..."
        className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-xl text-charcoal placeholder:text-silver-500 focus:outline-none focus:border-silver-300"
       />
      </div>
     </div>
    </div>
   )}

   {config.ecommercePlatform === 'shopify' && (
    <div className="space-y-4 p-4 bg-pearl-100/70 rounded-xl border border-silver-200/70">
     <div>
      <label className="block text-sm font-medium text-silver-700 mb-2">
       Shopify Store Domain
      </label>
      <input
       type="text"
       value={config.shopifyDomain}
       onChange={(e) => updateConfig('shopifyDomain', e.target.value)}
       placeholder="tuonegozio.myshopify.com"
       className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-xl text-charcoal placeholder:text-silver-500 focus:outline-none focus:border-silver-300"
      />
     </div>
     <div>
      <label className="block text-sm font-medium text-silver-700 mb-2">
       Access Token
      </label>
      <input
       type="password"
       value={config.shopifyAccessToken}
       onChange={(e) => updateConfig('shopifyAccessToken', e.target.value)}
       placeholder="shpat_..."
       className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-xl text-charcoal placeholder:text-silver-500 focus:outline-none focus:border-silver-300"
      />
     </div>
    </div>
   )}

   {!config.ecommercePlatform && (
    <div className="p-4 bg-pearl-100/70 border border-silver-200/70 rounded-xl text-center">
     <p className="text-silver-600 text-sm">
      Seleziona una piattaforma per continuare
     </p>
    </div>
   )}
  </div>
 );
}

// Step 3: Messages
function StepMessages({ config, updateConfig }: { config: any; updateConfig: (key: string, value: any) => void }) {
 return (
  <div className="space-y-6">
   <div>
    <h3 className="text-lg font-semibold text-charcoal mb-2">Personalizza Messaggi</h3>
    <p className="text-silver-600 text-sm">
     Personalizza i messaggi che i tuoi clienti vedranno.
    </p>
   </div>

   <div className="space-y-4">
    <div>
     <label className="block text-sm font-medium text-silver-700 mb-2">
      Messaggio di Ringraziamento
     </label>
     <input
      type="text"
      value={config.thankYouMessage}
      onChange={(e) => updateConfig('thankYouMessage', e.target.value)}
      placeholder="Ž‰ Grazie per il tuo acquisto!"
      className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-xl text-charcoal placeholder:text-silver-500 focus:outline-none focus:border-silver-300"
     />
     <p className="text-silver-600 text-xs mt-1">
      Mostrato come titolo del widget
     </p>
    </div>

    <div>
     <label className="block text-sm font-medium text-silver-700 mb-2">
      Domanda Survey
     </label>
     <input
      type="text"
      value={config.surveyQuestion}
      onChange={(e) => updateConfig('surveyQuestion', e.target.value)}
      placeholder="Come valuteresti la tua esperienza?"
      className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-xl text-charcoal placeholder:text-silver-500 focus:outline-none focus:border-silver-300"
     />
    </div>

    <div>
     <label className="block text-sm font-medium text-silver-700 mb-2">
      Messaggio Feedback Positivo (­4-5)
     </label>
     <textarea
      value={config.positiveMessage}
      onChange={(e) => updateConfig('positiveMessage', e.target.value)}
      placeholder="Fantastico! Ti andrebbe di condividere la tua opinione su Google?"
      rows={2}
      className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-xl text-charcoal placeholder:text-silver-500 focus:outline-none focus:border-silver-300 resize-none"
     />
     <p className="text-silver-600 text-xs mt-1">
      Mostrato quando il cliente dà  un voto positivo
     </p>
    </div>

    <div>
     <label className="block text-sm font-medium text-silver-700 mb-2">
      Messaggio Feedback Negativo (­1-3)
     </label>
     <textarea
      value={config.negativeMessage}
      onChange={(e) => updateConfig('negativeMessage', e.target.value)}
      placeholder="Grazie per il feedback! Cosa possiamo migliorare?"
      rows={2}
      className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-xl text-charcoal placeholder:text-silver-500 focus:outline-none focus:border-silver-300 resize-none"
     />
     <p className="text-silver-600 text-xs mt-1">
      Mostrato quando il cliente dà  un voto negativo (NON mostra link Google)
     </p>
    </div>

    <div>
     <label className="block text-sm font-medium text-silver-700 mb-2">
      Messaggio Completamento
     </label>
     <input
      type="text"
      value={config.completedMessage}
      onChange={(e) => updateConfig('completedMessage', e.target.value)}
      placeholder="Grazie mille per il tuo tempo! ¤ï¸"
      className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-xl text-charcoal placeholder:text-silver-500 focus:outline-none focus:border-silver-300"
     />
    </div>
   </div>

   {/* Preview */}
   <div className="p-4 bg-pearl-100/70 border border-silver-200/70 rounded-xl">
    <p className="text-silver-700 text-sm mb-3">
     <strong>Anteprima Flow:</strong>
    </p>
    <div className="space-y-2 text-sm">
     <div className="flex items-center gap-2">
      <span className="w-6 h-6 rounded-full bg-pearl-50 border border-silver-200/70 text-charcoal flex items-center justify-center text-xs">1</span>
      <span className="text-silver-600">{config.thankYouMessage}</span>
     </div>
     <div className="flex items-center gap-2">
      <span className="w-6 h-6 rounded-full bg-pearl-50 border border-silver-200/70 text-charcoal flex items-center justify-center text-xs">2</span>
      <span className="text-silver-600">{config.surveyQuestion} → 😍😊😐😕😞</span>
     </div>
     <div className="flex items-center gap-2">
      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs">3a</span>
      <span className="text-silver-600">Se 😍😊 → {config.positiveMessage.substring(0, 40)}...</span>
     </div>
     <div className="flex items-center gap-2">
      <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs">3b</span>
      <span className="text-silver-600">Se 😐😕😞 → {config.negativeMessage.substring(0, 40)}...</span>
     </div>
    </div>
   </div>
  </div>
 );
}

// Step 4: Widget Customization
function StepWidget({ config, updateConfig }: { config: any; updateConfig: (key: string, value: any) => void }) {
 const surveyTypes = [
  { id: 'EMOJI', label: 'Emoji', preview: '˜ ˜Š ˜ ˜• ˜ž' },
  { id: 'STARS', label: 'Stelle', preview: '­­­­­' },
  { id: 'NPS', label: 'NPS (0-10)', preview: '0 1 2 3 4 5 6 7 8 9 10' },
 ];

 const colors = [
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
 ];

 return (
  <div className="space-y-6">
   <div>
    <h3 className="text-lg font-semibold text-charcoal mb-2">Personalizza Widget</h3>
    <p className="text-silver-600 text-sm">
     Configura l&apos;aspetto e il comportamento del widget.
    </p>
   </div>

   <div className="space-y-4">
    {/* Survey Type */}
    <div>
     <label className="block text-sm font-medium text-silver-700 mb-2">
      Tipo di Survey
     </label>
     <div className="grid grid-cols-3 gap-3">
      {surveyTypes.map((type) => (
       <button
        key={type.id}
        onClick={() => updateConfig('surveyType', type.id)}
        className={`p-3 rounded-xl border-2 transition-all text-center ${
         config.surveyType === type.id
          ? 'border-charcoal bg-pearl-100/70'
          : 'border-silver-200/70 hover:border-silver-300'
        }`}
       >
        <p className="text-charcoal font-medium mb-1">{type.label}</p>
        <p className="text-xs text-silver-600">{type.preview}</p>
       </button>
      ))}
     </div>
    </div>

    {/* Positive Threshold */}
    <div>
     <label className="block text-sm font-medium text-silver-700 mb-2">
      Soglia Feedback Positivo
     </label>
     <div className="flex items-center gap-4">
      <input
       type="range"
       min="1"
       max="5"
       value={config.positiveThreshold}
       onChange={(e) => updateConfig('positiveThreshold', parseInt(e.target.value))}
       className="flex-1 accent-emerald-600"
      />
      <span className="text-charcoal font-bold w-8 text-center">
       {config.positiveThreshold}+
      </span>
     </div>
     <p className="text-silver-600 text-xs mt-1">
      Rating ‰¥ {config.positiveThreshold} mostrerà  il prompt Google Review
     </p>
    </div>

    {/* Color */}
    <div>
     <label className="block text-sm font-medium text-silver-700 mb-2">
      Colore Widget
     </label>
     <div className="flex gap-3">
      {colors.map((color) => (
       <button
        key={color}
        onClick={() => updateConfig('widgetColor', color)}
        className={`w-10 h-10 rounded-xl transition-all ${
         config.widgetColor === color
          ? 'ring-2 ring-charcoal scale-110'
          : 'hover:scale-105'
        }`}
        style={{ background: color }}
       />
      ))}
      <input
       type="color"
       value={config.widgetColor}
       onChange={(e) => updateConfig('widgetColor', e.target.value)}
       className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-2 border-dashed border-silver-200/70"
      />
     </div>
    </div>

    {/* Position */}
    <div>
     <label className="block text-sm font-medium text-silver-700 mb-2">
      Posizione
     </label>
     <div className="grid grid-cols-2 gap-3">
      <button
       onClick={() => updateConfig('widgetPosition', 'bottom-right')}
       className={`p-3 rounded-xl border-2 transition-all ${
        config.widgetPosition === 'bottom-right'
         ? 'border-charcoal bg-pearl-100/70'
         : 'border-silver-200/70 hover:border-silver-300'
       }`}
      >
       <p className="text-charcoal">Basso Destra</p>
      </button>
      <button
       onClick={() => updateConfig('widgetPosition', 'bottom-left')}
       className={`p-3 rounded-xl border-2 transition-all ${
        config.widgetPosition === 'bottom-left'
         ? 'border-charcoal bg-pearl-100/70'
         : 'border-silver-200/70 hover:border-silver-300'
       }`}
      >
       <p className="text-charcoal">Basso Sinistra</p>
      </button>
     </div>
    </div>

    {/* Delay */}
    <div>
     <label className="block text-sm font-medium text-silver-700 mb-2">
      Ritardo Apertura (secondi)
     </label>
     <input
      type="number"
      min="0"
      max="30"
      value={config.delaySeconds}
      onChange={(e) => updateConfig('delaySeconds', parseInt(e.target.value))}
      className="w-24 px-4 py-2 bg-pearl-50 border border-silver-200/70 rounded-xl text-charcoal focus:outline-none focus:border-silver-300"
     />
     <p className="text-silver-600 text-xs mt-1">
      Quanto tempo aspettare dopo l&apos;acquisto prima di mostrare il widget
     </p>
    </div>
   </div>

   {/* Mini Preview */}
   <div className="p-4 bg-pearl-100/70 border border-silver-200/70 rounded-xl relative min-h-[200px]">
    <p className="text-silver-600 text-xs mb-4">Anteprima</p>

    <div
     className={`absolute ${config.widgetPosition === 'bottom-right' ? 'bottom-4 right-4' : 'bottom-4 left-4'} w-72 bg-white rounded-2xl shadow-2xl overflow-hidden`}
    >
     <div
      className="p-4"
      style={{ background: `linear-gradient(135deg, ${config.widgetColor}, ${config.widgetColor}dd)` }}
     >
      <p className="text-pearl-50 font-semibold">{config.thankYouMessage}</p>
     </div>
     <div className="p-4">
      <p className="text-gray-700 text-sm mb-3">{config.surveyQuestion}</p>
      <div className="flex justify-center gap-2 text-2xl">
       {config.surveyType === 'EMOJI' && (
        <>
         <span>˜</span>
         <span>˜Š</span>
         <span>˜</span>
         <span>˜•</span>
         <span>˜ž</span>
        </>
       )}
       {config.surveyType === 'STARS' && (
        <>
         <span>­</span>
         <span>­</span>
         <span>­</span>
         <span>­</span>
         <span>­</span>
        </>
       )}
       {config.surveyType === 'NPS' && (
        <div className="flex gap-1 text-sm">
         {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
          <span key={n} className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-gray-600">{n}</span>
         ))}
        </div>
       )}
      </div>
     </div>
    </div>
   </div>
  </div>
 );
}



