'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuthStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState(searchParams.get('role') || 'producer');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(email, password, displayName, role);
      try { await api.sendVerification(); } catch {}
      router.push('/auth/verify-email');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 1: Role selector ─────────────────────────────────────────────── */
  if (step === 1) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Join Podwires Community</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Select your account type to get started
          </p>
        </div>

        <div className="space-y-3">
          {/* Producer card */}
          <button
            type="button"
            onClick={() => setRole('producer')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
              role === 'producer'
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <span className="text-3xl leading-none">🎙️</span>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">Podcast Producer</div>
              <div className="text-sm text-gray-500 mt-0.5">
                Talent, editors, and production teams
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                role === 'producer'
                  ? 'bg-brand-500 border-brand-500'
                  : 'border-gray-300'
              }`}
            >
              {role === 'producer' && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>

          {/* Brand card */}
          <button
            type="button"
            onClick={() => setRole('client')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
              role === 'client'
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <span className="text-3xl leading-none">📢</span>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">Brand / Business</div>
              <div className="text-sm text-gray-500 mt-0.5">
                Companies looking to sponsor or hire
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                role === 'client'
                  ? 'bg-brand-500 border-brand-500'
                  : 'border-gray-300'
              }`}
            >
              {role === 'client' && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setStep(2)}
          className="w-full py-3 rounded-full bg-brand-600 hover:bg-brand-500 text-white font-semibold text-base transition-colors flex items-center justify-center gap-2"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </button>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-brand-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  /* ── Step 2: Account details ────────────────────────────────────────────── */
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Back + heading */}
      <div className="flex items-center gap-3 mb-1">
        <button
          type="button"
          onClick={() => { setStep(1); setError(''); }}
          className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create your account</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {role === 'producer' ? '🎙️ Podcast Producer' : '📢 Brand / Business'}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-blue-50/40 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-gray-900 placeholder-gray-400 text-sm"
          placeholder="you@example.com"
        />
      </div>

      {/* Full name */}
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1.5">
          Full name
        </label>
        <input
          id="displayName"
          type="text"
          required
          minLength={2}
          maxLength={100}
          autoComplete="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-gray-900 placeholder-gray-400 text-sm"
          placeholder="Your name or brand name"
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-gray-900 placeholder-gray-400 text-sm"
          placeholder="Minimum 8 characters"
        />
      </div>

      {/* Terms checkbox */}
      <label className="flex items-start gap-3 cursor-pointer">
        <button
          type="button"
          role="checkbox"
          aria-checked={agreeTerms}
          onClick={() => setAgreeTerms((v) => !v)}
          className={`w-5 h-5 mt-0.5 flex-shrink-0 rounded border-2 transition-colors flex items-center justify-center ${
            agreeTerms
              ? 'bg-brand-600 border-brand-600'
              : 'border-gray-300 hover:border-gray-400 bg-white'
          }`}
        >
          {agreeTerms && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <span className="text-sm text-gray-600 leading-snug">
          I agree to the{' '}
          <a
            href="https://podwires.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 hover:underline"
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href="https://podwires.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 hover:underline"
          >
            Privacy Policy
          </a>
        </span>
      </label>

      {/* Sign up button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-full bg-brand-600 hover:bg-brand-500 text-white font-semibold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creating account...
          </span>
        ) : (
          'Sign up'
        )}
      </button>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-brand-600 font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="https://podwires.com" className="inline-flex items-center gap-2 justify-center">
            <img src="/podwires-logo.png" alt="Podwires" className="h-10 w-auto" />
            <span className="text-lg font-display font-bold text-brand-600">Community</span>
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
