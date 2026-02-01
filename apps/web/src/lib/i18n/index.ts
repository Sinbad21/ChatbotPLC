/**
 * Simple i18n implementation for static export
 * Supports Italian (default) and English
 */

import itTranslations from '../../../messages/it.json';
import enTranslations from '../../../messages/en.json';

export type Locale = 'it' | 'en';
export type Translations = typeof itTranslations;

const translations: Record<Locale, Translations> = {
  it: itTranslations,
  en: enTranslations,
};

export function getTranslations(locale: Locale = 'it'): Translations {
  return translations[locale] || translations.it;
}

export function detectLocale(): Locale {
  // Try to get locale from URL params first
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlLocale = params.get('locale') || params.get('lang');
    if (urlLocale === 'en' || urlLocale === 'it') {
      return urlLocale;
    }

    // Try localStorage
    const savedLocale = localStorage.getItem('locale');
    if (savedLocale === 'en' || savedLocale === 'it') {
      return savedLocale;
    }

    // Try browser language
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'it') return 'it';
    if (browserLang === 'en') return 'en';
  }

  // Default to Italian
  return 'it';
}

export function setLocale(locale: Locale): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', locale);

    // Update URL if needed
    const url = new URL(window.location.href);
    url.searchParams.set('locale', locale);
    window.history.replaceState(window.history.state, '', url.toString());
  }
}

// Helper to get nested translation
export function t(
  translations: Translations,
  key: string,
  fallback?: string
): string {
  const keys = key.split('.');
  let result: any = translations;

  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      return fallback || key;
    }
  }

  return typeof result === 'string' ? result : (fallback || key);
}
