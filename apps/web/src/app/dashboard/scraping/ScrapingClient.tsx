'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from '@/lib/i18n';
import { GlassCard } from '@/components/dashboard/ui';
import { ensureClientUser } from '@/lib/ensureClientUser';
interface Business {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  rating: number;
  reviewCount: number;
  category: string;
  source: string;
  coordinates: { lat: number; lng: number };
  technologies: string[];
  hasOnlineBooking: boolean;
  socialPresence: {
    facebook: boolean;
    instagram: boolean;
    linkedin: boolean;
  };
}

interface AIAnalysis {
  score: number;
  painPoints: string[];
  opportunity: string;
  approachStrategy: string;
  bestContactTime: string;
  emailHook: string;
  reasoning: string;
}

interface BusinessWithAnalysis extends Business {
  analysis?: AIAnalysis;
  outreachEmail?: {
    subject: string;
    body: string;
    followUpSuggestions: string[];
  };
}

type ViewMode = 'search' | 'results' | 'detail';

export default function ScrapingClient() {
  const { t, currentLang } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('search');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search form state
  const [searchGoal, setSearchGoal] = useState('');
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState(10);
  const [businessType, setBusinessType] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [maxRating, setMaxRating] = useState(5);
  const [hasWebsite, setHasWebsite] = useState<string>('any');
  const [selectedSources, setSelectedSources] = useState<string[]>(['google_maps', 'yelp']);

  // Results state
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<BusinessWithAnalysis[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessWithAnalysis | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // User product info for AI
  const [userProduct, setUserProduct] = useState('');
  const [userName, setUserName] = useState('');
  const [userCompany, setUserCompany] = useState('');

  useEffect(() => {
    void (async () => {
      const user = await ensureClientUser();
      if (user?.name) setUserName(user.name);
      // `User` model currently has no company field; keep existing behavior if present in stored payloads.
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUserCompany(parsed.company || '');
        } catch {}
      }
    })();
  }, []);

  const handleSearch = async () => {
    if (!searchGoal.trim() || !location.trim()) {
      setError(t('leadDiscovery.errors.requiredFields'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_WORKER_API_URL || process.env.NEXT_PUBLIC_API_URL;

      const response = await axios.post(
        `${apiUrl}/api/v1/discovery/search`,
        {
          searchGoal: searchGoal.trim(),
          location: location.trim(),
          radius,
          businessType: businessType.trim() || undefined,
          minRating: minRating > 0 ? minRating : undefined,
          maxRating: maxRating < 5 ? maxRating : undefined,
          hasWebsite: hasWebsite !== 'any' ? hasWebsite === 'yes' : undefined,
          sources: selectedSources,
        },
        { withCredentials: true }
      );

      setCampaignId(response.data.campaignId);
      setBusinesses(response.data.initialResults || []);
      setViewMode('results');
    } catch (err: any) {
      console.error('Error searching:', err);
      setError(err.response?.data?.error || err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeBusiness = async (business: Business) => {
    try {
      setAnalyzingId(business.id);
      const apiUrl = process.env.NEXT_PUBLIC_WORKER_API_URL || process.env.NEXT_PUBLIC_API_URL;

      const response = await axios.post(
        `${apiUrl}/api/v1/discovery/analyze`,
        {
          business,
          searchGoal,
          userProduct: userProduct || 'a solution to help businesses grow',
          language: currentLang,
        },
        { withCredentials: true }
      );

      const analysis = response.data.analysis;

      // Update business with analysis
      setBusinesses((prev) =>
        prev.map((b) => (b.id === business.id ? { ...b, analysis } : b))
      );
    } catch (err: any) {
      console.error('Error analyzing business:', err);
      alert(err.response?.data?.error || t('leadDiscovery.errors.analysisFailed'));
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleGenerateEmail = async (business: BusinessWithAnalysis) => {
    if (!business.analysis) {
      alert(t('leadDiscovery.errors.analyzeFirst'));
      return;
    }

    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_WORKER_API_URL || process.env.NEXT_PUBLIC_API_URL;

      const response = await axios.post(
        `${apiUrl}/api/v1/discovery/generate-outreach`,
        {
          business,
          analysis: business.analysis,
          userInfo: {
            name: userName,
            company: userCompany,
            product: userProduct,
          },
          language: currentLang,
        },
        { withCredentials: true }
      );

      const outreachEmail = response.data;

      // Update business with generated email
      setBusinesses((prev) =>
        prev.map((b) => (b.id === business.id ? { ...b, outreachEmail } : b))
      );

      // Show in detail view
      setSelectedBusiness({ ...business, outreachEmail });
      setViewMode('detail');
    } catch (err: any) {
      console.error('Error generating email:', err);
      alert(err.response?.data?.error || t('leadDiscovery.errors.emailFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResults = async () => {
    if (!campaignId || businesses.length === 0) {
      alert(t('leadDiscovery.errors.noResults'));
      return;
    }

    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_WORKER_API_URL || process.env.NEXT_PUBLIC_API_URL;

      const analyses = businesses.map((b) => b.analysis);

      await axios.post(
        `${apiUrl}/api/v1/discovery/save-results`,
        {
          campaignId,
          businesses,
          analyses,
        },
        { withCredentials: true }
      );

      alert(t('leadDiscovery.success.savedLeads').replace('{count}', businesses.length.toString()));
    } catch (err: any) {
      console.error('Error saving results:', err);
      alert(err.response?.data?.error || t('leadDiscovery.errors.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const handleExportCSV = () => {
    if (businesses.length === 0) {
      alert(t('leadDiscovery.errors.noExport'));
      return;
    }

    const csvEscape = (v: unknown): string => {
      let s = v == null ? '' : String(v);
      s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const mustQuote = /[",\n]/.test(s);
      if (mustQuote) s = '"' + s.replace(/"/g, '""') + '"';
      return s;
    };

    const header = [
      t('leadDiscovery.csv.name'),
      t('leadDiscovery.csv.address'),
      t('leadDiscovery.csv.phone'),
      t('leadDiscovery.csv.email'),
      t('leadDiscovery.csv.website'),
      t('leadDiscovery.csv.rating'),
      t('leadDiscovery.csv.reviews'),
      t('leadDiscovery.csv.category'),
      t('leadDiscovery.csv.aiScore'),
      t('leadDiscovery.csv.painPoints'),
      t('leadDiscovery.csv.opportunity'),
      t('leadDiscovery.csv.bestContactTime'),
    ];

    const rows = businesses.map((b) => [
      b.name,
      b.address,
      b.phone || '',
      b.email || '',
      b.website || '',
      b.rating,
      b.reviewCount,
      b.category,
      b.analysis?.score || '',
      b.analysis?.painPoints?.join('; ') || '',
      b.analysis?.opportunity || '',
      b.analysis?.bestContactTime || '',
    ]);

    const csvRows = [header, ...rows].map((row) => row.map(csvEscape));
    const csvContent = csvRows.map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `lead_discovery_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SEARCH VIEW
  if (viewMode === 'search') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">{t('leadDiscovery.title')}</h1>
          <p className="text-sm text-silver-700 mt-1">
            {t('leadDiscovery.subtitle')}
          </p>
        </div>

        <GlassCard className="space-y-6">
          {/* Search Goal */}
          <div>
            <label className="block text-sm font-medium text-silver-700 mb-2">
              {t('leadDiscovery.form.searchGoalRequired')}
            </label>
            <input
              type="text"
              placeholder={t('leadDiscovery.form.searchGoalPlaceholder')}
              value={searchGoal}
              onChange={(e) => setSearchGoal(e.target.value)}
              className="w-full px-4 py-2 border border-silver-200/70 rounded-lg text-sm text-charcoal bg-pearl-50 placeholder:text-charcoal/40 focus:ring-2 focus:ring-charcoal/10 focus:border-silver-300"
            />
            <p className="text-xs text-silver-600 mt-1">
              {t('leadDiscovery.form.searchGoalHelp')}
            </p>
          </div>

          {/* Your Product/Service */}
          <div>
            <label className="block text-sm font-medium text-silver-700 mb-2">
              {t('leadDiscovery.form.yourProduct')}
            </label>
            <input
              type="text"
              placeholder={t('leadDiscovery.form.yourProductPlaceholder')}
              value={userProduct}
              onChange={(e) => setUserProduct(e.target.value)}
              className="w-full px-4 py-2 border border-silver-200/70 rounded-lg text-sm text-charcoal bg-pearl-50 placeholder:text-charcoal/40 focus:ring-2 focus:ring-charcoal/10 focus:border-silver-300"
            />
            <p className="text-xs text-silver-600 mt-1">
              {t('leadDiscovery.form.yourProductHelp')}
            </p>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-silver-700 mb-2">
                {t('leadDiscovery.form.locationRequired')}
              </label>
              <input
                type="text"
                placeholder={t('leadDiscovery.form.locationPlaceholder')}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 border border-silver-200/70 rounded-lg text-sm text-charcoal bg-pearl-50 placeholder:text-charcoal/40 focus:ring-2 focus:ring-charcoal/10 focus:border-silver-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-silver-700 mb-2">
                {t('leadDiscovery.form.radius')}
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value) || 10)}
                className="w-full px-4 py-2 border border-silver-200/70 rounded-lg text-sm text-charcoal bg-pearl-50 focus:ring-2 focus:ring-charcoal/10 focus:border-silver-300"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-charcoal mb-4">{t('leadDiscovery.form.filtersOptional')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-silver-700 mb-2">
                  {t('leadDiscovery.form.businessType')}
                </label>
                <input
                  type="text"
                  placeholder={t('leadDiscovery.form.businessTypePlaceholder')}
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-4 py-2 border border-silver-200/70 rounded-lg text-sm text-charcoal bg-pearl-50 placeholder:text-charcoal/40 focus:ring-2 focus:ring-charcoal/10 focus:border-silver-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-silver-700 mb-2">
                  {t('leadDiscovery.form.hasWebsite')}
                </label>
                <select
                  value={hasWebsite}
                  onChange={(e) => setHasWebsite(e.target.value)}
                  className="w-full px-4 py-2 border border-silver-200/70 rounded-lg text-sm text-charcoal bg-pearl-50 focus:ring-2 focus:ring-charcoal/10 focus:border-silver-300"
                >
                  <option value="any">{t('leadDiscovery.form.hasWebsiteAny')}</option>
                  <option value="yes">{t('leadDiscovery.form.hasWebsiteYes')}</option>
                  <option value="no">{t('leadDiscovery.form.hasWebsiteNo')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-silver-700 mb-2">
                  {t('leadDiscovery.form.minRating')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={minRating}
                  onChange={(e) => setMinRating(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-silver-200/70 rounded-lg text-sm text-charcoal bg-pearl-50 focus:ring-2 focus:ring-charcoal/10 focus:border-silver-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-silver-700 mb-2">
                  {t('leadDiscovery.form.maxRating')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={maxRating}
                  onChange={(e) => setMaxRating(parseFloat(e.target.value) || 5)}
                  className="w-full px-4 py-2 border border-silver-200/70 rounded-lg text-sm text-charcoal bg-pearl-50 focus:ring-2 focus:ring-charcoal/10 focus:border-silver-300"
                />
              </div>
            </div>
          </div>

          {/* Data Sources */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-charcoal mb-3">{t('leadDiscovery.form.dataSources')}</h3>
            <div className="flex flex-wrap gap-3">
              {['google_maps', 'yelp', 'facebook', 'yellow_pages'].map((source) => (
                <label key={source} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSources.includes(source)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSources([...selectedSources, source]);
                      } else {
                        setSelectedSources(selectedSources.filter((s) => s !== source));
                      }
                    }}
                    className="w-4 h-4 text-charcoal border-silver-300 rounded focus:ring-charcoal/20"
                  />
                  <span className="text-sm text-silver-700 capitalize">
                    {source.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full px-4 py-3 bg-charcoal text-pearl rounded-lg hover:bg-charcoal/90 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('leadDiscovery.buttons.searching') : t('leadDiscovery.buttons.startSearch')}
          </button>
        </GlassCard>
      </div>
    );
  }

  // RESULTS VIEW
  if (viewMode === 'results') {
    const analyzedCount = businesses.filter((b) => b.analysis).length;
    const avgScore =
      analyzedCount > 0
        ? Math.round(
            businesses
              .filter((b) => b.analysis)
              .reduce((sum, b) => sum + (b.analysis?.score || 0), 0) / analyzedCount
          )
        : 0;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-charcoal">{t('leadDiscovery.results.title')}</h1>
            <p className="text-sm text-silver-700 mt-1">
              {t('leadDiscovery.results.foundBusinesses').replace('{count}', businesses.length.toString())}
            </p>
          </div>
          <button
            onClick={() => setViewMode('search')}
            className="px-4 py-2 text-sm font-medium text-charcoal bg-pearl-50 border border-silver-200/70 rounded-lg hover:bg-pearl-100"
          >
            {t('leadDiscovery.buttons.newSearch')}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard className="!p-4">
            <div className="text-sm text-silver-700">{t('leadDiscovery.results.totalFound')}</div>
            <div className="text-2xl font-bold text-charcoal mt-1">{businesses.length}</div>
          </GlassCard>
          <GlassCard className="!p-4">
            <div className="text-sm text-silver-700">{t('leadDiscovery.results.analyzed')}</div>
            <div className="text-2xl font-bold text-charcoal mt-1">{analyzedCount}</div>
          </GlassCard>
          <GlassCard className="!p-4">
            <div className="text-sm text-silver-700">{t('leadDiscovery.results.avgScore')}</div>
            <div className="text-2xl font-bold text-charcoal mt-1">{avgScore}</div>
          </GlassCard>
          <GlassCard className="!p-4">
            <div className="text-sm text-silver-700">{t('leadDiscovery.results.qualifiedLeads')}</div>
            <div className="text-2xl font-bold text-charcoal mt-1">
              {businesses.filter((b) => (b.analysis?.score || 0) >= 70).length}
            </div>
          </GlassCard>
        </div>

        {/* Map Placeholder */}
        <GlassCard>
          <h2 className="text-lg font-semibold text-charcoal mb-4">{t('leadDiscovery.results.geographicView')}</h2>
          <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <svg
                className="mx-auto h-12 w-12 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <p className="text-sm">
                {t('leadDiscovery.results.mapPlaceholder')}
                <br />
                <span className="text-xs">{t('leadDiscovery.results.mapPins').replace('{count}', businesses.length.toString())}</span>
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-gray-100 text-silver-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
          >
            {t('leadDiscovery.buttons.exportCSV')}
          </button>
          <button
            onClick={handleSaveResults}
            disabled={loading}
            className="px-4 py-2 bg-charcoal text-pearl rounded-lg hover:bg-charcoal/90 text-sm font-medium disabled:opacity-50"
          >
            {t('leadDiscovery.buttons.saveToLeads')}
          </button>
        </div>

        {/* Results Table */}
        <GlassCard>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    {t('leadDiscovery.table.business')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    {t('leadDiscovery.table.contact')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    {t('leadDiscovery.table.rating')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    {t('leadDiscovery.table.aiScore')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    {t('leadDiscovery.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {businesses.map((business) => (
                  <tr key={business.id} className="hover:bg-pearl-100">
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-charcoal">{business.name}</div>
                        <div className="text-xs text-gray-600">{business.category}</div>
                        <div className="text-xs text-gray-500">{business.address}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-charcoal">
                        {business.phone && <div>📞 {business.phone}</div>}
                        {business.email && <div>✉️ {business.email}</div>}
                        {business.website && (
                          <div>
                            🌐{' '}
                            <a
                              href={business.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-charcoal hover:underline"
                            >
                              {t('leadDiscovery.table.website')}
                            </a>
                          </div>
                        )}
                        {!business.phone && !business.email && !business.website && (
                          <span className="text-gray-400">{t('leadDiscovery.results.noContactInfo')}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-charcoal">
                        ⭐ {business.rating.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">
                        ({business.reviewCount} {t('leadDiscovery.table.reviews')})
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {business.analysis ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(
                            business.analysis.score
                          )}`}
                        >
                          {business.analysis.score}/100
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">{t('leadDiscovery.results.notAnalyzed')}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {!business.analysis ? (
                          <button
                            onClick={() => handleAnalyzeBusiness(business)}
                            disabled={analyzingId === business.id}
                            className="text-xs text-charcoal hover:text-charcoal font-medium disabled:opacity-50"
                          >
                            {analyzingId === business.id ? t('leadDiscovery.buttons.analyzing') : t('leadDiscovery.buttons.analyze')}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setSelectedBusiness(business);
                                setViewMode('detail');
                              }}
                              className="text-xs text-charcoal hover:text-charcoal font-medium"
                            >
                              {t('leadDiscovery.buttons.view')}
                            </button>
                            <button
                              onClick={() => handleGenerateEmail(business)}
                              className="text-xs text-green-600 hover:text-green-800 font-medium"
                            >
                              {t('leadDiscovery.buttons.generateEmail')}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    );
  }

  // DETAIL VIEW
  if (viewMode === 'detail' && selectedBusiness) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-charcoal">{selectedBusiness.name}</h1>
            <p className="text-sm text-silver-700 mt-1">{selectedBusiness.category}</p>
          </div>
          <button
            onClick={() => setViewMode('results')}
            className="px-4 py-2 text-sm font-medium text-charcoal bg-pearl-50 border border-silver-200/70 rounded-lg hover:bg-pearl-100"
          >
            {t('leadDiscovery.buttons.backToResults')}
          </button>
        </div>

        {/* Business Info */}
        <GlassCard>
          <h2 className="text-lg font-semibold text-charcoal mb-4">{t('leadDiscovery.detail.businessInfo')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-silver-700">{t('leadDiscovery.detail.address')}</span>
              <span className="ml-2 text-charcoal">{selectedBusiness.address}</span>
            </div>
            <div>
              <span className="font-medium text-silver-700">{t('leadDiscovery.detail.phone')}</span>
              <span className="ml-2 text-charcoal">{selectedBusiness.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-silver-700">{t('leadDiscovery.detail.email')}</span>
              <span className="ml-2 text-charcoal">{selectedBusiness.email || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-silver-700">{t('leadDiscovery.detail.website')}</span>
              <span className="ml-2 text-charcoal">
                {selectedBusiness.website ? (
                  <a
                    href={selectedBusiness.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-charcoal hover:underline"
                  >
                    {selectedBusiness.website}
                  </a>
                ) : (
                  'N/A'
                )}
              </span>
            </div>
            <div>
              <span className="font-medium text-silver-700">{t('leadDiscovery.detail.rating')}</span>
              <span className="ml-2 text-charcoal">
                {selectedBusiness.rating.toFixed(1)}/5 ({selectedBusiness.reviewCount} {t('leadDiscovery.table.reviews')})
              </span>
            </div>
            <div>
              <span className="font-medium text-silver-700">{t('leadDiscovery.detail.source')}</span>
              <span className="ml-2 text-charcoal">{selectedBusiness.source}</span>
            </div>
          </div>
        </GlassCard>

        {/* AI Analysis */}
        {selectedBusiness.analysis && (
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-charcoal">{t('leadDiscovery.detail.aiAnalysis')}</h2>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(
                  selectedBusiness.analysis.score
                )}`}
              >
                {t('leadDiscovery.detail.score')} {selectedBusiness.analysis.score}/100
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-silver-700 mb-2">{t('leadDiscovery.detail.whyIdeal')}</h3>
                <p className="text-sm text-charcoal">{selectedBusiness.analysis.opportunity}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-silver-700 mb-2">{t('leadDiscovery.detail.painPoints')}</h3>
                <ul className="list-disc list-inside text-sm text-charcoal space-y-1">
                  {selectedBusiness.analysis.painPoints.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium text-silver-700 mb-2">{t('leadDiscovery.detail.howToApproach')}</h3>
                <p className="text-sm text-charcoal">
                  {selectedBusiness.analysis.approachStrategy}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-silver-700 mb-2">{t('leadDiscovery.detail.bestContactTime')}</h3>
                <p className="text-sm text-charcoal">
                  {selectedBusiness.analysis.bestContactTime}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-silver-700 mb-2">{t('leadDiscovery.detail.emailHook')}</h3>
                <p className="text-sm text-charcoal italic">
                  "{selectedBusiness.analysis.emailHook}"
                </p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Outreach Email */}
        {selectedBusiness.outreachEmail && (
          <GlassCard>
            <h2 className="text-lg font-semibold text-charcoal mb-4">
              {t('leadDiscovery.detail.personalizedEmail')}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-silver-700 mb-1">{t('leadDiscovery.detail.subject')}</label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-charcoal">
                  {selectedBusiness.outreachEmail.subject}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-silver-700 mb-1">{t('leadDiscovery.detail.body')}</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded text-sm text-charcoal whitespace-pre-wrap">
                  {selectedBusiness.outreachEmail.body}
                </div>
              </div>

              {selectedBusiness.outreachEmail.followUpSuggestions &&
                selectedBusiness.outreachEmail.followUpSuggestions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-silver-700 mb-2">
                      {t('leadDiscovery.detail.followUpSuggestions')}
                    </label>
                    <ul className="list-disc list-inside text-sm text-charcoal space-y-1">
                      {selectedBusiness.outreachEmail.followUpSuggestions.map((suggestion, idx) => (
                        <li key={idx}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Subject: ${selectedBusiness.outreachEmail!.subject}\n\n${
                        selectedBusiness.outreachEmail!.body
                      }`
                    );
                    alert(t('leadDiscovery.success.emailCopied'));
                  }}
                  className="px-4 py-2 bg-charcoal text-pearl rounded-lg hover:bg-charcoal/90 text-sm font-medium"
                >
                  {t('leadDiscovery.buttons.copyEmail')}
                </button>
                <button
                  onClick={() => handleGenerateEmail(selectedBusiness)}
                  className="px-4 py-2 bg-gray-100 text-silver-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  {t('leadDiscovery.buttons.regenerate')}
                </button>
              </div>
            </div>
          </GlassCard>
        )}

        {!selectedBusiness.outreachEmail && selectedBusiness.analysis && (
          <GlassCard>
            <button
              onClick={() => handleGenerateEmail(selectedBusiness)}
              disabled={loading}
              className="w-full px-4 py-3 bg-charcoal text-pearl rounded-lg hover:bg-charcoal/90 text-sm font-medium disabled:opacity-50"
            >
              {loading ? t('leadDiscovery.buttons.generating') : t('leadDiscovery.buttons.generateOutreachEmail')}
            </button>
          </GlassCard>
        )}
      </div>
    );
  }

  return null;
}
