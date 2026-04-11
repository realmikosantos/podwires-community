'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mic2, ShieldCheck, Mail } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';

function VerifyEmailForm() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, loadUser, logout } = useAuthStore();

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 5) {
      const fullCode = [...next.slice(0, 5), digit].join('');
      if (fullCode.length === 6) submitCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || '';
    setDigits(next);
    setError('');
    const lastIdx = Math.min(pasted.length - 1, 5);
    inputRefs.current[lastIdx]?.focus();
    if (pasted.length === 6) submitCode(pasted);
  };

  const submitCode = async (code: string) => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await api.verifyEmail(code);
      await loadUser();
      router.push('/auth/profile-setup');
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    submitCode(code);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError('');
    setResendSuccess(false);
    try {
      await api.sendVerification();
      setResendCooldown(60);
      setResendSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const email = user?.email || '';

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Check your inbox</h1>
        <p className="mt-2 text-sm text-gray-500">
          We sent a 6-digit verification code to
        </p>

        {/* Email card */}
        {email && (
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 border border-gray-200">
            <Mail className="w-4 h-4 text-gray-500 shrink-0" />
            <span className="text-sm font-semibold text-gray-700">{email}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 6 digit inputs */}
        <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={submitting}
              className={`w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-white text-gray-900 outline-none transition-all
                ${digit
                  ? 'border-brand-500 ring-1 ring-brand-200'
                  : 'border-gray-200 hover:border-gray-300'
                }
                focus:border-brand-500 focus:ring-1 focus:ring-brand-200
                disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        {resendSuccess && (
          <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm text-center">
            New code sent! Check your inbox.
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || digits.join('').length < 6}
          className="w-full py-3 rounded-full bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Verifying...
            </span>
          ) : (
            'Verify email'
          )}
        </button>
      </form>

      {/* Resend + Security badge row */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-gray-500">
          Didn&apos;t get a code?{' '}
          {resendCooldown > 0 ? (
            <span className="text-gray-400">Resend in {resendCooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-brand-600 font-semibold hover:underline disabled:opacity-50"
            >
              {resending ? 'Sending…' : 'Resend code'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="text-xs">Safe and secure</span>
        </div>
      </div>

      {/* Wrong email */}
      <div className="pt-1 text-center">
        <button
          type="button"
          onClick={() => { logout(); router.push('/auth/login'); }}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Wrong email? Sign out
        </button>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="https://podwires.com" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
              <Mic2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-brand-600">podwires</span>
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <VerifyEmailForm />
        </Suspense>
      </div>
    </div>
  );
}
