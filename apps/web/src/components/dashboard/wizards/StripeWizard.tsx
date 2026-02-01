'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';

interface StripeWizardProps {
 botId: string;
 onClose: () => void;
 onSave: (config: any) => void;
 initialConfig?: Partial<{
  webhookSecret: string;
 }>;
 onDisconnect?: () => void | Promise<void>;
}

export function StripeWizard({ botId, onClose, onSave, initialConfig, onDisconnect }: StripeWizardProps) {
 const [config, setConfig] = useState({
  webhookSecret: initialConfig?.webhookSecret || '',
 });

 const handleSave = () => {
  onSave({ ...config, botId });
  onClose();
 };

 return (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
   <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-pearl-50 border border-silver-200/70">
    <div className="sticky top-0 bg-pearl-50/95 backdrop-blur border-b border-silver-200/70 p-6 flex items-center justify-between">
     <div>
      <h2 className="text-2xl font-bold text-charcoal">Integrazione Stripe</h2>
      <p className="text-sm text-silver-700 mt-1">Salva il webhook signing secret (whsec_...)</p>
     </div>
     <button onClick={onClose} className="text-silver-700 hover:text-charcoal transition-colors">
      <X className="w-6 h-6" />
     </button>
    </div>

    <div className="p-6 space-y-4">
     <div>
      <label className="block text-sm font-medium text-silver-700 mb-2">Webhook Signing Secret</label>
      <input
       type="password"
       value={config.webhookSecret}
       onChange={(e) => setConfig({ ...config, webhookSecret: e.target.value })}
       placeholder="whsec_..."
       className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-lg focus:ring-2 focus:ring-charcoal/10 focus:border-silver-300 text-charcoal placeholder:text-silver-500 transition-all"
      />
      <p className="text-xs text-silver-600 mt-1">
       Stripe Dashboard Developers Webhooks (endpoint) Signing secret
      </p>
     </div>

     <div className="bg-pearl-100/70 border border-silver-200/70 rounded-lg p-4">
      <p className="text-sm text-silver-700">
       Endpoint webhook (Stripe): <span className="text-charcoal font-semibold">/api/webhooks/stripe/review</span>
      </p>
      <p className="text-xs text-silver-600 mt-1">
       Configura lendpoint nel tuo Stripe dashboard con gli eventi: checkout.session.completed, payment_intent.succeeded, charge.succeeded
      </p>
     </div>
    </div>

    <div className="sticky bottom-0 bg-pearl-50/95 backdrop-blur border-t border-silver-200/70 p-6 flex justify-between">
     <div className="flex gap-2">
      <Button variant="outline" onClick={onClose} className="border-silver-200/70 text-silver-600 hover:bg-pearl-100/70">
       Annulla
      </Button>
      {onDisconnect && (
       <Button
        variant="outline"
        onClick={() => void onDisconnect()}
        className="border-red-500/30 text-red-300 hover:bg-red-500/10"
       >
        Disconnetti account
       </Button>
      )}
     </div>
     <Button
      onClick={handleSave}
      className="bg-charcoal hover:bg-charcoal/90 text-white shadow-lg "
      disabled={!config.webhookSecret}
     >
      Salva configurazione
     </Button>
    </div>
   </Card>
  </div>
 );
}


