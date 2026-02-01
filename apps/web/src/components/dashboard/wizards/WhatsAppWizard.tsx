'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Copy, Check, ExternalLink, ChevronRight } from 'lucide-react';

interface WhatsAppWizardProps {
 botId: string;
 onClose: () => void;
 onSave: (config: any) => void;
 initialConfig?: any;
 onDisconnect?: () => void | Promise<void>;
}

export function WhatsAppWizard({ botId, onClose, onSave, initialConfig, onDisconnect }: WhatsAppWizardProps) {
 const [step, setStep] = useState(1);
 const [config, setConfig] = useState(() => ({
  apiKey: '',
  phoneNumberId: '',
  webhookToken: '',
  ...(initialConfig ?? {}),
 }));
 const [copied, setCopied] = useState<string | null>(null);

 const apiBaseUrl = (process.env.NEXT_PUBLIC_WORKER_API_URL || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
 const webhookUrl = `${apiBaseUrl}/webhooks/whatsapp`;

 const copyToClipboard = (text: string, field: string) => {
  navigator.clipboard.writeText(text);
  setCopied(field);
  setTimeout(() => setCopied(null), 2000);
 };

 const handleNext = () => {
  if (step < 4) setStep(step + 1);
 };

 const handleBack = () => {
  if (step > 1) setStep(step - 1);
 };

 const handleSave = () => {
  onSave(config);
  onClose();
 };

 return (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
   <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-pearl-50 border border-silver-200/70">
    {/* Header */}
    <div className="sticky top-0 bg-pearl-50/95 backdrop-blur border-b border-silver-200/70 p-6 flex items-center justify-between">
     <div>
      <h2 className="text-2xl font-bold text-charcoal">Integrazione WhatsApp</h2>
      <p className="text-sm text-silver-700 mt-1">Step {step} di 4</p>
     </div>
     <button onClick={onClose} className="text-silver-700 hover:text-charcoal transition-colors">
      <X className="w-6 h-6" />
     </button>
    </div>

    {/* Progress Bar */}
    <div className="px-6 pt-4">
     <div className="flex gap-2">
      {[1, 2, 3, 4].map((s) => (
       <div
        key={s}
        className={`h-2 flex-1 rounded-full ${
         s <= step ? 'bg-charcoal' : 'bg-pearl-100'
        }`}
       />
      ))}
     </div>
    </div>

    {/* Content */}
    <div className="p-6">
     {step === 1 && (
      <div>
       <h3 className="text-lg font-semibold text-charcoal mb-4">
        1. Crea un'app WhatsApp Business
       </h3>
       <div className="space-y-4">
        <p className="text-silver-700">
         Per integrare WhatsApp, devi prima creare un'app WhatsApp Business su Meta for Developers.
        </p>
        <ol className="list-decimal list-inside space-y-3 text-sm text-silver-700">
         <li>Vai su <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-charcoal hover:text-silver-700 inline-flex items-center transition-colors">developers.facebook.com <ExternalLink className="w-3 h-3 ml-1" /></a></li>
         <li>Clicca su "My Apps" e poi "Create App"</li>
         <li>Seleziona "Business" come tipo di app</li>
         <li>Aggiungi il prodotto "WhatsApp" alla tua app</li>
         <li>Segui la configurazione guidata di WhatsApp Business API</li>
        </ol>
        <div className="bg-pearl-100/70 border border-silver-200/70 rounded-lg p-4">
         <p className="text-sm text-silver-600">
          <strong className="text-charcoal">Nota:</strong> Avrai bisogno di un account Facebook Business verificato per completare questo passaggio.
         </p>
        </div>
       </div>
      </div>
     )}

     {step === 2 && (
      <div>
       <h3 className="text-lg font-semibold text-charcoal mb-4">
        2. Ottieni le credenziali API
       </h3>
       <div className="space-y-4">
        <p className="text-silver-700">
         Dalla dashboard della tua app WhatsApp, copia le seguenti credenziali:
        </p>

        <div>
         <label className="block text-sm font-medium text-silver-700 mb-2">
          Access Token (API Key)
         </label>
         <input
          type="password"
          value={config.apiKey}
          onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
          placeholder="EAAxxxxxxxxxxxxx..."
          className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-lg focus:ring-2 focus:ring-charcoal/10 focus:border-silver-300 text-charcoal placeholder:text-silver-500 transition-all"
         />
         <p className="text-xs text-silver-600 mt-1">
          Trovalo in: WhatsApp → API Setup → Temporary access token (o genera un token permanente)
         </p>
        </div>

        <div>
         <label className="block text-sm font-medium text-silver-700 mb-2">
          Phone Number ID
         </label>
         <input
          type="text"
          value={config.phoneNumberId}
          onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
          placeholder="123456789012345"
          className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-lg focus:ring-2 focus:ring-charcoal/10 focus:border-silver-300 text-charcoal placeholder:text-silver-500 transition-all"
         />
         <p className="text-xs text-silver-600 mt-1">
          Trovalo in: WhatsApp → API Setup → Phone Number ID
         </p>
        </div>

        <div>
         <label className="block text-sm font-medium text-silver-700 mb-2">
          Webhook Verify Token (crea uno tu)
         </label>
         <input
          type="text"
          value={config.webhookToken}
          onChange={(e) => setConfig({ ...config, webhookToken: e.target.value })}
          placeholder="my_secret_token_12345"
          className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-lg focus:ring-2 focus:ring-charcoal/10 focus:border-silver-300 text-charcoal placeholder:text-silver-500 transition-all"
         />
         <p className="text-xs text-silver-600 mt-1">
          Scegli una stringa casuale e sicura (minimo 20 caratteri)
         </p>
        </div>
       </div>
      </div>
     )}

     {step === 3 && (
      <div>
       <h3 className="text-lg font-semibold text-charcoal mb-4">
        3. Configura il Webhook
       </h3>
       <div className="space-y-4">
        <p className="text-silver-700">
         Ora devi configurare il webhook su WhatsApp per ricevere i messaggi.
        </p>

        <div>
         <label className="block text-sm font-medium text-silver-700 mb-2">
          Callback URL
         </label>
         <div className="flex gap-2">
          <input
           type="text"
           value={webhookUrl}
           readOnly
           className="flex-1 px-4 py-3 bg-pearl-100 border border-silver-200/70 rounded-lg text-silver-700"
          />
          <Button
           variant="outline"
           size="sm"
           onClick={() => copyToClipboard(webhookUrl, 'url')}
           className="border-silver-200/70 text-silver-600 hover:bg-pearl-100/70"
          >
           {copied === 'url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
         </div>
        </div>

        <div>
         <label className="block text-sm font-medium text-silver-700 mb-2">
          Verify Token
         </label>
         <div className="flex gap-2">
          <input
           type="text"
           value={config.webhookToken}
           readOnly
           className="flex-1 px-4 py-3 bg-pearl-100 border border-silver-200/70 rounded-lg text-silver-700"
          />
          <Button
           variant="outline"
           size="sm"
           onClick={() => copyToClipboard(config.webhookToken, 'token')}
           className="border-silver-200/70 text-silver-600 hover:bg-pearl-100/70"
          >
           {copied === 'token' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
         </div>
        </div>

        <div className="bg-pearl-50 border border-silver-200/70 rounded-lg p-4">
         <p className="text-sm font-medium text-charcoal mb-2">Passaggi su Meta:</p>
         <ol className="list-decimal list-inside space-y-2 text-sm text-silver-700">
          <li>Vai su WhatsApp → Configuration → Webhook</li>
          <li>Clicca "Edit"</li>
          <li>Incolla il Callback URL copiato sopra</li>
          <li>Incolla il Verify Token copiato sopra</li>
          <li>Clicca "Verify and Save"</li>
          <li>Abilita i webhook fields: "messages"</li>
         </ol>
        </div>
       </div>
      </div>
     )}

     {step === 4 && (
      <div>
       <h3 className="text-lg font-semibold text-charcoal mb-4">
        4. Configurazione completata!
       </h3>
       <div className="space-y-4">
        <div className="bg-pearl-100/70 border border-silver-200/70 rounded-lg p-6 text-center">
         <div className="w-16 h-16 bg-charcoal rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-pearl-50" />
         </div>
         <h4 className="text-lg font-semibold text-charcoal mb-2">
          Integrazione WhatsApp configurata
         </h4>
         <p className="text-silver-700">
          Il tuo chatbot è ora collegato a WhatsApp e può ricevere e inviare messaggi.
         </p>
        </div>

        <div className="bg-pearl-50 border border-silver-200/70 rounded-lg p-4">
         <p className="text-sm font-medium text-charcoal mb-3">Prossimi passi:</p>
         <ul className="space-y-2 text-sm text-silver-700">
          <li className="flex items-start gap-2">
           <ChevronRight className="w-4 h-4 mt-0.5 text-charcoal flex-shrink-0" />
           <span>Testa inviando un messaggio al tuo numero WhatsApp Business</span>
          </li>
          <li className="flex items-start gap-2">
           <ChevronRight className="w-4 h-4 mt-0.5 text-charcoal flex-shrink-0" />
           <span>Verifica che il chatbot risponda correttamente</span>
          </li>
          <li className="flex items-start gap-2">
           <ChevronRight className="w-4 h-4 mt-0.5 text-charcoal flex-shrink-0" />
           <span>Monitora le conversazioni nella sezione "Conversations"</span>
          </li>
         </ul>
        </div>

        <div className="bg-pearl-100/70 border border-silver-200/70 rounded-lg p-4">
         <p className="text-sm text-silver-600">
          <strong className="text-charcoal">Importante:</strong> Per passare dalla sandbox WhatsApp alla produzione, dovrai completare la Business Verification su Meta. Contatta il supporto per assistenza.
         </p>
        </div>
       </div>
      </div>
     )}
    </div>

    {/* Footer */}
    <div className="sticky bottom-0 bg-pearl-50/95 backdrop-blur border-t border-silver-200/70 p-6 flex justify-between">
     <Button
      variant="outline"
      onClick={step === 1 ? onClose : handleBack}
      className="border-silver-200/70 text-silver-600 hover:bg-pearl-100/70"
     >
      {step === 1 ? 'Annulla' : 'Indietro'}
     </Button>
     <Button
      onClick={step === 4 ? handleSave : handleNext}
      className="bg-charcoal hover:bg-charcoal/90 text-white shadow-lg "
      disabled={step === 2 && (!config.apiKey || !config.phoneNumberId || !config.webhookToken)}
     >
      {step === 4 ? 'Salva configurazione' : 'Avanti'}
     </Button>
    </div>
   </Card>
  </div>
 );
}



