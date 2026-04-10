'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Mic2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function SsoCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { loadUser } = useAuthStore();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = params.get('code');
    const ssoError = params.get('sso_error');

    if (ssoError) {
      setError('Sign in failed: ' + ssoError.replace(/_/g, ' '));
      return;
    }

    if (!code) {
      router.replace('/auth/login');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/sso-exchange?code=${encodeURIComponent(code)}`);
        if (!res.ok) throw new Error('Exchange failed');

        const { accessToken, refreshToken } = await res.json();
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        await loadUser();
        router.replace('/dashboard');
      } catch {
        setError('Sign in failed. Please try again.');
      }
    })();
  }, [params, router, loadUser]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-900 px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-red-900/30 border border-red-700/50 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <p className="text-red-400 font-medium">{error}</p>
          <a
            href="/auth/login"
            className="mt-4 inline-block text-sm text-brand-400 hover:text-brand-300 transition-colors"
          >
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-900">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center mx-auto mb-5 animate-pulse">
          <Mic2 className="w-6 h-6 text-white" />
        </div>
        <p className="text-ink-400 text-sm">Signing you in&hellip;</p>
      </div>
    </div>
  );
}
