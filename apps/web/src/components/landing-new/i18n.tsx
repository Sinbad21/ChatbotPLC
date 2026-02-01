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
      about: 'Chi Siamo',
      services: 'Servizi',
      pricing: 'Prezzi',
      login: 'Accedi',
      language: 'Lingua',
    },
    pricing: {
      title: 'Investi nel Futuro',
      detailsCta: 'Dettagli completi e add-on',
      billingMonthly: 'Mensile',
      billingYearly: 'Annuale',
      billedAnnually: 'fatturato annualmente',
      activityLabel: 'Tipo di attività',
      goalLabel: 'Obiettivo principale',
      highlightPrefix: 'Evidenziamo le funzionalità più rilevanti per:',
      segments: {
        local: 'Attività locale',
        agency: 'Agenzia',
        saas: 'SaaS',
      },
      goals: {
        bookings: 'Prenotazioni',
        leads: 'Lead',
        support: 'Supporto',
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
        base: { name: 'Base', desc: "Per iniziare velocemente con tutto l'essenziale", cta: 'Inizia prova gratuita' },
        pro: { name: 'Pro', desc: 'Per team in crescita e volumi maggiori', cta: 'Inizia prova gratuita' },
        proPlus: { name: 'Pro+', desc: 'Il miglior rapporto valore/prezzo', cta: 'Scegli Pro+' },
        business: { name: 'Business', desc: 'Per scalare con controllo e governance', cta: 'Contatta vendite' },
        enterprise: {
          name: 'Enterprise',
          desc: 'Prezzi e funzionalità personalizzate con SLA',
          cta: 'Contatta vendite',
          customPrice: 'Su misura',
        },
        bestValue: 'Best Value',
        perMonth: '/mese',
      },
    },
  },
  en: {
    nav: {
      home: 'Home',
      about: 'About',
      services: 'Services',
      pricing: 'Pricing',
      login: 'Login',
      language: 'Language',
    },
    pricing: {
      title: 'Invest in the Future',
      detailsCta: 'Full pricing details & add-ons',
      billingMonthly: 'Monthly',
      billingYearly: 'Yearly',
      billedAnnually: 'billed annually',
      activityLabel: 'Business type',
      goalLabel: 'Main goal',
      highlightPrefix: "We highlight the most relevant features for:",
      segments: {
        local: 'Local business',
        agency: 'Agency',
        saas: 'SaaS',
      },
      goals: {
        bookings: 'Bookings',
        leads: 'Leads',
        support: 'Support',
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
        base: { name: 'Base', desc: 'Everything you need to get started', cta: 'Start free trial' },
        pro: { name: 'Pro', desc: 'For growing teams and higher volume', cta: 'Start free trial' },
        proPlus: { name: 'Pro+', desc: 'Best value for money', cta: 'Choose Pro+' },
        business: { name: 'Business', desc: 'Scale with control and governance', cta: 'Contact sales' },
        enterprise: {
          name: 'Enterprise',
          desc: 'Custom pricing and features with SLA',
          cta: 'Contact sales',
          customPrice: 'Custom',
        },
        bestValue: 'Best Value',
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
