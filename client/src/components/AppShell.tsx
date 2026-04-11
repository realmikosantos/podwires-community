'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, Bell, Bookmark, Menu, X, ChevronDown,
  LogOut, Settings, User, Plus, Lock,
  Home, Calendar, Users, Briefcase, Radio, BarChart2,
  Mic2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import type { Space } from '@/types';

// ─── Top navigation items ─────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Home',    href: '/dashboard', icon: Home,      matches: (p: string) => p === '/dashboard' || p.startsWith('/spaces') },
  { label: 'Events',  href: '/events',    icon: Calendar,  matches: (p: string) => p.startsWith('/events') },
  { label: 'Members', href: '/producers', icon: Users,     matches: (p: string) => p.startsWith('/producers') },
  { label: 'Jobs',    href: '/jobs',      icon: Briefcase, matches: (p: string) => p.startsWith('/jobs') },
  { label: 'Live',    href: '/live',      icon: Radio,     matches: (p: string) => p.startsWith('/live') },
];

const ADMIN_NAV = [
  { label: 'CRM', href: '/crm', icon: BarChart2, matches: (p: string) => p.startsWith('/crm') },
];

// ─── Sidebar space dot ────────────────────────────────────────────────────────
function SpaceDot({ color, active }: { color?: string; active?: boolean }) {
  return (
    <span
      className="w-2.5 h-2.5 rounded-full shrink-0"
      style={{ backgroundColor: active ? (color || '#4840B0') : '#d1d5db' }}
    />
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, src, size = 8 }: { name?: string; src?: string; size?: number }) {
  const sz = `w-${size} h-${size}`;
  if (src) return <img src={src} alt="" className={`${sz} rounded-full object-cover`} />;
  return (
    <div className={`${sz} rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

// ─── Tier badge ───────────────────────────────────────────────────────────────
function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    free: 'bg-gray-100 text-gray-500',
    pro:  'bg-brand-50 text-brand-600',
    vip:  'bg-purple-50 text-purple-600',
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${styles[tier] ?? styles.free}`}>
      {tier}
    </span>
  );
}

// ─── Main AppShell ────────────────────────────────────────────────────────────
export default function AppShell({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, loadUser, logout } = useAuthStore();

  const [spaces, setSpaces]             = useState<Space[]>([]);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [notifCount, setNotifCount]     = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [spaceModalOpen, setSpaceModal] = useState(false);

  useEffect(() => { loadUser(); }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth/login');
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      api.getSpaces().then(d => setSpaces(d.spaces ?? [])).catch(() => {});
      api.getNotificationCount().then(d => setNotifCount(d.count ?? 0)).catch(() => {});
    }
  }, [isAuthenticated]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading…</span>
        </div>
      </div>
    );
  }

  const allNav = user.role === 'admin' ? [...NAV_ITEMS, ...ADMIN_NAV] : NAV_ITEMS;
  const activeNav = allNav.find(n => n.matches(pathname)) ?? NAV_ITEMS[0];

  const openSpaces  = spaces.filter(s => !s.isLocked);
  const lockedSpaces = spaces.filter(s => s.isLocked);
  const isOnFeed = activeNav.href === '/dashboard' || pathname.startsWith('/spaces');

  /* ── Sidebar contents ── */
  const SidebarContents = () => (
    <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">

      {/* Feed link */}
      <div className="px-3 mb-1">
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
            pathname === '/dashboard'
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Home className="w-4 h-4 shrink-0" />
          Feed
        </Link>
      </div>

      {/* Deal Room */}
      <div className="px-3 mb-1">
        <Link
          href="/deal-room"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
            pathname.startsWith('/deal-room')
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Briefcase className="w-4 h-4 shrink-0" />
          Deal Room
        </Link>
      </div>

      {/* Member Center group */}
      <div className="px-3 mt-4 mb-2">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3">
          Member Center
        </span>
        <div className="mt-1 space-y-0.5">
          {[
            { label: 'Announcements', href: '/spaces/open-community' },
            { label: 'Getting Started', href: '/spaces/open-community' },
          ].map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  active ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <SpaceDot color="#22c55e" active={active} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Spaces group — dynamic from API */}
      {openSpaces.length > 0 && (
        <div className="px-3 mt-4 mb-2">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3">
            Spaces
          </span>
          <div className="mt-1 space-y-0.5">
            {openSpaces.map(space => {
              const active = pathname === `/spaces/${space.slug}`;
              return (
                <Link
                  key={space.id}
                  href={`/spaces/${space.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    active ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <SpaceDot color={space.color} active={active} />
                  <span className="truncate flex-1">{space.name}</span>
                  {space.postCount > 0 && (
                    <span className="text-[10px] text-gray-400 font-medium shrink-0">
                      {space.postCount > 99 ? '99+' : space.postCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked spaces */}
      {lockedSpaces.length > 0 && (
        <div className="px-3 mt-4 mb-2">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3">
            Upgrade to Unlock
          </span>
          <div className="mt-1 space-y-0.5">
            {lockedSpaces.map(space => (
              <Link
                key={space.id}
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:bg-gray-50 transition-colors"
              >
                <Lock className="w-3 h-3 shrink-0 text-gray-300" />
                <span className="truncate flex-1">{space.name}</span>
                <span className="text-[10px] text-gray-400 capitalize shrink-0">{space.requiredTier}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Admin — Create Space */}
      {user.role === 'admin' && (
        <div className="px-3 mt-4 mb-2">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3">
            Admin
          </span>
          <div className="mt-1">
            <button
              onClick={() => { setSpaceModal(true); setMobileOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              Create Space
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Top header bar ──────────────────────────────────────────── */}
      <header className="h-14 shrink-0 bg-white border-b border-gray-200 flex items-center px-4 z-30 sticky top-0">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 mr-6 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Mic2 className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
          </div>
          <span className="font-display font-bold text-gray-900 text-sm hidden sm:block leading-none">
            Podwires<br />
            <span className="text-gray-400 font-normal text-[10px] tracking-wide">Community</span>
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
        </Link>

        {/* Center navigation */}
        <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-hide">
          {allNav.map(item => {
            const active = item.matches(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'text-gray-900 bg-gray-100'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right utilities */}
        <div className="flex items-center gap-1 ml-4 shrink-0">
          <button className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" aria-label="Search">
            <Search className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
          </button>

          <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" aria-label="Notifications">
            <Bell className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </button>

          <button className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" aria-label="Bookmarks">
            <Bookmark className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
          </button>

          {/* User avatar + dropdown */}
          <div className="relative ml-1">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="User menu"
            >
              <Avatar name={user.displayName} src={user.avatarUrl} size={8} />
              <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block" />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-sm font-semibold text-gray-900 truncate">{user.displayName}</div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">{user.email}</div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <TierBadge tier={user.subscriptionTier} />
                      <span className="text-[10px] text-gray-400 capitalize">{user.role}</span>
                    </div>
                  </div>

                  <Link
                    href="/profile/edit"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400" /> Edit Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-400" /> Settings
                  </Link>

                  {user.role === 'admin' && (
                    <Link
                      href="/crm"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <BarChart2 className="w-4 h-4 text-gray-400" /> CRM
                    </Link>
                  )}

                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => { setUserMenuOpen(false); logout(); router.push('/auth/login'); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden ml-1 p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {mobileOpen ? <X className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} /> : <Menu className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />}
          </button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setMobileOpen(false)} />
        )}

        {/* ── Left sidebar ──────────────────────────────────────────── */}
        <aside
          className={`
            fixed top-14 left-0 bottom-0 w-56 z-20
            lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:flex-shrink-0
            bg-white border-r border-gray-100
            flex flex-col overflow-hidden
            transition-transform duration-200 lg:translate-x-0
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <SidebarContents />

          {/* User footer */}
          <div className="border-t border-gray-100 px-3 py-3 shrink-0">
            <div className="flex items-center gap-2.5 px-1">
              <Avatar name={user.displayName} src={user.avatarUrl} size={7} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-900 truncate">{user.displayName}</div>
                <TierBadge tier={user.subscriptionTier} />
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 bg-white text-gray-900 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ── Create Space Modal ─────────────────────────────────────── */}
      {spaceModalOpen && (
        <CreateSpaceModal
          onClose={() => setSpaceModal(false)}
          onCreated={(space) => {
            setSpaces(prev => [...prev, { ...space, hasAccess: true, isLocked: false }]);
            setSpaceModal(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Create Space Modal (light theme) ────────────────────────────────────────
function CreateSpaceModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (space: any) => void;
}) {
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#4840B0',
    requiredTier: 'free',
    allowedRoles: ['producer', 'client', 'admin'],
    visibility: 'public',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function setField(key: string, value: string) {
    setForm(f => {
      const next: any = { ...f, [key]: value };
      if (key === 'name') next.slug = autoSlug(value);
      return next;
    });
  }

  function toggleRole(role: string) {
    setForm(f => ({
      ...f,
      allowedRoles: f.allowedRoles.includes(role)
        ? f.allowedRoles.filter(r => r !== role)
        : [...f.allowedRoles, role],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.slug.trim()) { setError('Name and slug are required.'); return; }
    if (form.allowedRoles.length === 0) { setError('Select at least one allowed role.'); return; }
    setSaving(true);
    try {
      const { space } = await api.createSpace(form);
      onCreated(space);
    } catch (err: any) {
      setError(err.message || 'Failed to create space');
    } finally {
      setSaving(false);
    }
  }

  const COLOR_PRESETS = ['#4840B0', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#db2777'];

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl pointer-events-auto max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <h2 className="text-base font-semibold text-gray-900">Create Space</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">Space Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                placeholder="e.g. Producer Lounge"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">URL Slug *</label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50 focus-within:ring-2 focus-within:ring-brand-500 focus-within:bg-white">
                <span className="px-3 py-2.5 text-xs text-gray-400 border-r border-gray-200 shrink-0">/spaces/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                  placeholder="producer-lounge"
                  className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                placeholder="What is this space for?"
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            {/* Color */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-2">Colour</label>
              <div className="flex items-center gap-2">
                {COLOR_PRESETS.map(c => (
                  <button
                    key={c} type="button"
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${form.color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color" value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className="w-6 h-6 rounded-full cursor-pointer border-0 bg-transparent"
                  title="Custom colour"
                />
              </div>
            </div>

            {/* Tier + Visibility */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Required Tier</label>
                <select
                  value={form.requiredTier} onChange={e => setField('requiredTier', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  {['free', 'pro', 'vip'].map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Visibility</label>
                <select
                  value={form.visibility} onChange={e => setField('visibility', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  {['public', 'private', 'secret'].map(v => <option key={v} value={v} className="capitalize">{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
                </select>
              </div>
            </div>

            {/* Allowed roles */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-2">Allowed Roles</label>
              <div className="flex gap-2">
                {['producer', 'client', 'admin'].map(role => (
                  <button
                    key={role} type="button" onClick={() => toggleRole(role)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors capitalize ${
                      form.allowedRoles.includes(role)
                        ? 'bg-brand-50 border-brand-400 text-brand-700'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
            )}

            {/* Preview */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span
                className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                style={{ backgroundColor: form.color }}
              >
                {form.name[0] || '?'}
              </span>
              <span className="text-sm text-gray-700 truncate flex-1">{form.name || 'Space name'}</span>
              <span className="text-[10px] text-gray-400 capitalize">{form.requiredTier}</span>
            </div>
          </form>

          {/* Footer */}
          <div className="flex gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {saving ? 'Creating…' : 'Create Space'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
