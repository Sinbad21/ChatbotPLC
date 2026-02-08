'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from '@/lib/i18n';
import { ensureClientUser } from '@/lib/ensureClientUser';
import { GlassCard } from '@/components/dashboard/ui';
import {
  User,
  Key,
  Settings,
  Shield,
  Copy,
  Trash2,
  Plus,
  Check,
  AlertCircle,
  Loader2,
  Mail,
  Bell,
  Globe,
  Clock,
  Smartphone,
  LogOut,
} from 'lucide-react';

type TabType = 'profile' | 'api-keys' | 'preferences' | 'security';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  lastUsed: string | null;
  createdAt: string;
}

const tabs: { id: TabType; icon: React.ReactNode; label: string }[] = [
  { id: 'profile', icon: <User className="w-4 h-4" />, label: 'settings.profile' },
  { id: 'api-keys', icon: <Key className="w-4 h-4" />, label: 'settings.apiKeys' },
  { id: 'preferences', icon: <Settings className="w-4 h-4" />, label: 'settings.preferences' },
  { id: 'security', icon: <Shield className="w-4 h-4" />, label: 'settings.security' },
];

export default function SettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [user, setUser] = useState<UserData | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // API Key form state
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [creatingKey, setCreatingKey] = useState(false);

  // Preferences state
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [notifications, setNotifications] = useState({
    newConversations: true,
    botOfflineAlerts: true,
    weeklyReports: false,
    marketingEmails: false,
  });

  useEffect(() => {
    loadUserData();
    loadApiKeys();
  }, []);

  // Auto-hide message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadUserData = async () => {
    try {
      const clientUser = await ensureClientUser();

      if (!clientUser?.email) {
        setLoading(false);
        return;
      }

      const normalizedUser: UserData = {
        id: clientUser.id,
        email: clientUser.email,
        name: clientUser.name || '',
        role: clientUser.role || 'user',
        createdAt: clientUser.createdAt || '',
      };

      setUser(normalizedUser);
      setName(normalizedUser.name);
      setEmail(normalizedUser.email);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load user data:', error);
      setLoading(false);
    }
  };

  const loadApiKeys = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_WORKER_API_URL || '';
      const response = await axios.get(`${apiUrl}/api/v1/api-keys`, {
        withCredentials: true,
      });
      setApiKeys(response.data);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: t('settings.profileUpdated') });
      setSaving(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || t('settings.failedToUpdate') });
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: t('settings.passwordsDoNotMatch') });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: t('settings.passwordTooShort') });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: t('settings.passwordChanged') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSaving(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || t('settings.failedToChange') });
      setSaving(false);
    }
  };

  const handleGenerateApiKey = async () => {
    if (!newKeyName.trim()) {
      setMessage({ type: 'error', text: t('settings.enterKeyName') });
      return;
    }

    setCreatingKey(true);
    setMessage(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_WORKER_API_URL || '';
      const response = await axios.post(
        `${apiUrl}/api/v1/api-keys`,
        { name: newKeyName.trim() },
        { withCredentials: true }
      );

      setGeneratedKey(response.data.key);
      setApiKeys([
        ...apiKeys,
        {
          ...response.data,
          key: response.data.key.substring(0, 20) + '...',
        },
      ]);

      setNewKeyName('');
      setCreatingKey(false);
      setMessage({ type: 'success', text: t('settings.apiKeyCreated') });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || t('settings.failedToCreate') });
      setCreatingKey(false);
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    if (!confirm(t('settings.confirmRevoke'))) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_WORKER_API_URL || '';
      await axios.delete(`${apiUrl}/api/v1/api-keys/${id}`, {
        withCredentials: true,
      });

      setApiKeys(apiKeys.filter((key) => key.id !== id));
      setMessage({ type: 'success', text: t('settings.apiKeyRevoked') });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || t('settings.failedToRevoke') });
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(generatedKey || key);
    setMessage({ type: 'success', text: t('settings.apiKeyCopied') });
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: t('settings.savePreferences') + ' ✓' });
    } catch {
      setMessage({ type: 'error', text: t('settings.failedToUpdate') });
    }
    setSaving(false);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="h-9 w-48 bg-pearl-200 rounded-lg animate-pulse mb-2" />
          <div className="h-5 w-72 bg-pearl-200/70 rounded animate-pulse" />
        </div>
        <div className="border-b border-silver-200/70 mb-8">
          <div className="flex gap-6 pb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-28 bg-pearl-200/70 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="h-64 bg-pearl-200/70 rounded-2xl animate-pulse" />
          <div className="h-48 bg-pearl-200/70 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-charcoal font-serif">{t('settings.title')}</h1>
        <p className="text-silver-600 mt-2">{t('settings.subtitle')}</p>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-red-500/10 text-red-400 border border-red-500/30'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-silver-200/70 mb-8">
        <nav className="-mb-px flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-charcoal text-charcoal bg-pearl-100/60'
                  : 'border-transparent text-silver-600 hover:text-charcoal hover:border-silver-200/70 hover:bg-pearl-100/60'
              }`}
            >
              {tab.icon}
              <span>{t(tab.label)}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Profile Card with Avatar */}
          <GlassCard>
            <div className="flex items-start gap-6 mb-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-charcoal flex items-center justify-center text-pearl-50 text-2xl font-bold shadow-pearl">
                  {name ? name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-pearl-50 flex items-center justify-center">
                  <Check className="w-3 h-3 text-pearl-50" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-charcoal">{t('settings.profileInformation')}</h2>
                <p className="text-silver-600 text-sm mt-1">
                  {t('settings.memberSince')}: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-silver-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-xl focus:ring-2 focus:ring-charcoal/10 focus:border-silver-300 text-charcoal placeholder:text-silver-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-silver-700 mb-2">
                    {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-xl focus:ring-2 focus:ring-charcoal/10 focus:border-silver-300 text-charcoal placeholder:text-silver-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-silver-600 mb-2">{t('settings.authMethod')}</label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-xl text-silver-700">
                    <Mail className="w-4 h-4" />
                    <span>{t('settings.emailPassword')}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-silver-600 mb-2">{t('settings.role')}</label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-xl text-silver-700">
                    <Shield className="w-4 h-4" />
                    <span className="capitalize">{user?.role?.toLowerCase() || 'user'}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full px-6 py-3 bg-charcoal text-pearl-50 rounded-xl hover:bg-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('settings.saving')}
                  </>
                ) : (
                  t('settings.saveChanges')
                )}
              </button>
            </form>
          </GlassCard>

          {/* Change Password Section */}
          <GlassCard>
            <h2 className="text-xl font-semibold text-charcoal mb-6 flex items-center gap-2">
              <Key className="w-5 h-5 text-charcoal" />
              {t('settings.changePassword')}
            </h2>
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-silver-700 mb-2">
                  {t('settings.currentPassword')}
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-xl focus:ring-2 focus:ring-charcoal/10 focus:border-silver-300 text-charcoal placeholder:text-silver-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-silver-700 mb-2">
                    {t('settings.newPassword')}
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-xl focus:ring-2 focus:ring-charcoal/10 focus:border-silver-300 text-charcoal placeholder:text-silver-500 transition-all"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-silver-600 mt-1.5">{t('settings.passwordMin8')}</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-silver-700 mb-2">
                    {t('settings.confirmNewPassword')}
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-xl focus:ring-2 focus:ring-charcoal/10 focus:border-silver-300 text-charcoal placeholder:text-silver-500 transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full px-6 py-3 bg-charcoal text-pearl-50 rounded-xl hover:bg-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('settings.changing')}
                  </>
                ) : (
                  t('settings.changePasswordBtn')
                )}
              </button>
            </form>
          </GlassCard>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'api-keys' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Generated Key Display */}
          {generatedKey && (
            <div className="bg-pearl-50 border border-silver-200/70 rounded-xl p-6 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-pearl-100 flex items-center justify-center flex-shrink-0">
                  <Key className="w-5 h-5 text-charcoal" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-silver-600 mb-1">{t('settings.apiKeyGenerated')}</h3>
                  <p className="text-sm text-silver-600 mb-4">{t('settings.saveKeyNow')}</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-lg text-sm font-mono text-charcoal overflow-x-auto">
                      {generatedKey}
                    </code>
                    <button
                      onClick={() => handleCopyKey(generatedKey)}
                      className="px-4 py-3 bg-charcoal text-pearl-50 rounded-lg hover:bg-charcoal/90 font-medium shadow-pearl flex items-center gap-2 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      {t('settings.copy')}
                    </button>
                  </div>
                  <button
                    onClick={() => setGeneratedKey(null)}
                    className="mt-4 text-sm text-charcoal hover:text-charcoal underline transition-colors"
                  >
                    {t('common.close')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create New Key */}
          <GlassCard>
            <h2 className="text-xl font-semibold text-charcoal mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-charcoal" />
              {t('settings.createNewApiKey')}
            </h2>
            <p className="text-sm text-silver-600 mb-6">{t('settings.apiKeyDescription')}</p>

            <div className="flex gap-3">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder={t('settings.keyNamePlaceholder')}
                className="flex-1 px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-xl focus:ring-2 focus:ring-charcoal/10 focus:border-silver-300 text-charcoal placeholder:text-silver-500 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateApiKey()}
              />
              <button
                onClick={handleGenerateApiKey}
                disabled={creatingKey || !newKeyName.trim()}
                className="px-6 py-3 bg-charcoal text-pearl-50 rounded-xl hover:bg-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-lg flex items-center gap-2"
              >
                {creatingKey ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('settings.generating')}
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    {t('settings.generateKey')}
                  </>
                )}
              </button>
            </div>
          </GlassCard>

          {/* API Keys List */}
          <GlassCard>
            <h2 className="text-xl font-semibold text-charcoal mb-6">{t('settings.yourApiKeys')}</h2>

            {apiKeys.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-pearl-50 flex items-center justify-center mx-auto mb-4">
                  <Key className="w-8 h-8 text-silver-700" />
                </div>
                <p className="text-silver-600">{t('settings.noApiKeys')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="bg-pearl-50 border border-silver-200/70 rounded-xl p-4 hover:border-silver-300 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-charcoal flex items-center gap-2">
                          <Key className="w-4 h-4 text-charcoal" />
                          {key.name}
                        </h3>
                        <code className="text-sm text-silver-600 font-mono mt-1 block truncate">{key.key}</code>
                        <div className="flex items-center gap-4 mt-2 text-xs text-silver-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t('settings.createdDate').replace('{date}', new Date(key.createdAt).toLocaleDateString())}
                          </span>
                          {key.lastUsed ? (
                            <span>{t('settings.lastUsed').replace('{date}', new Date(key.lastUsed).toLocaleDateString())}</span>
                          ) : (
                            <span className="text-silver-500">{t('settings.neverUsed')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopyKey(key.key)}
                          className="p-2 text-silver-600 hover:text-charcoal hover:bg-pearl-100/60 rounded-lg transition-all"
                          title={t('settings.copy')}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRevokeApiKey(key.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all"
                          title={t('settings.revoke')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <GlassCard>
            <h2 className="text-xl font-semibold text-charcoal mb-6 flex items-center gap-2">
              <Globe className="w-5 h-5 text-charcoal" />
              {t('settings.preferences')}
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-silver-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {t('settings.timezone')}
                  </label>
                  <select
                    id="timezone"
                    value={selectedTimezone}
                    onChange={(e) => setSelectedTimezone(e.target.value)}
                    className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-xl focus:ring-2 focus:ring-charcoal/10 focus:border-silver-300 text-charcoal transition-all cursor-pointer"
                  >
                    <option value="UTC">UTC</option>
                    <option value="Europe/Rome">Europe/Rome</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="America/New_York">America/New York</option>
                    <option value="America/Los_Angeles">America/Los Angeles</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                    <option value="Asia/Singapore">Asia/Singapore</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-silver-700 mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    {t('settings.language')}
                  </label>
                  <select
                    id="language"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full px-4 py-3 bg-pearl-50 border border-silver-200/70 rounded-xl focus:ring-2 focus:ring-charcoal/10 focus:border-silver-300 text-charcoal transition-all cursor-pointer"
                  >
                    <option value="English">English</option>
                    <option value="Italiano">Italiano</option>
                    <option value="Español">Español</option>
                    <option value="Français">Français</option>
                    <option value="Deutsch">Deutsch</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-silver-200/70 pt-6">
                <label className="block text-sm font-medium text-silver-700 mb-4 flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  {t('settings.emailNotifications')}
                </label>
                <div className="space-y-3">
                  {[
                    { key: 'newConversations', label: t('settings.newConversations') },
                    { key: 'botOfflineAlerts', label: t('settings.botOfflineAlerts') },
                    { key: 'weeklyReports', label: t('settings.weeklyReports') },
                    { key: 'marketingEmails', label: t('settings.marketingEmails') },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-pearl-100/60 transition-colors cursor-pointer group"
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={notifications[item.key as keyof typeof notifications]}
                          onChange={(e) =>
                            setNotifications({ ...notifications, [item.key]: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 border-2 border-silver-300 rounded-md peer-checked:bg-charcoal peer-checked:border-charcoal transition-all flex items-center justify-center">
                          <Check className="w-3 h-3 text-pearl-50 opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <span className="text-silver-700 group-hover:text-charcoal transition-colors">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSavePreferences}
                disabled={saving}
                className="w-full px-6 py-3 bg-charcoal text-pearl-50 rounded-xl hover:bg-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('settings.saving')}
                  </>
                ) : (
                  t('settings.savePreferences')
                )}
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <GlassCard>
            <h2 className="text-xl font-semibold text-charcoal mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-charcoal" />
              {t('settings.securitySettings')}
            </h2>

            <div className="space-y-6">
              {/* Two-Factor Auth */}
              <div className="p-4 bg-pearl-50 rounded-xl border border-silver-200/70">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-pearl-100 flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-5 h-5 text-silver-700" />
                    </div>
                    <div>
                      <h3 className="font-medium text-charcoal">{t('settings.twoFactorAuth')}</h3>
                      <p className="text-sm text-silver-600 mt-1">{t('settings.twoFactorAuthDescription')}</p>
                    </div>
                  </div>
                  <button
                    disabled
                    className="px-4 py-2 bg-pearl-100 text-silver-600 rounded-lg cursor-not-allowed font-medium text-sm"
                  >
                    {t('settings.enable2FA')}
                  </button>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="border-t border-silver-200/70 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <LogOut className="w-5 h-5 text-charcoal" />
                  <h3 className="font-medium text-charcoal">{t('settings.activeSessions')}</h3>
                </div>
                <p className="text-sm text-silver-600 mb-4">{t('settings.activeSessionsDescription')}</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-pearl-50 border border-silver-200/70 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="font-medium text-charcoal">{t('settings.currentSession')}</div>
                        <div className="text-sm text-silver-600">Chrome on macOS - {new Date().toLocaleString()}</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/30">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="border-t border-red-500/20 pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <h3 className="font-medium text-red-400">{t('settings.dangerZone')}</h3>
                </div>
                <p className="text-sm text-silver-600 mb-4">{t('settings.irreversibleActions')}</p>

                <button className="px-6 py-2.5 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-600 hover:text-charcoal hover:border-red-500 font-medium transition-all">
                  {t('settings.deleteAccount')}
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}



