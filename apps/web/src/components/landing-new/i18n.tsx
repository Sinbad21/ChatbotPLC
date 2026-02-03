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
        small: 'PMI (< 50 dipendenti)',
        medium: 'Media impresa (50-250)',
        large: 'Grande impresa (250+)',
      },
      goals: {
        support: 'Supporto clienti',
        internal: 'Assistenza interna',
        onboarding: 'Formazione nuovi assunti',
      },
      focus: {
        small: {
          support: ['Riduzione ticket -50%', 'Risposta immediata 24/7', 'Zero formazione utente'],
          internal: ['Tecnici autonomi', 'Meno interruzioni', 'Documentazione sempre accessibile'],
          onboarding: ['Onboarding in autonomia', 'Meno affiancamento', 'Procedure sempre aggiornate'],
        },
        medium: {
          support: ['Riduzione ticket -60%', 'Multilingua', 'Integrazione CRM'],
          internal: ['Multi-reparto', 'Analytics utilizzo', 'Knowledge base centralizzata'],
          onboarding: ['Percorsi formativi', 'Verifica comprensione', 'Report completamento'],
        },
        large: {
          support: ['Riduzione ticket -70%', 'SLA garantito', 'Escalation automatica'],
          internal: ['Multi-sito', 'SSO aziendale', 'Audit compliance'],
          onboarding: ['Integrazione HR', 'Certificazioni', 'Dashboard manager'],
        },
      },
      plans: {
        base: { name: 'Starter', desc: 'Per team tecnici fino a 500 documenti', cta: 'Richiedi Demo' },
        pro: { name: 'Professional', desc: 'Per aziende con documentazione estesa', cta: 'Richiedi Demo' },
        proPlus: { name: 'Business', desc: 'ROI garantito: -70% ticket in 90 giorni', cta: 'Richiedi Demo' },
        business: { name: 'Enterprise', desc: 'Per gruppi industriali e multi-sito', cta: 'Contatta Vendite' },
        enterprise: {
          name: 'Enterprise',
          desc: 'Per gruppi industriali e multi-sito',
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
        small: 'SMB (< 50 employees)',
        medium: 'Mid-market (50-250)',
        large: 'Enterprise (250+)',
      },
      goals: {
        support: 'Customer support',
        internal: 'Internal assistance',
        onboarding: 'New hire training',
      },
      focus: {
        small: {
          support: ['-50% support tickets', '24/7 instant response', 'Zero user training'],
          internal: ['Self-service technicians', 'Fewer interruptions', 'Always accessible docs'],
          onboarding: ['Self-paced onboarding', 'Less shadowing needed', 'Always updated procedures'],
        },
        medium: {
          support: ['-60% support tickets', 'Multi-language', 'CRM integration'],
          internal: ['Multi-department', 'Usage analytics', 'Centralized knowledge base'],
          onboarding: ['Training paths', 'Comprehension checks', 'Completion reports'],
        },
        large: {
          support: ['-70% support tickets', 'Guaranteed SLA', 'Auto-escalation'],
          internal: ['Multi-site', 'Enterprise SSO', 'Compliance audit'],
          onboarding: ['HR integration', 'Certifications', 'Manager dashboard'],
        },
      },
      plans: {
        base: { name: 'Starter', desc: 'For technical teams up to 500 documents', cta: 'Request Demo' },
        pro: { name: 'Professional', desc: 'For companies with extensive documentation', cta: 'Request Demo' },
        proPlus: { name: 'Business', desc: 'Guaranteed ROI: -70% tickets in 90 days', cta: 'Request Demo' },
        business: { name: 'Enterprise', desc: 'For industrial groups and multi-site', cta: 'Contact Sales' },
        enterprise: {
          name: 'Enterprise',
          desc: 'For industrial groups and multi-site',
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
