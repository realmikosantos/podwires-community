'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import AppShell from '@/components/AppShell';
import type { Post, Space } from '@/types';

// ─── Relative time helper ─────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, src, size = 9 }: { name?: string; src?: string; size?: number }) {
  const sz = `w-${size} h-${size}`;
  if (src) return <img src={src} alt="" className={`${sz} rounded-full object-cover`} />;
  return (
    <div className={`${sz} rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────
function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likeCount);

  function toggle() {
    setLiked(l => !l);
    setLikes(n => n + (liked ? -1 : 1));
  }

  return (
    <article className="border-b border-gray-100 px-6 py-5 hover:bg-gray-50/50 transition-colors">
      <div className="flex gap-3">
        <Avatar name={post.authorName} src={post.authorAvatar} />
        <div className="flex-1 min-w-0">
          {/* Author line */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{post.authorName}</span>
            <RoleBadge role={post.authorRole} />
            <span className="text-gray-400 text-xs">{timeAgo(post.createdAt)}</span>
            {post.isPinned && (
              <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full font-medium">
                📌 Pinned
              </span>
            )}
          </div>

          {/* Title */}
          {post.title && (
            <h3 className="font-semibold text-gray-900 mt-1 text-base leading-snug">{post.title}</h3>
          )}

          {/* Body */}
          <p className="text-gray-700 text-sm mt-1 leading-relaxed line-clamp-4">{post.body}</p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={toggle}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                liked ? 'text-brand-600 font-medium' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <HeartIcon className={`w-4 h-4 ${liked ? 'fill-brand-600' : ''}`} />
              {likes > 0 && <span>{likes}</span>}
            </button>
            <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              <CommentIcon className="w-4 h-4" />
              {post.commentCount > 0 && <span>{post.commentCount}</span>}
            </button>
            <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors ml-auto">
              <ShareIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    producer: 'bg-brand-50 text-brand-600',
    client: 'bg-green-50 text-green-700',
    admin: 'bg-red-50 text-red-600',
  };
  const labels: Record<string, string> = {
    producer: 'Producer',
    client: 'Brand',
    admin: 'Admin',
  };
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${styles[role] ?? 'bg-gray-100 text-gray-500'}`}>
      {labels[role] ?? role}
    </span>
  );
}

// ─── Compose box ─────────────────────────────────────────────────────────────
function ComposeBox({ user }: { user: { displayName: string; avatarUrl?: string } }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');

  return (
    <div className="px-6 py-4 border-b border-gray-100">
      {!open ? (
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setOpen(true)}
        >
          <Avatar name={user.displayName} src={user.avatarUrl} />
          <div className="flex-1 h-10 rounded-full border border-gray-200 bg-gray-50 flex items-center px-4 text-sm text-gray-400 hover:border-brand-400 hover:bg-white transition-colors">
            Share something with the community…
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <Avatar name={user.displayName} src={user.avatarUrl} />
          <div className="flex-1">
            <textarea
              autoFocus
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Share something with the community…"
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-2">
                <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                  <LinkIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setOpen(false); setBody(''); }}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  disabled={!body.trim()}
                  className="px-4 py-1.5 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Right panel — online members & upcoming ──────────────────────────────────
function RightPanel({ spaces }: { spaces: Space[] }) {
  const SAMPLE_ONLINE = [
    { name: 'Alex Rivera', role: 'producer', initials: 'AR' },
    { name: 'Sarah Kim', role: 'client', initials: 'SK' },
    { name: 'Marcus W.', role: 'producer', initials: 'MW' },
    { name: 'Priya Singh', role: 'producer', initials: 'PS' },
    { name: 'Tom B.', role: 'client', initials: 'TB' },
  ];

  return (
    <aside className="w-72 shrink-0 border-l border-gray-100 py-5 px-4 hidden xl:block">
      {/* Active spaces */}
      {spaces.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Active Spaces</h3>
          <div className="space-y-2">
            {spaces.slice(0, 4).map(s => (
              <Link
                key={s.id}
                href={`/spaces/${s.slug}`}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 group"
              >
                <span
                  className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: s.color || '#4840B0' }}
                >
                  {s.name[0]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate group-hover:text-brand-600">{s.name}</div>
                  <div className="text-xs text-gray-400">{s.memberCount} members</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Online now */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Online Now <span className="text-green-500">●</span>
        </h3>
        <div className="space-y-2">
          {SAMPLE_ONLINE.map(m => (
            <div key={m.name} className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-semibold">
                  {m.initials}
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full border border-white" />
              </div>
              <div>
                <div className="text-sm text-gray-800 font-medium leading-none">{m.name}</div>
                <div className="text-[10px] text-gray-400 capitalize mt-0.5">{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming event teaser */}
      <div className="bg-brand-600 rounded-xl p-4 text-white">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-200 mb-1">Next Event</div>
        <div className="font-semibold text-sm leading-snug">Podcast Growth Masterclass</div>
        <div className="text-brand-200 text-xs mt-1">Thu, Apr 18 · 3:00 PM EST</div>
        <Link
          href="/events"
          className="inline-flex items-center gap-1 mt-3 text-xs font-medium bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full transition-colors"
        >
          RSVP →
        </Link>
      </div>
    </aside>
  );
}

// ─── Welcome modal (for users who skipped profile setup) ─────────────────────
function WelcomeModal({ name, onDismiss }: { name: string; onDismiss: () => void }) {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Colourful top banner */}
        <div className="bg-gradient-to-r from-brand-600 to-accent-600 h-24 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">🎙️</span>
          </div>
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 leading-snug">
            Welcome to Podwires Community,<br />
            <span className="text-brand-600">{name}!</span>
          </h2>
          <p className="mt-2.5 text-sm text-gray-500 leading-relaxed">
            Before you get started, don&apos;t forget to complete your profile so the community can get to know you.
          </p>

          <button
            onClick={() => { onDismiss(); router.push('/auth/profile-setup'); }}
            className="mt-5 w-full py-3 rounded-full bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors text-sm"
          >
            Complete your profile
          </button>
          <button
            onClick={onDismiss}
            className="mt-2.5 w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main dashboard page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore();
  const [posts, setPosts]   = useState<Post[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [tab, setTab]       = useState<'all' | 'following' | 'popular'>('all');
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  // Show welcome modal for users who skipped profile setup
  useEffect(() => {
    if (!user) return;
    if (user.profileSetupCompleted) return;
    const dismissed = localStorage.getItem('welcome_modal_dismissed');
    if (!dismissed) setShowWelcome(true);
  }, [user]);

  const dismissWelcome = () => {
    localStorage.setItem('welcome_modal_dismissed', '1');
    setShowWelcome(false);
  };

  useEffect(() => {
    api.getSpaces().then(d => setSpaces(d.spaces)).catch(() => {});
    // Load posts from the open-community space (getSpace returns { space, posts })
    api.getPosts('open-community').then(d => {
      // API returns raw post rows with snake_case — map to Post interface
      const raw: any[] = d.posts ?? [];
      setPosts(raw.map(p => ({
        id: p.id,
        spaceId: p.space_id,
        authorId: p.author_id,
        authorName: p.author_name,
        authorAvatar: p.author_avatar,
        authorRole: p.author_role,
        title: p.title,
        body: p.body,
        postType: p.post_type,
        isPinned: p.is_pinned,
        likeCount: p.like_count ?? 0,
        commentCount: p.comment_count ?? 0,
        createdAt: p.created_at,
      })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (!user) return null;

  const TABS = [
    { id: 'all',       label: 'All Posts' },
    { id: 'following', label: 'Following' },
    { id: 'popular',   label: 'Popular' },
  ] as const;

  return (
    <AppShell>
      {/* Welcome modal for profile-incomplete users */}
      {showWelcome && user && (
        <WelcomeModal name={user.displayName} onDismiss={dismissWelcome} />
      )}

      <div className="flex min-h-full">
        {/* Feed column */}
        <div className="flex-1 min-w-0">
          {/* Top bar */}
          <div className="sticky top-0 bg-white border-b border-gray-100 z-10">
            <div className="px-6 pt-5 pb-0">
              <h1 className="text-lg font-bold text-gray-900">Community Feed</h1>
            </div>

            {/* Tab bar */}
            <div className="flex px-6 gap-1 mt-3">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    tab === t.id
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compose */}
          <ComposeBox user={user} />

          {/* Feed */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-7 h-7 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-400">Loading posts…</span>
              </div>
            </div>
          ) : posts.length === 0 ? (
            <EmptyFeed user={user} />
          ) : (
            <div>
              {posts.map(post => <PostCard key={post.id} post={post} />)}
            </div>
          )}
        </div>

        {/* Right panel */}
        <RightPanel spaces={spaces.filter(s => !s.isLocked)} />
      </div>
    </AppShell>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyFeed({ user }: { user: { role: string } }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
        <span className="text-3xl">🎙️</span>
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Welcome to Podwires Community</h2>
      <p className="text-gray-500 text-sm max-w-sm mb-6">
        {user.role === 'producer'
          ? 'Share your latest work, ask questions, and connect with brands looking for podcast talent.'
          : 'Connect with top podcast producers, share your needs, and build your podcast production team.'}
      </p>
      <div className="flex gap-3">
        <Link
          href="/profile/edit"
          className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-500 transition-colors"
        >
          Complete Profile
        </Link>
        {user.role === 'producer' && (
          <Link
            href="/jobs"
            className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Browse Jobs
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function CommentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </svg>
  );
}
function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}
function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
