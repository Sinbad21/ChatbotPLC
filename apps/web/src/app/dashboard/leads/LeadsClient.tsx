'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { useTranslation } from '@/lib/i18n';
import { Filter, Download, MoreHorizontal } from 'lucide-react';

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  score: number;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
  botId: string;
  botName: string;
  conversationId: string;
  messageCount: number;
  campaignId: string | null;
  campaignName: string | null;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

interface LeadDetail extends Lead {
  conversation: {
    id: string;
    botId: string;
    botName: string;
    messageCount: number;
    messages: Array<{
      id: string;
      role: string;
      content: string;
      createdAt: string;
    }>;
  };
  campaign: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}

type FilterStatus = 'all' | 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
type SortBy = 'recent' | 'oldest' | 'score-high' | 'score-low';

export default function LeadsClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get('id');

  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [minScore, setMinScore] = useState(0);

  useEffect(() => {
    if (leadId) {
      loadLeadDetail(leadId);
    } else {
      loadLeads();
    }
  }, [leadId, filterStatus, sortBy, minScore]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_WORKER_API_URL || process.env.NEXT_PUBLIC_API_URL;

      const params = new URLSearchParams({
        status: filterStatus,
        sort: sortBy,
        search: searchQuery,
        minScore: minScore.toString(),
      });

      const response = await axios.get<Lead[]>(
        `${apiUrl}/api/v1/leads?${params}`,
        { withCredentials: true }
      );

      setLeads(response.data);
    } catch (err: any) {
      console.error('Error loading leads:', err);
      if (err.response?.status === 401) {
        router.push('/auth/login');
        return;
      }
      setError(err.message || t('leads.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const loadLeadDetail = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_WORKER_API_URL || process.env.NEXT_PUBLIC_API_URL;

      const response = await axios.get<LeadDetail>(
        `${apiUrl}/api/v1/leads/${id}`,
        { withCredentials: true }
      );

      setSelectedLead(response.data);
    } catch (err: any) {
      console.error('Error loading lead:', err);
      if (err.response?.status === 401) {
        router.push('/auth/login');
        return;
      }
      setError(err.message || t('leads.failedToLoadLead'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_WORKER_API_URL || process.env.NEXT_PUBLIC_API_URL;

      await axios.patch(
        `${apiUrl}/api/v1/leads/${leadId}`,
        { status: newStatus },
        { withCredentials: true }
      );

      setMessage({ type: 'success', text: t('leads.statusUpdated') });
      setTimeout(() => setMessage(null), 3000);

      // Reload data
      if (selectedLead) {
        loadLeadDetail(leadId);
      } else {
        loadLeads();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t('leads.failedToUpdate') });
    }
  };

  const handleExportCSV = () => {
    const csvEscape = (v: unknown): string => {
      let s = v == null ? '' : String(v);
      s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const mustQuote = /[",\n]/.test(s);
      if (mustQuote) s = '"' + s.replace(/"/g, '""') + '"';
      return s;
    };

    const header = ['Name', 'Email', 'Phone', 'Company', 'Score', 'Status', 'Bot', 'Campaign', 'Created'];
    const rows = leads.map(lead => [
      lead.name,
      lead.email,
      lead.phone,
      lead.company,
      lead.score,
      lead.status,
      lead.botName,
      lead.campaignName,
      new Date(lead.createdAt).toLocaleString(),
    ]);

    const csvContent = [header, ...rows].map(row => row.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-silver-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'CONTACTED': return 'bg-pearl-100/60 text-silver-700 border-silver-200/70';
      case 'QUALIFIED': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'CONVERTED': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'LOST': return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

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
        <div className="text-silver-600">{t('leads.loadingLeads')}</div>
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
  if (leadId && selectedLead) {
    return (
      <div className="space-y-6">
        {/* Success/Error Message */}
        {message && (
          <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-emerald/10 border border-emerald/20 text-silver-700' : 'bg-red-500/20 border border-red-500/30 text-red-300'}`}>
            {message.text}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/leads')}
              className="p-2 hover:bg-pearl-100/60 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-silver-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-charcoal">{t('leads.leadDetails')}</h1>
              <p className="text-sm text-silver-600 mt-1">{selectedLead.email || 'No email'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedLead.status}
              onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
              className="px-4 py-2 bg-pearl-50 border border-silver-200/70 rounded-lg text-sm font-medium text-charcoal focus:ring-2 focus:ring-emerald/30 focus:border-emerald/40"
            >
              <option value="NEW">{t('leads.new')}</option>
              <option value="CONTACTED">{t('leads.contacted')}</option>
              <option value="QUALIFIED">{t('leads.qualified')}</option>
              <option value="CONVERTED">{t('leads.converted')}</option>
              <option value="LOST">{t('leads.lost')}</option>
            </select>
          </div>
        </div>

        {/* Lead Info Card */}
        <div className="glass-effect border border-silver-200/70 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-charcoal mb-4">{t('leads.contactInformation')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-silver-600">{t('leads.name')}</label>
              <p className="text-sm text-charcoal font-medium mt-1">{selectedLead.name || 'N/A'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-silver-600">{t('leads.email')}</label>
              <p className="text-sm text-charcoal font-medium mt-1">{selectedLead.email || 'N/A'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-silver-600">{t('leads.phone')}</label>
              <p className="text-sm text-charcoal font-medium mt-1">{selectedLead.phone || 'N/A'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-silver-600">{t('leads.company')}</label>
              <p className="text-sm text-charcoal font-medium mt-1">{selectedLead.company || 'N/A'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-silver-600">{t('leads.leadScore')}</label>
              <p className={`text-2xl font-bold mt-1 ${getScoreColor(selectedLead.score)}`}>
                {selectedLead.score}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-silver-600">{t('conversations.status')}</label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(selectedLead.status)}`}>
                {selectedLead.status}
              </span>
            </div>
            <div>
              <label className="text-xs font-medium text-silver-600">{t('leads.bot')}</label>
              <p className="text-sm text-charcoal font-medium mt-1">{selectedLead.conversation.botName}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-silver-600">{t('leads.campaign')}</label>
              <p className="text-sm text-charcoal font-medium mt-1">{selectedLead.campaign?.name || t('leads.none')}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-silver-600">{t('leads.created')}</label>
              <p className="text-sm text-charcoal font-medium mt-1">{formatDate(selectedLead.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Conversation Transcript */}
        <div className="glass-effect border border-silver-200/70 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-charcoal mb-4">
            {t('leads.conversation').replace('{count}', selectedLead.conversation.messageCount.toString())}
          </h2>
          <div className="space-y-3">
            {selectedLead.conversation.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  msg.role === 'USER' ? 'bg-charcoal text-white' : 'bg-pearl-50 text-silver-700'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="glass-effect border border-silver-200/70 rounded-2xl p-0 overflow-hidden backdrop-blur-md shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="p-6 border-b border-silver-200/70 flex justify-between items-center">
        <h2 className="text-xl font-medium text-charcoal">Leads Database</h2>
        <div className="flex gap-2">
          <button className="p-2 rounded-lg border border-silver-200/70 hover:bg-pearl-100/60">
            <Filter size={16} className="text-silver-600" />
          </button>
          <button
            onClick={handleExportCSV}
            disabled={leads.length === 0}
            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border flex items-center gap-2 border-silver-200/70 bg-charcoal hover:bg-charcoal/90 text-pearl-50 disabled:opacity-50 shadow-lg transition-all"
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-left text-sm">
        <thead className="text-xs font-bold uppercase tracking-wider text-silver-400 bg-pearl-50">
          <tr>
            <th className="px-6 py-4 font-medium">Contact</th>
            <th className="px-6 py-4 font-medium">Score</th>
            <th className="px-6 py-4 font-medium">Status</th>
            <th className="px-6 py-4 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {leads.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-silver-400">
                {t('leads.noLeads')}
              </td>
            </tr>
          ) : (
            leads.map((lead) => (
              <tr key={lead.id} className="transition-colors hover:bg-pearl-100/60">
                <td className="px-6 py-4">
                  <div className="font-bold text-charcoal">{lead.name || 'N/A'}</div>
                  <div className="text-silver-400 text-xs">{lead.email || 'N/A'}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`font-sans font-bold tabular-nums ${getScoreColor(lead.score)}`}>
                    {lead.score}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => router.push(`/dashboard/leads?id=${lead.id}`)}
                    className="p-1.5 rounded-md transition-colors hover:bg-pearl-100/60 text-silver-600"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

