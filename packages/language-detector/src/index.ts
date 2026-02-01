/**
 * Language Detection Utility
 * Detects the language of user input using simple heuristics
 */

// Common words per language for detection
const LANGUAGE_PATTERNS: Record<string, string[]> = {
  en: ['the', 'is', 'are', 'you', 'what', 'how', 'can', 'help', 'please', 'thank'],
  it: ['il', 'la', 'sono', 'sei', 'cosa', 'come', 'puoi', 'aiuto', 'per favore', 'grazie'],
  es: ['el', 'la', 'es', 'eres', 'qué', 'cómo', 'puedes', 'ayuda', 'por favor', 'gracias'],
  fr: ['le', 'la', 'est', 'es', 'quoi', 'comment', 'peux', 'aide', 's\'il vous plaît', 'merci'],
  de: ['der', 'die', 'ist', 'bist', 'was', 'wie', 'kannst', 'hilfe', 'bitte', 'danke'],
  pt: ['o', 'a', 'é', 'está', 'o que', 'como', 'pode', 'ajuda', 'por favor', 'obrigado'],
  nl: ['de', 'het', 'is', 'bent', 'wat', 'hoe', 'kan', 'hulp', 'alstublieft', 'bedankt'],
  pl: ['to', 'jest', 'jesteś', 'co', 'jak', 'możesz', 'pomoc', 'proszę', 'dziękuję'],
  ro: ['este', 'ești', 'ce', 'cum', 'poți', 'ajutor', 'te rog', 'mulțumesc'],
  el: ['το', 'είναι', 'είσαι', 'τι', 'πώς', 'μπορείς', 'βοήθεια', 'παρακαλώ', 'ευχαριστώ'],
  cs: ['je', 'jsi', 'co', 'jak', 'můžeš', 'pomoc', 'prosím', 'děkuji'],
  hu: ['a', 'az', 'van', 'vagy', 'mi', 'hogyan', 'tudsz', 'segítség', 'kérem', 'köszönöm'],
  sv: ['är', 'du', 'vad', 'hur', 'kan', 'hjälp', 'tack'],
  da: ['er', 'du', 'hvad', 'hvordan', 'kan', 'hjælp', 'tak'],
  no: ['er', 'du', 'hva', 'hvordan', 'kan', 'hjelp', 'takk'],
  fi: ['on', 'olet', 'mitä', 'miten', 'voit', 'apu', 'kiitos'],
};

/**
 * Detect language from text using keyword matching
 */
export function detectLanguage(text: string): string {
  const normalized = text.toLowerCase();
  const words = normalized.split(/\s+/);

  let maxScore = 0;
  let detectedLang = 'en'; // Default to English

  for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    let score = 0;
    for (const pattern of patterns) {
      if (words.includes(pattern) || normalized.includes(pattern)) {
        score++;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang;
    }
  }

  // If no pattern matched, default to English
  return maxScore > 0 ? detectedLang : 'en';
}

/**
 * Get supported languages list
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(LANGUAGE_PATTERNS);
}

/**
 * Check if a language code is supported
 */
export function isLanguageSupported(langCode: string): boolean {
  return langCode in LANGUAGE_PATTERNS;
}

/**
 * Normalize language code (e.g., 'en-US' -> 'en')
 */
export function normalizeLanguageCode(langCode: string): string {
  return langCode.split('-')[0].toLowerCase();
}
