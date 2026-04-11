'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X, Heart, MessageSquare, Share2, Bookmark,
  MoreHorizontal, ChevronDown, Pencil, Check,
  ShieldCheck, ImageIcon, Paperclip, Smile, Link2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import AppShell from '@/components/AppShell';
import type { Post, Space } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    producer: 'bg-brand-50 text-brand-600',
    client:   'bg-green-50 text-green-700',
    admin:    'bg-red-50 text-red-600',
  };
  const labels: Record<string, string> = {
    producer: 'Producer',
    client:   'Brand',
    admin:    'Admin',
  };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${styles[role] ?? 'bg-gray-100 text-gray-500'}`}>
      {labels[role] ?? role}
    </span>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────
function PostCard({
  post,
  isAdmin = false,
}: {
  post: Post & { spaceName?: string; spaceSlug?: string };
  isAdmin?: boolean;
}) {
  const [liked, setLiked]     = useState(false);
  const [likes, setLikes]     = useState(post.likeCount);
  const [saved, setSaved]     = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pinned, setPinned]   = useState(post.isPinned);
  const [menuOpen, setMenuOpen] = useState(false);

  function toggleLike() {
    api.likePost(post.id).catch(() => {});
    setLiked(l => !l);
    setLikes(n => n + (liked ? -1 : 1));
  }

  function togglePin() {
    api.pinPost(post.id).then(r => setPinned(r.isPinned)).catch(() => {});
    setMenuOpen(false);
  }

  const isLong = post.body.length > 280 || post.body.split('\n').filter(Boolean).length > 4;

  return (
    <article className="border-b border-gray-100 px-6 py-5 hover:bg-gray-50/40 transition-colors">
      <div className="flex gap-3">
        <Avatar name={post.authorName} src={post.authorAvatar} size={9} />
        <div className="flex-1 min-w-0">

          {/* Author + meta row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-gray-900 text-sm">{post.authorName}</span>
                <RoleBadge role={post.authorRole} />
                {pinned && (
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full font-semibold">
                    📌 Pinned
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-gray-400">{timeAgo(post.createdAt)}</span>
                {post.spaceSlug && post.spaceName && (
                  <>
                    <span className="text-gray-300 text-[10px]">·</span>
                    <span className="text-xs text-gray-400">Posted in</span>
                    <Link
                      href={`/spaces/${post.spaceSlug}`}
                      className="text-xs text-brand-500 hover:underline font-medium"
                    >
                      {post.spaceName}
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Utility buttons */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => setSaved(s => !s)}
                className={`p-1.5 rounded-lg transition-colors ${saved ? 'text-brand-600' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}
                aria-label="Bookmark"
              >
                <Bookmark className={`w-4 h-4 ${saved ? 'fill-brand-600' : ''}`} />
              </button>

              <button className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors" aria-label="Share">
                <Share2 className="w-4 h-4" />
              </button>

              {/* Three-dot menu */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(m => !m)}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                  aria-label="More options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                      {isAdmin && (
                        <button
                          onClick={togglePin}
                          className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-base">📌</span>
                          {pinned ? 'Unpin post' : 'Pin post'}
                        </button>
                      )}
                      <button
                        onClick={() => setMenuOpen(false)}
                        className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Share2 className="w-4 h-4 text-gray-400" />
                        Copy link
                      </button>
                      <button
                        onClick={() => setMenuOpen(false)}
                        className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <span className="text-base">🚩</span>
                        Report
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Title — links to post detail */}
          {post.title && (
            <Link href={`/posts/${post.id}`}>
              <h3 className="font-bold text-gray-900 mt-2 text-base leading-snug hover:text-brand-600 transition-colors cursor-pointer">
                {post.title}
              </h3>
            </Link>
          )}

          {/* Body */}
          <div className="mt-1.5">
            <p className={`text-gray-700 text-sm leading-relaxed whitespace-pre-line ${!expanded && isLong ? 'line-clamp-4' : ''}`}>
              {post.body}
            </p>
            {isLong && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="text-sm text-brand-500 hover:text-brand-600 font-medium mt-1"
              >
                {expanded ? 'Show less' : 'See more'}
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 mt-3">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                liked ? 'text-brand-600 bg-brand-50' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-brand-600' : ''}`} />
              <span>{likes > 0 ? likes : 'Like'}</span>
            </button>

            <Link
              href={`/posts/${post.id}#comments`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{post.commentCount > 0 ? `${post.commentCount} Comment${post.commentCount !== 1 ? 's' : ''}` : 'Comment'}</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── New Post modal ──────────────────────────────────────────────────────────
interface NewPostModalProps {
  spaces: Space[];
  defaultSpaceId?: string;
  onClose: () => void;
  onPosted: () => void;
}
function NewPostModal({ spaces, defaultSpaceId, onClose, onPosted }: NewPostModalProps) {
  const [spaceId, setSpaceId]   = useState(defaultSpaceId ?? spaces[0]?.id ?? '');
  const [title, setTitle]       = useState('');
  const [body, setBody]         = useState('');
  const [posting, setPosting]   = useState(false);
  const [error, setError]       = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const handlePost = async () => {
    if (!body.trim()) { setError('Post body is required.'); return; }
    if (!spaceId)     { setError('Please select a space.'); return; }
    setPosting(true);
    setError('');
    try {
      await api.createPost({ spaceId, title: title.trim() || undefined, body: body.trim() });
      onPosted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="font-semibold text-gray-900">New Post</span>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          {/* Space selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Post to
            </label>
            <select
              value={spaceId}
              onChange={e => setSpaceId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
            >
              {spaces.filter(s => s.hasAccess && !s.isLocked).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none font-medium"
          />

          {/* Body */}
          <textarea
            ref={textareaRef}
            placeholder="Share something with the community…"
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={6}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
          />

          {/* Toolbar */}
          <div className="flex items-center gap-1">
            {[ImageIcon, Paperclip, Smile, Link2].map((Icon, i) => (
              <button
                key={i}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                type="button"
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Community guidelines apply
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePost}
              disabled={posting || !body.trim()}
              className="px-5 py-2 text-sm font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              {posting ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Posting…</>
              ) : (
                <><Check className="w-3.5 h-3.5" /> Post</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Right panel ──────────────────────────────────────────────────────────────
function RightPanel({ spaces }: { spaces: Space[] }) {
  const [events, setEvents]   = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);

  useEffect(() => {
    // Upcoming events from WP
    api.getEvents().then(d => {
      const now = Date.now();
      const upcoming = (d.events ?? [])
        .filter((e: any) => new Date(e.eventDate || e.date).getTime() >= now - 86400000)
        .slice(0, 3);
      setEvents(upcoming);
    }).catch(() => {});

    // Trending = latest WP blog posts
    api.getBlogPosts().then(d => {
      setTrending((d.posts ?? []).slice(0, 4));
    }).catch(() => {});
  }, []);

  return (
    <aside className="w-64 shrink-0 border-l border-gray-100 py-5 px-4 space-y-7 hidden xl:block">
      {/* Upcoming events */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Upcoming Events</h3>
        <div className="space-y-3">
          {events.length === 0 ? (
            <a href="https://podwires.com/events/" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-brand-600">
              Browse events on podwires.com →
            </a>
          ) : events.map((ev: any) => {
            const d = new Date(ev.eventDate || ev.date);
            const month = d.toLocaleDateString('en-US', { month: 'short' });
            const day   = d.getDate();
            return (
              <a key={ev.id} href={ev.link} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 group">
                <div className="w-9 h-9 rounded-lg bg-brand-50 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] font-semibold text-brand-600 uppercase leading-none">{month}</span>
                  <span className="text-sm font-black text-brand-700 leading-none">{day}</span>
                </div>
                <div>
                  <div
                    className="text-sm font-medium text-gray-800 group-hover:text-brand-600 leading-snug line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: ev.title }}
                  />
                  {ev.eventTime && <div className="text-xs text-gray-400 mt-0.5">{ev.eventTime}</div>}
                </div>
              </a>
            );
          })}
          <Link href="/events" className="text-xs text-brand-600 hover:underline font-medium">
            View all events →
          </Link>
        </div>
      </div>

      {/* Trending — from WP blog */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Trending Posts</h3>
        <div className="space-y-3">
          {trending.length === 0 ? (
            <p className="text-xs text-gray-400">Loading…</p>
          ) : trending.map((t: any) => (
            <a key={t.id} href={t.link} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 group">
              {t.coverImage && (
                <img src={t.coverImage} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
              )}
              {!t.coverImage && t.authorAvatar && (
                <img src={t.authorAvatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <div
                  className="text-sm text-gray-800 group-hover:text-brand-600 leading-snug font-medium line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: t.title }}
                />
                <div className="text-xs text-gray-400 mt-0.5">{t.authorName}</div>
              </div>
            </a>
          ))}
          <a href="https://podwires.com/blog/" target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline font-medium">
            More from the blog →
          </a>
        </div>
      </div>

      {/* Spaces */}
      {spaces.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Spaces</h3>
          <div className="space-y-1">
            {spaces.slice(0, 5).map(s => (
              <Link key={s.id} href={`/spaces/${s.slug}`} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 group">
                <span
                  className="w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                  style={{ backgroundColor: s.color || '#1e3a8a' }}
                >
                  {s.name[0]}
                </span>
                <span className="text-sm text-gray-700 truncate group-hover:text-brand-600">{s.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

// ─── Sort dropdown ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { id: 'latest',    label: 'Latest' },
  { id: 'popular',  label: 'Popular' },
  { id: 'following', label: 'Following' },
] as const;
type SortOption = (typeof SORT_OPTIONS)[number]['id'];

function SortDropdown({ value, onChange }: { value: SortOption; onChange: (v: SortOption) => void }) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find(o => o.id === value)!;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors bg-white"
      >
        {current.label}
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 w-36 bg-white rounded-xl border border-gray-200 shadow-lg z-20 overflow-hidden py-1">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => { onChange(opt.id); setOpen(false); }}
                className={`w-full text-left px-3.5 py-2 text-sm transition-colors ${
                  opt.id === value
                    ? 'text-brand-600 font-semibold bg-brand-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Welcome modal ─────────────────────────────────────────────────────────────
function WelcomeModal({ name, onDismiss }: { name: string; onDismiss: () => void }) {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-brand-600 to-accent-600 h-24 relative flex items-center justify-center">
          <span className="text-5xl">🎙️</span>
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
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

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyFeed({ onNewPost }: { onNewPost: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
        <span className="text-3xl">🎙️</span>
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Nothing here yet</h2>
      <p className="text-gray-500 text-sm max-w-sm mb-6">
        Be the first to share something with the community!
      </p>
      <button
        onClick={onNewPost}
        className="px-5 py-2.5 text-sm font-semibold bg-brand-600 text-white rounded-full hover:bg-brand-500 transition-colors"
      >
        Write the first post
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore();

  type RichPost = Post & { spaceName?: string; spaceSlug?: string };
  const [posts, setPosts]         = useState<RichPost[]>([]);
  const [spaces, setSpaces]       = useState<Space[]>([]);
  const [sort, setSort]           = useState<SortOption>('latest');
  const [loading, setLoading]     = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const loadPosts = () => {
    api.getPosts('open-community').then(d => {
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
        spaceName: p.space_name,
        spaceSlug: p.space_slug,
      })));
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    api.getSpaces().then(d => setSpaces(d.spaces ?? [])).catch(() => {});
    loadPosts();
  }, []);

  // Welcome modal for users who skipped profile setup
  useEffect(() => {
    if (!user) return;
    if (user.profileSetupCompleted) return;
    if (!localStorage.getItem('welcome_modal_dismissed')) setShowWelcome(true);
  }, [user]);

  const dismissWelcome = () => {
    localStorage.setItem('welcome_modal_dismissed', '1');
    setShowWelcome(false);
  };

  if (!user) return null;

  // Apply sort
  const sortedPosts = [...posts].sort((a, b) => {
    if (sort === 'popular')   return (b.likeCount + b.commentCount) - (a.likeCount + a.commentCount);
    if (sort === 'following') return (b.likeCount + b.commentCount) - (a.likeCount + a.commentCount); // placeholder
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <AppShell>
      {/* Welcome modal */}
      {showWelcome && (
        <WelcomeModal name={user.displayName} onDismiss={dismissWelcome} />
      )}

      {/* New post modal */}
      {showNewPost && (
        <NewPostModal
          spaces={spaces}
          onClose={() => setShowNewPost(false)}
          onPosted={() => { setLoading(true); loadPosts(); }}
        />
      )}

      <div className="flex min-h-full">
        {/* ── Feed column ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Sticky top bar */}
          <div className="sticky top-0 bg-white border-b border-gray-100 z-10 px-6 py-3.5 flex items-center gap-3">
            <h1 className="text-base font-bold text-gray-900 flex-1">Feed</h1>

            {/* Sort dropdown */}
            <SortDropdown value={sort} onChange={setSort} />

            {/* New post button */}
            <button
              onClick={() => setShowNewPost(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              New post
            </button>
          </div>

          {/* Start a post strip */}
          <div
            className="flex items-center gap-3 px-6 py-3.5 border-b border-gray-100 cursor-pointer group"
            onClick={() => setShowNewPost(true)}
          >
            <Avatar name={user.displayName} src={user.avatarUrl} size={8} />
            <div className="flex-1 h-10 rounded-full border border-gray-200 bg-gray-50 group-hover:border-brand-400 group-hover:bg-white flex items-center px-4 text-sm text-gray-400 transition-colors">
              Start a post…
            </div>
          </div>

          {/* Feed */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-7 h-7 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-400">Loading posts…</span>
              </div>
            </div>
          ) : sortedPosts.length === 0 ? (
            <EmptyFeed onNewPost={() => setShowNewPost(true)} />
          ) : (
            <div>
              {sortedPosts.map(post => (
                <PostCard key={post.id} post={post} isAdmin={user.role === 'admin'} />
              ))}
            </div>
          )}
        </div>

        {/* ── Right panel ─────────────────────────────────────── */}
        <RightPanel spaces={spaces.filter(s => !s.isLocked)} />
      </div>
    </AppShell>
  );
}
