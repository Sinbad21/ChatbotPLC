'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

import type { ConsentSettings } from './ConsentScriptInjector';

const STORAGE_KEY = 'cookie_consent_v1';
const LEGACY_COOKIE = 'cookie_consent';
const MAX_AGE_DAYS = 90;
const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

type DraftConsent = Omit<ConsentSettings, 'updatedAt' | 'expiresAt'>;

const DEFAULT_DRAFT: DraftConsent = {
  v: 1,
  essential: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function normalizeLegacyConsent(value: string | null): DraftConsent | null {
  if (!value) return null;

  if (value === 'accepted') {
    return { ...DEFAULT_DRAFT, analytics: true, marketing: true, preferences: true };
  }

  if (value === 'essential') {
    return { ...DEFAULT_DRAFT };
  }

  try {
    const parsed = JSON.parse(value) as Partial<DraftConsent>;
    if (parsed?.v !== 1) return null;
    return {
      v: 1,
      essential: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      preferences: Boolean(parsed.preferences),
    };
  } catch {
    return null;
  }
}

function readStoredConsent(): ConsentSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
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

function toDraft(stored: ConsentSettings | null): DraftConsent {
  if (!stored) return { ...DEFAULT_DRAFT };
  return {
    v: 1,
    essential: true,
    analytics: Boolean(stored.analytics),
    marketing: Boolean(stored.marketing),
    preferences: Boolean(stored.preferences),
  };
}

function isExpired(stored: ConsentSettings | null): boolean {
  if (!stored) return true;
  return Date.now() > stored.expiresAt;
}

function writeConsent(draft: DraftConsent) {
  const now = Date.now();
  const stored: ConsentSettings = {
    ...draft,
    updatedAt: now,
    expiresAt: now + MAX_AGE_MS,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

function reloadPage() {
  window.location.reload();
}

function Toggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={[
        'relative inline-flex h-6 w-11 items-center rounded-full border transition-colors',
        disabled
          ? checked
            ? 'bg-slate-200 border-slate-200 cursor-not-allowed'
            : 'bg-slate-100 border-slate-200 cursor-not-allowed'
          : checked
            ? 'bg-indigo-600 border-indigo-600'
            : 'bg-slate-200 border-slate-300',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-1',
        ].join(' ')}
      />
    </button>
  );
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [draft, setDraft] = useState<DraftConsent>(DEFAULT_DRAFT);

  useEffect(() => {
    const stored = readStoredConsent();
    if (stored && !isExpired(stored)) {
      setDraft(toDraft(stored));
      setVisible(false);
      return;
    }

    const legacy = getCookie(LEGACY_COOKIE);
    const legacyDraft = normalizeLegacyConsent(legacy);
    if (legacyDraft) {
      writeConsent(legacyDraft);
      clearCookie(LEGACY_COOKIE);
      setDraft(legacyDraft);
      setVisible(false);
      return;
    }

    setDraft({ ...DEFAULT_DRAFT });
    setVisible(true);
  }, []);

  const acceptAll = () => {
    writeConsent({ ...DEFAULT_DRAFT, analytics: true, marketing: true, preferences: true });
    setVisible(false);
    setManageOpen(false);
    reloadPage();
  };

  const rejectAll = () => {
    writeConsent({ ...DEFAULT_DRAFT });
    setVisible(false);
    setManageOpen(false);
    reloadPage();
  };

  const openManage = () => {
    const stored = readStoredConsent();
    if (stored && !isExpired(stored)) {
      setDraft(toDraft(stored));
    } else {
      const legacy = getCookie(LEGACY_COOKIE);
      const legacyDraft = normalizeLegacyConsent(legacy);
      setDraft(legacyDraft ?? { ...DEFAULT_DRAFT });
    }
    setManageOpen(true);
  };

  const savePreferences = () => {
    writeConsent(draft);
    setVisible(false);
    setManageOpen(false);
    reloadPage();
  };

  const floatingOffsetClass = visible ? 'bottom-24' : 'bottom-4';

  return (
    <>
      <div className={`fixed left-4 ${floatingOffsetClass} z-[120]`}>
        <Button
          variant="outline"
          onClick={openManage}
          className="rounded-full bg-white text-slate-900 border-slate-200 shadow-lg"
          aria-label="Cookie preferences"
        >
          Cookies
        </Button>
      </div>

      {visible ? (
        <div className="fixed inset-x-0 bottom-0 z-[100] p-4">
          <div className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-4 shadow-lg text-slate-900">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-600">
                <span className="font-medium text-slate-900">Cookie notice.</span>{' '}
                We use essential cookies for authentication and security. Optional cookies are only used with your consent.{" "}
                <Link href="/legal/cookies" className="underline underline-offset-4 hover:text-slate-900">
                  Cookie Policy
                </Link>{' '}
                <Link href="/legal/privacy" className="underline underline-offset-4 hover:text-slate-900">
                  Privacy Policy
                </Link>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <Button variant="outline" onClick={rejectAll}>
                  Reject all
                </Button>
                <Button variant="outline" onClick={openManage}>
                  Manage
                </Button>
                <Button onClick={acceptAll}>Accept all</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {manageOpen ? (
        <div className="fixed inset-0 z-[110]">
          <button
            aria-label="Close cookie preferences"
            className="absolute inset-0 bg-transparent"
            onClick={() => setManageOpen(false)}
          />

          <div className="relative mx-auto mt-24 w-[calc(100%-2rem)] max-w-xl rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-5">
              <div>
                <h2 className="text-lg font-semibold">Cookie preferences</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Choose which optional cookies you want to allow. Essential cookies are always on.
                </p>
              </div>
              <Button variant="ghost" onClick={() => setManageOpen(false)} aria-label="Close" />
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
                <div>
                  <div className="font-medium">Essential</div>
                  <div className="text-sm text-slate-600">
                    Required for authentication, security, and core functionality.
                  </div>
                </div>
                <div className="mt-1">
                  <Toggle checked label="Essential cookies" disabled />
                </div>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
                <div>
                  <div className="font-medium">Preferences</div>
                  <div className="text-sm text-slate-600">Remember choices like language or UI preferences.</div>
                </div>
                <div className="mt-1">
                  <Toggle
                    checked={draft.preferences}
                    label="Preferences cookies"
                    onChange={(checked) => setDraft((prev) => ({ ...prev, preferences: checked }))}
                  />
                </div>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
                <div>
                  <div className="font-medium">Analytics</div>
                  <div className="text-sm text-slate-600">Help us understand usage to improve the product.</div>
                </div>
                <div className="mt-1">
                  <Toggle
                    checked={draft.analytics}
                    label="Analytics cookies"
                    onChange={(checked) => setDraft((prev) => ({ ...prev, analytics: checked }))}
                  />
                </div>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
                <div>
                  <div className="font-medium">Marketing</div>
                  <div className="text-sm text-slate-600">Used for advertising and measuring campaign performance.</div>
                </div>
                <div className="mt-1">
                  <Toggle
                    checked={draft.marketing}
                    label="Marketing cookies"
                    onChange={(checked) => setDraft((prev) => ({ ...prev, marketing: checked }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t p-5 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="outline" onClick={rejectAll}>
                Reject all
              </Button>
              <div className="flex gap-2 sm:justify-end">
                <Button variant="outline" onClick={() => setManageOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={savePreferences}>Save preferences</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
