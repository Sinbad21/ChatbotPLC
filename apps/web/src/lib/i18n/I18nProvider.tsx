'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Locale,
  Translations,
  getTranslations,
  detectLocale,
  setLocale as saveLocale,
  t as translate,
} from './index';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, fallback?: string) => string;
  translations: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale || 'it');
  const [translations, setTranslations] = useState<Translations>(() =>
    getTranslations(initialLocale || 'it')
  );

  // Detect locale on mount
  useEffect(() => {
    if (!initialLocale) {
      const detected = detectLocale();
      setLocaleState(detected);
      setTranslations(getTranslations(detected));
    }
  }, [initialLocale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    setTranslations(getTranslations(newLocale));
    saveLocale(newLocale);
  };

  const t = (key: string, fallback?: string) => {
    return translate(translations, key, fallback);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, translations }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Language selector component
export function LanguageSelector({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        onClick={() => setLocale('it')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          locale === 'it'
            ? 'bg-emerald text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        🇮🇹 Italiano
      </button>
      <button
        onClick={() => setLocale('en')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          locale === 'en'
            ? 'bg-emerald text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        🇬🇧 English
      </button>
    </div>
  );
}
