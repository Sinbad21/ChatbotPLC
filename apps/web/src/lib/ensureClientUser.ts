export type ClientUser = {
  id: string;
  email: string;
  name?: string;
  role?: string;
  avatar?: string | null;
  createdAt?: string;
};

const safeParseJson = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const setNonHttpOnlySessionCookies = () => {
  const now = Date.now();
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const cookieOptions = `path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${isSecure ? '; Secure' : ''}`;

  document.cookie = `last_activity=${now}; ${cookieOptions}`;
  document.cookie = `auth_session=true; ${cookieOptions}`;
};

export async function ensureClientUser(): Promise<ClientUser | null> {
  if (typeof window === 'undefined') return null;

  const existing = safeParseJson<ClientUser>(localStorage.getItem('user'));
  if (existing?.email) {
    // Keep session cookies fresh for client-side guards.
    setNonHttpOnlySessionCookies();
    return existing;
  }

  const apiUrl = process.env.NEXT_PUBLIC_WORKER_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;

  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/v1/auth/me`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) return null;

    const payload: any = await response.json();
    const user: ClientUser = payload?.user && typeof payload.user === 'object' ? payload.user : payload;

    if (!user?.email) return null;

    localStorage.setItem('user', JSON.stringify(user));
    setNonHttpOnlySessionCookies();
    return user;
  } catch {
    return null;
  }
}