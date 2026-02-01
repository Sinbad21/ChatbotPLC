'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTranslation } from '@/lib/i18n';

interface AnalyticsOverview {
  conversations: number;
  messages: number;
  leads: number;
}

interface ConversationData {
  date: string;
  conversations: number;
}

interface IntentData {
  name: string;
  count: number;
}

interface Conversation {
  id: string;
  botName: string;
  messageCount: number;
  lastMessage: string;
  duration: string;
  createdAt: string;
  status: 'active' | 'completed' | 'abandoned';
}

interface UsageByModel {
  model: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

interface UsageByDate {
  date: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

interface UsageData {
  byModel: UsageByModel[];
  byDate: UsageByDate[];
  total: {
    requests: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

interface Bot {
  id: string;
  name: string;
}

type DateRange = '7d' | '30d' | '90d' | 'all';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [conversationsData, setConversationsData] = useState<ConversationData[]>([]);
  const [intentsData, setIntentsData] = useState<IntentData[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>('');
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBots();
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  useEffect(() => {
    if (selectedBotId) {
      loadUsageData();
    }
  }, [selectedBotId, dateRange]);

  const loadBots = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_WORKER_API_URL || process.env.NEXT_PUBLIC_API_URL;

      if (!token) return;

      const response = await axios.get<Bot[]>(`${apiUrl}/api/v1/bots`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBots(response.data);
      if (response.data.length > 0 && !selectedBotId) {
        setSelectedBotId(response.data[0].id);
      }
    } catch (err) {
      console.error('Error loading bots:', err);
    }
  };

  const loadUsageData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_WORKER_API_URL || process.env.NEXT_PUBLIC_API_URL;

      if (!token || !selectedBotId) return;

      // Calculate date range
      const to = new Date();
      const from = new Date();
      switch (dateRange) {
        case '7d':
          from.setDate(from.getDate() - 7);
          break;
        case '30d':
          from.setDate(from.getDate() - 30);
          break;
        case '90d':
          from.setDate(from.getDate() - 90);
          break;
        case 'all':
          from.setFullYear(from.getFullYear() - 10); // 10 years ago
          break;
      }

      const response = await axios.get<UsageData>(`${apiUrl}/api/v1/bots/${selectedBotId}/usage`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          from: from.toISOString(),
          to: to.toISOString(),
        },
      });

      setUsageData(response.data);
    } catch (err) {
      console.error('Error loading usage data:', err);
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_WORKER_API_URL || process.env.NEXT_PUBLIC_API_URL;

      if (!token) {
        setError(t('analytics.authTokenNotFound'));
        return;
      }

      // Load all analytics data in parallel
      const [overviewResponse, conversationsDataResponse, intentsDataResponse, conversationsListResponse] =
        await Promise.all([
          axios.get<AnalyticsOverview>(`${apiUrl}/api/v1/analytics/overview`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get<ConversationData[]>(
            `${apiUrl}/api/v1/analytics/conversations-over-time?range=${dateRange}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
          axios.get<IntentData[]>(`${apiUrl}/api/v1/analytics/top-intents?range=${dateRange}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get<Conversation[]>(`${apiUrl}/api/v1/conversations?sort=recent&status=all`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      setOverview(overviewResponse.data);
      setConversationsData(conversationsDataResponse.data);
      setIntentsData(intentsDataResponse.data);
      setConversations(conversationsListResponse.data.slice(0, 5)); // Show only top 5
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError(err.message || t('analytics.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  // CSV helper functions with RFC-compliant escaping
  const csvEscape = (v: unknown): string => {
    let s = v == null ? '' : String(v);
    // Replace CR/LF with \n for uniform lines
    s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const mustQuote = /[",\n]/.test(s);
    if (mustQuote) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  };

  const downloadCsv = (filename: string, rows: (string | number | null | undefined)[][]) => {
    const csvRows = rows.map(r => r.map(csvEscape));
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    // Prepare CSV data with proper typing
    const header = ['Date', 'Bot Name', 'Messages', 'Duration', 'Status'];
    const rows = conversations.map(conv => [
      new Date(conv.createdAt).toLocaleString(),
      conv.botName,
      conv.messageCount,
      conv.duration,
      conv.status,
    ]);

    downloadCsv(`conversations_${dateRange}_${Date.now()}`, [header, ...rows]);
  };

  const filteredConversations = conversations.filter(conv =>
    searchQuery === '' ||
    conv.botName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="text-gray-600">{t('analytics.loadingAnalytics')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('analytics.title')}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {t('analytics.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="7d">{t('analytics.dateRanges.7d')}</option>
            <option value="30d">{t('analytics.dateRanges.30d')}</option>
            <option value="90d">{t('analytics.dateRanges.90d')}</option>
            <option value="all">{t('analytics.dateRanges.all')}</option>
          </select>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            {t('analytics.exportCSV')}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">{t('analytics.stats.totalConversations')}</h3>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {overview?.conversations.toLocaleString() || 0}
          </div>
          <p className="text-xs text-green-600 mt-2">{t('analytics.growth.fromLastPeriod').replace('{percent}', '12')}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">{t('analytics.stats.totalMessages')}</h3>
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {overview?.messages.toLocaleString() || 0}
          </div>
          <p className="text-xs text-green-600 mt-2">{t('analytics.growth.fromLastPeriod').replace('{percent}', '8')}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">{t('analytics.stats.totalLeads')}</h3>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {overview?.leads.toLocaleString() || 0}
          </div>
          <p className="text-xs text-green-600 mt-2">{t('analytics.growth.fromLastPeriod').replace('{percent}', '24')}</p>
        </div>
      </div>

      {/* Conversations Over Time Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('analytics.charts.conversationsOverTime')}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={conversationsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="conversations"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={{ fill: '#4f46e5', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Intents Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('analytics.charts.topIntents')}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={intentsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="count" fill="#4f46e5" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Conversations Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('analytics.table.recentConversations')}</h3>
          <input
            type="text"
            placeholder={t('analytics.searchByBotOrStatus')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('analytics.table.botName')}
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('analytics.table.messages')}
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('analytics.table.duration')}
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('conversations.status')}
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('analytics.table.created')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredConversations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 text-sm">
                    {t('analytics.noConversationsFound')}
                  </td>
                </tr>
              ) : (
                filteredConversations.map((conv) => (
                  <tr key={conv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-gray-900">{conv.botName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600">{conv.messageCount}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600">{conv.duration}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          conv.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : conv.status === 'active'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {conv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600">{formatDate(conv.createdAt)}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Usage Analytics Section */}
      {bots.length > 0 && (
        <>
          <div className="border-t border-gray-200 my-8"></div>

          {/* Bot Selector + Usage Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t('analytics.usageAndCosts')}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {t('analytics.usageSubtitle')}
              </p>
            </div>
            <select
              value={selectedBotId}
              onChange={(e) => setSelectedBotId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {bots.map((bot) => (
                <option key={bot.id} value={bot.id}>
                  {bot.name}
                </option>
              ))}
            </select>
          </div>

          {/* Usage Stats Cards */}
          {usageData && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">{t('analytics.stats.totalRequests')}</h3>
                  <div className="text-3xl font-bold text-gray-900">
                    {usageData.total.requests.toLocaleString()}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">{t('analytics.stats.inputTokens')}</h3>
                  <div className="text-3xl font-bold text-gray-900">
                    {usageData.total.inputTokens.toLocaleString()}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">{t('analytics.stats.outputTokens')}</h3>
                  <div className="text-3xl font-bold text-gray-900">
                    {usageData.total.outputTokens.toLocaleString()}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">{t('analytics.stats.totalCost')}</h3>
                  <div className="text-3xl font-bold text-green-600">
                    ${usageData.total.cost.toFixed(4)}
                  </div>
                </div>
              </div>

              {/* Usage Over Time Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('analytics.charts.usageOverTime')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={usageData.byDate}>
                    <defs>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      stroke="#6b7280"
                      fontSize={12}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                      formatter={(value: any, name: string) => {
                        if (name === 'cost') return [`$${Number(value).toFixed(4)}`, 'Cost'];
                        return [Number(value).toLocaleString(), name];
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      stroke="#4f46e5"
                      fillOpacity={1}
                      fill="url(#colorRequests)"
                    />
                    <Area
                      type="monotone"
                      dataKey="cost"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorCost)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Model Distribution Pie Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('analytics.charts.usageByModel')}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={usageData.byModel}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.model}: ${entry.requests}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="requests"
                      >
                        {usageData.byModel.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#4f46e5', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Model Stats Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('analytics.charts.modelBreakdown')}</h3>
                  <div className="space-y-4">
                    {usageData.byModel.map((model, index) => (
                      <div key={model.model} className="border-b border-gray-100 pb-3 last:border-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">{model.model}</span>
                          <span className="text-sm font-semibold text-green-600">${model.cost.toFixed(4)}</span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>{t('analytics.requestsLabel')}</span>
                            <span className="font-medium">{model.requests.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('analytics.inputTokensLabel')}</span>
                            <span className="font-medium">{model.inputTokens.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('analytics.outputTokensLabel')}</span>
                            <span className="font-medium">{model.outputTokens.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
