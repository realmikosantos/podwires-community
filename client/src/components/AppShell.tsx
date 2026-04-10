'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import type { Space } from '@/types';

// ─── Module nav ──────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'community', label: 'Community', href: '/dashboard',  matches: (p: string) => p === '/dashboard' || p.startsWith('/spaces') },
  { id: 'chat',      label: 'Chat',      href: '/deal-room',  matches: (p: string) => p.startsWith('/deal-room') },
  { id: 'members',   label: 'Members',   href: '/producers',  matches: (p: string) => p.startsWith('/producers') },
  { id: 'events',    label: 'Events',    href: '/events',     matches: (p: string) => p.startsWith('/events') },
  { id: 'live',      label: 'Live',      href: '/live',       matches: (p: string) => p.startsWith('/live') },
  { id: 'jobs',      label: 'Jobs',      href: '/jobs',       matches: (p: string) => p.startsWith('/jobs') },
  { id: 'crm',       label: 'CRM',       href: '/crm',        matches: (p: string) => p.startsWith('/crm') },
];

// ─── Community sidebar ────────────────────────────────────────────────────────
const COMMUNITY_FIXED = [
  {
    groupLabel: 'Start Here',
    items: [
      { label: '👋 Welcome', href: '/spaces/open-community' },
      { label: '🙋 Say Hello', href: '/spaces/open-community' },
    ],
  },
  {
    groupLabel: 'Community',
    items: [
      { label: '📣 Announcements', href: '/spaces/open-community' },
      { label: '📚 Resources', href: '/spaces/open-community' },
      { label: '💬 Discussions', href: '/spaces/pro-network' },
      { label: '🏆 Wins', href: '/spaces/pro-network' },
    ],
  },
];

// ─── Icon helpers ─────────────────────────────────────────────────────────────
function Avatar({ name, src, size = 8 }: { name?: string; src?: string; size?: number }) {
  const sz = `w-${size} h-${size}`;
  if (src) return <img src={src} alt="" className={`${sz} rounded-full object-cover`} />;
  return (
    <div className={`${sz} rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold text-sm`}>
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

// ─── Main AppShell ────────────────────────────────────────────────────────────
export default function AppShell({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, loadUser, logout } = useAuthStore();

  const [spaces, setSpaces]               = useState<Space[]>([]);
  const [mobileOpen, setMobileOpen]       = useState(false);
  const [notifCount, setNotifCount]       = useState(0);
  const [userMenuOpen, setUserMenuOpen]   = useState(false);

  useEffect(() => { loadUser(); }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth/login');
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      api.getSpaces().then(d => setSpaces(d.spaces)).catch(() => {});
      api.getNotificationCount().then(d => setNotifCount(d.count)).catch(() => {});
    }
  }, [isAuthenticated]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-ink-400">Loading community…</span>
        </div>
      </div>
    );
  }

  const activeModule = MODULES.find(m => m.matches(pathname)) ?? MODULES[0];

  // Build dynamic community sidebar sections
  const dynamicSpaces = spaces.filter(s => !s.isLocked);
  const lockedSpaces  = spaces.filter(s => s.isLocked);

  return (
    <div className="min-h-screen bg-ink-900 flex flex-col">

      {/* ── Top header bar ─────────────────────────────────────────── */}
      <header className="h-12 shrink-0 bg-ink-900 border-b border-ink-700 flex items-center px-4 z-30 sticky top-0">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 mr-6 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <MicIcon className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-white text-sm hidden sm:block">Podwires</span>
        </Link>

        {/* Module tabs */}
        <nav className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide">
          {MODULES.map(m => {
            const active = m.id === activeModule.id;
            return (
              <Link
                key={m.id}
                href={m.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-ink-700 text-white'
                    : 'text-ink-300 hover:text-white hover:bg-ink-800'
                }`}
              >
                {m.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-4 shrink-0">
          {/* Search */}
          <button className="p-1.5 rounded-md text-ink-400 hover:text-white hover:bg-ink-700 transition-colors">
            <SearchIcon className="w-4 h-4" />
          </button>

          {/* Notifications */}
          <button className="relative p-1.5 rounded-md text-ink-400 hover:text-white hover:bg-ink-700 transition-colors">
            <BellIcon className="w-4 h-4" />
            {notifCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-md hover:bg-ink-700 transition-colors"
            >
              <Avatar name={user.displayName} src={user.avatarUrl} size={7} />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-52 bg-ink-800 border border-ink-600 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                  <div className="px-3 py-2 border-b border-ink-700">
                    <div className="text-sm font-medium text-white truncate">{user.displayName}</div>
                    <div className="text-xs text-ink-400 truncate">{user.email}</div>
                  </div>
                  <Link
                    href="/profile/edit"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-ink-200 hover:bg-ink-700 hover:text-white transition-colors"
                  >
                    <UserIcon className="w-4 h-4" /> Edit Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-ink-200 hover:bg-ink-700 hover:text-white transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4" /> Settings
                  </Link>
                  <div className="border-t border-ink-700 mt-1 pt-1">
                    <button
                      onClick={() => { setUserMenuOpen(false); logout(); router.push('/auth/login'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-ink-700 hover:text-red-300 transition-colors"
                    >
                      <LogOutIcon className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-1.5 rounded-md text-ink-400 hover:text-white hover:bg-ink-700"
          >
            <MenuIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Body: sidebar + main ───────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* ── Left sidebar ──────────────────────────────────────────── */}
        <aside
          className={`
            fixed top-12 left-0 bottom-0 w-56 z-20
            lg:sticky lg:top-0 lg:flex-shrink-0
            bg-ink-800 border-r border-ink-700
            flex flex-col overflow-hidden
            transition-transform lg:translate-x-0
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex-1 overflow-y-auto py-3">

            {/* Community module sidebar */}
            {activeModule.id === 'community' && (
              <>
                {/* Feed link */}
                <div className="px-3 mb-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname === '/dashboard'
                        ? 'bg-brand-600/20 text-brand-300'
                        : 'text-ink-300 hover:bg-ink-700 hover:text-white'
                    }`}
                  >
                    <HomeIcon className="w-4 h-4" />
                    Feed
                  </Link>
                </div>

                {/* Fixed sections */}
                {COMMUNITY_FIXED.map(group => (
                  <div key={group.groupLabel} className="px-3 mb-4">
                    <div className="text-[10px] font-semibold text-ink-500 uppercase tracking-wider px-3 mb-1">
                      {group.groupLabel}
                    </div>
                    {group.items.map(item => {
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            active
                              ? 'bg-brand-600/20 text-brand-300'
                              : 'text-ink-300 hover:bg-ink-700 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                ))}

                {/* Dynamic spaces */}
                {dynamicSpaces.length > 0 && (
                  <div className="px-3 mb-4">
                    <div className="text-[10px] font-semibold text-ink-500 uppercase tracking-wider px-3 mb-1">
                      Spaces
                    </div>
                    {dynamicSpaces.map(space => {
                      const active = pathname === `/spaces/${space.slug}`;
                      return (
                        <Link
                          key={space.id}
                          href={`/spaces/${space.slug}`}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            active
                              ? 'bg-brand-600/20 text-brand-300'
                              : 'text-ink-300 hover:bg-ink-700 hover:text-white'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                            style={{ backgroundColor: space.color || '#4840B0' }}
                          >
                            {space.name[0]}
                          </span>
                          <span className="truncate">{space.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Locked spaces */}
                {lockedSpaces.length > 0 && (
                  <div className="px-3 mb-4">
                    <div className="text-[10px] font-semibold text-ink-500 uppercase tracking-wider px-3 mb-1">
                      Upgrade to Unlock
                    </div>
                    {lockedSpaces.map(space => (
                      <Link
                        key={space.id}
                        href="/settings"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-ink-600 hover:text-ink-400 transition-colors"
                      >
                        <LockIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{space.name}</span>
                        <span className="ml-auto text-[10px] text-ink-600 capitalize">{space.requiredTier}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Chat module sidebar */}
            {activeModule.id === 'chat' && (
              <div className="px-3">
                <div className="text-[10px] font-semibold text-ink-500 uppercase tracking-wider px-3 mb-1">
                  Deal Room
                </div>
                <Link
                  href="/deal-room"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    pathname === '/deal-room'
                      ? 'bg-brand-600/20 text-brand-300'
                      : 'text-ink-300 hover:bg-ink-700 hover:text-white'
                  }`}
                >
                  <BriefcaseIcon className="w-4 h-4" />
                  All Projects
                </Link>
              </div>
            )}

            {/* Members module sidebar */}
            {activeModule.id === 'members' && (
              <div className="px-3">
                <div className="text-[10px] font-semibold text-ink-500 uppercase tracking-wider px-3 mb-1">
                  Talent Hub
                </div>
                <Link
                  href="/producers"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    pathname === '/producers'
                      ? 'bg-brand-600/20 text-brand-300'
                      : 'text-ink-300 hover:bg-ink-700 hover:text-white'
                  }`}
                >
                  <UsersIcon className="w-4 h-4" />
                  Browse Producers
                </Link>
              </div>
            )}

            {/* Events module sidebar */}
            {activeModule.id === 'events' && (
              <div className="px-3">
                <div className="text-[10px] font-semibold text-ink-500 uppercase tracking-wider px-3 mb-1">
                  Events
                </div>
                <Link
                  href="/events"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-300 hover:bg-ink-700 hover:text-white transition-colors"
                >
                  <CalendarIcon className="w-4 h-4" />
                  Upcoming
                </Link>
                <Link
                  href="/events?tab=past"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-300 hover:bg-ink-700 hover:text-white transition-colors"
                >
                  <PlayIcon className="w-4 h-4" />
                  Recordings
                </Link>
              </div>
            )}

            {/* Live module sidebar */}
            {activeModule.id === 'live' && (
              <div className="px-3">
                <div className="text-[10px] font-semibold text-ink-500 uppercase tracking-wider px-3 mb-1">
                  Live
                </div>
                <Link
                  href="/live"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-ink-700 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Go Live
                </Link>
              </div>
            )}

            {/* Jobs module sidebar */}
            {activeModule.id === 'jobs' && (
              <div className="px-3">
                <div className="text-[10px] font-semibold text-ink-500 uppercase tracking-wider px-3 mb-1">
                  Job Board
                </div>
                <Link
                  href="/jobs"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-300 hover:bg-ink-700 hover:text-white transition-colors"
                >
                  <MegaphoneIcon className="w-4 h-4" />
                  All Jobs
                </Link>
              </div>
            )}

            {/* CRM module sidebar */}
            {activeModule.id === 'crm' && (
              <div className="px-3">
                <div className="text-[10px] font-semibold text-ink-500 uppercase tracking-wider px-3 mb-1">
                  Audience
                </div>
                <Link
                  href="/crm"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    pathname === '/crm'
                      ? 'bg-brand-600/20 text-brand-300'
                      : 'text-ink-300 hover:bg-ink-700 hover:text-white'
                  }`}
                >
                  <UsersIcon className="w-4 h-4" />
                  Members
                </Link>
                <Link
                  href="/crm?tab=segments"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-300 hover:bg-ink-700 hover:text-white transition-colors"
                >
                  <SegmentIcon className="w-4 h-4" />
                  Segments
                </Link>
              </div>
            )}
          </div>

          {/* User footer */}
          <div className="border-t border-ink-700 p-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <Avatar name={user.displayName} src={user.avatarUrl} size={8} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{user.displayName}</div>
                <div className="flex items-center gap-1.5">
                  <TierBadge tier={user.subscriptionTier} />
                  <span className="text-[10px] text-ink-500 capitalize">{user.role}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main content area ─────────────────────────────────────── */}
        <main className="flex-1 min-w-0 bg-white text-gray-900 overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  );
}

// ─── Tier badge ───────────────────────────────────────────────────────────────
function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    free: 'bg-ink-600/40 text-ink-400',
    pro:  'bg-brand-600/30 text-brand-300',
    vip:  'bg-accent-600/30 text-accent-300',
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${styles[tier] ?? styles.free}`}>
      {tier}
    </span>
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
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 13v-2z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}
function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" x2="16.65" y1="21" y2="16.65" />
    </svg>
  );
}
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}
function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}
function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
function SegmentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h18v18H3z" />
      <path d="M3 9h18M3 15h18M9 3v18" />
    </svg>
  );
}
