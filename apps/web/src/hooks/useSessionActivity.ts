import { useEffect, useRef } from 'react';

// Aggiorna il cookie dell'ultima attività ogni minuto di attività
const UPDATE_INTERVAL = 60 * 1000; // 1 minuto
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minuti

/**
 * Hook per tracciare l'attività dell'utente e aggiornare il cookie last_activity
 * Questo previene il timeout della sessione durante l'uso attivo dell'applicazione
 */
export function useSessionActivity() {
  const lastUpdateRef = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateActivity = () => {
      const now = Date.now();

      // Aggiorna solo se è passato almeno un minuto dall'ultimo aggiornamento
      if (now - lastUpdateRef.current >= UPDATE_INTERVAL) {
        lastUpdateRef.current = now;

        // Aggiorna il cookie last_activity
        const isSecure = window.location.protocol === 'https:';
        const cookieOptions = `path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
        document.cookie = `last_activity=${now}; ${cookieOptions}`;
      }
    };

    // Controlla periodicamente se la sessione è scaduta
    const checkSessionTimeout = () => {
      const lastActivityCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('last_activity='));

      if (lastActivityCookie) {
        const lastActivity = parseInt(lastActivityCookie.split('=')[1], 10);
        const now = Date.now();

        if (now - lastActivity > SESSION_TIMEOUT_MS) {
          // Sessione scaduta - redirect al login
          window.location.href = '/auth/login?timeout=true';
        }
      }
    };

    // Eventi che indicano attività dell'utente
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    // Aggiungi listeners per gli eventi
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    // Controlla timeout ogni minuto
    const intervalId = setInterval(checkSessionTimeout, 60 * 1000);

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(intervalId);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
}
