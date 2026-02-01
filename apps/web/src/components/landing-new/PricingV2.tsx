'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { useLandingNewI18n } from './i18n';

type Segment = 'local' | 'agency' | 'saas';
type Goal = 'bookings' | 'leads' | 'support';

type Price = number | string;

type Billing = 'monthly' | 'yearly';

type Plan = {
  id: 'base' | 'pro' | 'pro-plus' | 'business' | 'enterprise';
  name: string;
  price: Price;
  priceYearly?: Price;
  desc: string;
  features: string[];
  highlight?: boolean;
  cta: string;
  href: string;
};

const segments: Array<{ value: Segment }> = [{ value: 'local' }, { value: 'agency' }, { value: 'saas' }];

const goals: Array<{ value: Goal }> = [{ value: 'bookings' }, { value: 'leads' }, { value: 'support' }];

const plans: Plan[] = [
  {
    id: 'base',
    name: 'Base',
    price: 29,
    priceYearly: 23,
    desc: "Per iniziare velocemente con tutto l'essenziale",
    features: ['1 bot', 'Chat + lead core', 'Analisi base', 'Supporto email'],
    cta: 'Inizia prova gratuita',
    href: '/auth/register',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 79,
    priceYearly: 63,
    desc: 'Per team in crescita e volumi maggiori',
    features: ['Fino a 3 bot', 'Analisi avanzate', 'Collaborazione team', 'Supporto prioritario'],
    cta: 'Inizia prova gratuita',
    href: '/auth/register',
  },
  {
    id: 'pro-plus',
    name: 'Pro+',
    price: 129,
    priceYearly: 103,
    desc: 'Il miglior rapporto valore/prezzo',
    features: [
      'BYOK (API key AI del cliente)',
      'Review Bot incluso',
      'Multi-canale starter',
      'Scraping/Docs starter',
      'Onboarding prioritario',
    ],
    highlight: true,
    cta: 'Scegli Pro+',
    href: '/auth/register',
  },
  {
    id: 'business',
    name: 'Business',
    price: 299,
    priceYearly: 239,
    desc: 'Per scalare con controllo e governance',
    features: ['Ruoli e permessi', 'Audit log', 'Limiti più alti', 'Supporto prioritario', 'Controlli avanzati'],
    cta: 'Contatta vendite',
    href: '/contact',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Su misura',
    priceYearly: 'Su misura',
    desc: 'Prezzi e funzionalità personalizzate con SLA',
    features: ['SSO/SAML', 'Limiti personalizzati', 'SLA e review sicurezza', 'Success manager dedicato', 'Integrazioni custom'],
    cta: 'Contatta vendite',
    href: '/contact',
  },
];

export const PricingV2: React.FC = () => {
  const { t } = useLandingNewI18n();
  const pathname = usePathname();
  const showDetailsCta = pathname !== '/pricing';
  const [segment, setSegment] = useState<Segment>('local');
  const [goal, setGoal] = useState<Goal>('bookings');
  const [billing, setBilling] = useState<Billing>('monthly');

  const focus = useMemo(() => t('pricing').focus[segment]?.[goal] ?? [], [segment, goal, t]);

  return (
    <section id="prezzi" className="py-20 md:py-32 bg-platinum-950 relative overflow-hidden">
      <span id="pricing" aria-hidden="true" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-platinum-400/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-4">{t('pricing').title}</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-platinum-400 to-transparent mx-auto" />

          {showDetailsCta && (
            <div className="mt-8 flex justify-center">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-6 py-3 rounded-sm border border-platinum-700 text-platinum-200 uppercase tracking-widest text-xs font-semibold transition-all duration-300 hover:border-platinum-400 hover:text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.18)] hover:bg-platinum-900/30"
              >
                {t('pricing').detailsCta}
              </Link>
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto flex justify-end mb-8">
          <div className="flex items-center gap-3">
            <span
              className={`text-xs uppercase tracking-widest ${billing === 'monthly' ? 'text-white' : 'text-platinum-500'}`}
            >
              {t('pricing').billingMonthly}
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={billing === 'yearly'}
              onClick={() => setBilling((prev) => (prev === 'monthly' ? 'yearly' : 'monthly'))}
              className="relative w-16 h-8 rounded-full border border-platinum-700 bg-platinum-900/60 focus:outline-none"
            >
              <span
                className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-platinum-100 transition-transform duration-300 ${
                  billing === 'yearly' ? 'translate-x-8' : ''
                }`}
              />
            </button>

            <span
              className={`text-xs uppercase tracking-widest ${billing === 'yearly' ? 'text-white' : 'text-platinum-500'}`}
            >
              {t('pricing').billingYearly}
            </span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mb-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-left">
              <label className="block text-xs uppercase tracking-widest text-platinum-400 mb-2">{t('pricing').activityLabel}</label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value as Segment)}
                className="w-full bg-platinum-900/50 border border-platinum-800 text-white px-4 py-3 text-sm focus:outline-none focus:border-platinum-400 transition-colors rounded-sm"
              >
                {segments.map((s) => (
                  <option key={s.value} value={s.value}>
                    {t('pricing').segments[s.value]}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-left">
              <label className="block text-xs uppercase tracking-widest text-platinum-400 mb-2">{t('pricing').goalLabel}</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as Goal)}
                className="w-full bg-platinum-900/50 border border-platinum-800 text-white px-4 py-3 text-sm focus:outline-none focus:border-platinum-400 transition-colors rounded-sm"
              >
                {goals.map((g) => (
                  <option key={g.value} value={g.value}>
                    {t('pricing').goals[g.value]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-platinum-500 mt-4">
            {t('pricing').highlightPrefix} {t('pricing').segments[segment]} · {t('pricing').goals[goal]}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`relative p-8 rounded-2xl border transition-all duration-500 group hover:-translate-y-2 ${
                plan.highlight
                  ? 'bg-gradient-to-b from-platinum-800/40 to-platinum-900/40 border-platinum-400/50 shadow-[0_0_50px_rgba(156,163,175,0.1)]'
                  : 'bg-platinum-900/20 border-platinum-800 hover:border-platinum-600'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-platinum-100 text-black px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-1 shadow-lg">
                  <Sparkles size={12} /> {t('pricing').plans.bestValue}
                </div>
              )}

              {plan.highlight && (
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                </div>
              )}

              <h3 className={`text-xl font-serif mb-2 ${plan.highlight ? 'text-white' : 'text-platinum-300'}`}>
                {plan.id === 'base'
                  ? t('pricing').plans.base.name
                  : plan.id === 'pro'
                    ? t('pricing').plans.pro.name
                    : plan.id === 'pro-plus'
                      ? t('pricing').plans.proPlus.name
                      : plan.id === 'business'
                        ? t('pricing').plans.business.name
                        : t('pricing').plans.enterprise.name}
              </h3>
              <p className="text-platinum-500 text-sm mb-6 min-h-[2.5rem]">
                {plan.id === 'base'
                  ? t('pricing').plans.base.desc
                  : plan.id === 'pro'
                    ? t('pricing').plans.pro.desc
                    : plan.id === 'pro-plus'
                      ? t('pricing').plans.proPlus.desc
                      : plan.id === 'business'
                        ? t('pricing').plans.business.desc
                        : t('pricing').plans.enterprise.desc}
              </p>

              {(() => {
                const rawPrice = billing === 'yearly' ? (plan.priceYearly ?? plan.price) : plan.price;

                if (typeof rawPrice === 'number') {
                  return (
                    <div className="mb-8">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">€{rawPrice}</span>
                        <span className="text-platinum-500">{t('pricing').plans.perMonth}</span>
                      </div>
                      {billing === 'yearly' && <p className="text-xs text-platinum-500 mt-1">{t('pricing').billedAnnually}</p>}
                    </div>
                  );
                }

                return (
                  <div className="mb-8">
                    <span className="text-3xl font-bold text-white">
                      {plan.id === 'enterprise' ? t('pricing').plans.enterprise.customPrice : rawPrice}
                    </span>
                  </div>
                );
              })()}

              <ul className="space-y-4 mb-8">
                {[...focus, ...plan.features]
                  .filter((v, i, arr) => arr.indexOf(v) === i)
                  .map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-platinum-300">
                      <div
                        className={`p-0.5 rounded-full ${
                          plan.highlight ? 'bg-platinum-100 text-black' : 'bg-platinum-800 text-platinum-400'
                        }`}
                      >
                        <Check size={12} />
                      </div>
                      {feature}
                    </li>
                  ))}
              </ul>

              <Link
                href={plan.href}
                className={`block w-full py-3 rounded-sm text-sm font-bold uppercase tracking-widest transition-all duration-300 relative overflow-hidden group/btn active:scale-95 text-center ${
                  plan.highlight
                    ? 'bg-platinum-100 text-black hover:bg-white hover:shadow-[0_0_30px_rgba(255,255,255,0.6)]'
                    : 'border border-platinum-700 text-platinum-300 hover:border-platinum-400 hover:text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-platinum-800/50'
                }`}
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out"></span>
                <span className="relative z-10">
                  {plan.id === 'base'
                    ? t('pricing').plans.base.cta
                    : plan.id === 'pro'
                      ? t('pricing').plans.pro.cta
                      : plan.id === 'pro-plus'
                        ? t('pricing').plans.proPlus.cta
                        : plan.id === 'business'
                          ? t('pricing').plans.business.cta
                          : t('pricing').plans.enterprise.cta}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
