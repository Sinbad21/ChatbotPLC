'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Copy, Check } from 'lucide-react';

interface WidgetGuideProps {
 botId: string;
 onClose: () => void;
 onDisconnect?: () => void | Promise<void>;
}

export function WidgetGuide({ botId, onClose, onDisconnect }: WidgetGuideProps) {
 const [copied, setCopied] = useState(false);

 const apiBaseUrl = (process.env.NEXT_PUBLIC_WORKER_API_URL || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
const widgetCode = `<!-- OMNICAL STUDIO Widget -->
<script>
 window.chatbotConfig = {
  botId: '${botId}',
  apiUrl: '${apiBaseUrl}',
  position: 'bottom-right',
  theme: 'light'
 };
</script>
<script src="https://cdn.yourdomain.com/widget.js" async></script>`;

 const copyCode = () => {
  navigator.clipboard.writeText(widgetCode);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
 };

 return (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
   <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-pearl-50 border border-silver-200/70">
    <div className="sticky top-0 bg-pearl-50/95 backdrop-blur border-b border-silver-200/70 p-6 flex items-center justify-between">
     <h2 className="text-2xl font-bold text-white">Widget Sito Web</h2>
     <button onClick={onClose} className="text-silver-700 hover:text-charcoal transition-colors">
      <X className="w-6 h-6" />
     </button>
    </div>

    <div className="p-6 space-y-6">
     <div>
      <h3 className="text-lg font-semibold text-white mb-3">
       Codice di installazione
      </h3>
      <p className="text-sm text-silver-700 mb-4">
       Copia questo codice e incollalo prima del tag <code className="bg-pearl-100 px-2 py-1 rounded text-charcoal">&lt;/body&gt;</code> del tuo sito:
      </p>
      <div className="relative">
       <pre className="bg-charcoal border border-silver-200/20 text-pearl p-4 rounded-lg text-sm overflow-x-auto">
        <code>{widgetCode}</code>
       </pre>
       <Button
        variant="outline"
        size="sm"
        onClick={copyCode}
        className="absolute top-2 right-2 border-silver-200/70 text-silver-600 hover:bg-pearl-100"
       >
        {copied ? (
         <>
          <Check className="w-4 h-4 mr-2" />
          Copiato!
         </>
        ) : (
         <>
          <Copy className="w-4 h-4 mr-2" />
          Copia
         </>
        )}
       </Button>
      </div>
     </div>

     <div className="bg-pearl-100/70 border border-silver-200/70 rounded-lg p-4">
      <p className="text-sm text-charcoal font-medium mb-2">
       ? Il widget è già configurato con il tuo Bot ID
      </p>
      <p className="text-sm text-silver-700">
       Apparirà automaticamente nell'angolo in basso a destra del tuo sito.
      </p>
     </div>

     <div>
      <h3 className="text-lg font-semibold text-white mb-3">
       Opzioni di personalizzazione
      </h3>
      <div className="space-y-3 text-sm">
       <div className="flex items-start gap-3">
        <code className="bg-pearl-100 px-2 py-1 rounded text-xs text-charcoal">position</code>
        <span className="text-silver-700">
         Posizione: <code className="text-charcoal">'bottom-right'</code>, <code className="text-charcoal">'bottom-left'</code>, <code className="text-charcoal">'top-right'</code>, <code className="text-charcoal">'top-left'</code>
        </span>
       </div>
       <div className="flex items-start gap-3">
        <code className="bg-pearl-100 px-2 py-1 rounded text-xs text-charcoal">theme</code>
        <span className="text-silver-700">
         Tema: <code className="text-charcoal">'light'</code>, <code className="text-charcoal">'dark'</code>, <code className="text-charcoal">'auto'</code>
        </span>
       </div>
       <div className="flex items-start gap-3">
        <code className="bg-pearl-100 px-2 py-1 rounded text-xs text-charcoal">language</code>
        <span className="text-silver-700">
         Lingua: <code className="text-charcoal">'it'</code>, <code className="text-charcoal">'en'</code>, <code className="text-charcoal">'es'</code>, <code className="text-charcoal">'fr'</code>, ecc.
        </span>
       </div>
      </div>
     </div>

     <div className="bg-pearl-100/70 border border-silver-200/70 rounded-lg p-4">
      <h4 className="font-medium text-white mb-2">Piattaforme supportate:</h4>
      <ul className="grid grid-cols-2 gap-2 text-sm text-silver-700">
       <li>• HTML/CSS/JavaScript</li>
       <li>• React</li>
       <li>• Vue.js</li>
       <li>• Angular</li>
       <li>• WordPress</li>
       <li>• Shopify</li>
       <li>• Wix</li>
       <li>• Webflow</li>
      </ul>
     </div>
    </div>

    <div className="sticky bottom-0 bg-pearl-50/95 backdrop-blur border-t border-silver-200/70 p-6 flex gap-3 justify-between">
     <Button onClick={onClose} className="flex-1 bg-charcoal hover:bg-charcoal/90 text-white shadow-lg ">
      Chiudi
     </Button>
     {onDisconnect && (
      <Button
       variant="outline"
       onClick={() => void onDisconnect()}
       className="border-red-500/30 text-red-300 hover:bg-red-500/10"
      >
       Disconnetti
      </Button>
     )}
    </div>
   </Card>
  </div>
 );
}


