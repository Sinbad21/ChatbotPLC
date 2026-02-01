'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WhatsAppWizard } from '@/components/dashboard/wizards/WhatsAppWizard';
import { TelegramWizard } from '@/components/dashboard/wizards/TelegramWizard';
import { SlackWizard } from '@/components/dashboard/wizards/SlackWizard';
import { HubSpotWizard } from '@/components/dashboard/wizards/HubSpotWizard';
import { StripeWizard } from '@/components/dashboard/wizards/StripeWizard';
import { WooCommerceWizard } from '@/components/dashboard/wizards/WooCommerceWizard';
import { WidgetGuide } from '@/components/dashboard/guides/WidgetGuide';
import { ShopifyGuide } from '@/components/dashboard/guides/ShopifyGuide';
import { WordPressGuide } from '@/components/dashboard/guides/WordPressGuide';
import { GenericIntegrationWizard } from '@/components/dashboard/wizards/GenericIntegrationWizard';
import { authFetch } from '@/lib/authHeaders';
import {
  GoogleCalendarIcon,
  HubSpotIcon,
  SlackIcon,
  StripeIcon,
  TelegramIcon,
  WhatsAppIcon,
  WooCommerceIcon,
  ShopifyIcon,
  brandColors,
} from '@/components/icons/BrandIcons';
import { Puzzle, Globe } from 'lucide-react';

type OrganizationMembership = {
  role: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    plan: string;
  };
};

type Integration = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  active: boolean;
};

type IntegrationConfig = {
  id: string;
  integrationId: string;
  enabled: boolean;
  config: any;
  integration: Integration;
};

type Bot = {
  id: string;
  name: string;
};

const displayOrder = [
  'widget',
  'whatsapp',
  'telegram',
  'google-calendar',
  'hubspot',
  'stripe',
  'slack',
  'woocommerce',
  'shopify',
  'wordpress',
] as const;

function iconForSlug(slug: string) {
  switch (slug) {
    case 'whatsapp':
      return <WhatsAppIcon className="w-6 h-6" />;
    case 'telegram':
      return <TelegramIcon className="w-6 h-6" />;
    case 'slack':
      return <SlackIcon className="w-6 h-6" />;
    case 'stripe':
      return <StripeIcon className="w-6 h-6" />;
    case 'hubspot':
      return <HubSpotIcon className="w-6 h-6" />;
    case 'google-calendar':
      return <GoogleCalendarIcon className="w-6 h-6" />;
    case 'woocommerce':
      return <WooCommerceIcon className="w-6 h-6" />;
    case 'shopify':
      return <ShopifyIcon className="w-6 h-6" />;
    case 'wordpress':
      return <Globe className="w-6 h-6" />;
    case 'widget':
    default:
      return <Puzzle className="w-6 h-6" />;
  }
}

function colorForSlug(slug: string) {
  switch (slug) {
    case 'whatsapp':
      return brandColors.whatsapp;
    case 'telegram':
      return brandColors.telegram;
    case 'slack':
      return brandColors.slack;
    case 'stripe':
      return brandColors.stripe;
    case 'hubspot':
      return brandColors.hubspot;
    case 'woocommerce':
      return brandColors.woocommerce;
    case 'shopify':
      return brandColors.shopify;
    case 'google-calendar':
      return brandColors.google;
    default:
      return brandColors.google;
  }
}

export default function IntegrationsPage() {
  const router = useRouter();
  const [activeWizard, setActiveWizard] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<OrganizationMembership['organization'] | null>(null);
  const [integrationsDb, setIntegrationsDb] = useState<Integration[]>([]);
  const [configured, setConfigured] = useState<IntegrationConfig[]>([]);
  const [botId, setBotId] = useState<string>('');

  const integrationsBySlug = useMemo(() => {
    const map = new Map<string, Integration>();
    for (const i of integrationsDb) map.set(i.slug, i);
    return map;
  }, [integrationsDb]);

  const configuredBySlug = useMemo(() => {
    const map = new Map<string, IntegrationConfig>();
    for (const c of configured) map.set(c.integration.slug, c);
    return map;
  }, [configured]);

  const uiIntegrations = useMemo(() => {
    const list = integrationsDb.filter((i) => i.active);
    const bySlug = new Map(list.map((i) => [i.slug, i] as const));
    const ordered = displayOrder
      .map((slug) => bySlug.get(slug))
      .filter(Boolean) as Integration[];

    const rest = list
      .filter((i) => !displayOrder.includes(i.slug as any))
      .sort((a, b) => a.name.localeCompare(b.name));

    return [...ordered, ...rest].map((integration) => {
      const cfg = configuredBySlug.get(integration.slug);
      const status = cfg ? 'Connected' : 'Disconnected';
      return {
        slug: integration.slug,
        name: integration.name,
        description: integration.description || '',
        icon: iconForSlug(integration.slug),
        color: colorForSlug(integration.slug),
        isMultiColor: integration.slug === 'google-calendar',
        status,
      };
    });
  }, [integrationsDb, configuredBySlug]);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setInitError(null);
        const bootstrapRes = await authFetch('/api/v1/integrations/bootstrap');
        if (bootstrapRes.ok) {
          const bootstrap = (await bootstrapRes.json()) as {
            organization: OrganizationMembership['organization'];
            integrations: Integration[];
            configured: IntegrationConfig[];
            bots: Bot[];
          };

          setOrganization(bootstrap.organization);
          setIntegrationsDb(bootstrap.integrations);
          setConfigured(bootstrap.configured);
          setBotId(bootstrap.bots?.[0]?.id || '');
          return;
        }

        const orgRes = await authFetch('/api/v1/organizations');
        if (!orgRes.ok) throw new Error('Failed to load organizations');
        const memberships = (await orgRes.json()) as OrganizationMembership[];
        const primaryOrg = memberships[0]?.organization;
        if (!primaryOrg) throw new Error('No organization found for this user');
        setOrganization(primaryOrg);

        const [integrationsRes, botsRes, cfgRes] = await Promise.all([
          authFetch('/api/v1/integrations'),
          authFetch(`/api/v1/bots?organizationId=${encodeURIComponent(primaryOrg.id)}`),
          authFetch(`/api/v1/integrations/configured?organizationId=${encodeURIComponent(primaryOrg.id)}`),
        ]);

        if (integrationsRes.ok) {
          setIntegrationsDb((await integrationsRes.json()) as Integration[]);
        }
        if (botsRes.ok) {
          const bots = (await botsRes.json()) as Bot[];
          setBotId(bots[0]?.id || '');
        }
        if (cfgRes.ok) {
          setConfigured((await cfgRes.json()) as IntegrationConfig[]);
        }
      } catch (error) {
        console.error('Failed to init integrations page:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to load integrations');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshConfigured = async () => {
    if (!organization) return;
    const cfgRes = await authFetch(
      `/api/v1/integrations/configured?organizationId=${encodeURIComponent(organization.id)}`
    );
    if (cfgRes.ok) {
      setConfigured((await cfgRes.json()) as IntegrationConfig[]);
    }
  };

  const handleSave = async (slug: string, config: any) => {
    if (!organization) return;
    const integration = integrationsBySlug.get(slug);
    if (!integration) return;

    const res = await authFetch('/api/v1/integrations/configure', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: organization.id,
        integrationId: integration.id,
        config,
      }),
    });

    if (res.ok) {
      await refreshConfigured();
      setActiveWizard(null);
    }
  };

  const handleDisconnect = async (slug: string) => {
    if (!organization) return;
    const cfg = configuredBySlug.get(slug);
    if (!cfg) return;
    if (!confirm('Sei sicuro di voler disconnettere questo account?')) return;

    const res = await authFetch(`/api/v1/integrations/${cfg.id}`, { method: 'DELETE' });
    if (res.ok) {
      await refreshConfigured();
      setActiveWizard(null);
    }
  };

  if (loading && integrationsDb.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-silver-400 mx-auto mb-4"></div>
          <p className="text-silver-600">Loading integrations...</p>
        </div>
      </div>
    );
  }

  if (!loading && integrationsDb.length === 0 && initError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-2">
          <p className="text-charcoal font-semibold">Could not load integrations</p>
          <p className="text-silver-600 text-sm">{initError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {uiIntegrations.map((integration) => (
          <div
            key={integration.slug}
            onClick={() => {
              if (integration.slug === 'google-calendar') {
                router.push('/dashboard/calendar');
                return;
              }setActiveWizard(integration.slug);
            }}
            
            className="glass-effect border border-silver-200/70 rounded-2xl p-6 hover:border-silver-300 hover:shadow-silver transition-all duration-500 cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-6">
              <div
                className="p-3 rounded-xl border border-silver-200/70 transition-all group-hover:scale-110"
                style={{
                  background: integration.isMultiColor
                    ? 'rgba(255,255,255,0.1)'
                    : `linear-gradient(135deg, ${integration.color}25 0%, ${integration.color}10 100%)`,
                }}
              >
                <div style={integration.isMultiColor ? {} : { color: integration.color }}>{integration.icon}</div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                  integration.status === 'Connected'
                    ? 'bg-emerald/10 text-emerald border-emerald/20'
                    : 'bg-silver-50 text-silver-700 border-silver-200/70'
                }`}
              >
                {integration.status}
              </span>
            </div>

            <h3 className="text-lg font-bold mb-1 text-charcoal">{integration.name}</h3>
            <p className="text-xs text-silver-600">{integration.description}</p>
          </div>
        ))}
      </div>

      {activeWizard === 'widget' && (
        <WidgetGuide
          botId={botId || 'YOUR_BOT_ID'}
          onClose={() => setActiveWizard(null)}
          onDisconnect={configuredBySlug.get('widget') ? () => handleDisconnect('widget') : undefined}
        />
      )}

      
      {activeWizard === 'shopify' && (
        <ShopifyGuide
          botId={botId || 'YOUR_BOT_ID'}
          onClose={() => setActiveWizard(null)}
          onDisconnect={configuredBySlug.get('shopify') ? () => handleDisconnect('shopify') : undefined}
        />
      )}

      {activeWizard === 'wordpress' && (
        <WordPressGuide
          botId={botId || 'YOUR_BOT_ID'}
          onClose={() => setActiveWizard(null)}
          onDisconnect={configuredBySlug.get('wordpress') ? () => handleDisconnect('wordpress') : undefined}
        />
      )}

      {activeWizard === 'whatsapp' && (
        <WhatsAppWizard
          botId={botId || 'YOUR_BOT_ID'}
          onClose={() => setActiveWizard(null)}
          initialConfig={configuredBySlug.get('whatsapp')?.config}
          onSave={(config) => void handleSave('whatsapp', config)}
          onDisconnect={configuredBySlug.get('whatsapp') ? () => handleDisconnect('whatsapp') : undefined}
        />
      )}

      {activeWizard === 'telegram' && (
        <TelegramWizard
          botId={botId || 'YOUR_BOT_ID'}
          onClose={() => setActiveWizard(null)}
          initialConfig={configuredBySlug.get('telegram')?.config}
          onSave={(config) => void handleSave('telegram', config)}
          onDisconnect={configuredBySlug.get('telegram') ? () => handleDisconnect('telegram') : undefined}
        />
      )}

      {activeWizard === 'slack' && (
        <SlackWizard
          botId={botId || 'YOUR_BOT_ID'}
          onClose={() => setActiveWizard(null)}
          initialConfig={configuredBySlug.get('slack')?.config}
          onSave={(config) => void handleSave('slack', config)}
          onDisconnect={configuredBySlug.get('slack') ? () => handleDisconnect('slack') : undefined}
        />
      )}

      
      {activeWizard === 'stripe' && (
        <StripeWizard
          botId={botId || 'YOUR_BOT_ID'}
          onClose={() => setActiveWizard(null)}
          initialConfig={configuredBySlug.get('stripe')?.config}
          onSave={(config) => void handleSave('stripe', config)}
          onDisconnect={configuredBySlug.get('stripe') ? () => handleDisconnect('stripe') : undefined}
        />
      )}

      {activeWizard === 'woocommerce' && (
        <WooCommerceWizard
          botId={botId || 'YOUR_BOT_ID'}
          onClose={() => setActiveWizard(null)}
          initialConfig={configuredBySlug.get('woocommerce')?.config}
          onSave={(config) => void handleSave('woocommerce', config)}
          onDisconnect={configuredBySlug.get('woocommerce') ? () => handleDisconnect('woocommerce') : undefined}
        />
      )}

      {activeWizard && !['widget', 'shopify', 'wordpress', 'whatsapp', 'telegram', 'slack', 'hubspot', 'stripe', 'woocommerce'].includes(activeWizard) && (
        <GenericIntegrationWizard
          title={integrationsBySlug.get(activeWizard)?.name || 'Integrazione'}
          description={integrationsBySlug.get(activeWizard)?.description || null}
          onClose={() => setActiveWizard(null)}
          initialConfig={configuredBySlug.get(activeWizard)?.config}
          onSave={(config) => handleSave(activeWizard, config)}
          onDisconnect={configuredBySlug.get(activeWizard) ? () => handleDisconnect(activeWizard) : undefined}
        />
      )}
    </div>
  );
}

