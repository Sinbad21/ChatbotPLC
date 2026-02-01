/**
 * Build authentication headers for API requests.
 * Note: With httpOnly cookies, the Authorization header is no longer needed
 * for browser requests. This function is kept for backward compatibility
 * with external API clients or mobile apps that might still use Bearer tokens.
 */
export function buildAuthHeaders(includeContentType: boolean = true): Record<string, string> {
  const headers: Record<string, string> = {};

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_WORKER_API_URL || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
}

/**
 * Authenticated fetch wrapper that automatically includes credentials
 * for httpOnly cookie-based authentication.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const apiBaseUrl = getApiBaseUrl();
  // If the base URL is missing, a relative '/api/...' request would hit the frontend worker,
  // which looks like Failed to load organizations and breaks auth.
  if (!apiBaseUrl && url.startsWith('/api/')) {
    throw new Error('API base URL is missing (set NEXT_PUBLIC_API_URL or NEXT_PUBLIC_WORKER_API_URL)');
  }
  const fullUrl = url.startsWith('http') ? url : apiBaseUrl ? `${apiBaseUrl}${url}` : url;

  return fetch(fullUrl, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

/**
 * Logout function that clears the httpOnly cookies via API call
 * and clears local storage user data.
 */
export async function logout(): Promise<void> {
  const apiBaseUrl = getApiBaseUrl();

  try {
    if (apiBaseUrl) {
      await fetch(`${apiBaseUrl}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    }
  } catch (error) {
    console.error('Logout API call failed:', error);
  }

  localStorage.removeItem('user');

  // Clear non-httpOnly cookies
  document.cookie = 'last_activity=; path=/; max-age=0';
  document.cookie = 'auth_session=; path=/; max-age=0';

  window.location.href = '/auth/login';
}