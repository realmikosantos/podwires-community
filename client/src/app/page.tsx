'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent-500 rounded-lg" />
          <span className="text-xl font-display font-bold text-white">Podwires</span>
          <span className="text-sm text-brand-200 font-medium">Community</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-brand-100 hover:text-white transition-colors">
            Log in
          </Link>
          <Link href="/auth/register" className="btn-primary">
            Join Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-display font-extrabold text-white leading-tight">
            Where Podcast
            <span className="text-accent-400"> Producers </span>
            Meet Their Next
            <span className="text-accent-400"> Client</span>
          </h1>
          <p className="mt-6 text-xl text-brand-200 leading-relaxed">
            The industry community connecting podcast production talent with brands
            and businesses ready to launch, grow, or elevate their shows.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register?role=producer"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-accent-500 text-white font-semibold text-lg hover:bg-accent-600 transition-colors"
            >
              I&apos;m a Producer
            </Link>
            <Link
              href="/auth/register?role=client"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-brand-800 font-semibold text-lg hover:bg-brand-50 transition-colors"
            >
              I&apos;m a Brand / Business
            </Link>
          </div>
        </div>

        {/* Feature grid */}
        <div className="mt-32 grid md:grid-cols-3 gap-8">
          {[
            {
              title: 'Talent Hub',
              desc: 'Showcase your skills, build your portfolio, and get discovered by brands looking for podcast talent.',
              color: 'bg-purple-500',
            },
            {
              title: 'Deal Room',
              desc: 'Secure project workspace for producer-client collaboration. From inquiry to delivery, all in one place.',
              color: 'bg-blue-500',
            },
            {
              title: 'Job Board',
              desc: 'Fresh opportunities pulled directly from Podwires.com. Find your next gig or post a brief.',
              color: 'bg-green-500',
            },
          ].map((feature) => (
            <div key={feature.title} className="card p-6">
              <div className={`w-10 h-10 ${feature.color} rounded-lg mb-4`} />
              <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="mt-32 text-center">
          <h2 className="text-3xl font-display font-bold text-white">Simple, Fair Pricing</h2>
          <p className="mt-3 text-brand-200">Start free. Upgrade when you&apos;re ready to grow.</p>

          <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: 'Free', price: '$0', features: ['Open Community', 'Basic profile', 'Job board'] },
              { name: 'Pro', price: '$29/mo', features: ['Talent Hub / Client Lounge', 'Deal Room (5 projects)', 'Priority job alerts', 'Portfolio showcase'], popular: true },
              { name: 'VIP', price: '$49/mo', features: ['Everything in Pro', 'VIP Space access', 'Unlimited projects', 'Featured badge', 'Direct introductions'] },
            ].map((plan) => (
              <div key={plan.name} className={`card p-6 text-left ${plan.popular ? 'ring-2 ring-accent-500 relative' : ''}`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-2 text-3xl font-bold">{plan.price}</p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-500">&#10003;</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register"
                  className={`mt-6 block text-center py-2 rounded-lg font-medium ${
                    plan.popular ? 'bg-accent-500 text-white hover:bg-accent-600' : 'btn-secondary'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-700 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-brand-300 text-sm">&copy; {new Date().getFullYear()} Podwires. All rights reserved.</p>
          <a href="https://podwires.com" className="text-brand-300 hover:text-white text-sm transition-colors">
            podwires.com
          </a>
        </div>
      </footer>
    </div>
  );
}
