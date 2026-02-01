'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, Lock, CheckCircle, Check } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('API configuration is missing');
      }

      const response = await fetch(`${apiUrl}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Password reset successful</h1>
            <p className="text-muted-foreground mt-2">
              Your password has been updated. Redirecting to login...
            </p>
          </div>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-[#5B4BFF] hover:text-[#4B3BEF] font-medium transition-colors"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Invalid or missing token</h1>
            <p className="text-muted-foreground mt-2">
              This password reset link is invalid or has expired.
            </p>
          </div>
          <Link
            href="/auth/forgot-password"
            className="inline-flex items-center gap-2 text-[#5B4BFF] hover:text-[#4B3BEF] font-medium transition-colors"
          >
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-foreground font-bold text-xl mb-8">
            <div className="w-8 h-8 bg-[#5B4BFF] rounded-lg flex items-center justify-center">
              <span className="text-lg"></span>
            </div>
            Omnical Studio
          </Link>
          <div className="w-16 h-16 bg-[#5B4BFF]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-[#5B4BFF]" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Set new password</h1>
          <p className="text-muted-foreground mt-2">
            Your new password must be different from previous passwords.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              New Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-[#5B4BFF]/50 focus:border-[#5B4BFF] text-foreground placeholder:text-muted-foreground transition-all outline-none"
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
              className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-[#5B4BFF]/50 focus:border-[#5B4BFF] text-foreground placeholder:text-muted-foreground transition-all outline-none"
              placeholder=""
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-[#5B4BFF] hover:bg-[#4B3BEF] text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Resetting...
              </>
            ) : (
              'Reset password'
            )}
          </button>
        </form>

        <Link
          href="/auth/login"
          className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#5B4BFF]" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}