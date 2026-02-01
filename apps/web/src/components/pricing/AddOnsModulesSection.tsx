'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

type AddOn = {
  id:
    | 'review-bot'
    | 'extra-bot-slot'
    | 'voice-receptionist'
    | 'unlimited-conversations'
    | 'byok'
    | 'sso-saml'
    | 'audit-log'
    | 'custom-reporting'
    | 'extra-workspace'
    | 'remove-watermark';
  name: string;
  description: string;
  priceMonthlyEur: number | null;
  badge?: { label: string; tone: 'blue' | 'purple' };
};

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-7 w-14 items-center rounded-full border transition-colors',
        checked ? 'bg-blue-500 border-blue-400' : 'bg-platinum-900/40 border-platinum-800/80',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-platinum-950',
      ].join(' ')}
    >
      <span
        className={[
          'absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-7' : 'translate-x-0',
        ].join(' ')}
      />
      <span className="sr-only">{checked ? 'On' : 'Off'}</span>
    </button>
  );
}

export function AddOnsModulesSection() {
  const addOns: AddOn[] = useMemo(
    () => [
      {
        id: 'review-bot',
        name: 'Review Bot',
        description: 'Collect and respond to reviews automatically with brand-safe replies.',
        priceMonthlyEur: 29,
        badge: { label: 'Upgrade', tone: 'blue' },
      },
      {
        id: 'extra-bot-slot',
        name: 'Extra Bot Slot',
        description: 'Add another bot to cover a new channel, brand, or workflow.',
        priceMonthlyEur: 19,
      },
      {
        id: 'extra-workspace',
        name: 'Extra Workspace / Sito',
        description: 'Gestisci più brand o property con workspace separati e ruoli dedicati.',
        priceMonthlyEur: 29,
        badge: { label: 'Scaling', tone: 'blue' },
      },
      {
        id: 'voice-receptionist',
        name: 'Voice Receptionist',
        description: 'Turn inbound calls into booked meetings and qualified leads.',
        priceMonthlyEur: 55,
        badge: { label: 'Premium', tone: 'purple' },
      },
      {
        id: 'unlimited-conversations',
        name: 'Unlimited Conversations',
        description: 'Remove conversation caps for high-volume sales and support teams.',
        priceMonthlyEur: 39,
        badge: { label: 'Popular', tone: 'blue' },
      },
      {
        id: 'remove-watermark',
        name: 'White Label (senza watermark)',
        description: 'Rimuove il watermark e abilita una versione “no-brand” del widget/bot.',
        priceMonthlyEur: 69,
        badge: { label: 'Premium', tone: 'purple' },
      },
      {
        id: 'byok',
        name: 'BYOK (Bring Your Own Key)',
        description: 'Usa le API key del cliente (OpenAI/Anthropic/Google) per controllo costi e compliance.',
        priceMonthlyEur: null,
        badge: { label: 'Enterprise', tone: 'purple' },
      },
      {
        id: 'audit-log',
        name: 'Audit Log & Ruoli',
        description: 'Tracciamento eventi, permessi avanzati e governance per team strutturati.',
        priceMonthlyEur: 99,
        badge: { label: 'Enterprise', tone: 'purple' },
      },
      {
        id: 'custom-reporting',
        name: 'Reportistica Custom',
        description: 'Dashboard e report su misura (KPI, export, integrazioni) per stakeholder e clienti.',
        priceMonthlyEur: 99,
        badge: { label: 'Enterprise', tone: 'purple' },
      },
      {
        id: 'sso-saml',
        name: 'SSO / SAML',
        description: 'Single Sign-On per organizzazioni con requisiti di sicurezza e provisioning utenti.',
        priceMonthlyEur: 129,
        badge: { label: 'Security', tone: 'purple' },
      },
    ],
    []
  );

  const [enabled, setEnabled] = useState<Record<AddOn['id'], boolean>>({
    'review-bot': false,
    'extra-bot-slot': false,
    'voice-receptionist': false,
    'unlimited-conversations': false,
    byok: false,
    'sso-saml': false,
    'audit-log': false,
    'custom-reporting': false,
    'extra-workspace': false,
    'remove-watermark': false,
  });

  return (
    <section aria-labelledby="addons-modules" className="mt-16">
      <div className="rounded-2xl overflow-hidden border border-platinum-800/60 bg-platinum-950/20">
        <div className="bg-transparent">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-purple-500" />

          <div className="px-6 py-12 sm:px-10">
            <div className="max-w-2xl">
              <h2 id="addons-modules" className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Add-ons & Modules
              </h2>
              <p className="mt-3 text-white/70">
                Extend your plan with focused modules. Toggle what you need now, keep the rest off.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {addOns.map((addOn) => {
                const isEnabled = enabled[addOn.id];

                return (
                  <Card
                    key={addOn.id}
                    className={[
                      'relative p-6 bg-platinum-900/15 text-white border-platinum-800/60',
                      'transition-transform duration-200 will-change-transform',
                      'hover:-translate-y-0.5 hover:border-blue-500/40 hover:bg-platinum-900/25',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold leading-tight truncate">{addOn.name}</h3>
                          {addOn.badge && (
                            <Badge
                              variant="secondary"
                              className={[
                                'border',
                                addOn.badge.tone === 'purple'
                                  ? 'bg-purple-500/10 text-purple-200 border-purple-500/20'
                                  : 'bg-blue-500/10 text-blue-200 border-blue-500/20',
                              ].join(' ')}
                            >
                              {addOn.badge.label}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-platinum-500">{addOn.description}</p>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <ToggleSwitch
                          checked={isEnabled}
                          onChange={(next) => setEnabled((prev) => ({ ...prev, [addOn.id]: next }))}
                          label={`Toggle ${addOn.name}`}
                        />
                        <div className={['text-xs font-medium', isEnabled ? 'text-blue-300' : 'text-platinum-500'].join(' ')}>
                          {isEnabled ? 'ON' : 'OFF'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-end gap-2">
                      {typeof addOn.priceMonthlyEur === 'number' ? (
                        <>
                          <div className="text-3xl font-bold">€{addOn.priceMonthlyEur}</div>
                          <div className="pb-1 text-sm text-platinum-500">/mese</div>
                        </>
                      ) : (
                        <div className="text-2xl font-bold">Su misura</div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            <p className="mt-8 text-sm text-platinum-500">Nota: richiede il piano Base o superiore.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
