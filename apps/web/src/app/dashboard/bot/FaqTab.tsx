"use client";

import React, { useEffect, useState } from "react";
import { buildAuthHeaders } from "@/lib/authHeaders";

type FaqRecord = {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
};

type Props = {
  botId: string;
  apiBaseUrl: string;
};

export default function FaqTab({ botId, apiBaseUrl }: Props) {
  const [faqs, setFaqs] = useState<FaqRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadFaqs() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/bots/${botId}/faqs`, {
        credentials: 'include',
        headers: buildAuthHeaders(false),
      });

      if (!res.ok) {
        throw new Error("Impossibile caricare le FAQ");
      }

      const data: FaqRecord[] = await res.json();
      setFaqs(data);
    } catch (err: any) {
      setError(err.message || "Errore durante il caricamento");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/bots/${botId}/faqs`, {
        credentials: 'include',
        method: "POST",
        headers: buildAuthHeaders(),
        body: JSON.stringify({ question, answer }),
      });

      if (!res.ok) {
        throw new Error("Errore salvataggio FAQ");
      }

      setQuestion("");
      setAnswer("");
      await loadFaqs();
    } catch (err: any) {
      setError(err.message || "Errore salvataggio FAQ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/faqs/${id}`, {
        credentials: 'include',
        method: "DELETE",
        headers: buildAuthHeaders(false),
      });

      if (!res.ok) {
        throw new Error("Errore durante l'eliminazione");
      }

      setFaqs((prev) => prev.filter((faq) => faq.id !== id));
    } catch (err: any) {
      setError(err.message || "Errore eliminazione FAQ");
    }
  }

  useEffect(() => {
    loadFaqs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botId]);

  return (
    <div className="flex flex-col gap-24">
      <form
        onSubmit={handleCreate}
        className="rounded-xl border p-16 flex flex-col gap-12 glass-effect backdrop-blur-md shadow-sm"
      >
        <div className="text-lg font-semibold text-charcoal">Aggiungi FAQ</div>

        <div className="flex flex-col gap-4">
          <label className="text-sm font-medium text-silver-600">Domanda</label>
          <input
            className="border rounded-md px-8 py-6 text-sm bg-white text-black placeholder:text-gray-400"
            placeholder="Es. Quali sono gli orari di supporto?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="flex flex-col gap-4">
          <label className="text-sm font-medium text-silver-600">Risposta</label>
          <textarea
            className="border rounded-md px-8 py-6 text-sm bg-white text-black placeholder:text-gray-400 min-h-[120px]"
            placeholder="Inserisci la risposta dettagliata"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={saving}
          />
        </div>

        {error && <div className="text-xs text-red-600">{error}</div>}

        <button
          type="submit"
          disabled={saving}
          className="bg-black text-charcoal text-sm font-medium rounded-md px-12 py-8 disabled:opacity-50"
        >
          {saving ? "Salvo..." : "Salva FAQ"}
        </button>
      </form>

      <div className="rounded-xl border p-16 glass-effect backdrop-blur-md shadow-sm">
        <div className="text-lg font-semibold text-charcoal mb-12">FAQ configurate</div>

        {loading ? (
          <div className="text-sm text-silver-500">Caricamento…</div>
        ) : faqs.length === 0 ? (
          <div className="text-sm text-silver-500">
            Nessuna FAQ ancora. Aggiungine una sopra.
          </div>
        ) : (
          <ul className="flex flex-col gap-12">
            {faqs.map((faq) => (
              <li
                key={faq.id}
                className="border rounded-md p-12 flex flex-col gap-6 bg-pearl-50"
              >
                <div className="flex items-start justify-between gap-8">
                  <div className="font-medium text-charcoal">{faq.question}</div>
                  <button
                    onClick={() => handleDelete(faq.id)}
                    className="text-xs text-red-600 hover:underline"
                    type="button"
                  >
                    Elimina
                  </button>
                </div>

                <div className="text-xs text-silver-600 whitespace-pre-wrap">
                  {faq.answer}
                </div>

                <div className="text-[10px] text-silver-400">
                  {new Date(faq.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
