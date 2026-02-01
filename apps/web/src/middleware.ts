import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Session timeout: 30 minuti in millisecondi
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect dashboard routes (excluding API calls and static files)
  if (pathname.startsWith('/dashboard')) {
    // Check for auth cookie (set by backend during login)
    // SECURITY NOTE: This is a UX gate only. Real authentication happens via
    // httpOnly cookies verified by the API backend on every request.
    const authCookie = request.cookies.get('auth_session');
    const lastActivityCookie = request.cookies.get('last_activity');

    // If session doesn't exist, redirect to login
    if (!authCookie || authCookie.value !== 'true') {
      const loginUrl = new URL('/auth/login', request.url);
      // Prevent redirect loops
      if (pathname !== '/auth/login') {
        return NextResponse.redirect(loginUrl);
      }
    }

    // Controlla il timeout di inattività (30 minuti)
    if (lastActivityCookie) {
      try {
        const lastActivity = parseInt(lastActivityCookie.value, 10);
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivity;

        // Se sono passati più di 30 minuti, timeout della sessione
        if (timeSinceLastActivity > SESSION_TIMEOUT_MS) {
          const loginUrl = new URL('/auth/login', request.url);
          loginUrl.searchParams.set('timeout', 'true');

          // Crea response con redirect
          const response = NextResponse.redirect(loginUrl);

          // Rimuovi i cookie di sessione
          response.cookies.set('auth_session', '', {
            maxAge: 0,
            path: '/'
          });
          response.cookies.set('last_activity', '', {
            maxAge: 0,
            path: '/'
          });

          return response;
        }
      } catch (error) {
        // Se c'è un errore nel parsing, considera la sessione invalida
        const loginUrl = new URL('/auth/login', request.url);
        const response = NextResponse.redirect(loginUrl);

        response.cookies.set('auth_session', '', {
          maxAge: 0,
          path: '/'
        });
        response.cookies.set('last_activity', '', {
          maxAge: 0,
          path: '/'
        });

        return response;
      }
    }

    // Aggiorna il timestamp dell'ultima attività
    const response = NextResponse.next();
    const now = Date.now();

    // Imposta cookie con l'ultima attività (scade dopo 7 giorni)
    const isSecure = request.nextUrl.protocol === 'https:';
    response.cookies.set('last_activity', now.toString(), {
      maxAge: 60 * 60 * 24 * 7, // 7 giorni
      path: '/',
      sameSite: 'lax',
      secure: isSecure,
    });

    return response;
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
// Exclude _next/static, _next/image, favicon.ico
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
