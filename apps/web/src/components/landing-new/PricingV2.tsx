'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileText, Users, Building2, Factory, ArrowRight } from 'lucide-react';

type Plan = {
  id: string;
  name: string;
  idealFor: string;
  documentVolume: string;
  ticketReduction: string;
  paybackTime: string;
  annualSavings: string;
  icon: React.ReactNode;
  features: string[];
  highlight?: boolean;
};

const plans: Plan[] = [
  {
    id: 'team',
    name: 'Team Tecnico',
    idealFor: 'Ufficio tecnico, reparto manutenzione',
    documentVolume: 'Fino a 500 pagine',
    ticketReduction: '-40% interruzioni',
    paybackTime: '4-6 mesi',
    annualSavings: '€8.000+',
    icon: <FileText className="w-6 h-6" />,
    features: [
      'Manuali macchine e impianti',
      'Schede tecniche prodotto',
      'Procedure manutenzione',
      'Widget interno + web',
      'Report utilizzo mensile',
    ],
  },
  {
    id: 'department',
    name: 'Reparto / Business Unit',
    idealFor: 'Supporto clienti, service post-vendita',
    documentVolume: 'Fino a 2.000 pagine',
    ticketReduction: '-60% ticket L1',
    paybackTime: '3-4 mesi',
    annualSavings: '€18.000+',
    icon: <Users className="w-6 h-6" />,
    features: [
      'Tutto Team Tecnico +',
      'Documentazione multilingua',
      'Integrazione canali (web, WhatsApp)',
      'Escalation automatica',
      'Analytics per ticket deflection',
      'Supporto prioritario',
    ],
    highlight: true,
  },
  {
    id: 'company',
    name: 'Azienda',
    idealFor: 'Intera organizzazione, multi-reparto',
    documentVolume: 'Fino a 10.000 pagine',
    ticketReduction: '-70% ticket totali',
    paybackTime: '2-3 mesi',
    annualSavings: '€40.000+',
    icon: <Building2 className="w-6 h-6" />,
    features: [
      'Tutto Reparto +',
      'Knowledge base centralizzata',
      'SSO aziendale',
      'API per ERP/CRM/Ticketing',
      'Onboarding nuovi assunti',
      'SLA 99.5% uptime',
      'Success manager dedicato',
    ],
  },
  {
    id: 'group',
    name: 'Gruppo Industriale',
    idealFor: 'Multi-sito, multi-paese, OEM',
    documentVolume: 'Illimitato',
    ticketReduction: 'Progetto su misura',
    paybackTime: 'ROI documentato',
    annualSavings: 'Calcolato insieme',
    icon: <Factory className="w-6 h-6" />,
    features: [
      'Deploy on-premise disponibile',
      'Integrazioni custom',
      'Multi-tenant / multi-brand',
      'Compliance audit',
      'SLA personalizzato',
      'Formazione team interno',
    ],
  },
];

export const PricingV2: React.FC = () => {
  return (
    <section id="prezzi" className="py-20 md:py-32 bg-platinum-950 relative overflow-hidden">
      <span id="pricing" aria-hidden="true" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-platinum-400/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-4">
            Costo proporzionato al risparmio generato
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-platinum-400 to-transparent mx-auto mb-6" />
          <p className="text-platinum-400 max-w-2xl mx-auto">
            Niente "posti utente" o "crediti messaggi". Il dimensionamento dipende dal volume documentale e dal risparmio atteso.
          </p>
        </div>

        {/* ROI Reference */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-platinum-900/40 border border-platinum-800 rounded-lg p-8">
            <h3 className="text-lg font-bold text-white mb-6 text-center">Come calcoliamo il ROI</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-400 mb-1">€15-30</div>
                <div className="text-platinum-500 text-xs">Costo medio ticket L1</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400 mb-1">45 min</div>
                <div className="text-platinum-500 text-xs">Tempo medio per interruzione</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400 mb-1">70%</div>
                <div className="text-platinum-500 text-xs">Domande risolvibili da documentazione</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400 mb-1">3-6 mesi</div>
                <div className="text-platinum-500 text-xs">Payback tipico</div>
              </div>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`relative p-6 rounded-lg border transition-all duration-500 group hover:-translate-y-2 ${
                plan.highlight
                  ? 'bg-gradient-to-b from-platinum-800/40 to-platinum-900/40 border-platinum-400/50 shadow-[0_0_50px_rgba(156,163,175,0.1)]'
                  : 'bg-platinum-900/20 border-platinum-800 hover:border-platinum-600'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-lg">
                  Più scelto
                </div>
              )}

              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${plan.highlight ? 'bg-platinum-100 text-black' : 'bg-platinum-800 text-platinum-300'}`}>
                  {plan.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-platinum-500 text-xs">{plan.idealFor}</p>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="space-y-3 mb-6 py-4 border-y border-platinum-800">
                <div className="flex justify-between text-sm">
                  <span className="text-platinum-500">Documentazione</span>
                  <span className="text-white font-medium">{plan.documentVolume}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-platinum-500">Riduzione ticket</span>
                  <span className="text-emerald-400 font-medium">{plan.ticketReduction}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-platinum-500">Payback</span>
                  <span className="text-white font-medium">{plan.paybackTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-platinum-500">Risparmio annuo</span>
                  <span className="text-emerald-400 font-bold">{plan.annualSavings}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-6 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-platinum-300">
                    <span className="text-platinum-600 mt-1">•</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/contact"
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-sm text-sm font-bold uppercase tracking-widest transition-all duration-300 ${
                  plan.highlight
                    ? 'bg-platinum-100 text-black hover:bg-white hover:shadow-[0_0_30px_rgba(255,255,255,0.6)]'
                    : 'border border-platinum-700 text-platinum-300 hover:border-platinum-400 hover:text-white'
                }`}
              >
                Richiedi Valutazione
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom Note */}
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-platinum-500 text-sm mb-4">
            Ogni progetto include: analisi documentazione esistente, configurazione iniziale, test con dati reali.
          </p>
          <p className="text-platinum-600 text-xs">
            Prezzi definiti dopo assessment. Nessun vincolo annuale obbligatorio.
          </p>
        </div>
      </div>
    </section>
  );
};
