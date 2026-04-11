'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Heart, MessageSquare, Bookmark, Share2, MoreHorizontal,
  Pencil, ChevronDown, X, Check, ShieldCheck,
  ImageIcon, Paperclip, Smile, Link2, Users, Lock,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import AppShell from '@/components/AppShell';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60)    return 'just now';
  if (d < 3600)  return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  if (d < 604800) return `${Math.floor(d / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Av({ name, src, size = 9 }: { name?: string; src?: string; size?: number }) {
  const sz = `w-${size} h-${size}`;
  if (src) return <img src={src} alt="" className={`${sz} rounded-full object-cover shrink-0`} />;
  return (
    <div className={`${sz} rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

function RoleBadge({ role }: { role?: string }) {
  if (!role || role === 'producer') return null;
  const styles: Record<string, string> = {
    admin:  'bg-red-50 text-red-600',
    client: 'bg-green-50 text-green-700',
  };
  const label: Record<string, string> = { admin: 'Admin', client: 'Brand' };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${styles[role] ?? 'bg-gray-100 text-gray-500'}`}>
      {label[role] ?? role}
    </span>
  );
}

// ─── Sort dropdown ─────────────────────────────────────────────────────────────
const SORTS = [
  { id: 'latest',  label: 'Latest' },
  { id: 'popular', label: 'Popular' },
] as const;
type SortId = (typeof SORTS)[number]['id'];

function SortDropdown({ value, onChange }: { value: SortId; onChange: (v: SortId) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors bg-white"
      >
        {SORTS.find(s => s.id === value)?.label}
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 w-36 bg-white rounded-xl border border-gray-200 shadow-lg z-20 py-1 overflow-hidden">
            {SORTS.map(s => (
              <button
                key={s.id}
                onClick={() => { onChange(s.id); setOpen(false); }}
                className={`w-full text-left px-3.5 py-2 text-sm transition-colors ${
                  s.id === value ? 'text-brand-600 font-semibold bg-brand-50' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── New post modal ────────────────────────────────────────────────────────────
function NewPostModal({
  spaceId, spaceName, onClose, onPosted,
}: { spaceId: string; spaceName: string; onClose: () => void; onPosted: (post: any) => void }) {
  const [title, setTitle]     = useState('');
  const [body, setBody]       = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError]     = useState('');
  const ta = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ta.current?.focus(); }, []);

  const submit = async () => {
    if (!body.trim()) { setError('Post body is required.'); return; }
    setPosting(true); setError('');
    try {
      const { post } = await api.createPost({ spaceId, title: title.trim() || undefined, body: body.trim() });
      onPosted(post);
      onClose();
    } catch (err: any) { setError(err.message || 'Failed to post.'); }
    finally { setPosting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="font-semibold text-gray-900">New Post in <span className="text-brand-600">{spaceName}</span></span>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {error && <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          <input
            type="text" placeholder="Title (optional)" value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none font-medium"
          />
          <textarea
            ref={ta} placeholder="Share something with this space…" value={body}
            onChange={e => setBody(e.target.value)} rows={5}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
          />
          <div className="flex items-center gap-1">
            {[ImageIcon, Paperclip, Smile, Link2].map((Icon, i) => (
              <button key={i} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Community guidelines apply
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg">Cancel</button>
            <button
              onClick={submit} disabled={posting || !body.trim()}
              className="px-5 py-2 text-sm font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-500 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              {posting
                ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Posting…</>
                : <><Check className="w-3.5 h-3.5" /> Post</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Post card ─────────────────────────────────────────────────────────────────
function PostCard({ post, isAdmin }: { post: any; isAdmin: boolean }) {
  const [liked, setLiked]   = useState(false);
  const [likes, setLikes]   = useState(post.like_count ?? 0);
  const [saved, setSaved]   = useState(false);
  const [pinned, setPinned] = useState(post.is_pinned ?? false);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function toggleLike() {
    api.likePost(post.id).catch(() => {});
    setLiked(l => !l);
    setLikes((n: number) => n + (liked ? -1 : 1));
  }

  const body    = post.body ?? '';
  const isLong  = body.length > 300 || body.split('\n').filter(Boolean).length > 5;
  const commentCount = post.comment_count ?? 0;

  return (
    <article className="border-b border-gray-100 px-6 py-5 hover:bg-gray-50/40 transition-colors">
      <div className="flex gap-3">
        <Av name={post.author_name} src={post.author_avatar} size={9} />
        <div className="flex-1 min-w-0">

          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-gray-900 text-sm">{post.author_name}</span>
                <RoleBadge role={post.author_role} />
                {pinned && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full font-semibold">📌 Pinned</span>}
              </div>
              <span className="text-xs text-gray-400">{timeAgo(post.created_at)}</span>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={() => setSaved(s => !s)} className={`p-1.5 rounded-lg transition-colors ${saved ? 'text-brand-600' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}>
                <Bookmark className={`w-4 h-4 ${saved ? 'fill-brand-600' : ''}`} />
              </button>
              <button className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
              <div className="relative">
                <button onClick={() => setMenuOpen(m => !m)} className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                      {isAdmin && (
                        <button
                          onClick={() => { api.pinPost(post.id).then(r => setPinned(r.isPinned)); setMenuOpen(false); }}
                          className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <span>📌</span> {pinned ? 'Unpin post' : 'Pin post'}
                        </button>
                      )}
                      <button onClick={() => setMenuOpen(false)} className="w-full text-left px-3.5 py-2.5 text-sm text-red-500 hover:bg-red-50">🚩 Report</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Title — links to post detail */}
          {post.title && (
            <Link href={`/posts/${post.id}`}>
              <h3 className="font-bold text-gray-900 mt-1.5 text-base leading-snug hover:text-brand-600 transition-colors">
                {post.title}
              </h3>
            </Link>
          )}

          {/* Body */}
          <div className="mt-1.5">
            <p className={`text-gray-700 text-sm leading-relaxed whitespace-pre-line ${!expanded && isLong ? 'line-clamp-4' : ''}`}>
              {body}
            </p>
            {isLong && (
              <button onClick={() => setExpanded(e => !e)} className="text-sm text-brand-500 hover:text-brand-600 font-medium mt-0.5">
                {expanded ? 'Show less' : 'See more'}
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 mt-3">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${liked ? 'text-brand-600 bg-brand-50' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-brand-600' : ''}`} />
              {likes > 0 ? likes : 'Like'}
            </button>
            <Link
              href={`/posts/${post.id}#comments`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              {commentCount > 0 ? `${commentCount} Comment${commentCount !== 1 ? 's' : ''}` : 'Comment'}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Space page ────────────────────────────────────────────────────────────────
export default function SpacePage() {
  const params   = useParams();
  const slug     = params.slug as string;
  const { user } = useAuthStore();

  const [space, setSpace]     = useState<any>(null);
  const [posts, setPosts]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [sort, setSort]       = useState<SortId>('latest');
  const [joined, setJoined]   = useState(false);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getSpace(slug);
      setSpace(data.space);
      setPosts(data.posts ?? []);
      setJoined(true); // if we can load it, user has access
    } catch (err: any) {
      setError(err.message?.includes('403') ? 'upgrade' : err.message ?? 'error');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const handleJoin = async () => {
    try { await api.joinSpace(slug); setJoined(true); } catch {}
  };

  const handleNewPost = (post: any) => {
    setPosts(prev => [{
      ...post,
      author_name: user?.displayName,
      author_role: user?.role,
      author_avatar: user?.avatarUrl,
    }, ...prev]);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24">
          <div className="w-7 h-7 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (error === 'upgrade') {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto py-24 text-center px-6">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Upgrade Required</h2>
          <p className="text-gray-500 mt-2 text-sm">This space requires a higher subscription tier.</p>
          <Link href="/settings" className="mt-5 inline-flex px-5 py-2.5 rounded-full bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors">
            View Plans
          </Link>
        </div>
      </AppShell>
    );
  }

  if (!space) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto py-24 text-center px-6">
          <h2 className="text-xl font-bold text-gray-900">Space not found</h2>
          <Link href="/dashboard" className="text-brand-600 text-sm mt-2 inline-block hover:underline">← Back to Feed</Link>
        </div>
      </AppShell>
    );
  }

  const sortedPosts = [...posts].sort((a, b) => {
    // Pinned always first
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    if (sort === 'popular') return ((b.like_count ?? 0) + (b.comment_count ?? 0)) - ((a.like_count ?? 0) + (a.comment_count ?? 0));
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const isAdmin = user?.role === 'admin';

  return (
    <AppShell>
      {showModal && (
        <NewPostModal
          spaceId={space.id}
          spaceName={space.name}
          onClose={() => setShowModal(false)}
          onPosted={handleNewPost}
        />
      )}

      {/* ── Space header ─────────────────────────────────────────── */}
      <div className="border-b border-gray-100 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Space icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xl"
              style={{ backgroundColor: space.color || '#4840B0' }}
            >
              {space.name[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{space.name}</h1>
              {space.description && (
                <p className="text-sm text-gray-500 mt-0.5 max-w-lg">{space.description}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {space.member_count ?? 0} members
                </span>
                <span>·</span>
                <span>{space.post_count ?? 0} posts</span>
              </div>
            </div>
          </div>

          {/* Join button */}
          <button
            onClick={handleJoin}
            disabled={joined}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors shrink-0 ${
              joined
                ? 'bg-gray-100 text-gray-500 cursor-default'
                : 'bg-brand-600 hover:bg-brand-500 text-white'
            }`}
          >
            {joined ? '✓ Member' : 'Join space'}
          </button>
        </div>
      </div>

      {/* ── Feed controls ────────────────────────────────────────── */}
      <div className="sticky top-14 bg-white border-b border-gray-100 z-10 px-6 py-3 flex items-center gap-3">
        <SortDropdown value={sort} onChange={setSort} />
        <div className="flex-1" />
        {/* Start a post strip */}
        <div
          className="hidden sm:flex items-center gap-2 flex-1 max-w-sm h-9 rounded-full border border-gray-200 bg-gray-50 px-4 text-sm text-gray-400 cursor-pointer hover:border-brand-400 hover:bg-white transition-colors"
          onClick={() => setShowModal(true)}
        >
          Start a post…
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          New post
        </button>
      </div>

      {/* ── Post list ────────────────────────────────────────────── */}
      {sortedPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <span className="text-2xl">📝</span>
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">No posts yet</h2>
          <p className="text-sm text-gray-400 max-w-xs mb-5">Be the first to share something in {space.name}!</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-full bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors"
          >
            Write the first post
          </button>
        </div>
      ) : (
        <div>
          {sortedPosts.map(post => (
            <PostCard key={post.id} post={post} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
