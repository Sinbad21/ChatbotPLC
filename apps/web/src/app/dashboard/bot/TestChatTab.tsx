'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowUp, Settings, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TestChatTabProps {
  botId: string;
  apiBaseUrl: string;
}

// Simple markdown-like formatter for bot messages
function FormattedMessage({ content, isUser }: { content: string; isUser: boolean }) {
  if (isUser) {
    return <p className="text-sm whitespace-pre-wrap">{content}</p>;
  }

  // Split by double newlines for paragraphs
  const paragraphs = content.split(/\n\n+/);

  return (
    <div className="text-sm space-y-2">
      {paragraphs.map((paragraph, pIdx) => {
        // Check if it's a numbered list
        const numberedListMatch = paragraph.match(/^(\d+[\.\)]\s+.+(\n|$))+/m);
        if (numberedListMatch || /^\d+[\.\)]\s+/.test(paragraph)) {
          const items = paragraph.split(/\n/).filter(line => line.trim());
          return (
            <ol key={pIdx} className="list-decimal list-inside space-y-1 ml-1">
              {items.map((item, idx) => (
                <li key={idx} className="text-sm">
                  {item.replace(/^\d+[\.\)]\s*/, '')}
                </li>
              ))}
            </ol>
          );
        }

        // Check if it's a bullet list
        if (/^[-•*]\s+/.test(paragraph)) {
          const items = paragraph.split(/\n/).filter(line => line.trim());
          return (
            <ul key={pIdx} className="list-disc list-inside space-y-1 ml-1">
              {items.map((item, idx) => (
                <li key={idx} className="text-sm">
                  {item.replace(/^[-•*]\s*/, '')}
                </li>
              ))}
            </ul>
          );
        }

        // Check for headers (lines ending with colon or all caps)
        const lines = paragraph.split(/\n/);
        return (
          <div key={pIdx} className="space-y-1">
            {lines.map((line, lIdx) => {
              // Bold headers (text ending with colon or ALL CAPS)
              if (/^[A-Z\s]+$/.test(line.trim()) || /^[A-Z][A-Za-z\s]+:$/.test(line.trim())) {
                return <p key={lIdx} className="font-semibold text-charcoal">{line}</p>;
              }
              return <p key={lIdx} className="whitespace-pre-wrap">{line}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

const PROMPT_TEMPLATES = [
  {
    name: 'Customer Support',
    prompt: `You are a customer support assistant for a business.

GOAL
- Resolve the customer's issue end-to-end with minimal back-and-forth.

RULES
1) Identify intent (order/tracking, refund/returns, billing, account, product info, technical issue).
2) Ask 1–2 clarifying questions only when needed.
3) Provide a concrete next step with clear expectations.
4) If you lack information, say so and offer escalation.
5) Never request sensitive data (passwords, full card numbers).

STYLE
- Default to the user's language.
- Use numbered steps for troubleshooting.
- Summarize and ask a short closing question.
`
  },
  {
    name: 'Sales Assistant',
    prompt: `You are a high-performing sales assistant.

GOAL
- Understand the user’s needs quickly and recommend the best option.

PLAYBOOK
1) Ask a short discovery question (use case, constraints, timeline).
2) Recommend 1–3 options and explain why.
3) Handle objections (budget, fit, complexity) with alternatives.
4) Propose a next step (quote, demo, booking, checkout).

GUARDRAILS
- Don’t invent prices/policies; ask for details if missing.
- Be persuasive but never pushy.
`
  },
  {
    name: 'Technical Expert',
    prompt: `You are a technical expert.

GOAL
- Diagnose and solve problems safely with clear steps.

DIAGNOSTIC FLOW
1) Confirm context (product, version, OS/browser, exact error).
2) Ask what changed and whether it’s reproducible.
3) Provide steps from low-risk to high-impact.
4) After each step, ask for the result.
5) If unresolved, propose escalation and list the needed logs/details.

SAFETY
- Never ask for secrets or passwords.
`
  },
  {
    name: 'Friendly Chatbot',
    prompt: `You are a friendly, conversational assistant.

GOAL
- Help the user quickly while keeping the tone warm and approachable.

STYLE
- Keep responses concise.
- Ask clarifying questions when needed.
- Offer 2–3 options when the user is unsure.
`
  },
  {
    name: 'Professional Advisor',
    prompt: `You are a professional advisor.

GOAL
- Provide precise, structured guidance and acknowledge uncertainties.

STYLE
- Be formal and clear.
- Use headings or bullets when it improves clarity.
- State assumptions explicitly.
- If you don’t know, say what information is missing and how to obtain it.
`
  },
];

export default function TestChatTab({ botId, apiBaseUrl }: TestChatTabProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(`test-${Date.now()}`);
  const [botName, setBotName] = useState('Bot');
  const [botLogoUrl, setBotLogoUrl] = useState<string | null>(null);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.');
  const [editedPrompt, setEditedPrompt] = useState('');
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Fetch bot details to get logo and system prompt
    const fetchBotDetails = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/bots/${botId}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const bot = await response.json();
          if (bot.name) setBotName(bot.name);
          if (bot.logoUrl) setBotLogoUrl(bot.logoUrl);
          if (bot.systemPrompt) {
            setSystemPrompt(bot.systemPrompt);
            setEditedPrompt(bot.systemPrompt);
          }
        }
      } catch (err) {
        console.error('Failed to fetch bot details:', err);
      }
    };

    fetchBotDetails();
  }, [botId, apiBaseUrl]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/chat`, {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId,
          message: userMessage.content,
          sessionId,
          metadata: { source: 'test-tab' },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.botName && botName === 'Bot') {
        setBotName(data.botName);
      }

      const botMessage: Message = {
        role: 'assistant',
        content: data.message || t('bot.test.noResponse'),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: t('bot.test.errorMessage').replace('{message}', error.message),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const applyPrompt = async () => {
    if (isSavingPrompt || editedPrompt.trim() === systemPrompt) return;

    setIsSavingPrompt(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/bots/${botId}`, {
        credentials: 'include',
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ systemPrompt: editedPrompt.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update prompt (${response.status})`);
      }

      setSystemPrompt(editedPrompt.trim());
      setIsEditingPrompt(false);
    } catch (error: any) {
      console.error('Error updating prompt:', error);
      alert(t('bot.test.failedToUpdate').replace('{message}', error.message));
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const applyTemplate = (template: typeof PROMPT_TEMPLATES[0]) => {
    setEditedPrompt(template.prompt);
    setShowTemplates(false);
  };

  return (
    <div className="space-y-4">
      {/* Prompt Editor */}
      <div className="glass-effect backdrop-blur-md rounded-lg shadow-sm border border-silver-200/70 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-silver-600" />
            <h3 className="text-sm font-semibold text-charcoal">{t('bot.test.botSystemPrompt')}</h3>
          </div>
          <button
            onClick={() => {
              if (isEditingPrompt) {
                setEditedPrompt(systemPrompt);
              }
              setIsEditingPrompt(!isEditingPrompt);
            }}
            className="text-sm text-charcoal hover:text-charcoal/80 font-medium"
          >
            {isEditingPrompt ? t('bot.test.cancel') : t('bot.test.edit')}
          </button>
        </div>

        {isEditingPrompt ? (
          <div className="space-y-3">
            {/* Templates Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="w-full px-3 py-2 text-sm border border-silver-200/70 rounded-lg hover:bg-pearl-100/60 flex items-center justify-between"
              >
                <span className="text-silver-600">{t('bot.test.chooseTemplate')}</span>
                <ChevronDown className="w-4 h-4 text-silver-500" />
              </button>

              {showTemplates && (
                <div className="absolute z-10 w-full mt-1 glass-effect backdrop-blur-md border border-silver-200/70 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {PROMPT_TEMPLATES.map((template, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyTemplate(template)}
                      className="w-full px-4 py-3 text-left hover:bg-pearl-100/60 border-b border-gray-100 last:border-0"
                    >
                      <div className="font-medium text-sm text-charcoal">{template.name}</div>
                      <div className="text-xs text-silver-600 mt-1 line-clamp-2">{template.prompt}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Prompt Textarea */}
            <textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-silver-200/70 rounded-lg focus:ring-2 focus:ring-emerald/20 focus:border-transparent resize-none text-charcoal bg-pearl-50"
              placeholder={t('bot.test.enterSystemPrompt')}
            />

            {/* Apply Button */}
            <div className="flex justify-end">
              <button
                onClick={applyPrompt}
                disabled={isSavingPrompt || editedPrompt.trim() === systemPrompt}
                className="px-4 py-2 bg-charcoal text-pearl rounded-lg text-sm font-medium hover:bg-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSavingPrompt ? (
                  <>{t('bot.test.applying')}</>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {t('bot.test.apply')}
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-silver-600 line-clamp-2">{systemPrompt}</p>
        )}
      </div>

      {/* Chat Container */}
      <div className="flex flex-col h-[600px] glass-effect backdrop-blur-md rounded-lg shadow-sm border border-silver-200/70">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-silver-200/70">
          <div className="flex items-center gap-3">
          {botLogoUrl ? (
            <img
              src={botLogoUrl}
              alt={botName}
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-pearl-100/70 border border-silver-200/70 flex items-center justify-center">
              <span className="text-silver-700 font-bold text-lg">
                {botName ? botName.charAt(0).toUpperCase() : 'B'}
              </span>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-charcoal">{botLogoUrl ? botName : t('bot.test.testChat')}</h3>
            <p className="text-sm text-silver-600">
              {t('bot.test.subtitle')}
            </p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="px-3 py-1 text-sm text-silver-600 border border-silver-200/70 rounded-lg hover:bg-pearl-100/60"
        >
          {t('bot.test.clearChat')}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <svg className="w-16 h-16 mb-4 text-silver-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm text-silver-600">{t('bot.test.startConversation')}</p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <p className="text-xs font-medium text-silver-600 mb-1 px-1">
                  {msg.role === 'user' ? t('bot.test.you') : botName}
                </p>
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-charcoal text-pearl'
                      : 'bg-pearl-50/60 text-charcoal'
                  }`}
                >
                  <FormattedMessage content={msg.content} isUser={msg.role === 'user'} />
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[70%] rounded-lg px-4 py-3 bg-pearl-50/60">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-silver-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-silver-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-silver-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    <span className="text-sm text-charcoal ml-2">{t('bot.test.isTyping').replace('{botName}', botName)}</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-silver-200/70">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('bot.test.placeholder')}
            disabled={loading}
            className="flex-1 px-4 py-2 text-charcoal border border-silver-200/70 rounded-lg focus:ring-2 focus:ring-emerald/20 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-silver-400 bg-pearl-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 bg-charcoal text-pearl rounded-lg hover:bg-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            aria-label="Send message"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
