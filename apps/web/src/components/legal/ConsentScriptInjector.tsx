'use client';

import { useEffect, useRef } from 'react';

const STORAGE_KEY = 'cookie_consent_v1';

export type ConsentSettings = {
  v: 1;
  essential: true;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  updatedAt: number;
  expiresAt: number;
};

function parseConsent(raw: string | null): ConsentSettings | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentSettings>;
    if (parsed?.v !== 1) return null;
    if (parsed.essential !== true) return null;

    const updatedAt = Number(parsed.updatedAt);
    const expiresAt = Number(parsed.expiresAt);
    if (!Number.isFinite(updatedAt) || !Number.isFinite(expiresAt)) return null;

    return {
      v: 1,
      essential: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      preferences: Boolean(parsed.preferences),
      updatedAt,
      expiresAt,
    };
  } catch {
    return null;
  }
}

function shouldInject(consent: ConsentSettings | null): consent is ConsentSettings {
  if (!consent) return false;
  if (Date.now() > consent.expiresAt) return false;
  return Boolean(consent.analytics || consent.marketing || consent.preferences);
}

declare global {
  interface Window {
    ChatbotConsentScripts?: {
      init: (consent: ConsentSettings) => void | Promise<void>;
    };
  }
}

export function ConsentScriptInjector() {
  const injectedRef = useRef(false);

  useEffect(() => {
    if (injectedRef.current) return;

    const consent = parseConsent(localStorage.getItem(STORAGE_KEY));
    if (!shouldInject(consent)) return;

    injectedRef.current = true;

    const script = document.createElement('script');
    script.src = '/consent/consent-required.js';
    script.async = true;
    script.onload = () => {
      try {
        window.ChatbotConsentScripts?.init(consent);
      } catch {
        // ignore
      }
    };

    document.head.appendChild(script);
  }, []);

  return null;
}
