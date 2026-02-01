import { useState, useEffect } from 'react';

// Supported languages
export const LANGUAGES = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  pt: 'Português',
  nl: 'Nederlands',
  pl: 'Polski',
  ro: 'Română',
  el: 'Ελληνικά',
  cs: 'Čeština',
  hu: 'Magyar',
  sv: 'Svenska',
  da: 'Dansk',
  no: 'Norsk',
  fi: 'Suomi',
  sk: 'Slovenčina',
  sl: 'Slovenščina',
  bg: 'Български',
  hr: 'Hrvatski',
  lt: 'Lietuvių',
};

export type Language = keyof typeof LANGUAGES;

const DEFAULT_LANGUAGE: Language = 'en';

// Translation cache
const translationCache: Record<string, any> = {};

/**
 * Load translations for a specific language
 */
async function loadTranslations(lang: Language): Promise<any> {
  if (translationCache[lang]) {
    return translationCache[lang];
  }

  try {
    const translations = await import(`../translations/${lang}.json`);
    translationCache[lang] = translations.default || translations;
    return translationCache[lang];
  } catch (error) {
    console.warn(`Failed to load translations for ${lang}, falling back to ${DEFAULT_LANGUAGE}`);
    if (lang !== DEFAULT_LANGUAGE) {
      return loadTranslations(DEFAULT_LANGUAGE);
    }
    return {};
  }
}

/**
 * Get value from nested object using dot notation
 */
function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return path; // Return key if not found
    }
  }

  return typeof value === 'string' ? value : path;
}

/**
 * Get current language from localStorage or default
 */
export function getCurrentLanguage(): Language {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const stored = localStorage.getItem('language');
  if (stored && stored in LANGUAGES) {
    return stored as Language;
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Set current language
 */
export function setLanguage(lang: Language): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lang);
    window.dispatchEvent(new Event('languagechange'));
  }
}

/**
 * React hook for translations
 */
export function useTranslation() {
  const [currentLang, setCurrentLang] = useState<Language>(DEFAULT_LANGUAGE);
  const [translations, setTranslations] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const lang = getCurrentLanguage();
    setCurrentLang(lang);

    loadTranslations(lang).then((t) => {
      setTranslations(t);
      setLoading(false);
    });

    // Listen for language changes
    const handleLanguageChange = () => {
      const newLang = getCurrentLanguage();
      setCurrentLang(newLang);
      loadTranslations(newLang).then(setTranslations);
    };

    window.addEventListener('languagechange', handleLanguageChange);
    return () => window.removeEventListener('languagechange', handleLanguageChange);
  }, []);

  /**
   * Translate a key
   */
  const t = (key: string, fallback?: string): string => {
    if (!translations) {
      return fallback || key;
    }
    const value = getNestedValue(translations, key);
    return value || fallback || key;
  };

  const changeLanguage = (lang: Language) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
    setCurrentLang(lang);
    // Load translations for the new language
    loadTranslations(lang).then(setTranslations);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('languagechange'));
    }
  };

  return {
    t,
    currentLang,
    setLanguage: changeLanguage,
    loading,
  };
}

/**
 * Server-side or synchronous translation (returns key if not loaded)
 */
export function t(key: string, lang: Language = DEFAULT_LANGUAGE): string {
  const translations = translationCache[lang] || {};
  return getNestedValue(translations, key) || key;
}
