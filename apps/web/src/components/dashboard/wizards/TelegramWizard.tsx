'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Copy, Check, ExternalLink } from 'lucide-react';

interface TelegramWizardProps {
 botId: string;
 onClose: () => void;
 onSave: (config: any) => void;
 initialConfig?: any;
 onDisconnect?: () => void | Promise<void>;
}

export function TelegramWizard({ botId, onClose, onSave, initialConfig, onDisconnect }: TelegramWizardProps) {
 const [step, setStep] = useState(1);
 const [config, setConfig] = useState(() => ({
  botToken: '',
  webhookSecret: '',
  ...(initialConfig ?? {}),
 }));
 const [copied, setCopied] = useState(false);

 const apiBaseUrl = (process.env.NEXT_PUBLIC_WORKER_API_URL || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
 const webhookUrl = `${apiBaseUrl}/webhooks/telegram`;

 const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
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
      <h2 className="text-2xl font-bold text-charcoal">Integrazione Telegram</h2>
      <p className="text-sm text-silver-700 mt-1">Step {step} di 3</p>
     </div>
     <button onClick={onClose} className="text-silver-700 hover:text-charcoal transition-colors">
      <X className="w-6 h-6" />
     </button>
    </div>

    {/* Progress */}
    <div className="px-6 pt-4">
     <div className="flex gap-2">
      {[1, 2, 3].map((s) => (
       <div
        key={s}
        className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-charcoal' : 'bg-pearl-100'}`}
       />
      ))}
     </div>
    </div>

    {/* Content */}
    <div className="p-6">
     {step === 1 && (
      <div className="space-y-4">
       <h3 className="text-lg font-semibold text-charcoal">1. Crea un Bot Telegram</h3>
       <ol className="list-decimal list-inside space-y-3 text-sm text-silver-700">
        <li>Apri Telegram e cerca <code className="bg-pearl-100 px-2 py-1 rounded text-silver-700">@BotFather</code></li>
        <li>Invia il comando <code className="bg-pearl-100 px-2 py-1 rounded text-silver-700">/newbot</code></li>
        <li>Scegli un nome per il bot (es. "Il mio Chatbot")</li>
        <li>Scegli un username (deve finire con "bot", es. "MioAssistenteBot")</li>
        <li>BotFather ti invierà  il <strong className="text-charcoal">Bot Token</strong> - copialo!</li>
       </ol>
       <a
        href="https://core.telegram.org/bots#6-botfather"
        target="_blank"
        rel="noopener noreferrer"
        className="text-charcoal hover:text-silver-700 text-sm inline-flex items-center transition-colors"
       >
        Guida completa di Telegram <ExternalLink className="w-3 h-3 ml-1" />
       </a>
      </div>
     )}

     {step === 2 && (
      <div className="space-y-4">
       <h3 className="text-lg font-semibold text-charcoal">2. Inserisci le credenziali</h3>

       <div>
        <label className="block text-sm font-medium text-silver-700 mb-2">
         Bot Token
        </label>
        <input
         type="password"
         value={config.botToken}
         onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
         placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
         className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-lg focus:ring-2 focus:ring-charcoal/10 focus:border-silver-300 text-charcoal placeholder:text-silver-500 transition-all"
        />
        <p className="text-xs text-silver-600 mt-1">
         Il token fornito da @BotFather
        </p>
       </div>

       <div>
        <label className="block text-sm font-medium text-silver-700 mb-2">
         Webhook Secret (opzionale)
        </label>
        <input
         type="text"
         value={config.webhookSecret}
         onChange={(e) => setConfig({ ...config, webhookSecret: e.target.value })}
         placeholder="my_secret_token_12345"
         className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-lg focus:ring-2 focus:ring-charcoal/10 focus:border-silver-300 text-charcoal placeholder:text-silver-500 transition-all"
        />
        <p className="text-xs text-silver-600 mt-1">
         Token segreto per validare i webhook (consigliato)
        </p>
       </div>

       <div className="bg-pearl-50 border border-silver-200/70 rounded-lg p-4">
        <p className="text-sm font-medium text-charcoal mb-2">Webhook URL (configurato automaticamente):</p>
        <div className="flex gap-2">
         <code className="flex-1 px-3 py-2 bg-pearl-100 border border-silver-200/70 rounded text-xs text-silver-700">
          {webhookUrl}
         </code>
         <Button variant="outline" size="sm" onClick={() => copyToClipboard(webhookUrl)} className="border-silver-200/70 text-silver-600 hover:bg-pearl-100/70">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
         </Button>
        </div>
       </div>
      </div>
     )}

     {step === 3 && (
      <div className="space-y-4">
       <div className="bg-pearl-100/70 border border-silver-200/70 rounded-lg p-6 text-center">
        <div className="w-16 h-16 bg-charcoal rounded-full flex items-center justify-center mx-auto mb-4">
         <Check className="w-8 h-8 text-pearl-50" />
        </div>
        <h4 className="text-lg font-semibold text-charcoal mb-2">
         Integrazione Telegram completata!
        </h4>
        <p className="text-silver-700">
         Il webhook verrà configurato automaticamente al salvataggio.
        </p>
       </div>

       <div className="bg-pearl-50 border border-silver-200/70 rounded-lg p-4">
        <p className="text-sm font-medium text-charcoal mb-3">Come testare:</p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-silver-700">
         <li>Cerca il tuo bot su Telegram usando l'username</li>
         <li>Invia <code className="bg-pearl-100 px-2 py-1 rounded text-silver-700">/start</code></li>
         <li>Scrivi un messaggio e verifica la risposta</li>
        </ol>
       </div>
      </div>
     )}
    </div>

    {/* Footer */}
    <div className="sticky bottom-0 bg-pearl-50/95 backdrop-blur border-t border-silver-200/70 p-6 flex justify-between">
     <Button variant="outline" onClick={step === 1 ? onClose : () => setStep(step - 1)} className="border-silver-200/70 text-silver-600 hover:bg-pearl-100/70">
      {step === 1 ? 'Annulla' : 'Indietro'}
     </Button>
     <Button
      onClick={step === 3 ? handleSave : () => setStep(step + 1)}
      className="bg-charcoal hover:bg-charcoal/90 text-white shadow-lg "
      disabled={step === 2 && !config.botToken}
     >
      {step === 3 ? 'Salva configurazione' : 'Avanti'}
     </Button>
    </div>
   </Card>
  </div>
 );
}



