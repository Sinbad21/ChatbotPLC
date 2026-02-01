'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

type Plan = {
  id: 'base' | 'pro' | 'pro-plus' | 'business' | 'enterprise';
  name: string;
  tagline: string;
  price: number | string;
  desc: string;
  features: string[];
  highlight?: boolean;
  badgeLabel?: string;
  cta: string;
  href: string;
};

const plans: Plan[] = [
  {
    id: 'base',
    name: 'Base',
    tagline: 'Per chi inizia',
    price: 29,
    desc: 'Professionisti e micro-attività che vogliono iniziare con un solo canale.',
    features: [
      '1 bot',
      '1 canale (Web o WhatsApp)',
      'Fino a 1.000 conversazioni/mese',
      'Widget prenotazioni + calendario',
      'Promemoria automatici',
      'Raccolta lead',
      'Upload documenti (base)',
      'Analytics essenziali',
      '1 utente',
      'Supporto email',
    ],
    cta: 'Inizia Prova Gratuita',
    href: '/auth/register',
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Per business in crescita',
    price: 79,
    desc: 'Attività in crescita che vogliono più automazioni e canali.',
    features: [
      'Fino a 3 bot',
      '2-3 canali (Web, WhatsApp, Telegram)',
      'Fino a 3.000 conversazioni/mese (poi add-on Unlimited Conversations)',
      'Google Calendar avanzato',
      'Knowledge base con scraping siti',
      'Analytics avanzate',
      'Fino a 3 utenti',
      'Supporto prioritario email',
    ],
    cta: 'Inizia Prova Gratuita',
    href: '/auth/register',
  },
  {
    id: 'pro-plus',
    name: 'Pro+ (consigliato)',
    tagline: 'Per agenzie e multi-cliente',
    price: 129,
    desc: 'Agenzie e studi che gestiscono più clienti/brand.',
    features: [
      'Tutto Pro',
      'Fino a 10 bot',
      'Multicanale completo (Web, WhatsApp, Telegram, Slack)',
      'Fino a 10.000 conversazioni/mese (poi add-on Unlimited Conversations)',
      'BYOK (API key OpenAI del cliente)',
      'Review Bot incluso (Stripe, WooCommerce, Shopify)',
      'Scraping / docs esteso',
      'Onboarding prioritario 1:1',
      'Fino a 5 utenti',
    ],
    highlight: true,
    badgeLabel: 'Più scelto',
    cta: 'Inizia Prova Gratuita',
    href: '/auth/register',
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'Per aziende strutturate',
    price: 299,
    desc: 'Aziende strutturate e catene con volumi alti.',
    features: [
      'Tutto Pro+',
      '20+ bot',
      'Fino a 30.000 conversazioni/mese (estendibile)',
      'Ruoli e permessi avanzati',
      'Audit log',
      'Più workspace / siti',
      'Supporto via email + call periodiche',
      'Opzioni di reportistica custom',
    ],
    cta: 'Contatta Vendite',
    href: '/contact',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Per corporate e governance',
    price: 'Su misura',
    desc: 'Gruppi e corporate con esigenze specifiche.',
    features: [
      'Tutto Business',
      'SSO/SAML',
      'Limiti personalizzati',
      'SLA e sicurezza avanzata',
      'Integrazioni custom (CRM, data warehouse)',
      'Success manager dedicato',
    ],
    cta: 'Contatta Vendite',
    href: '/contact',
  },
];

export const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="py-32 bg-platinum-950 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-platinum-400/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-4">Investi nel Futuro</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-platinum-400 to-transparent mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-8 rounded-2xl border transition-all duration-500 group hover:-translate-y-2 ${
                plan.highlight
                  ? 'bg-gradient-to-b from-platinum-800/40 to-platinum-900/40 border-platinum-400/50 shadow-[0_0_50px_rgba(156,163,175,0.1)]'
                  : 'bg-platinum-900/20 border-platinum-800 hover:border-platinum-600'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-platinum-100 text-black px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-1 shadow-lg">
                  <Sparkles size={12} /> {plan.badgeLabel ?? 'Miglior rapporto qualità/prezzo'}
                </div>
              )}

              {plan.highlight && (
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                </div>
              )}

              <h3 className={`text-xl font-serif mb-2 ${plan.highlight ? 'text-white' : 'text-platinum-300'}`}>{plan.name}</h3>
              <div className="text-xs uppercase tracking-widest text-platinum-400 mb-3">{plan.tagline}</div>
              <p className="text-platinum-500 text-sm mb-6 h-10">{plan.desc}</p>

              <div className="flex items-baseline gap-1 mb-8">
                {typeof plan.price === 'number' ? (
                  <>
                    <span className="text-4xl font-bold text-white">€{plan.price}</span>
                    <span className="text-platinum-500">/mese</span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
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
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out" />
                <span className="relative z-10">{plan.cta}</span>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 max-w-6xl mx-auto">
          <h3 className="font-serif text-2xl text-white mb-6">Confronto rapido</h3>
          <div className="overflow-x-auto rounded-2xl border border-platinum-800 bg-platinum-900/20">
            <table className="min-w-[900px] w-full text-left">
              <thead className="bg-platinum-900/40">
                <tr>
                  <th className="py-4 px-5 text-sm font-semibold text-platinum-300">Caratteristica</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="py-4 px-5 text-sm font-semibold text-white">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-platinum-800">
                {[
                  { label: 'Numero bot', values: ['1', 'Fino a 3', 'Fino a 10', '20+', 'Su misura'] },
                  { label: 'Canali', values: ['1', '2-3', '4+', '4+', 'Su misura'] },
                  { label: 'Conversazioni/mese', values: ['1.000', '3.000', '10.000', '30.000+', 'Su misura'] },
                  { label: 'Utenti', values: ['1', 'Fino a 3', 'Fino a 5', 'Team', 'Team'] },
                  { label: 'Workspace', values: ['1', '1', '1', 'Multi', 'Multi'] },
                  { label: 'Supporto', values: ['Email', 'Email prioritario', 'Onboarding 1:1', 'Email + call', 'Success manager'] },
                  { label: 'Branding', values: ['Con watermark', 'Con watermark', 'White label (add-on)', 'White label (add-on)', 'White label'] },
                ].map((row) => (
                  <tr key={row.label} className="hover:bg-platinum-900/30">
                    <td className="py-4 px-5 text-sm text-platinum-300">{row.label}</td>
                    {row.values.map((value, i) => (
                      <td key={i} className="py-4 px-5 text-sm text-platinum-200">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-14 max-w-6xl mx-auto">
          <h3 className="font-serif text-2xl text-white mb-4">Esempi di configurazione</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Pro + Unlimited Conversations', value: '€118/mese' },
              { label: 'Pro+ + White Label', value: '€198/mese' },
              { label: 'Business + SSO/SAML', value: '€428/mese' },
            ].map((example) => (
              <div key={example.label} className="rounded-2xl border border-platinum-800 bg-platinum-900/20 p-6">
                <div className="text-sm text-platinum-300">{example.label}</div>
                <div className="mt-2 text-2xl font-bold text-white">{example.value}</div>
                <div className="mt-2 text-xs text-platinum-500">Totale indicativo (prezzi add-on inclusi).</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
