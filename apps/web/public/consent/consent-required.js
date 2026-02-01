/*
  consent-required.js
  
  This file is intentionally served as a static asset (not bundled with Next.js),
  so it can be injected only after the user gives consent.

  Implement/extend integrations inside the functions below.
*/

(function () {
  'use strict';

  function loadScript(src, attrs) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      if (attrs) {
        Object.keys(attrs).forEach(function (k) {
          s.setAttribute(k, String(attrs[k]));
        });
      }
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Failed to load ' + src)); };
      document.head.appendChild(s);
    });
  }

  // Example placeholders (no-op by default).
  async function loadAnalytics(/* consent */) {
    // Add analytics integrations here (e.g., your analytics vendor script).
    // return loadScript('https://example.com/analytics.js');
  }

  async function loadMarketing(/* consent */) {
    // Add marketing integrations here (e.g., pixels).
    // return loadScript('https://example.com/pixel.js');
  }

  async function loadPreferences(/* consent */) {
    // Optional: preference scripts (e.g., support chat widgets, A/B tests).
  }

  async function init(consent) {
    try {
      if (!consent || consent.v !== 1) return;
      if (consent.analytics) await loadAnalytics(consent);
      if (consent.marketing) await loadMarketing(consent);
      if (consent.preferences) await loadPreferences(consent);
    } catch (e) {
      // Fail closed: do not break the site if a third-party fails.
      // eslint-disable-next-line no-console
      console.warn('[consent-required] init failed', e);
    }
  }

  // Expose a stable API for the injector.
  window.ChatbotConsentScripts = {
    init: init,
    _loadScript: loadScript,
  };
})();
