'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Copy, Check } from 'lucide-react';

interface WordPressGuideProps {
 botId: string;
 onClose: () => void;
 onDisconnect?: () => void | Promise<void>;
}

export function WordPressGuide({ botId, onClose, onDisconnect }: WordPressGuideProps) {
 const [copied, setCopied] = useState(false);

 const apiBaseUrl = (process.env.NEXT_PUBLIC_WORKER_API_URL || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

 const widgetCode = `<!-- OMNICAL STUDIO Widget (WordPress) -->
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
     <div>
      <h2 className="text-2xl font-bold text-charcoal">WordPress</h2>
      <p className="text-sm text-silver-700 mt-1">Inserisci lo script nel footer del tuo sito.</p>
     </div>
     <button onClick={onClose} className="text-silver-700 hover:text-charcoal transition-colors">
      <X className="w-6 h-6" />
     </button>
    </div>

    <div className="p-6 space-y-6">
     <div>
      <h3 className="text-lg font-semibold text-charcoal mb-3">Opzione rapida (consigliata)</h3>
      <ol className="space-y-2 text-sm text-silver-700 list-decimal list-inside">
       <li>Installa un plugin tipo Insert Headers and Footers (o equivalente)</li>
       <li>Incolla questo codice nel Footer</li>
       <li>Salva e verifica che il widget appaia</li>
      </ol>
     </div>

     <div>
      <h3 className="text-lg font-semibold text-charcoal mb-3">Codice</h3>
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
    </div>

    <div className="sticky bottom-0 bg-pearl-50/95 backdrop-blur border-t border-silver-200/70 p-6 flex gap-3 justify-between">
     <Button
      onClick={onClose}
      className="flex-1 bg-charcoal hover:bg-charcoal/90 text-white shadow-lg "
     >
      Chiudi
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
   </Card>
  </div>
 );
}


