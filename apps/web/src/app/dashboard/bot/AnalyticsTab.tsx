'use client';

import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Activity, Zap, DollarSign, Calendar } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface AnalyticsTabProps {
  botId: string;
  apiBaseUrl: string;
}

interface ModelData {
  model: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

interface DateData {
  date: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

interface AnalyticsData {
  byModel: ModelData[];
  byDate: DateData[];
  total: {
    requests: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function AnalyticsTab({ botId, apiBaseUrl }: AnalyticsTabProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);

      const response = await fetch(
        `${apiBaseUrl}/api/v1/bots/${botId}/usage?${params.toString()}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics (${response.status})`);
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || t('analytics.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [botId, apiBaseUrl]);

  const handleApplyDateRange = () => {
    fetchAnalytics();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-silver-600">{t('analytics.loadingAnalytics')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <p className="text-red-300 text-sm">Error: {error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const hasData = data.total.requests > 0;

  return (
    <div className="space-y-6">
      {/* Date Range Picker */}
      <div className="glass-effect backdrop-blur-md rounded-lg shadow-sm border border-silver-200/70 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-silver-600" />
            <span className="text-sm font-medium text-charcoal">{t('analytics.dateRange')}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-silver-600">{t('analytics.from')}</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-silver-200/70 rounded-lg focus:ring-2 focus:ring-emerald/20 focus:border-emerald/40 text-charcoal bg-pearl-50"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-silver-600">{t('analytics.to')}</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-silver-200/70 rounded-lg focus:ring-2 focus:ring-emerald/20 focus:border-emerald/40 text-charcoal bg-pearl-50"
            />
          </div>
          <button
            onClick={handleApplyDateRange}
            className="px-4 py-1.5 bg-charcoal text-pearl text-sm font-medium rounded-lg hover:bg-charcoal/90"
          >
            {t('analytics.apply')}
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-pearl-50 border border-silver-200/70 rounded-lg p-12 text-center">
          <Activity className="w-12 h-12 text-silver-400 mx-auto mb-3" />
          <p className="text-silver-600 text-sm">{t('analytics.noUsageData')}</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-effect backdrop-blur-md rounded-lg shadow-sm border border-silver-200/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-silver-600">{t('analytics.stats.totalRequests')}</p>
                  <p className="text-2xl font-bold text-charcoal mt-1">
                    {data.total.requests.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-pearl-100/70 border border-silver-200/70 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-silver-700" />
                </div>
              </div>
            </div>

            <div className="glass-effect backdrop-blur-md rounded-lg shadow-sm border border-silver-200/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-silver-600">{t('analytics.stats.inputTokens')}</p>
                  <p className="text-2xl font-bold text-charcoal mt-1">
                    {data.total.inputTokens.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-pearl-100/70 border border-silver-200/70 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-silver-700" />
                </div>
              </div>
            </div>

            <div className="glass-effect backdrop-blur-md rounded-lg shadow-sm border border-silver-200/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-silver-600">{t('analytics.stats.outputTokens')}</p>
                  <p className="text-2xl font-bold text-charcoal mt-1">
                    {data.total.outputTokens.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </div>

            <div className="glass-effect backdrop-blur-md rounded-lg shadow-sm border border-silver-200/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-silver-600">{t('analytics.stats.totalCost')}</p>
                  <p className="text-2xl font-bold text-charcoal mt-1">
                    ${data.total.cost.toFixed(4)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Time Series Charts */}
          {data.byDate.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Requests Over Time */}
              <div className="glass-effect backdrop-blur-md rounded-lg shadow-sm border border-silver-200/70 p-4">
                <h3 className="text-lg font-semibold text-charcoal mb-4">{t('analytics.charts.requestsOverTime')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.byDate}>
                    <defs>
                      <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                    />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                      labelFormatter={(value) => format(new Date(value as string), 'MMM dd, yyyy')}
                    />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#colorRequests)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Cost Over Time */}
              <div className="glass-effect backdrop-blur-md rounded-lg shadow-sm border border-silver-200/70 p-4">
                <h3 className="text-lg font-semibold text-charcoal mb-4">{t('analytics.charts.costOverTime')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.byDate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                    />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                      labelFormatter={(value) => format(new Date(value as string), 'MMM dd, yyyy')}
                      formatter={(value: any) => `$${value.toFixed(4)}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="cost"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Tokens Over Time */}
              <div className="glass-effect backdrop-blur-md rounded-lg shadow-sm border border-silver-200/70 p-4">
                <h3 className="text-lg font-semibold text-charcoal mb-4">{t('analytics.charts.tokensOverTime')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.byDate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                    />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                      labelFormatter={(value) => format(new Date(value as string), 'MMM dd, yyyy')}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="inputTokens"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="Input Tokens"
                    />
                    <Line
                      type="monotone"
                      dataKey="outputTokens"
                      stroke="#ec4899"
                      strokeWidth={2}
                      name="Output Tokens"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Model Distribution */}
              {data.byModel.length > 0 && (
                <div className="glass-effect backdrop-blur-md rounded-lg shadow-sm border border-silver-200/70 p-4">
                  <h3 className="text-lg font-semibold text-charcoal mb-4">{t('analytics.charts.usageByModel')}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.byModel}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ model, requests, percent }) =>
                          `${model}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="requests"
                      >
                        {data.byModel.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Model Details Table */}
          {data.byModel.length > 0 && (
            <div className="glass-effect backdrop-blur-md rounded-lg shadow-sm border border-silver-200/70 overflow-hidden">
              <div className="p-4 border-b border-silver-200/70">
                <h3 className="text-lg font-semibold text-charcoal">{t('analytics.modelDetails')}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-pearl-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-silver-600 uppercase tracking-wider">
                        {t('analytics.table.model')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-silver-600 uppercase tracking-wider">
                        {t('analytics.table.requests')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-silver-600 uppercase tracking-wider">
                        {t('analytics.stats.inputTokens')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-silver-600 uppercase tracking-wider">
                        {t('analytics.stats.outputTokens')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-silver-600 uppercase tracking-wider">
                        {t('analytics.stats.totalCost')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.byModel.map((model, idx) => (
                      <tr key={idx} className="hover:bg-pearl-100/60">
                        <td className="px-4 py-3 text-sm font-medium text-charcoal">
                          {model.model}
                        </td>
                        <td className="px-4 py-3 text-sm text-charcoal text-right">
                          {model.requests.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-charcoal text-right">
                          {model.inputTokens.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-charcoal text-right">
                          {model.outputTokens.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-charcoal text-right">
                          ${model.cost.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
