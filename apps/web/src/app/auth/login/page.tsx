'use client';

import { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const timeout = searchParams.get('timeout');
    if (timeout === 'true') {
      setSessionExpired(true);
    }
  }, [searchParams]);

  const validateEmail = (email: string): boolean => {
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiUrl) {
        throw new Error(
          'API configuration is missing. Please contact support or try again later.'
        );
      }

      const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server returned an invalid response. Please try again later.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('user', JSON.stringify(data.user));

      const now = Date.now();
      const isSecure = window.location.protocol === 'https:';
      const cookieOptions = `path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
      document.cookie = `last_activity=${now}; ${cookieOptions}`;
      document.cookie = `auth_session=true; ${cookieOptions}`;

      window.location.href = '/dashboard';
    } catch (err: any) {
      if (err.message?.includes('fetch')) {
        setError('Unable to connect to the server. Please try again later.');
      } else {
        setError(err.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 border-r border-border">
          <div className="w-full p-12 bg-gradient-to-br from-primary/10 via-background to-background flex flex-col justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="Omnical Studio"
                width={48}
                height={48}
                className="w-12 h-12 rounded-xl"
              />
              <span className="text-xl font-semibold text-foreground">Omnical Studio</span>
            </Link>

            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-foreground">Welcome back</h2>
              <p className="text-muted-foreground text-lg">
                Sign in to manage your bots, conversations, and integrations.
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
               {new Date().getFullYear()} Omnical Studio. All rights reserved.
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/logo.svg"
                  alt="Omnical Studio"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-lg"
                />
                <span className="text-lg font-semibold text-foreground">Omnical Studio</span>
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 sm:p-8 shadow-sm">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">Sign in</h1>
                <p className="text-muted-foreground mt-1">Enter your credentials to continue.</p>
              </div>

              {sessionExpired && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 px-4 py-3 rounded-lg text-sm mb-5">
                  Your session has expired after 30 minutes of inactivity. Please sign in again.
                </div>
              )}

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-foreground placeholder:text-muted-foreground transition-all outline-none"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-sm font-medium text-foreground">Password</label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-foreground placeholder:text-muted-foreground transition-all outline-none"
                    placeholder=""
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-input rounded bg-background"
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-muted-foreground">Remember me</label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>

              <p className="text-center text-muted-foreground text-sm mt-6">
                Don't have an account?{' '}
                <Link href="/auth/register" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                  Sign up for free
                </Link>
              </p>

              <Link
                href="/"
                className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors mt-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}