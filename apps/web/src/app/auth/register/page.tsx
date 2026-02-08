'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Check } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  };

  const isDisposableEmail = (email: string): boolean => {
    const disposableDomains = [
      'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'throwaway.email',
      'mailinator.com', 'maildrop.cc', 'temp-mail.org', 'getnada.com',
      'trashmail.com', 'yopmail.com', 'fakeinbox.com'
    ];
    const domain = email.split('@')[1]?.toLowerCase();
    return disposableDomains.some(d => domain?.includes(d));
  };

  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (isDisposableEmail(formData.email)) {
      setError('Please use a valid business or personal email address');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!Object.values(passwordChecks).every(Boolean)) {
      setError('Password does not meet all requirements');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server returned an invalid response. Please try again later.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem('user', JSON.stringify(data.user));

      const now = Date.now();
      const isSecure = window.location.protocol === 'https:';
      const cookieOptions = `path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
      document.cookie = `last_activity=${now}; ${cookieOptions}`;
      document.cookie = `auth_session=true; ${cookieOptions}`;

      window.location.href = '/dashboard';
    } catch (err: any) {
      if (err.message.includes('fetch')) {
        setError('Unable to connect to the server. Please try again later.');
      } else {
        setError(err.message || 'An error occurred during registration');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--background)] flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#5B4BFF] to-[#8B5CF6] p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-2xl">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-xl"></span>
            </div>
            Omnical Studio
          </Link>
        </div>
        
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Start building in minutes
          </h2>
          <p className="text-white/80 text-lg">
            Create your first AI chatbot with no code required. Train on your data and deploy everywhere.
          </p>
          <div className="space-y-3 pt-4">
            {['7-day free trial', 'No credit card required', 'Cancel anytime'].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-white/90">
                <Check className="w-5 h-5 text-white" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="relative z-10 text-white/60 text-sm">
           2025 Omnical Studio. All rights reserved.
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2 text-foreground font-bold text-xl">
              <div className="w-8 h-8 bg-[#5B4BFF] rounded-lg flex items-center justify-center">
                <span className="text-lg"></span>
              </div>
              Omnical Studio
            </Link>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
            <p className="text-muted-foreground mt-2">
              Start building amazing chatbots today
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-[color:var(--background)] border border-[color:color-mix(in_srgb,var(--foreground)_20%,transparent)] rounded-lg focus:ring-2 focus:ring-[#5B4BFF]/50 focus:border-[#5B4BFF] text-[color:var(--foreground)] placeholder:text-[color:color-mix(in_srgb,var(--foreground)_45%,transparent)] transition-all outline-none"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-[color:var(--background)] border border-[color:color-mix(in_srgb,var(--foreground)_20%,transparent)] rounded-lg focus:ring-2 focus:ring-[#5B4BFF]/50 focus:border-[#5B4BFF] text-[color:var(--foreground)] placeholder:text-[color:color-mix(in_srgb,var(--foreground)_45%,transparent)] transition-all outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-[color:var(--background)] border border-[color:color-mix(in_srgb,var(--foreground)_20%,transparent)] rounded-lg focus:ring-2 focus:ring-[#5B4BFF]/50 focus:border-[#5B4BFF] text-[color:var(--foreground)] placeholder:text-[color:color-mix(in_srgb,var(--foreground)_45%,transparent)] transition-all outline-none"
                placeholder=""
              />
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                {[
                  { key: 'length', label: '8+ characters' },
                  { key: 'uppercase', label: 'Uppercase' },
                  { key: 'lowercase', label: 'Lowercase' },
                  { key: 'number', label: 'Number' },
                  { key: 'special', label: 'Special char' },
                ].map(({ key, label }) => (
                  <div key={key} className={`flex items-center gap-1 ${passwordChecks[key as keyof typeof passwordChecks] ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                    <Check className="w-3 h-3" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-[color:var(--background)] border border-[color:color-mix(in_srgb,var(--foreground)_20%,transparent)] rounded-lg focus:ring-2 focus:ring-[#5B4BFF]/50 focus:border-[#5B4BFF] text-[color:var(--foreground)] placeholder:text-[color:color-mix(in_srgb,var(--foreground)_45%,transparent)] transition-all outline-none"
                placeholder=""
              />
            </div>

            <div className="flex items-start gap-2 text-sm">
              <input
                id="terms"
                type="checkbox"
                required
                className="mt-1 h-4 w-4 text-[#5B4BFF] focus:ring-[#5B4BFF] border-input rounded bg-background"
              />
              <label htmlFor="terms" className="text-muted-foreground">
                I agree to the{' '}
                <Link href="/legal/terms" className="text-[#5B4BFF] hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/legal/privacy" className="text-[#5B4BFF] hover:underline">Privacy Policy</Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-[#5B4BFF] hover:bg-[#4B3BEF] text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="text-center text-muted-foreground text-sm">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#5B4BFF] hover:text-[#4B3BEF] font-semibold transition-colors">
              Sign in
            </Link>
          </p>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}