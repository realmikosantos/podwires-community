'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { ArrowRight } from 'lucide-react';

const WP_COMMUNITY_LOGIN = 'https://podwires.com/community-login';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="https://podwires.com" className="inline-flex items-center gap-2 justify-center">
            <img src="/podwires-logo.png" alt="Podwires" className="h-10 w-auto" />
            <span className="text-lg font-display font-bold text-white">Community</span>
          </Link>
          <h1 className="mt-5 text-2xl font-bold text-white">Welcome back</h1>
          <p className="mt-1.5 text-sm text-ink-400">Sign in to your community account</p>
        </div>

        {/* Primary SSO button */}
        <a
          href={WP_COMMUNITY_LOGIN}
          className="group flex items-center justify-between w-full px-5 py-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-all shadow-lg shadow-brand-900/50"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
              <img src="/podwires-logo.png" alt="" className="w-5 h-5 object-contain" />
            </div>
            <span>Continue with Podwires</span>
          </div>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </a>

        <p className="mt-3 text-center text-xs text-ink-500">
          Uses your existing podwires.com account &mdash; no separate login needed.
        </p>

        {/* Toggle email/password form */}
        {!showEmailForm ? (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowEmailForm(true)}
              className="text-sm text-ink-500 hover:text-ink-300 transition-colors underline underline-offset-2"
            >
              Sign in with email instead
            </button>
          </div>
        ) : (
          <>
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-ink-700" />
              <span className="text-xs text-ink-500 font-medium">or email</span>
              <div className="flex-1 h-px bg-ink-700" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-ink-300 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-ink-800 border border-ink-600 rounded-lg text-white placeholder-ink-500 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-ink-300 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-ink-800 border border-ink-600 rounded-lg text-white placeholder-ink-500 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </>
        )}

        <p className="mt-8 text-center text-sm text-ink-500">
          Don&apos;t have an account?{' '}
          <a href="https://podwires.com/register" className="text-brand-400 font-medium hover:text-brand-300 transition-colors">
            Join Podwires free
          </a>
        </p>
      </div>
    </div>
  );
}
