'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, AlertCircle } from 'lucide-react';

interface GenericIntegrationWizardProps {
 title: string;
 description?: string | null;
 onClose: () => void;
 onSave: (config: any) => void | Promise<void>;
 initialConfig?: any;
 onDisconnect?: () => void | Promise<void>;
}

export function GenericIntegrationWizard({
 title,
 description,
 onClose,
 onSave,
 initialConfig,
 onDisconnect,
}: GenericIntegrationWizardProps) {
 const [rawJson, setRawJson] = useState(() => {
  try {
   return JSON.stringify(initialConfig ?? {}, null, 2);
  } catch {
   return '{}';
  }
 });

 const parsed = useMemo(() => {
  try {
   return { ok: true as const, value: JSON.parse(rawJson) };
  } catch (error: any) {
   return { ok: false as const, error: error?.message || 'Invalid JSON' };
  }
 }, [rawJson]);

 const handleSave = async () => {
  if (!parsed.ok) return;
  await onSave(parsed.value);
  onClose();
 };

 return (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
   <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-pearl-50 border border-silver-200/70">
    <div className="sticky top-0 bg-pearl-50/95 backdrop-blur border-b border-silver-200/70 p-6 flex items-center justify-between">
     <div>
      <h2 className="text-2xl font-bold text-charcoal">{title}</h2>
      {description && <p className="text-sm text-silver-700 mt-1">{description}</p>}
     </div>
     <button onClick={onClose} className="text-silver-700 hover:text-charcoal transition-colors">
      <X className="w-6 h-6" />
     </button>
    </div>

    <div className="p-6 space-y-4">
     <div>
      <label className="block text-sm font-medium text-silver-700 mb-2">Configurazione (JSON)</label>
      <textarea
       value={rawJson}
       onChange={(e) => setRawJson(e.target.value)}
       rows={10}
       spellCheck={false}
       className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-lg focus:ring-2 focus:ring-charcoal/10 focus:border-silver-300 text-charcoal placeholder:text-silver-500 transition-all font-mono text-sm"
      />
      {!parsed.ok && (
       <div className="mt-2 text-sm text-red-300 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        <span>JSON non valido: {parsed.error}</span>
       </div>
      )}
     </div>

     <div className="bg-pearl-50 border border-silver-200/70 rounded-lg p-4">
      <p className="text-sm text-silver-700">
       Consiglio: salva solo i campi necessari (es. <span className="text-silver-700">apiKey</span>,{' '}
       <span className="text-silver-700">webhookSecret</span>, <span className="text-silver-700">domain</span>).
      </p>
     </div>
    </div>

    <div className="sticky bottom-0 bg-pearl-50/95 backdrop-blur border-t border-silver-200/70 p-6 flex justify-between">
     <div className="flex gap-2">
      <Button
       variant="outline"
       onClick={onClose}
       className="border-silver-200/70 text-silver-600 hover:bg-pearl-100/70"
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
     <Button
      onClick={() => void handleSave()}
      className="bg-charcoal hover:bg-charcoal/90 text-white shadow-lg "
      disabled={!parsed.ok}
     >
      Salva configurazione
     </Button>
    </div>
   </Card>
  </div>
 );
}


