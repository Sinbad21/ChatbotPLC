import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, 
  MessageSquare, 
  Layout, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  X,
  Building2
} from 'lucide-react';
import { ReviewBotWizardConfig } from '@/types/review-bot';
import { StripeIcon, WooCommerceIcon, ShopifyIcon, GoogleIcon } from '@/components/icons';

interface ReviewBotWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (config: ReviewBotWizardConfig) => Promise<void>;
}

const STEPS = [
  { id: 1, title: 'Business Info', icon: Building2 },
  { id: 2, title: 'Integration', icon: Store },
  { id: 3, title: 'Messages', icon: MessageSquare },
  { id: 4, title: 'Widget', icon: Layout },
];

const INITIAL_CONFIG: ReviewBotWizardConfig = {
  businessName: '',
  googlePlaceId: '',
  googleReviewUrl: '',
  ecommercePlatform: '',
  stripeWebhookSecret: '',
  wooUrl: '',
  wooConsumerKey: '',
  wooConsumerSecret: '',
  shopifyDomain: '',
  shopifyAccessToken: '',
  thankYouMessage: '🎉 Grazie per il tuo acquisto!',
  surveyQuestion: 'Come valuteresti la tua esperienza?',
  positiveMessage: 'Fantastico! Ti andrebbe di condividere la tua opinione su Google?',
  negativeMessage: 'Grazie per il feedback! Cosa possiamo migliorare?',
  completedMessage: 'Grazie mille per il tuo tempo! ❤️',
  surveyType: 'EMOJI',
  positiveThreshold: 4,
  widgetColor: '#10b981',
  widgetPosition: 'bottom-right',
  delaySeconds: 2,
};

export default function ReviewBotWizard({ isOpen, onClose, onComplete }: ReviewBotWizardProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<ReviewBotWizardConfig>(INITIAL_CONFIG);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(config);
    } catch (error) {
      console.error('Error submitting wizard:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateConfig = (key: keyof ReviewBotWizardConfig, value: any) => {
    setConfig((prev: ReviewBotWizardConfig) => ({ ...prev, [key]: value }));
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return config.businessName.trim().length > 0;
      case 2:
        if (config.ecommercePlatform === 'stripe') return !!config.stripeWebhookSecret;
        if (config.ecommercePlatform === 'woocommerce') return !!config.wooUrl && !!config.wooConsumerKey && !!config.wooConsumerSecret;
        if (config.ecommercePlatform === 'shopify') return !!config.shopifyDomain && !!config.shopifyAccessToken;
        return true;
      case 3:
        return !!config.thankYouMessage && !!config.surveyQuestion && !!config.positiveMessage && !!config.negativeMessage;
      default:
        return true;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-pearl-50 border border-silver-200/70 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-silver-200/70 flex justify-between items-center bg-pearl-50">
          <div>
            <h2 className="text-2xl font-bold text-charcoal">Setup Review Bot</h2>
            <p className="text-silver-600 text-sm">Configure your automated review collection system</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-pearl-100 rounded-lg transition-colors text-silver-600 hover:text-charcoal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-pearl-50 border-b border-silver-200/70">
          <div className="flex justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-silver-200/70 -z-10" />
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isActive = s.id === step;
              const isCompleted = s.id < step;

              return (
                <div key={s.id} className="flex flex-col items-center gap-2 bg-pearl-50 px-2">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isActive 
                        ? 'border-silver-300 bg-pearl-100 text-charcoal ' 
                        : isCompleted
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                          : 'border-silver-200/70 bg-pearl-50 text-silver-600'
                    }`}
                  >
                    {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                  </div>
                  <span className={`text-xs font-medium transition-colors ${
                    isActive ? 'text-charcoal' : 'text-silver-500'
                  }`}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-sm font-medium text-silver-700 mb-1 block">Business Name <span className="text-red-400">*</span></span>
                      <input
                        type="text"
                        value={config.businessName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('businessName', e.target.value)}
                        className="w-full bg-pearl-50 border border-silver-200/70 rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:border-silver-300 transition-colors"
                        placeholder="e.g. Acme Corp"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-silver-700 mb-1 block">Google Place ID</span>
                      <div className="relative">
                        <input
                          type="text"
                          value={config.googlePlaceId}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('googlePlaceId', e.target.value)}
                          className="w-full bg-pearl-50 border border-silver-200/70 rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:border-silver-300 transition-colors pl-10"
                          placeholder="ChIJ..."
                        />
                        <GoogleIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                      </div>
                      <p className="text-xs text-silver-500 mt-1">
                        You can find this in your Google Business Profile settings or using the Place ID Finder.
                      </p>
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-silver-700 mb-1 block">Google Review URL</span>
                      <input
                        type="text"
                        value={config.googleReviewUrl}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('googleReviewUrl', e.target.value)}
                        className="w-full bg-pearl-50 border border-silver-200/70 rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:border-silver-300 transition-colors"
                        placeholder="https://g.page/r/..."
                      />
                    </label>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'stripe', name: 'Stripe', icon: StripeIcon },
                      { id: 'woocommerce', name: 'WooCommerce', icon: WooCommerceIcon },
                      { id: 'shopify', name: 'Shopify', icon: ShopifyIcon },
                    ].map((platform) => (
                      <button
                        key={platform.id}
                        onClick={() => updateConfig('ecommercePlatform', platform.id)}
                        className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-3 ${
                          config.ecommercePlatform === platform.id
                            ? 'bg-pearl-100 border-silver-300 text-charcoal shadow-[0_0_20px_rgba(147,51,234,0.2)]'
                            : 'bg-pearl-50 border-silver-200/70 text-silver-500 hover:border-silver-300 hover:bg-pearl-100/70'
                        }`}
                      >
                        <platform.icon size={32} />
                        <span className="font-medium">{platform.name}</span>
                      </button>
                    ))}
                  </div>

                  {config.ecommercePlatform === 'stripe' && (
                    <div className="p-4 bg-pearl-100/70 rounded-xl border border-silver-200/70 space-y-4">
                      <label className="block">
                        <span className="text-sm font-medium text-silver-700 mb-1 block">Stripe Webhook Secret</span>
                        <input
                          type="password"
                          value={config.stripeWebhookSecret}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('stripeWebhookSecret', e.target.value)}
                          className="w-full bg-pearl-50 border border-silver-200/70 rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:border-silver-300 transition-colors"
                          placeholder="whsec_..."
                        />
                      </label>
                    </div>
                  )}

                  {config.ecommercePlatform === 'woocommerce' && (
                    <div className="p-4 bg-pearl-100/70 rounded-xl border border-silver-200/70 space-y-4">
                      <label className="block">
                        <span className="text-sm font-medium text-silver-700 mb-1 block">Store URL</span>
                        <input
                          type="text"
                          value={config.wooUrl}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('wooUrl', e.target.value)}
                          className="w-full bg-pearl-50 border border-silver-200/70 rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:border-silver-300 transition-colors"
                          placeholder="https://yourstore.com"
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <label className="block">
                          <span className="text-sm font-medium text-silver-700 mb-1 block">Consumer Key</span>
                          <input
                            type="text"
                            value={config.wooConsumerKey}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('wooConsumerKey', e.target.value)}
                            className="w-full bg-pearl-50 border border-silver-200/70 rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:border-silver-300 transition-colors"
                            placeholder="ck_..."
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-silver-700 mb-1 block">Consumer Secret</span>
                          <input
                            type="password"
                            value={config.wooConsumerSecret}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('wooConsumerSecret', e.target.value)}
                            className="w-full bg-pearl-50 border border-silver-200/70 rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:border-silver-300 transition-colors"
                            placeholder="cs_..."
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {config.ecommercePlatform === 'shopify' && (
                    <div className="p-4 bg-pearl-100/70 rounded-xl border border-silver-200/70 space-y-4">
                      <label className="block">
                        <span className="text-sm font-medium text-silver-700 mb-1 block">Shop Domain</span>
                        <input
                          type="text"
                          value={config.shopifyDomain}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('shopifyDomain', e.target.value)}
                          className="w-full bg-pearl-50 border border-silver-200/70 rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:border-silver-300 transition-colors"
                          placeholder="your-store.myshopify.com"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-silver-700 mb-1 block">Access Token</span>
                        <input
                          type="password"
                          value={config.shopifyAccessToken}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('shopifyAccessToken', e.target.value)}
                          className="w-full bg-pearl-50 border border-silver-200/70 rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:border-silver-300 transition-colors"
                          placeholder="shpat_..."
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <label className="block">
                      <span className="text-sm font-medium text-silver-700 mb-1 block">Thank You Message</span>
                      <p className="text-xs text-silver-500 mb-2">Sent immediately after purchase</p>
                      <textarea
                        value={config.thankYouMessage}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateConfig('thankYouMessage', e.target.value)}
                        className="w-full bg-pearl-50 border border-silver-200/70 rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:border-silver-300 transition-colors h-20 resize-none"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-silver-700 mb-1 block">Survey Question</span>
                      <input
                        type="text"
                        value={config.surveyQuestion}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('surveyQuestion', e.target.value)}
                        className="w-full bg-pearl-50 border border-silver-200/70 rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:border-silver-300 transition-colors"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="block">
                        <span className="text-sm font-medium text-green-400 mb-1 block">Positive Feedback Message</span>
                        <p className="text-xs text-silver-500 mb-2">Shown when rating is high (asks for Google Review)</p>
                        <textarea
                          value={config.positiveMessage}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateConfig('positiveMessage', e.target.value)}
                          className="w-full bg-pearl-50 border border-silver-200/70 rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:border-silver-300 transition-colors h-24 resize-none"
                        />
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium text-orange-400 mb-1 block">Negative Feedback Message</span>
                        <p className="text-xs text-silver-500 mb-2">Shown when rating is low (internal feedback only)</p>
                        <textarea
                          value={config.negativeMessage}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateConfig('negativeMessage', e.target.value)}
                          className="w-full bg-pearl-50 border border-silver-200/70 rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:border-silver-300 transition-colors h-24 resize-none"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <label className="block">
                        <span className="text-sm font-medium text-silver-700 mb-1 block">Survey Type</span>
                        <div className="grid grid-cols-3 gap-2">
                          {['EMOJI', 'STARS', 'NPS'].map((type) => (
                            <button
                              key={type}
                              onClick={() => updateConfig('surveyType', type)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                                config.surveyType === type
                                  ? 'bg-charcoal text-white border-silver-300'
                                  : 'bg-pearl-50 text-silver-600 border-silver-200/70 hover:bg-silver-200/70'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium text-silver-700 mb-1 block">Positive Threshold</span>
                        <p className="text-xs text-silver-500 mb-2">Minimum rating to ask for Google Review</p>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          value={config.positiveThreshold}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('positiveThreshold', parseInt(e.target.value))}
                          className="w-full accent-emerald-600"
                        />
                        <div className="flex justify-between text-xs text-silver-500 mt-1">
                          <span>1</span>
                          <span>2</span>
                          <span>3</span>
                          <span>4</span>
                          <span>5</span>
                        </div>
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium text-silver-700 mb-1 block">Widget Color</span>
                        <div className="flex gap-2 mt-2">
                          {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'].map((color) => (
                            <button
                              key={color}
                              onClick={() => updateConfig('widgetColor', color)}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${
                                config.widgetColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                          <input
                            type="color"
                            value={config.widgetColor}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('widgetColor', e.target.value)}
                            className="w-8 h-8 rounded-full overflow-hidden cursor-pointer border-0 p-0"
                          />
                        </div>
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium text-silver-700 mb-1 block">Position</span>
                        <div className="grid grid-cols-2 gap-2">
                          {['bottom-right', 'bottom-left'].map((pos) => (
                            <button
                              key={pos}
                              onClick={() => updateConfig('widgetPosition', pos)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                                config.widgetPosition === pos
                                  ? 'bg-charcoal text-white border-silver-300'
                                  : 'bg-pearl-50 text-silver-600 border-silver-200/70 hover:bg-silver-200/70'
                              }`}
                            >
                              {pos.replace('-', ' ')}
                            </button>
                          ))}
                        </div>
                      </label>
                    </div>

                    {/* Preview */}
                    <div className="bg-pearl-100/70 rounded-xl border border-silver-200/70 p-6 flex items-center justify-center relative min-h-[300px]">
                      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                      
                      {/* Widget Preview */}
                      <div 
                        className={`absolute p-4 rounded-xl shadow-2xl max-w-[280px] w-full bg-white text-gray-900`}
                        style={{ 
                          [config.widgetPosition.includes('right') ? 'right' : 'left']: '20px',
                          bottom: '20px',
                          borderLeft: `4px solid ${config.widgetColor}`
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-sm">{config.businessName || 'Business Name'}</h4>
                          <button className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{config.surveyQuestion}</p>
                        <div className={`flex justify-center ${config.surveyType === 'NPS' ? 'gap-1 flex-wrap' : 'gap-2'}`}>
                          {config.surveyType === 'NPS' ? (
                            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                              <button 
                                key={i} 
                                className={`w-5 h-7 rounded flex items-center justify-center text-[10px] font-bold transition-transform hover:scale-110 ${
                                  i <= 6 ? 'bg-red-100 text-red-600' :
                                  i <= 8 ? 'bg-yellow-100 text-yellow-600' :
                                  'bg-green-100 text-green-600'
                                }`}
                              >
                                {i}
                              </button>
                            ))
                          ) : (
                            [1, 2, 3, 4, 5].map((i) => (
                              <button key={i} className="text-xl hover:scale-110 transition-transform">
                                {config.surveyType === 'EMOJI' 
                                  ? ['😠', '🙁', '😐', '🙂', '😍'][i-1] 
                                  : '⭐'
                                }
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-silver-200/70 flex justify-between bg-pearl-50">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className={`px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${
              step === 1
                ? 'opacity-0 pointer-events-none'
                : 'text-silver-700 hover:text-charcoal hover:bg-pearl-100'
            }`}
          >
            <ChevronLeft size={18} />
            Back
          </button>

          <button
            onClick={step === 4 ? handleSubmit : handleNext}
            disabled={isSubmitting || !isStepValid()}
            className="px-8 py-2.5 bg-charcoal hover:bg-charcoal/90 text-pearl-50 rounded-xl font-medium  flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              'Creating...'
            ) : step === 4 ? (
              <>Complete Setup <Check size={18} /></>
            ) : (
              <>Next Step <ChevronRight size={18} /></>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

