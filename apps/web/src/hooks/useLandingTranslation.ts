'use client';

import { useState, useEffect, useCallback } from 'react';

// Import all available landing translations
import enTranslations from '@/translations/landing-en.json';
import itTranslations from '@/translations/landing-it.json';
import esTranslations from '@/translations/landing-es.json';
import deTranslations from '@/translations/landing-de.json';
import frTranslations from '@/translations/landing-fr.json';

// Supported languages - automatically derived from imported translations
export type Language = 'en' | 'it' | 'es' | 'de' | 'fr';

// Available languages with display names
export const AVAILABLE_LANGUAGES: Record<Language, { name: string; nativeName: string }> = {
  en: { name: 'English', nativeName: 'English' },
  it: { name: 'Italian', nativeName: 'Italiano' },
  es: { name: 'Spanish', nativeName: 'Español' },
  de: { name: 'German', nativeName: 'Deutsch' },
  fr: { name: 'French', nativeName: 'Français' },
};

const TRANSLATIONS: Record<Language, any> = {
  en: enTranslations,
  it: itTranslations,
  es: esTranslations,
  de: deTranslations,
  fr: frTranslations,
};

let currentLang: Language = 'en';
let listeners: Set<() => void> = new Set();

function loadTranslation(lang: Language) {
  return TRANSLATIONS[lang];
}

function notifyListeners() {
  listeners.forEach(listener => listener());
}

export function useLandingTranslation() {
  const [translations, setTranslations] = useState<any>(() => loadTranslation(currentLang));
  const [loading, setLoading] = useState(false);
  const [lang, setLangState] = useState<Language>(currentLang);

  const loadCurrentTranslation = useCallback(() => {
    const trans = loadTranslation(currentLang);
    setTranslations(trans);
    setLangState(currentLang);
  }, []);

  useEffect(() => {
    const listener = () => {
      loadCurrentTranslation();
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [loadCurrentTranslation]);

  const setLanguage = useCallback((newLang: Language) => {
    if (newLang === currentLang) return;

    currentLang = newLang;

    if (typeof window !== 'undefined') {
      localStorage.setItem('landing_language', newLang);
    }

    notifyListeners();
  }, []);

  const t = useCallback((key: string, fallback?: string): any => {
    if (!translations) return fallback || key;

    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return fallback || key;
      }
    }

    return value;
  }, [translations]);

  return {
    t,
    lang,
    setLanguage,
    loading,
    translations,
  };
}

// Initialize language from localStorage on client
if (typeof window !== 'undefined') {
  const savedLang = localStorage.getItem('landing_language') as Language;
  if (savedLang && savedLang in TRANSLATIONS) {
    currentLang = savedLang;
  }

  // Auto-detect browser language if no saved preference
  if (!savedLang) {
    const browserLocale =
      (Array.isArray(navigator.languages) && navigator.languages[0]) ||
      navigator.language ||
      '';
    const browserLang = browserLocale.split('-')[0] as Language;
    if (browserLang && browserLang in TRANSLATIONS) {
      currentLang = browserLang;
    }
  }

  // Listen for language changes from other tabs/windows
  // This fixes the "language state leaking between tabs" issue by syncing across tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'landing_language' && e.newValue) {
      const newLang = e.newValue as Language;
      if (newLang in TRANSLATIONS && newLang !== currentLang) {
        currentLang = newLang;
        notifyListeners();
      }
    }
  });
}
