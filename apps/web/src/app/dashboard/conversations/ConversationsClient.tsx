'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Trash2, BookOpen, X, Loader2, Search, MoreHorizontal, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ConversationDetail {
  id: string;
  botId: string;
  botName: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'completed' | 'abandoned';
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    duration?: string;
    leadCaptured?: boolean;
  };
}

interface ConversationListItem {
  id: string;
  botName: string;
  messageCount: number;
  lastMessage: string;
  createdAt: string;
  status: 'active' | 'completed' | 'abandoned';
}

type FilterStatus = 'all' | 'active' | 'completed' | 'abandoned';
type SortBy = 'recent' | 'oldest' | 'messages';

export default function ConversationsClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('id');

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('recent');

  // Training modal state
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<{ user: string; bot: string } | null>(null);
  const [trainingType, setTrainingType] = useState<'faq' | 'intent'>('faq');
  const [isSavingTraining, setIsSavingTraining] = useState(false);

  useEffect(() => {
    if (conversationId) {
      loadConversationDetail(conversationId);
    } else {
      loadConversations();
    }
  }, [conversationId, filterStatus, sortBy, searchQuery]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_WORKER_API_URL || '';

      // Load conversations from API
      const response = await axios.get<ConversationListItem[]>(
        `${apiUrl}/api/v1/conversations?status=${filterStatus}&sort=${sortBy}&search=${searchQuery}`,
        { withCredentials: true }
      );

      setConversations(response.data);
    } catch (err: any) {
      console.error('Error loading conversations:', err);
      if (err.response?.status === 401) {
        router.push('/auth/login');
        return;
      }
      setError(err.message || t('conversations.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const loadConversationDetail = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_WORKER_API_URL || '';

      // Load conversation detail from API
      const response = await axios.get<ConversationDetail>(
        `${apiUrl}/api/v1/conversations/${id}`,
        { withCredentials: true }
      );

      setSelectedConversation(response.data);
    } catch (err: any) {
      console.error('Error loading conversation:', err);
      if (err.response?.status === 401) {
        router.push('/auth/login');
        return;
      }
      setError(err.message || t('conversations.failedToLoadConversation'));
    } finally {
      setLoading(false);
    }
  };

  const handleExportConversation = (conversation: ConversationDetail) => {
    // Create transcript text
    const transcript = conversation.messages
      .map(msg => {
        const timestamp = new Date(msg.createdAt).toLocaleString();
        const role = msg.role === 'user' ? 'User' : conversation.botName;
        return `[${timestamp}] ${role}:\n${msg.content}\n`;
      })
      .join('\n');

    const metadata = `
Conversation ID: ${conversation.id}
Bot: ${conversation.botName}
Status: ${conversation.status}
Started: ${new Date(conversation.createdAt).toLocaleString()}
Ended: ${new Date(conversation.updatedAt).toLocaleString()}
Duration: ${conversation.metadata?.duration || 'N/A'}
Total Messages: ${conversation.messages.length}

-----------------------------------
TRANSCRIPT
-----------------------------------

${transcript}
    `;

    const blob = new Blob([metadata], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `conversation_${conversation.id}_${Date.now()}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm(t('conversations.confirmDelete'))) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_WORKER_API_URL || '';

      await axios.delete(`${apiUrl}/api/v1/conversations/${conversationId}`, {
        withCredentials: true,
      });

      // Navigate back to list
      router.push('/dashboard/conversations');
      // Reload conversations
      loadConversations();
    } catch (err: any) {
      console.error('Error deleting conversation:', err);
      alert(t('conversations.failedToDelete'));
    }
  };

  const handleUseAsTraining = (userMessage: string, botMessage: string) => {
    setSelectedMessage({ user: userMessage, bot: botMessage });
    setTrainingModalOpen(true);
  };

  const handleSaveTraining = async () => {
    if (!selectedMessage || !selectedConversation) return;

    setIsSavingTraining(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_WORKER_API_URL || '';

      if (trainingType === 'faq') {
        await axios.post(
          `${apiUrl}/api/v1/bots/${selectedConversation.botId}/faqs`,
          {
            question: selectedMessage.user,
            answer: selectedMessage.bot,
            enabled: true,
          },
          { withCredentials: true }
        );
      } else {
        // For intent, use the bot message as response
        await axios.post(
          `${apiUrl}/api/v1/bots/${selectedConversation.botId}/intents`,
          {
            name: selectedMessage.user.substring(0, 50), // Truncate for intent name
            response: selectedMessage.bot,
            enabled: true,
          },
          { withCredentials: true }
        );
      }

      alert(`Successfully saved as ${trainingType.toUpperCase()}`);
      setTrainingModalOpen(false);
      setSelectedMessage(null);
    } catch (err: any) {
      console.error('Error saving training:', err);
      alert('Failed to save training data');
    } finally {
      setIsSavingTraining(false);
    }
  };

  // Search is now handled by the backend, no need to filter here
  const filteredConversations = conversations;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-silver-600">{t('conversations.loadingConversations')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
        {error}
      </div>
    );
  }

  // Detail View
  if (conversationId && selectedConversation) {
    return (
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/conversations')}
              className="p-2 hover:bg-pearl-100/60 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-silver-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-charcoal">{t('conversations.conversationDetails')}</h1>
              <p className="text-sm text-silver-600 mt-1">{t('conversations.viewFullTranscript')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleExportConversation(selectedConversation)}
              className="px-4 py-2 bg-charcoal text-white rounded-lg hover:bg-charcoal/90 text-sm font-medium shadow-lg  transition-all"
            >
              {t('conversations.exportTranscript')}
            </button>
            <button
              onClick={() => handleDeleteConversation(selectedConversation.id)}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg hover:bg-red-500/30 text-sm font-medium flex items-center gap-2 transition-all"
            >
              <Trash2 size={16} />
              {t('common.delete')}
            </button>
          </div>
        </div>

        {/* Metadata Card */}
        <div className="glass-effect border border-silver-200/70 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-charcoal mb-4">{t('conversations.metadata')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-silver-600">{t('conversations.botName')}</label>
              <p className="text-sm text-charcoal font-medium mt-1">{selectedConversation.botName}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-silver-600">{t('conversations.status')}</label>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                  selectedConversation.status === 'completed'
                    ? 'bg-pearl-100/60 text-silver-600'
                    : selectedConversation.status === 'active'
                    ? 'bg-pearl-100/60 text-charcoal'
                    : 'bg-pearl-50 text-silver-700'
                }`}
              >
                {selectedConversation.status}
              </span>
            </div>
            <div>
              <label className="text-xs font-medium text-silver-600">{t('conversations.duration')}</label>
              <p className="text-sm text-charcoal font-medium mt-1">
                {selectedConversation.metadata?.duration || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-silver-600">{t('conversations.messages').replace('{count}', '')}</label>
              <p className="text-sm text-charcoal font-medium mt-1">{selectedConversation.messages.length}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-silver-600">{t('conversations.started')}</label>
              <p className="text-sm text-charcoal font-medium mt-1">
                {new Date(selectedConversation.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-silver-600">{t('conversations.ended')}</label>
              <p className="text-sm text-charcoal font-medium mt-1">
                {new Date(selectedConversation.updatedAt).toLocaleString()}
              </p>
            </div>
            {selectedConversation.metadata?.leadCaptured !== undefined && (
              <div>
                <label className="text-xs font-medium text-silver-600">{t('conversations.leadCaptured')}</label>
                <p className="text-sm text-charcoal font-medium mt-1">
                  {selectedConversation.metadata.leadCaptured ? ' Yes' : ' No'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Transcript */}
        <div className="glass-effect border border-silver-200/70 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-charcoal mb-4">{t('conversations.transcript')}</h2>
          <div className="space-y-4">
            {selectedConversation.messages.map((message, index) => {
              const prevMessage = index > 0 ? selectedConversation.messages[index - 1] : null;
              const canUseAsTraining = message.role === 'assistant' && prevMessage?.role === 'user';

              return (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-silver-600">
                        {message.role === 'user' ? t('conversations.user') : selectedConversation.botName}
                      </span>
                      <span className="text-xs text-silver-500">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-charcoal text-white'
                          : 'bg-pearl-50 text-charcoal'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {canUseAsTraining && prevMessage && (
                      <button
                        onClick={() => handleUseAsTraining(prevMessage.content, message.content)}
                        className="mt-2 flex items-center gap-1.5 text-xs text-charcoal hover:text-charcoal font-medium transition-colors"
                      >
                        <BookOpen size={14} />
                        {t('conversations.useAsTraining')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Training Modal */}
        {trainingModalOpen && selectedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="bg-pearl-50/90 border border-silver-200/70 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-silver-200/70 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-charcoal">{t('conversations.addToTrainingData')}</h3>
                <button
                  onClick={() => setTrainingModalOpen(false)}
                  className="p-2 hover:bg-pearl-100/60 rounded-lg text-silver-600 hover:text-charcoal transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-silver-600 mb-2 block">{t('conversations.type')}</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="trainingType"
                        value="faq"
                        checked={trainingType === 'faq'}
                        onChange={(e) => setTrainingType(e.target.value as 'faq' | 'intent')}
                        className="w-4 h-4 text-emerald border-silver-200/70 bg-pearl-50"
                      />
                      <span className="text-sm text-charcoal">{t('conversations.faq')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="trainingType"
                        value="intent"
                        checked={trainingType === 'intent'}
                        onChange={(e) => setTrainingType(e.target.value as 'faq' | 'intent')}
                        className="w-4 h-4 text-emerald border-silver-200/70 bg-pearl-50"
                      />
                      <span className="text-sm text-charcoal">{t('conversations.intent')}</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-silver-600 mb-2 block">
                    {trainingType === 'faq' ? t('conversations.question') : t('conversations.trigger')}
                  </label>
                  <div className="bg-pearl-50 border border-silver-200/70 rounded-lg p-4">
                    <p className="text-sm text-charcoal whitespace-pre-wrap">{selectedMessage.user}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-silver-600 mb-2 block">
                    {trainingType === 'faq' ? t('conversations.answer') : t('conversations.response')}
                  </label>
                  <div className="bg-pearl-50 border border-silver-200/70 rounded-lg p-4">
                    <p className="text-sm text-charcoal whitespace-pre-wrap">{selectedMessage.bot}</p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-silver-200/70 bg-pearl-50/60 flex justify-end gap-3">
                <button
                  onClick={() => setTrainingModalOpen(false)}
                  className="px-4 py-2 bg-pearl-50 border border-silver-200/70 text-silver-700 rounded-lg text-sm font-medium hover:bg-pearl-100/60 transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSaveTraining}
                  disabled={isSavingTraining}
                  className="px-4 py-2 bg-charcoal text-white rounded-lg text-sm font-medium hover:bg-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg  transition-all"
                >
                  {isSavingTraining ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t('common.save')}...
                    </>
                  ) : (
                    t('conversations.saveToTraining')
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // List View
  return (
    <div className="glass-effect border border-silver-200/70 rounded-2xl h-[600px] flex p-0 overflow-hidden backdrop-blur-md shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
      {/* Sidebar List */}
      <div className="w-1/3 border-r border-silver-200/70 bg-pearl-50 flex flex-col">
        <div className="p-4 border-b border-silver-200/70">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-pearl-50 border-silver-200/70 text-charcoal">
            <Search size={14} className="opacity-50" />
            <input
              className="bg-transparent border-none text-sm w-full focus:outline-none placeholder-white/40"
              placeholder={t('conversations.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-silver-400 text-sm">
              {t('conversations.noConversations')}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => router.push(`/dashboard/conversations?id=${conv.id}`)}
                className={`p-4 border-b border-silver-200/50 cursor-pointer transition-colors hover:bg-pearl-100/60`}
              >
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-sm text-charcoal">{conv.botName}</span>
                  <span className="text-[10px] text-silver-400">{formatDate(conv.createdAt)}</span>
                </div>
                <p className="text-xs truncate text-silver-600">
                  {conv.lastMessage}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                      conv.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : conv.status === 'active'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                    }`}
                  >
                    {conv.status}
                  </span>
                  <span className="text-[10px] text-silver-400">{conv.messageCount} msgs</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area Placeholder */}
      <div className="flex-1 flex flex-col relative">
        <div className="p-4 border-b border-silver-200/70 bg-pearl-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r   text-charcoal text-xs font-bold">CB</div>
            <div>
              <h3 className="font-bold text-sm text-charcoal">{t('conversations.title')}</h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-silver-600">{t('conversations.subtitle')}</span>
              </div>
            </div>
          </div>
          <div className="p-2 rounded-lg hover:bg-pearl-100/60">
            <MoreHorizontal size={20} className="opacity-50 text-charcoal" />
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto flex items-center justify-center">
          <div className="text-center text-silver-400">
            <p className="text-sm">{t('conversations.selectConversation') || 'Select a conversation to view messages'}</p>
          </div>
        </div>

        <div className="p-4 border-t border-silver-200/70 bg-pearl-50">
          <div className="flex gap-2 p-2 rounded-xl border bg-pearl-50 border-silver-200/70">
            <input className="flex-1 bg-transparent border-none px-2 text-sm focus:outline-none text-charcoal placeholder-white/40" placeholder="Type your reply..." disabled />
            <button className="p-2 rounded-lg transition-colors bg-white text-black hover:bg-pearl-100/60">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


