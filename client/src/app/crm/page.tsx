'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { useAuthStore } from '@/lib/auth-store';

// ─── Sample member data ───────────────────────────────────────────────────────
const MEMBERS = [
  { id: '1', name: 'Marcus Webb',   email: 'marcus@example.com',  role: 'producer', tier: 'pro',  score: 92, joined: '2025-11-02', lastSeen: '2 hours ago',   location: 'New York, US',    tags: ['active', 'featured'] },
  { id: '2', name: 'Sarah Kim',     email: 'sarah@example.com',   role: 'client',   tier: 'vip',  score: 88, joined: '2025-12-15', lastSeen: '1 day ago',    location: 'Los Angeles, US', tags: ['hiring'] },
  { id: '3', name: 'Alex Rivera',   email: 'alex@example.com',    role: 'producer', tier: 'free', score: 61, joined: '2026-01-08', lastSeen: '3 days ago',   location: 'Austin, US',      tags: [] },
  { id: '4', name: 'Priya Singh',   email: 'priya@example.com',   role: 'producer', tier: 'pro',  score: 79, joined: '2025-10-30', lastSeen: '5 hours ago',  location: 'London, UK',      tags: ['active'] },
  { id: '5', name: 'Tom Baker',     email: 'tom@example.com',     role: 'client',   tier: 'pro',  score: 74, joined: '2026-02-17', lastSeen: '2 days ago',   location: 'Chicago, US',     tags: ['hiring'] },
  { id: '6', name: 'Dana Lee',      email: 'dana@example.com',    role: 'producer', tier: 'free', score: 45, joined: '2026-03-01', lastSeen: '1 week ago',   location: 'Seattle, US',     tags: [] },
  { id: '7', name: 'Jordan Park',   email: 'jordan@example.com',  role: 'producer', tier: 'vip',  score: 97, joined: '2025-09-14', lastSeen: '30 min ago',   location: 'Toronto, CA',     tags: ['featured', 'active'] },
  { id: '8', name: 'Emma Wilson',   email: 'emma@example.com',    role: 'client',   tier: 'free', score: 33, joined: '2026-03-28', lastSeen: '2 weeks ago',  location: 'Miami, US',       tags: [] },
];

// ─── Score badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-green-50 text-green-700 ring-green-200' :
    score >= 60 ? 'bg-amber-50 text-amber-700 ring-amber-200' :
                  'bg-red-50   text-red-700   ring-red-200';
  return (
    <span className={`inline-flex items-center justify-center w-9 h-7 rounded-full text-xs font-bold ring-1 ${color}`}>
      {score}
    </span>
  );
}

// ─── Tier pill ────────────────────────────────────────────────────────────────
function TierPill({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    free: 'bg-gray-100 text-gray-600',
    pro:  'bg-brand-50 text-brand-700',
    vip:  'bg-accent-50 text-accent-700',
  };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${styles[tier] ?? styles.free}`}>
      {tier}
    </span>
  );
}

// ─── Role pill ────────────────────────────────────────────────────────────────
function RolePill({ role }: { role: string }) {
  const styles: Record<string, string> = {
    producer: 'bg-indigo-50 text-indigo-700',
    client:   'bg-green-50 text-green-700',
    admin:    'bg-red-50 text-red-700',
  };
  const labels: Record<string, string> = {
    producer: 'Producer',
    client: 'Brand',
    admin: 'Admin',
  };
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${styles[role] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[role] ?? role}
    </span>
  );
}

// ─── Member avatar ────────────────────────────────────────────────────────────
function MemberAvatar({ name }: { name: string }) {
  const colors = [
    'bg-brand-600', 'bg-accent-600', 'bg-green-600',
    'bg-amber-600', 'bg-pink-600', 'bg-cyan-600',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div className={`w-8 h-8 rounded-full ${colors[idx]} flex items-center justify-center text-white text-sm font-semibold shrink-0`}>
      {name[0]}
    </div>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { label: 'Total Members', value: MEMBERS.length, change: '+4 this week' },
    { label: 'Producers',     value: MEMBERS.filter(m => m.role === 'producer').length, change: '' },
    { label: 'Brands',        value: MEMBERS.filter(m => m.role === 'client').length, change: '' },
    { label: 'Pro/VIP',       value: MEMBERS.filter(m => m.tier !== 'free').length, change: '62% conversion' },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map(s => (
        <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-gray-900">{s.value}</div>
          <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          {s.change && <div className="text-[10px] text-green-600 font-medium mt-1">{s.change}</div>}
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CrmPage() {
  const { user } = useAuthStore();
  const [search, setSearch]     = useState('');
  const [roleFilter, setRole]   = useState('all');
  const [tierFilter, setTier]   = useState('all');
  const [sortBy, setSort]       = useState<'score' | 'joined' | 'name'>('score');
  const [selected, setSelected] = useState<string[]>([]);

  if (user?.role !== 'admin') {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <LockIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Admin Only</h2>
          <p className="text-sm text-gray-500">The CRM is only available to community administrators.</p>
        </div>
      </AppShell>
    );
  }

  const filtered = MEMBERS
    .filter(m => {
      const q = search.toLowerCase();
      if (q && !m.name.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q)) return false;
      if (roleFilter !== 'all' && m.role !== roleFilter) return false;
      if (tierFilter !== 'all' && m.tier !== tierFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'joined') return new Date(b.joined).getTime() - new Date(a.joined).getTime();
      return a.name.localeCompare(b.name);
    });

  function toggleSelect(id: string) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  return (
    <AppShell>
      <div className="px-6 py-6 min-h-full bg-gray-50">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Audience</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage and understand your community members</p>
          </div>
          <button className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-500 transition-colors flex items-center gap-2">
            <ExportIcon className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Stats */}
        <StatsBar />

        {/* Filters + search */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-100">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search members…"
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Role filter */}
            <select
              value={roleFilter}
              onChange={e => setRole(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Roles</option>
              <option value="producer">Producers</option>
              <option value="client">Brands</option>
              <option value="admin">Admins</option>
            </select>

            {/* Tier filter */}
            <select
              value={tierFilter}
              onChange={e => setTier(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Tiers</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="vip">VIP</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSort(e.target.value as typeof sortBy)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="score">Sort: Score</option>
              <option value="joined">Sort: Newest</option>
              <option value="name">Sort: Name</option>
            </select>

            {selected.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-500">{selected.length} selected</span>
                <button className="text-sm text-red-500 hover:text-red-700 font-medium">Remove</button>
                <button className="text-sm text-brand-600 hover:text-brand-800 font-medium">Message</button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-4 py-2.5 w-8">
                    <input
                      type="checkbox"
                      checked={selected.length === filtered.length && filtered.length > 0}
                      onChange={() => setSelected(selected.length === filtered.length ? [] : filtered.map(m => m.id))}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                  </th>
                  <th className="px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Member</th>
                  <th className="px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Role / Tier</th>
                  <th className="px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Score</th>
                  <th className="px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Location</th>
                  <th className="px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Last Seen</th>
                  <th className="px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wider hidden xl:table-cell">Tags</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(m => (
                  <tr
                    key={m.id}
                    className={`hover:bg-gray-50 transition-colors ${selected.includes(m.id) ? 'bg-brand-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(m.id)}
                        onChange={() => toggleSelect(m.id)}
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <MemberAvatar name={m.name} />
                        <div>
                          <div className="font-medium text-gray-900">{m.name}</div>
                          <div className="text-xs text-gray-400">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <RolePill role={m.role} />
                        <TierPill tier={m.tier} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={m.score} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{m.location}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{m.lastSeen}</td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {m.tags.map(t => (
                          <span key={t} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-xs text-brand-600 hover:text-brand-800 font-medium">
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">No members match your filters.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
            <span>Showing {filtered.length} of {MEMBERS.length} members</span>
            <div className="flex items-center gap-2">
              <button className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40" disabled>← Prev</button>
              <span className="px-2">Page 1 of 1</span>
              <button className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40" disabled>Next →</button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" />
    </svg>
  );
}
function ExportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
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
