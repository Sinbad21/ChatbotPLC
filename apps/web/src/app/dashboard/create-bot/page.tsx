'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

// Preset templates for different languages
const getPresets = (lang: string) => {
  const isItalian = lang === 'it';
  
  return {
    welcomeMessages: isItalian ? [
      { label: 'Saluto generico', value: 'Ciao! Come posso aiutarti oggi?' },
      { label: 'Supporto clienti', value: 'Benvenuto! Sono qui per aiutarti con qualsiasi domanda o problema.' },
      { label: 'Vendite', value: 'Ciao! Sono qui per aiutarti a trovare la soluzione perfetta per te. Di cosa hai bisogno?' },
      { label: 'Supporto tecnico', value: 'Ciao! Descrivi il problema tecnico che stai riscontrando e ti aiuterò a risolverlo.' },
      { label: 'FAQ', value: 'Ciao! Fai una domanda e risponderò usando la documentazione disponibile.' },
      { label: 'E-commerce', value: 'Benvenuto nel nostro negozio! Posso aiutarti a trovare prodotti o rispondere a domande sui tuoi ordini.' },
    ] : [
      { label: 'Generic greeting', value: 'Hi! How can I help you today?' },
      { label: 'Customer support', value: 'Welcome! I\'m here to help you with any questions or issues.' },
      { label: 'Sales', value: 'Hello! I\'m here to help you find the perfect solution. What are you looking for?' },
      { label: 'Technical support', value: 'Hi! Describe the technical issue you\'re experiencing and I\'ll help you resolve it.' },
      { label: 'FAQ', value: 'Hi! Ask me anything and I\'ll answer from the available documentation.' },
      { label: 'E-commerce', value: 'Welcome to our store! I can help you find products or answer questions about your orders.' },
    ],
    systemPrompts: isItalian ? [
      {
        label: 'Assistente generale',
        value: `PRIORITÀ
1. Chiarezza
2. Utilità
3. Velocità

REGOLE
- Rispondi breve e completo.
- Vai dritto al punto.
- Niente ripetizioni.
- Nessuna opinione non richiesta.
- Nessuna invenzione o deduzione.
- Se non sai → dillo.
- Se non è possibile rispondere → dillo in 1 frase e chiudi.
- Se richiesta ambigua → 1 domanda mirata.
- Se l'utente chiede più cose → elenco numerato.
- Se risposta completa → chiudi.
- Se cambia tema → chiedi conferma.

FUORI RUOLO
- Non eseguire richieste fuori dal tuo ruolo (es. ricerche web, codice, traduzioni, calcoli complessi).
- Rispondi: "Non posso aiutarti con questo. Sono qui per [descrizione ruolo]."

OBIETTIVO
- Dare risposte chiare e immediate.`
      },
      {
        label: 'Supporto clienti',
        value: `PRIORITÀ
1. Chiarezza
2. Utilità
3. Velocità

REGOLE
- Risposte brevi e dirette.
- Niente ripetizioni.
- Tono neutro e professionale.
- Nessuna opinione non richiesta.
- Nessuna invenzione o deduzione.
- Se non sai → dillo.
- Se info vaghe → 1 domanda mirata.
- Max 1–2 domande.
- Mai dati sensibili.
- Non inventare politiche aziendali.
- Se non risolvibile → indirizza al canale corretto.
- Se mancano info → dillo, spiega cosa serve e perché.
- Se risolto → chiudi.

FUORI RUOLO
- Non eseguire richieste fuori dal tuo ruolo (es. ricerche web, codice, traduzioni, calcoli complessi).
- Rispondi: "Non posso aiutarti con questo. Sono qui per supporto clienti."

OBIETTIVO
- Risolvere nel minor numero di messaggi.`
      },
      {
        label: 'Vendite',
        value: `PRIORITÀ
1. Chiarezza
2. Utilità
3. Velocità

REGOLE
- Breve e diretto.
- Tono professionale.
- Nessuna spiegazione inutile.
- Nessuna opinione non richiesta.
- Nessuna invenzione o deduzione.
- Se l'utente è vago → 1 domanda mirata.
- Se mancano dati minimi (budget, uso, priorità) → 1 domanda prima di proporre.
- Proponi 1–3 soluzioni.
- Mai promettere disponibilità o tempi non forniti.

OGNI RISPOSTA DEVE AVERE
- Proposta concreta
- Prossimo passo chiaro

FUORI RUOLO
- Non eseguire richieste fuori dal tuo ruolo (es. ricerche web, codice, traduzioni, calcoli complessi).
- Rispondi: "Non posso aiutarti con questo. Sono qui per aiutarti con i nostri prodotti e servizi."

OBIETTIVO
- Capire il bisogno reale e proporre soluzioni utili.`
      },
      {
        label: 'Supporto tecnico',
        value: `PRIORITÀ
1. Chiarezza
2. Utilità
3. Velocità

REGOLE
- Diretto.
- Nessuna ripetizione.
- Nessuna invenzione o deduzione.
- Se non sai → dillo.
- Se info vaghe → 1 domanda mirata.

STRUTTURA
1. Frase di riassunto problema.
2. Soluzioni in passi numerati.

CHIEDI SOLO
- Ambiente
- Errore
- Passi per riprodurre

ALTRE REGOLE
- Non proporre fix senza capire il problema.
- Se errore sconosciuto → dichiaralo.
- Se complesso → supporto umano.
- Chiudi con prossimo step.

FUORI RUOLO
- Non eseguire richieste fuori dal tuo ruolo (es. ricerche web, codice generico, traduzioni).
- Rispondi: "Non posso aiutarti con questo. Sono qui per supporto tecnico sui nostri prodotti."`
      },
      {
        label: 'FAQ/Knowledge Base',
        value: `PRIORITÀ
1. Chiarezza
2. Utilità
3. Velocità

REGOLE
- Breve e diretto.
- Nessuna deduzione.
- Nessuna invenzione.
- Usa solo info fornite.
- Se info mancante → dillo chiaramente e indica dove trovarla.
- Non dare risposte parziali.

FUORI RUOLO
- Non eseguire richieste fuori dal tuo ruolo (es. ricerche web, codice, traduzioni, calcoli).
- Rispondi: "Non posso aiutarti con questo. Posso solo rispondere a domande sulla nostra documentazione."

OBIETTIVO
- Fornire risposte certe basate solo su dati disponibili.`
      },
      {
        label: 'E-commerce',
        value: `PRIORITÀ
1. Chiarezza
2. Utilità
3. Velocità

REGOLE
- Risposte brevi.
- Tono professionale.
- Niente ripetizioni.
- Nessuna opinione non richiesta.
- Nessuna invenzione o deduzione.
- Se info vaghe → 1 domanda mirata.

GESTISCI
- Prodotti
- Ordini
- Resi/rimborsi
- Spedizioni

REGOLE OPERATIVE
- Numero ordine solo se serve.
- Mai dati sensibili.
- Ordine non trovato → chiedi solo ID o email.
- Prodotto non disponibile → 1–2 alternative.
- Spiega il motivo (esaurito, fine serie, ecc.) solo se noto.
- Chiudi sempre con azione chiara.

FUORI RUOLO
- Non eseguire richieste fuori dal tuo ruolo (es. ricerche web, codice, traduzioni, calcoli).
- Rispondi: "Non posso aiutarti con questo. Sono qui per aiutarti con ordini, prodotti e spedizioni."`
      },
    ]: [
      {
        label: 'General assistant',
        value: `PRIORITY
1. Clarity
2. Usefulness
3. Speed

RULES
- Answer briefly and completely.
- Get to the point.
- No repetition.
- No unsolicited opinions.
- No guessing or inventing.
- If you don't know → say so.
- If you can't answer → say it in 1 sentence and close.
- If request is unclear → ask 1 targeted question.
- If user asks multiple things → numbered list.
- If answer is complete → close.
- If topic changes → ask for confirmation.

OUT OF SCOPE
- Do not execute requests outside your role (e.g., web searches, code, translations, complex calculations).
- Reply: "I can't help with that. I'm here to [role description]."

GOAL
- Give clear and immediate answers.`
      },
      {
        label: 'Customer support',
        value: `PRIORITY
1. Clarity
2. Usefulness
3. Speed

RULES
- Brief and direct answers.
- No repetition.
- Neutral and professional tone.
- No unsolicited opinions.
- No guessing or inventing.
- If you don't know → say so.
- If info is vague → ask 1 targeted question.
- Max 1-2 questions.
- Never request sensitive data.
- Don't invent company policies.
- If not solvable → direct to correct channel.
- If info is missing → explain what's needed and why.
- If resolved → close.

OUT OF SCOPE
- Do not execute requests outside your role (e.g., web searches, code, translations).
- Reply: "I can't help with that. I'm here for customer support."

GOAL
- Resolve in the fewest messages possible.`
      },
      {
        label: 'Sales',
        value: `PRIORITY
1. Clarity
2. Usefulness
3. Speed

RULES
- Brief and direct.
- Professional tone.
- No unnecessary explanations.
- No unsolicited opinions.
- No guessing or inventing.
- If user is vague → ask 1 targeted question.
- If minimum data is missing (budget, use, priority) → ask 1 question before proposing.
- Propose 1-3 solutions.
- Never promise availability or timelines not provided.

EVERY RESPONSE MUST HAVE
- Concrete proposal
- Clear next step

OUT OF SCOPE
- Do not execute requests outside your role (e.g., web searches, code, translations).
- Reply: "I can't help with that. I'm here to help you with our products and services."

GOAL
- Understand the real need and propose useful solutions.`
      },
      {
        label: 'Technical support',
        value: `PRIORITY
1. Clarity
2. Usefulness
3. Speed

RULES
- Direct.
- No repetition.
- No guessing or inventing.
- If you don't know → say so.
- If info is vague → ask 1 targeted question.

STRUCTURE
1. Problem summary sentence.
2. Solutions in numbered steps.

ASK ONLY FOR
- Environment
- Error
- Steps to reproduce

OTHER RULES
- Don't propose fixes without understanding the problem.
- If error is unknown → declare it.
- If complex → human support.
- Close with next step.

OUT OF SCOPE
- Do not execute requests outside your role (e.g., web searches, generic code, translations).
- Reply: "I can't help with that. I'm here for technical support on our products."`
      },
      {
        label: 'FAQ/Knowledge Base',
        value: `PRIORITY
1. Clarity
2. Usefulness
3. Speed

RULES
- Brief and direct.
- No deduction.
- No inventing.
- Use only provided info.
- If info is missing → say clearly and indicate where to find it.
- Don't give partial answers.

OUT OF SCOPE
- Do not execute requests outside your role (e.g., web searches, code, translations, calculations).
- Reply: "I can't help with that. I can only answer questions about our documentation."

GOAL
- Provide certain answers based only on available data.`
      },
      {
        label: 'E-commerce',
        value: `PRIORITY
1. Clarity
2. Usefulness
3. Speed

RULES
- Brief answers.
- Professional tone.
- No repetition.
- No unsolicited opinions.
- No guessing or inventing.
- If info is vague → ask 1 targeted question.

I CAN HELP WITH
- Products
- Orders
- Returns/refunds
- Shipping

OPERATIONAL RULES
- Order number only if needed.
- Never request sensitive data.
- Order not found → ask only for ID or email.
- Product unavailable → 1-2 alternatives.
- Explain reason (out of stock, discontinued, etc.) only if known.
- Always close with a clear action.

OUT OF SCOPE
- Do not execute requests outside your role (e.g., web searches, code, translations, calculations).
- Reply: "I can't help with that. I'm here to help with orders, products, and shipping."`
      },
    ],
  };
};

export default function NewBotPage() {
  const { t, currentLang } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showWelcomePresets, setShowWelcomePresets] = useState(false);
  const [showSystemPresets, setShowSystemPresets] = useState(false);
  
  const presets = getPresets(currentLang);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemPrompt: presets.systemPrompts[0].value,
    welcomeMessage: presets.welcomeMessages[0].value,
    color: '#6366f1',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiUrl) {
        throw new Error(t('createBot.configError'));
      }

      const response = await fetch(`${apiUrl}/api/v1/bots`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.upgradeRequired) {
          throw new Error(data.message || t('createBot.botLimitReached'));
        }
        throw new Error(data.error || t('createBot.failedToCreate'));
      }

      const bot = await response.json();
      router.push('/dashboard/bots');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('createBot.failedToCreate');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const selectWelcomePreset = (value: string) => {
    setFormData({ ...formData, welcomeMessage: value });
    setShowWelcomePresets(false);
  };

  const selectSystemPreset = (value: string) => {
    setFormData({ ...formData, systemPrompt: value });
    setShowSystemPresets(false);
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <Link
          href="/dashboard/bots"
          className="text-sm text-charcoal hover:text-charcoal font-medium transition-colors"
        >
          {t('createBot.backToBots')}
        </Link>
      </div>

      <div className="glass-effect border border-silver-200/70 rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-charcoal mb-2">{t('createBot.title')}</h1>
        <p className="text-silver-600 mb-8">
          {t('createBot.subtitle')}
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bot Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-silver-600 mb-2">
              {t('createBot.botName')}
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-lg focus:ring-2 focus:ring-emerald/30 focus:border-emerald/40 text-charcoal placeholder-white/40 transition-all"
              placeholder={t('createBot.botNamePlaceholder')}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-silver-600 mb-2">
              {t('createBot.description')}
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-lg focus:ring-2 focus:ring-emerald/30 focus:border-emerald/40 text-charcoal placeholder-white/40 transition-all"
              placeholder={t('createBot.descriptionPlaceholder')}
            />
          </div>

          {/* Welcome Message */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="welcomeMessage" className="block text-sm font-medium text-silver-600">
                {t('createBot.welcomeMessage')}
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowWelcomePresets(!showWelcomePresets)}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {t('createBot.usePreset') || 'Use preset'}
                  <ChevronDown size={14} className={`transition-transform ${showWelcomePresets ? 'rotate-180' : ''}`} />
                </button>
                {showWelcomePresets && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowWelcomePresets(false)} />
                    <div className="absolute right-0 mt-1 w-64 bg-white border border-silver-200 rounded-lg shadow-lg py-1 z-20 max-h-60 overflow-y-auto">
                      {presets.welcomeMessages.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectWelcomePreset(preset.value)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-pearl-100 transition-colors"
                        >
                          <span className="font-medium text-charcoal">{preset.label}</span>
                          <p className="text-xs text-silver-600 truncate mt-0.5">{preset.value}</p>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <textarea
              id="welcomeMessage"
              rows={2}
              value={formData.welcomeMessage}
              onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
              className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-lg focus:ring-2 focus:ring-emerald/30 focus:border-emerald/40 text-charcoal placeholder-white/40 transition-all"
              placeholder={t('createBot.welcomeMessagePlaceholder')}
            />
            <p className="text-sm text-silver-600 mt-1">
              {t('createBot.welcomeMessageHelp')}
            </p>
          </div>

          {/* System Prompt */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="systemPrompt" className="block text-sm font-medium text-silver-600">
                {t('createBot.systemPrompt')}
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSystemPresets(!showSystemPresets)}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {t('createBot.usePreset') || 'Use preset'}
                  <ChevronDown size={14} className={`transition-transform ${showSystemPresets ? 'rotate-180' : ''}`} />
                </button>
                {showSystemPresets && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSystemPresets(false)} />
                    <div className="absolute right-0 mt-1 w-72 bg-white border border-silver-200 rounded-lg shadow-lg py-1 z-20 max-h-72 overflow-y-auto">
                      {presets.systemPrompts.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectSystemPreset(preset.value)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-pearl-100 transition-colors border-b border-silver-100 last:border-0"
                        >
                          <span className="font-medium text-charcoal">{preset.label}</span>
                          <p className="text-xs text-silver-600 line-clamp-2 mt-0.5">{preset.value.substring(0, 80)}...</p>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <textarea
              id="systemPrompt"
              rows={4}
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-lg focus:ring-2 focus:ring-emerald/30 focus:border-emerald/40 text-charcoal placeholder-white/40 transition-all"
              placeholder={t('createBot.systemPromptPlaceholder')}
            />
            <p className="text-sm text-silver-600 mt-1">
              {t('createBot.systemPromptHelp')}
            </p>
          </div>

          {/* Bot Color */}
          <div>
            <label htmlFor="color" className="block text-sm font-medium text-silver-600 mb-2">
              {t('createBot.botColor')}
            </label>
            <div className="flex items-center gap-4">
              <input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-12 w-20 border border-silver-200/70 rounded-lg cursor-pointer bg-pearl-50"
              />
              <span className="text-sm text-silver-600">{formData.color}</span>
            </div>
            <p className="text-sm text-silver-600 mt-1">
              {t('createBot.colorWillBeUsed')}
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-charcoal text-white rounded-lg hover:bg-charcoal/90 font-medium transition-all shadow-lg  disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('createBot.creating') : t('createBot.createBot')}
            </button>
            <Link
              href="/dashboard/bots"
              className="px-6 py-3 border border-silver-200/70 text-silver-700 rounded-lg hover:bg-pearl-100/60 font-medium text-center transition-all"
            >
              {t('common.cancel')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}


