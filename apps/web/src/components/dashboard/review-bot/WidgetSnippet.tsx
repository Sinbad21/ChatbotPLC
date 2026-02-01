'use client';

import { useState } from 'react';
import { X, Copy, Check, Code, Zap, ExternalLink } from 'lucide-react';

interface WidgetSnippetProps {
 widgetId: string;
 businessName?: string;
 onClose: () => void;
}

export function WidgetSnippet({ widgetId, businessName, onClose }: WidgetSnippetProps) {
 const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
 const [copied, setCopied] = useState(false);

 const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.chatbotstudio.io';
 
 const embedCode = `<script src="${baseUrl}/api/review-widget/${widgetId}/embed.js" async></script>`;
 
 const advancedCode = `<!-- Review Bot Widget -->
<script src="${baseUrl}/api/review-widget/${widgetId}/embed.js" async></script>

<script>
 // API JavaScript disponibile dopo il caricamento
 // window.ReviewBot.show()    - Mostra il widget
 // window.ReviewBot.hide()    - Nasconde il widget
 // window.ReviewBot.show({ force: true }) - Mostra anche se già  risposto
 // window.ReviewBot.reset()   - Reset stato (per testing)
</script>`;

 const handleCopy = (code: string) => {
  navigator.clipboard.writeText(code);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
 };

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
   {/* Backdrop */}
   <div 
    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
    onClick={onClose}
   />
   
   {/* Modal */}
   <div className="relative w-full max-w-2xl bg-pearl-50 border border-silver-200/70 rounded-2xl shadow-2xl overflow-hidden">
    {/* Header */}
    <div className="flex items-center justify-between px-6 py-4 border-b border-silver-200/70 bg-pearl-50/95 backdrop-blur">
     <div>
      <h2 className="text-xl font-bold text-charcoal">Codice Widget</h2>
      {businessName && (
       <p className="text-silver-600 text-sm mt-1">{businessName}</p>
      )}
     </div>
     <button
      onClick={onClose}
      className="p-2 text-silver-600 hover:text-charcoal hover:bg-pearl-100 rounded-lg transition-all"
     >
      <X size={20} />
     </button>
    </div>

    {/* Tabs */}
    <div className="flex border-b border-silver-200/70 bg-pearl-50/95 backdrop-blur">
     <button
      onClick={() => setActiveTab('basic')}
      className={`flex-1 px-6 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
       activeTab === 'basic'
        ? 'text-charcoal border-b-2 border-charcoal bg-pearl-100'
        : 'text-silver-600 hover:text-charcoal hover:bg-pearl-100'
      }`}
     >
      <Code size={16} />
      Script Base
     </button>
     <button
      onClick={() => setActiveTab('advanced')}
      className={`flex-1 px-6 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
       activeTab === 'advanced'
        ? 'text-charcoal border-b-2 border-charcoal bg-pearl-100'
        : 'text-silver-600 hover:text-charcoal hover:bg-pearl-100'
      }`}
     >
      <Zap size={16} />
      Trigger Avanzati
     </button>
    </div>

    {/* Content */}
    <div className="p-6 space-y-4">
     {activeTab === 'basic' && (
      <>
       <div className="space-y-2">
        <p className="text-silver-700 text-sm">
         Copia questo codice e incollalo nel tuo sito prima del tag <code className="bg-pearl-100 px-1 rounded">&lt;/body&gt;</code>
        </p>
        
        {/* Code Block */}
        <div className="relative">
         <pre className="p-4 bg-charcoal border border-silver-200/20 rounded-xl overflow-x-auto">
          <code className="text-charcoal text-sm">{embedCode}</code>
         </pre>
         <button
          onClick={() => handleCopy(embedCode)}
          className="absolute top-2 right-2 p-2 bg-pearl-50 hover:bg-pearl-100 rounded-lg transition-all"
         >
          {copied ? (
           <Check size={16} className="text-emerald-400" />
          ) : (
           <Copy size={16} className="text-silver-600" />
          )}
         </button>
        </div>

        {copied && (
         <p className="text-emerald-400 text-sm flex items-center gap-1">
          <Check size={14} />
          Copiato negli appunti!
         </p>
        )}
       </div>

       {/* Auto-trigger Info */}
       <div className="p-4 bg-pearl-100/70 border border-silver-200/70 rounded-xl space-y-3">
        <h4 className="text-charcoal font-medium">Auto-trigger dopo acquisto</h4>
        <p className="text-silver-600 text-sm">
         Il widget si attiva automaticamente quando l&apos;URL contiene uno di questi parametri:
        </p>
        <div className="flex flex-wrap gap-2">
         <code className="px-2 py-1 bg-pearl-100 rounded text-charcoal text-xs">?review=true</code>
         <code className="px-2 py-1 bg-pearl-100 rounded text-charcoal text-xs">?rb=1</code>
         <code className="px-2 py-1 bg-pearl-100 rounded text-charcoal text-xs">?feedback=true</code>
        </div>
        
        <div className="mt-3 pt-3 border-t border-silver-200/70 bg-pearl-50/95 backdrop-blur">
         <p className="text-silver-700 text-sm font-medium mb-2">
          Configura il redirect post-acquisto:
         </p>
         <ul className="text-silver-600 text-sm space-y-1">
          <li>€¢ <strong>Stripe:</strong> Success URL †’ <code className="text-charcoal">https://tuosito.com/grazie?review=true</code></li>
          <li>€¢ <strong>WooCommerce:</strong> Thank you page con parametro</li>
          <li>€¢ <strong>Shopify:</strong> Order confirmation page script</li>
         </ul>
        </div>
       </div>
      </>
     )}

     {activeTab === 'advanced' && (
      <>
       <div className="space-y-2">
        <p className="text-silver-700 text-sm">
         Usa l&apos;API JavaScript per controllare il widget programmaticamente.
        </p>
        
        {/* Code Block */}
        <div className="relative">
         <pre className="p-4 bg-charcoal border border-silver-200/20 rounded-xl overflow-x-auto text-sm">
          <code className="text-charcoal">{advancedCode}</code>
         </pre>
         <button
          onClick={() => handleCopy(advancedCode)}
          className="absolute top-2 right-2 p-2 bg-pearl-50 hover:bg-pearl-100 rounded-lg transition-all"
         >
          {copied ? (
           <Check size={16} className="text-emerald-400" />
          ) : (
           <Copy size={16} className="text-silver-600" />
          )}
         </button>
        </div>

        {copied && (
         <p className="text-emerald-400 text-sm flex items-center gap-1">
          <Check size={14} />
          Copiato negli appunti!
         </p>
        )}
       </div>

       {/* API Reference */}
       <div className="p-4 bg-pearl-100/70 border border-silver-200/70 rounded-xl">
        <h4 className="text-charcoal font-medium mb-3">API Reference</h4>
        <div className="space-y-3">
         <div className="p-3 bg-pearl-50 rounded-lg">
          <code className="text-charcoal text-sm">ReviewBot.show()</code>
          <p className="text-silver-600 text-xs mt-1">
           Mostra il widget. Non fa nulla se l&apos;utente ha già  risposto.
          </p>
         </div>
         <div className="p-3 bg-pearl-50 rounded-lg">
          <code className="text-charcoal text-sm">ReviewBot.show({'{ force: true }'})</code>
          <p className="text-silver-600 text-xs mt-1">
           Mostra il widget anche se l&apos;utente ha già  risposto.
          </p>
         </div>
         <div className="p-3 bg-pearl-50 rounded-lg">
          <code className="text-charcoal text-sm">ReviewBot.hide()</code>
          <p className="text-silver-600 text-xs mt-1">
           Nasconde il widget.
          </p>
         </div>
         <div className="p-3 bg-pearl-50 rounded-lg">
          <code className="text-charcoal text-sm">ReviewBot.reset()</code>
          <p className="text-silver-600 text-xs mt-1">
           Resetta lo stato localStorage. Utile per testing.
          </p>
         </div>
        </div>
       </div>

       {/* Trigger Examples */}
       <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
        <h4 className="text-amber-700 font-medium mb-2">’¡ Esempi di utilizzo</h4>
        <div className="space-y-2 text-sm">
         <p className="text-silver-600">
          <strong className="text-charcoal">Trigger su click:</strong>
         </p>
         <code className="block p-2 bg-pearl-50 rounded text-charcoal text-xs">
          {`<button onclick="ReviewBot.show()">Lascia feedback</button>`}
         </code>
         
         <p className="text-silver-600 mt-3">
          <strong className="text-charcoal">Trigger dopo X secondi:</strong>
         </p>
         <code className="block p-2 bg-pearl-50 rounded text-charcoal text-xs">
          {`setTimeout(() => ReviewBot.show(), 5000);`}
         </code>
        </div>
       </div>
      </>
     )}
    </div>

    {/* Footer */}
    <div className="px-6 py-4 border-t border-silver-200/70 bg-pearl-50/95 backdrop-blur flex justify-between items-center">
     <a
      href={`${baseUrl}/widget/review/test?widgetId=${widgetId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-charcoal hover:text-charcoal text-sm inline-flex items-center gap-1"
     >
      <ExternalLink size={14} />
      Anteprima widget
     </a>
     <button
      onClick={onClose}
      className="px-4 py-2 bg-charcoal text-white rounded-xl font-medium hover:bg-charcoal/90 transition-all"
     >
      Chiudi
     </button>
    </div>
   </div>
  </div>
 );
}


