'use client';

import Link from 'next/link';

const PODWIRES_URL   = 'https://podwires.com';
const PODWIRES_JOIN  = 'https://podwires.com/join';
const COMMUNITY_LOGIN = '/auth/login';

// ─── Feature list ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    emoji: '💬',
    title: 'Community Spaces',
    desc: 'Dedicated spaces for announcements, discussions, showcases, and resources — all in one organised feed.',
    color: 'from-brand-900/60 to-brand-800/40',
    accent: 'border-brand-700',
  },
  {
    emoji: '🎙️',
    title: 'Talent Hub',
    desc: 'Browse verified podcast producers by specialisation, rates, and availability. Brands find talent fast.',
    color: 'from-accent-900/60 to-accent-800/40',
    accent: 'border-accent-700',
  },
  {
    emoji: '🤝',
    title: 'Deal Room',
    desc: 'Private real-time workspace for producer–client collaboration. Proposals, milestones, and chat in one place.',
    color: 'from-ink-800/80 to-ink-700/50',
    accent: 'border-ink-600',
  },
  {
    emoji: '📋',
    title: 'Job Board',
    desc: 'Live podcast production opportunities pulled directly from Podwires.com. Always up-to-date, no double-posting.',
    color: 'from-green-900/40 to-green-800/20',
    accent: 'border-green-800',
  },
  {
    emoji: '📅',
    title: 'Events & Live',
    desc: 'Webinars, workshops, AMAs, and live video sessions. Record and rewatch on-demand.',
    color: 'from-amber-900/40 to-amber-800/20',
    accent: 'border-amber-800',
  },
  {
    emoji: '🌐',
    title: 'One Podwires Login',
    desc: 'Your podwires.com account is your community account. No new passwords, no friction.',
    color: 'from-indigo-900/40 to-indigo-800/20',
    accent: 'border-indigo-800',
  },
];

// ─── How it works steps ───────────────────────────────────────────────────────
const STEPS = [
  {
    n: '01',
    title: 'Create your Podwires account',
    desc: 'Sign up for free at podwires.com — one account for the whole platform.',
    cta: { label: 'Go to Podwires.com →', href: PODWIRES_JOIN },
  },
  {
    n: '02',
    title: 'Click "Community" in the nav',
    desc: 'You\'ll be securely signed in to the community via WordPress SSO — no second password.',
    cta: null,
  },
  {
    n: '03',
    title: 'Connect, collaborate, and grow',
    desc: 'Post in spaces, reach out to talent or brands, and join live events with the community.',
    cta: null,
  },
];

// ─── Social proof numbers ─────────────────────────────────────────────────────
const STATS = [
  { value: '500+', label: 'Members' },
  { value: '12',   label: 'Active Spaces' },
  { value: '200+', label: 'Producers' },
  { value: '80+',  label: 'Brands' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-ink-900 text-white overflow-x-hidden">

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-ink-800 bg-ink-900/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          {/* Logo */}
          <a href={PODWIRES_URL} className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center group-hover:bg-brand-500 transition-colors">
              <MicIcon className="w-4 h-4 text-white" />
            </div>
            <div className="leading-none">
              <span className="font-display font-bold text-white text-sm">Podwires</span>
              <span className="text-ink-400 font-medium text-sm"> Community</span>
            </div>
          </a>

          {/* Right */}
          <div className="flex items-center gap-3">
            <a
              href={PODWIRES_URL}
              className="hidden sm:inline-flex items-center gap-1 text-sm text-ink-400 hover:text-white transition-colors"
            >
              podwires.com
              <ExternalIcon className="w-3 h-3" />
            </a>
            <Link
              href={COMMUNITY_LOGIN}
              className="px-4 py-1.5 rounded-full bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 pt-20 pb-24 text-center">
        {/* Badge */}
        <a
          href={PODWIRES_URL}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-800 bg-brand-900/30 text-brand-300 text-xs font-semibold mb-8 hover:border-brand-700 transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Part of the Podwires Platform
          <ExternalIcon className="w-3 h-3" />
        </a>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-extrabold leading-[1.05] tracking-tight">
          The private community<br />
          for{' '}
          <span className="bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">
            podcast professionals
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-ink-400 max-w-2xl mx-auto leading-relaxed">
          Podcast producers and brands connect, collaborate, and grow together.
          Spaces, deal rooms, live events, and a talent hub — built for the podcast industry.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={COMMUNITY_LOGIN}
            className="w-full sm:w-auto group flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-base transition-all shadow-lg shadow-brand-900/40"
          >
            <MicIcon className="w-4 h-4" />
            Sign in with Podwires
            <ArrowIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href={PODWIRES_JOIN}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-ink-600 hover:border-ink-500 text-ink-300 hover:text-white font-semibold text-base transition-colors"
          >
            New? Join on Podwires.com
            <ExternalIcon className="w-4 h-4" />
          </a>
        </div>

        <p className="mt-5 text-xs text-ink-600">
          Community membership is managed through your Podwires.com account
        </p>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────── */}
      <section className="border-y border-ink-800 bg-ink-800/40">
        <div className="max-w-6xl mx-auto px-5 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-display font-bold text-white">{s.value}</div>
              <div className="text-xs text-ink-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 py-24">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-white">
            Everything in one place
          </h2>
          <p className="mt-3 text-ink-400 text-sm sm:text-base max-w-xl mx-auto">
            All the tools your podcast business needs — community, talent, projects, and events.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div
              key={f.title}
              className={`p-6 rounded-2xl bg-gradient-to-br ${f.color} border ${f.accent} hover:border-opacity-100 transition-all group`}
            >
              <div className="text-3xl mb-3">{f.emoji}</div>
              <h3 className="font-semibold text-white text-base mb-2">{f.title}</h3>
              <p className="text-ink-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="border-t border-ink-800 bg-ink-800/20">
        <div className="max-w-4xl mx-auto px-5 py-24">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-white">
              How to join
            </h2>
            <p className="mt-3 text-ink-400 text-sm sm:text-base">
              Your Podwires.com account is all you need.
            </p>
          </div>

          <div className="space-y-6">
            {STEPS.map((step, i) => (
              <div
                key={step.n}
                className="flex gap-6 p-6 rounded-2xl bg-ink-800/50 border border-ink-700"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-600/20 border border-brand-700/40 flex items-center justify-center shrink-0">
                  <span className="text-brand-400 font-display font-bold text-sm">{step.n}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-base">{step.title}</h3>
                  <p className="text-ink-400 text-sm mt-1 leading-relaxed">{step.desc}</p>
                  {step.cta && (
                    <a
                      href={step.cta.href}
                      className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      {step.cta.label}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href={COMMUNITY_LOGIN}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors shadow-lg shadow-brand-900/40"
            >
              Sign in to the Community
              <ArrowIcon className="w-4 h-4" />
            </Link>
            <p className="mt-4 text-xs text-ink-600">
              Don&apos;t have an account?{' '}
              <a href={PODWIRES_JOIN} className="text-brand-500 hover:text-brand-400 transition-colors">
                Register at podwires.com
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-ink-800 py-8 px-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center">
              <MicIcon className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm text-ink-500">
              &copy; {new Date().getFullYear()} Podwires Community
            </span>
          </div>
          <div className="flex items-center gap-5 text-sm text-ink-500">
            <a
              href={PODWIRES_URL}
              className="hover:text-ink-300 transition-colors flex items-center gap-1"
            >
              podwires.com <ExternalIcon className="w-3 h-3" />
            </a>
            <a href={`${PODWIRES_URL}/privacy`} className="hover:text-ink-300 transition-colors">Privacy</a>
            <a href={`${PODWIRES_URL}/terms`}   className="hover:text-ink-300 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}
function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" x2="19" y1="12" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" x2="21" y1="14" y2="3" />
    </svg>
  );
}
