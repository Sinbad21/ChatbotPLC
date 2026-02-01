'use client';

import { useState } from 'react';
import { RefreshCw, Play, Eye, EyeOff, Trash2 } from 'lucide-react';

export default function ReviewWidgetTestPage() {
  const [widgetId, setWidgetId] = useState('demo-widget');
  const [autoTrigger, setAutoTrigger] = useState(false);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [showWidget, setShowWidget] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  const widgetUrl = `${baseUrl}/widget/review?widgetId=${widgetId}${autoTrigger ? '&autoTrigger=true' : ''}`;
  
  const embedCode = `<script src="${baseUrl}/api/review-widget/${widgetId}/embed.js" async></script>`;

  const handleLoadWidget = () => {
    setWidgetLoaded(true);
    setShowWidget(true);
  };

  const handleResetState = () => {
    // Clear localStorage for this widget
    localStorage.removeItem(`rb_session_${widgetId}`);
    localStorage.removeItem(`rb_responded_${widgetId}`);
    
    // Reload widget
    setWidgetLoaded(false);
    setShowWidget(false);
    setTimeout(() => {
      setWidgetLoaded(true);
      setShowWidget(true);
    }, 100);
  };

  const handleToggleWidget = () => {
    setShowWidget(!showWidget);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">🧪 Review Widget Test Page</h1>
          <p className="text-gray-400 mt-2">
            Usa questa pagina per testare il widget Review Bot durante lo sviluppo.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Controlli</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Widget ID */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Widget ID
              </label>
              <input
                type="text"
                value={widgetId}
                onChange={(e) => setWidgetId(e.target.value)}
                placeholder="demo-widget"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Auto Trigger */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Trigger Mode
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAutoTrigger(false)}
                  className={`flex-1 px-4 py-2 rounded-xl transition-all ${
                    !autoTrigger 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  Manuale
                </button>
                <button
                  onClick={() => setAutoTrigger(true)}
                  className={`flex-1 px-4 py-2 rounded-xl transition-all ${
                    autoTrigger 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  Auto (2s delay)
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-700">
            <button
              onClick={handleLoadWidget}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl transition-all inline-flex items-center gap-2"
            >
              <Play size={18} />
              Carica Widget
            </button>
            
            <button
              onClick={handleToggleWidget}
              disabled={!widgetLoaded}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showWidget ? <EyeOff size={18} /> : <Eye size={18} />}
              {showWidget ? 'Nascondi' : 'Mostra'} Widget
            </button>
            
            <button
              onClick={handleResetState}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl transition-all inline-flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Reset Stato
            </button>
            
            <button
              onClick={() => {
                localStorage.removeItem(`rb_session_${widgetId}`);
                localStorage.removeItem(`rb_responded_${widgetId}`);
              }}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 rounded-xl transition-all inline-flex items-center gap-2"
            >
              <Trash2 size={18} />
              Clear localStorage
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Preview Area</h2>
          <p className="text-gray-400 text-sm">
            Simula un sito web dove il widget viene visualizzato.
          </p>
          
          {/* Simulated Website */}
          <div className="relative bg-white rounded-xl min-h-[500px] overflow-hidden">
            {/* Fake website content */}
            <div className="p-8 text-gray-800">
              <div className="max-w-md mx-auto space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900">🎉 Grazie per il tuo ordine!</h3>
                  <p className="text-gray-600 mt-2">
                    Il tuo ordine #12345 è stato confermato.
                  </p>
                </div>
                
                <div className="bg-gray-100 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prodotto:</span>
                    <span className="font-medium">Widget Premium</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Totale:</span>
                    <span className="font-medium">€49.99</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">cliente@example.com</span>
                  </div>
                </div>
                
                <p className="text-center text-gray-500 text-sm">
                  Riceverai una email di conferma a breve.
                </p>
              </div>
            </div>

            {/* Widget iframe */}
            {widgetLoaded && showWidget && (
              <iframe
                src={widgetUrl}
                className="absolute inset-0 w-full h-full border-0"
                style={{ background: 'transparent' }}
                title="Review Widget Preview"
              />
            )}
          </div>
        </div>

        {/* Embed Code */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Codice Embed</h2>
          <p className="text-gray-400 text-sm">
            Questo è il codice da inserire nel sito del cliente.
          </p>
          
          <pre className="p-4 bg-gray-900 rounded-xl overflow-x-auto">
            <code className="text-purple-400 text-sm">{embedCode}</code>
          </pre>
        </div>

        {/* Instructions */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">📖 Istruzioni Test</h2>
          
          <ol className="space-y-3 text-gray-400">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm">1</span>
              <span>Inserisci un Widget ID (o usa &quot;demo-widget&quot; per il test)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm">2</span>
              <span>Clicca &quot;Carica Widget&quot; per inizializzare</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm">3</span>
              <span>Il widget apparirà nell&apos;angolo in basso a destra dopo il delay configurato</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm">4</span>
              <span>Testa il flow: survey → feedback positivo/negativo → completamento</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm">5</span>
              <span>Usa &quot;Reset Stato&quot; per testare di nuovo (pulisce localStorage)</span>
            </li>
          </ol>
        </div>

        {/* Debug Info */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">🐛 Debug Info</h2>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-900 rounded-lg">
              <span className="text-gray-500">Widget URL:</span>
              <p className="text-purple-400 break-all mt-1">{widgetUrl}</p>
            </div>
            <div className="p-3 bg-gray-900 rounded-lg">
              <span className="text-gray-500">Widget Loaded:</span>
              <p className={widgetLoaded ? 'text-green-400' : 'text-red-400'}>
                {widgetLoaded ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
