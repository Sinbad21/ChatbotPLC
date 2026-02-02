'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type LandingNewLang = 'it' | 'en';

type Dict = {
  nav: {
    home: string;
    about: string;
    services: string;
    pricing: string;
    login: string;
    language: string;
  };
  pricing: {
    title: string;
    detailsCta: string;
    billingMonthly: string;
    billingYearly: string;
    billedAnnually: string;
    activityLabel: string;
    goalLabel: string;
    highlightPrefix: string;
    segments: Record<'local' | 'agency' | 'saas', string>;
    goals: Record<'bookings' | 'leads' | 'support', string>;
    focus: Record<'local' | 'agency' | 'saas', Record<'bookings' | 'leads' | 'support', string[]>>;
    plans: {
      base: { name: string; desc: string; cta: string };
      pro: { name: string; desc: string; cta: string };
      proPlus: { name: string; desc: string; cta: string };
      business: { name: string; desc: string; cta: string };
      enterprise: { name: string; desc: string; cta: string; customPrice: string };
      bestValue: string;
      perMonth: string;
    };
  };
};

const DICT: Record<LandingNewLang, Dict> = {
  it: {
    nav: {
      home: 'Home',
      about: 'Il Problema',
      services: 'Benefici',
      pricing: 'Prezzi',
      login: 'Accedi',
      language: 'Lingua',
    },
    pricing: {
      title: 'Scegli il Piano',
      detailsCta: 'Dettagli completi',
      billingMonthly: 'Mensile',
      billingYearly: 'Annuale',
      billedAnnually: 'fatturato annualmente',
      activityLabel: 'Tipo di attività',
      goalLabel: 'Obiettivo principale',
      highlightPrefix: 'Funzionalità rilevanti per:',
      segments: {
        local: 'Attività locale',
        agency: 'Agenzia',
        saas: 'SaaS',
      },
      goals: {
        bookings: 'Prenotazioni',
        leads: 'Lead',
        support: 'Supporto Tecnico',
      },
      focus: {
        local: {
          bookings: ['Widget prenotazioni & calendario', 'Promemoria automatici', 'Raccolta contatti immediata'],
          leads: ['Form lead + follow-up', 'Qualifica richieste in automatico', 'CRM-ready'],
          support: ['FAQ & policy sempre aggiornate', 'Riduci chiamate/email', 'Escalation assistita'],
        },
        agency: {
          bookings: ['Multi-cliente (starter)', 'Template per verticali', 'Setup veloce'],
          leads: ['Lead routing', 'Report per cliente', 'Automazioni campaign'],
          support: ['Playbook support', 'Dashboard & export', 'SLA (piani alti)'],
        },
        saas: {
          bookings: ['Onboarding & demo assistite', 'Riduci drop-off', 'Analisi funnel'],
          leads: ['Lead scoring', 'Integrazioni (piani alti)', 'Attribution-ready'],
          support: ['Deflection ticket', 'RAG su docs', 'BYOK (da Pro+)'],
        },
      },
      plans: {
        base: { name: 'Base', desc: 'Per iniziare con la documentazione essenziale', cta: 'Richiedi Demo' },
        pro: { name: 'Pro', desc: 'Per team tecnici e volumi maggiori', cta: 'Richiedi Demo' },
        proPlus: { name: 'Pro+', desc: 'Il miglior rapporto valore/prezzo', cta: 'Richiedi Demo' },
        business: { name: 'Business', desc: 'Per scalare con controllo e governance', cta: 'Contatta Vendite' },
        enterprise: {
          name: 'Enterprise',
          desc: 'Prezzi e funzionalità personalizzate con SLA',
          cta: 'Contatta Vendite',
          customPrice: 'Su misura',
        },
        bestValue: 'Consigliato',
        perMonth: '/mese',
      },
    },
  },
  en: {
    nav: {
      home: 'Home',
      about: 'The Problem',
      services: 'Benefits',
      pricing: 'Pricing',
      login: 'Login',
      language: 'Language',
    },
    pricing: {
      title: 'Choose Your Plan',
      detailsCta: 'Full pricing details',
      billingMonthly: 'Monthly',
      billingYearly: 'Yearly',
      billedAnnually: 'billed annually',
      activityLabel: 'Business type',
      goalLabel: 'Main goal',
      highlightPrefix: "Relevant features for:",
      segments: {
        local: 'Local business',
        agency: 'Agency',
        saas: 'SaaS',
      },
      goals: {
        bookings: 'Bookings',
        leads: 'Leads',
        support: 'Technical Support',
      },
      focus: {
        local: {
          bookings: ['Booking widget & calendar', 'Automated reminders', 'Instant contact capture'],
          leads: ['Lead forms + follow-up', 'Automatic request qualification', 'CRM-ready'],
          support: ['Always up-to-date FAQs & policies', 'Reduce calls/emails', 'Assisted escalation'],
        },
        agency: {
          bookings: ['Multi-client (starter)', 'Vertical templates', 'Fast setup'],
          leads: ['Lead routing', 'Client reporting', 'Campaign automations'],
          support: ['Support playbooks', 'Dashboard & export', 'SLAs (higher plans)'],
        },
        saas: {
          bookings: ['Assisted onboarding & demos', 'Reduce drop-off', 'Funnel analytics'],
          leads: ['Lead scoring', 'Integrations (higher plans)', 'Attribution-ready'],
          support: ['Ticket deflection', 'RAG on docs', 'BYOK (from Pro+)'],
        },
      },
      plans: {
        base: { name: 'Base', desc: 'Start with essential documentation', cta: 'Request Demo' },
        pro: { name: 'Pro', desc: 'For technical teams and higher volume', cta: 'Request Demo' },
        proPlus: { name: 'Pro+', desc: 'Best value for money', cta: 'Request Demo' },
        business: { name: 'Business', desc: 'Scale with control and governance', cta: 'Contact Sales' },
        enterprise: {
          name: 'Enterprise',
          desc: 'Custom pricing and features with SLA',
          cta: 'Contact Sales',
          customPrice: 'Custom',
        },
        bestValue: 'Recommended',
        perMonth: '/mo',
      },
    },
  },
};

type Ctx = {
  lang: LandingNewLang;
  setLang: (lang: LandingNewLang) => void;
  t: <T extends keyof Dict>(key: T) => Dict[T];
};

const LandingNewI18nContext = createContext<Ctx | null>(null);

function isLang(value: string | null | undefined): value is LandingNewLang {
  return value === 'it' || value === 'en';
}

export function LandingNewI18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LandingNewLang>('it');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlLang = new URLSearchParams(window.location.search).get('lang');
    const stored = window.localStorage.getItem('landing_lang');

    const initial = (isLang(urlLang) && urlLang) || (isLang(stored) && stored) || 'it';
    setLangState(initial);
  }, []);

  const setLang = useCallback((next: LandingNewLang) => {
    setLangState(next);

    if (typeof window === 'undefined') return;
    window.localStorage.setItem('landing_lang', next);

    const url = new URL(window.location.href);
    url.searchParams.set('lang', next);
    window.history.replaceState(null, '', url.toString());
  }, []);

  const value = useMemo<Ctx>(() => {
    return {
      lang,
      setLang,
      t: (key) => DICT[lang][key],
    };
  }, [lang, setLang]);

  return <LandingNewI18nContext.Provider value={value}>{children}</LandingNewI18nContext.Provider>;
}

export function useLandingNewI18n() {
  const ctx = useContext(LandingNewI18nContext);
  if (!ctx) throw new Error('useLandingNewI18n must be used within LandingNewI18nProvider');
  return ctx;
}
