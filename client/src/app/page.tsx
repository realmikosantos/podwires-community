'use client';

import Link from 'next/link';
import { Mic2, Users, Briefcase, Star, ArrowRight, CheckCircle2 } from 'lucide-react';

const WP_COMMUNITY_LOGIN = 'https://podwires.com/community-login';
const WP_REGISTER = 'https://podwires.com/register';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-ink-900 text-white">

      {/* ── Navigation ── */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Mic2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-display font-bold tracking-tight">
            Podwires <span className="text-ink-400 font-medium">Community</span>
          </span>
        </div>
        <a
          href={WP_COMMUNITY_LOGIN}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors"
        >
          Sign In
        </a>
      </nav>

      {/* ── Hero ── */}
      <main className="max-w-7xl mx-auto px-6">
        <div className="pt-20 pb-28 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-700 bg-brand-900/40 text-brand-300 text-sm font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            The Podcast Industry Community
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-extrabold leading-tight tracking-tight">
            Where Podcast{' '}
            <span className="text-brand-400">Producers</span>
            <br />
            Meet Their Next{' '}
            <span className="text-brand-400">Client</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-ink-400 max-w-2xl mx-auto leading-relaxed">
            The private community connecting podcast production talent with brands
            and businesses. Deal rooms, talent hub, job board — all in one place.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={WP_COMMUNITY_LOGIN}
              className="group flex items-center gap-3 px-8 py-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-lg transition-all shadow-lg shadow-brand-900/50"
            >
              <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
                <Mic2 className="w-3.5 h-3.5" />
              </div>
              Sign in with Podwires
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href={WP_REGISTER}
              className="px-8 py-4 rounded-xl border border-ink-700 hover:border-ink-600 text-ink-300 hover:text-white font-semibold text-lg transition-colors"
            >
              New to Podwires? Join free
            </a>
          </div>

          <p className="mt-5 text-sm text-ink-500">
            One account. Same login as podwires.com.
          </p>
        </div>

        {/* ── Features ── */}
        <div className="pb-24">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: 'Talent Hub',
                desc: 'Showcase your skills, build your portfolio, and get discovered by brands looking for podcast talent.',
                color: 'bg-brand-700',
                iconColor: 'text-brand-300',
              },
              {
                icon: Briefcase,
                title: 'Deal Room',
                desc: 'Private project workspace for producer–client collaboration. From inquiry to delivery in one place.',
                color: 'bg-accent-800',
                iconColor: 'text-accent-300',
              },
              {
                icon: Star,
                title: 'Job Board',
                desc: 'Fresh opportunities direct from Podwires.com. Find your next gig or post a production brief.',
                color: 'bg-ink-700',
                iconColor: 'text-ink-300',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl bg-ink-800 border border-ink-700 hover:border-brand-700 transition-colors"
              >
                <div className={`w-10 h-10 ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                </div>
                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-ink-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Pricing ── */}
        <div className="pb-28 text-center">
          <h2 className="text-3xl font-display font-bold text-white">Simple, Fair Pricing</h2>
          <p className="mt-3 text-ink-400">Start free. Upgrade when you&apos;re ready to grow.</p>

          <div className="mt-10 grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              {
                name: 'Free',
                price: '$0',
                sub: 'Forever',
                features: ['Open Community', 'Basic profile', 'Job board access'],
              },
              {
                name: 'Pro',
                price: '$29',
                sub: 'per month',
                features: ['Talent Hub & Client Lounge', 'Deal Room (5 projects)', 'Priority job alerts', 'Portfolio showcase'],
                popular: true,
              },
              {
                name: 'VIP',
                price: '$49',
                sub: 'per month',
                features: ['Everything in Pro', 'VIP Space access', 'Unlimited projects', 'Featured badge', 'Direct introductions'],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`p-6 rounded-2xl text-left relative ${
                  plan.popular
                    ? 'bg-brand-700 border border-brand-500 ring-1 ring-brand-500/50'
                    : 'bg-ink-800 border border-ink-700'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-400 text-ink-900 text-xs font-bold">
                    Most Popular
                  </span>
                )}
                <h3 className="font-semibold text-white">{plan.name}</h3>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-4xl font-display font-bold text-white">{plan.price}</span>
                  <span className="text-ink-400 text-sm pb-1">{plan.sub}</span>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${plan.popular ? 'text-brand-300' : 'text-brand-500'}`} />
                      <span className={plan.popular ? 'text-brand-100' : 'text-ink-300'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={WP_COMMUNITY_LOGIN}
                  className={`mt-6 block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-white text-brand-700 hover:bg-brand-50'
                      : 'bg-ink-700 text-white hover:bg-ink-600 border border-ink-600'
                  }`}
                >
                  Get Started
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-ink-800 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center">
              <Mic2 className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm text-ink-400">&copy; {new Date().getFullYear()} Podwires. All rights reserved.</span>
          </div>
          <a href="https://podwires.com" className="text-sm text-ink-500 hover:text-ink-300 transition-colors">
            podwires.com
          </a>
        </div>
      </footer>
    </div>
  );
}
