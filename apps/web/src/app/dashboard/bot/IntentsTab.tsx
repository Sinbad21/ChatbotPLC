'use client';

import { useState, useEffect } from 'react';
import { buildAuthHeaders } from '@/lib/authHeaders';
import { useTranslation } from '@/lib/i18n';
import { GlassCard } from '@/components/dashboard/ui';

interface Intent {
  id: string;
  name: string;
  patterns: string[];
  response: string;
  createdAt: string;
}

interface IntentsTabProps {
  botId: string;
  apiBaseUrl: string;
}

export default function IntentsTab({ botId, apiBaseUrl }: IntentsTabProps) {
  const { t } = useTranslation();
  const [intents, setIntents] = useState<Intent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [patternsText, setPatternsText] = useState('');
  const [response, setResponse] = useState('');

  useEffect(() => {
    fetchIntents();
  }, [botId]);

  const fetchIntents = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/bots/${botId}/intents`, {
        credentials: 'include',
        headers: buildAuthHeaders(false),
      });

      if (!res.ok) {
        throw new Error(t('bot.intents.error', 'Error loading intents'));
      }

      const data = await res.json();
      setIntents(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !patternsText.trim() || !response.trim()) {
      return;
    }

    const patterns = patternsText
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (patterns.length === 0) {
      setError(t('bot.intents.atLeastOnePattern', 'Please add at least one pattern'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/bots/${botId}/intents`, {
        credentials: 'include',
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({ name, patterns, response }),
      });

      if (!res.ok) {
        throw new Error(t('bot.intents.failedToAdd', 'Failed to add intent'));
      }

      const newIntent = await res.json();
      setIntents([newIntent, ...intents]);
      setName('');
      setPatternsText('');
      setResponse('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (intentId: string) => {
    if (!confirm(t('bot.intents.deleteConfirm', 'Are you sure you want to delete this intent?'))) {
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/intents/${intentId}`, {
        credentials: 'include',
        method: 'DELETE',
        headers: buildAuthHeaders(false),
      });

      if (!res.ok) {
        throw new Error(t('bot.intents.failedToDelete', 'Failed to delete intent'));
      }

      setIntents(intents.filter(intent => intent.id !== intentId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-silver-600">{t('bot.intents.loading', 'Loading intents...')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-charcoal mb-4">{t('bot.intents.title', 'Add New Intent')}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-silver-600 mb-1">
              {t('bot.intents.intentName', 'Intent Name')}
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('bot.intents.intentNamePlaceholder', 'e.g., greeting, help_request, pricing_question')}
              className="w-full px-4 py-2 border border-silver-200/70 rounded-lg focus:ring-2 focus:ring-emerald/20 focus:border-transparent text-charcoal placeholder:text-silver-400 bg-pearl-50"
              required
            />
          </div>

          <div>
            <label htmlFor="patterns" className="block text-sm font-medium text-silver-600 mb-1">
              {t('bot.intents.patterns', 'Patterns (one per line)')}
            </label>
            <textarea
              id="patterns"
              value={patternsText}
              onChange={(e) => setPatternsText(e.target.value)}
              placeholder={t('bot.intents.patternsPlaceholder', 'hello\nhi\nhey there\ngood morning')}
              rows={5}
              className="w-full px-4 py-2 border border-silver-200/70 rounded-lg focus:ring-2 focus:ring-emerald/20 focus:border-transparent resize-none font-mono text-sm text-charcoal placeholder:text-silver-400 bg-pearl-50"
              required
            />
            <p className="text-xs text-silver-500 mt-1">{t('bot.intents.patternsHelp', 'Add phrases that trigger this intent, one per line')}</p>
          </div>

          <div>
            <label htmlFor="response" className="block text-sm font-medium text-silver-600 mb-1">
              {t('bot.intents.response', 'Response')}
            </label>
            <textarea
              id="response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder={t('bot.intents.responsePlaceholder', 'Hello! How can I help you today?')}
              rows={4}
              className="w-full px-4 py-2 border border-silver-200/70 rounded-lg focus:ring-2 focus:ring-emerald/20 focus:border-transparent resize-none text-charcoal placeholder:text-silver-400 bg-pearl-50"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-2 bg-charcoal text-white rounded-lg hover:bg-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {submitting ? t('bot.intents.adding', 'Adding...') : t('bot.intents.addIntent', 'Add Intent')}
          </button>
        </form>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-charcoal mb-4">
          {t('bot.intents.intentsCount', 'Intents')} ({intents.length})
        </h3>

        {intents.length === 0 ? (
          <p className="text-silver-500 text-center py-8">
            {t('bot.intents.noIntents', 'No intents yet. Add your first intent above to train your bot with pattern matching.')}
          </p>
        ) : (
          <div className="space-y-4">
            {intents.map((intent) => (
              <div
                key={intent.id}
                className="border border-silver-200/70 rounded-lg p-4 hover:border-emerald/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-charcoal">{intent.name}</h4>
                    <span className="text-xs text-silver-500">
                      {new Date(intent.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(intent.id)}
                    className="text-red-600 hover:text-red-400 text-sm font-medium"
                  >
                    {t('bot.intents.delete', 'Delete')}
                  </button>
                </div>

                <div className="mb-3">
                  <p className="text-xs font-medium text-silver-600 mb-1">{t('bot.intents.patterns', 'Patterns')}:</p>
                  <div className="flex flex-wrap gap-1">
                    {intent.patterns.map((pattern, idx) => (
                      <span
                        key={idx}
                        className="bg-pearl-100/60 text-charcoal px-2 py-1 rounded text-xs font-mono"
                      >
                        {pattern}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-silver-600 mb-1">{t('bot.intents.response', 'Response')}:</p>
                  <p className="text-sm text-silver-600">{intent.response}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}