'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Heart, MessageSquare, Bookmark, Share2,
  MoreHorizontal, Send, ImageIcon, Paperclip, Smile,
  Link2, Mic, Video, ChevronDown,
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
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Av({ name, src, size = 9 }: { name?: string; src?: string; size?: number }) {
  const sz = `w-${size} h-${size}`;
  if (src) return <img src={src} alt="" className={`${sz} rounded-full object-cover shrink-0`} />;
  return (
    <div className={`${sz} rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm shrink-0`}>
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────
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

// ─── GIF icon ─────────────────────────────────────────────────────────────────
function GifIcon() {
  return (
    <span className="text-[11px] font-bold text-gray-400 leading-none border border-gray-300 rounded px-0.5">
      GIF
    </span>
  );
}

// ─── Comment compose ──────────────────────────────────────────────────────────
function CommentCompose({
  avatar, name, onSubmit, autoFocus = false, placeholder = 'Write a comment…',
}: {
  avatar?: string; name?: string; onSubmit: (body: string, parentId?: string) => Promise<void>;
  autoFocus?: boolean; placeholder?: string;
}) {
  const [body, setBody]       = useState('');
  const [posting, setPosting] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (autoFocus) textRef.current?.focus(); }, [autoFocus]);

  const submit = async () => {
    if (!body.trim() || posting) return;
    setPosting(true);
    try { await onSubmit(body.trim()); setBody(''); } finally { setPosting(false); }
  };

  return (
    <div className="flex gap-3">
      <Av name={name} src={avatar} size={8} />
      <div className="flex-1 border border-gray-200 rounded-2xl bg-gray-50 focus-within:bg-white focus-within:border-gray-300 focus-within:ring-1 focus-within:ring-brand-300 transition-all overflow-hidden">
        <textarea
          ref={textRef}
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
          placeholder={placeholder}
          rows={2}
          className="w-full px-4 pt-3 pb-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent resize-none outline-none"
        />
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          <div className="flex items-center gap-0.5">
            {[
              { icon: <span className="text-[13px] font-bold text-gray-400">/</span>,     title: 'Slash commands' },
              { icon: <Link2 className="w-3.5 h-3.5" />,    title: 'Link to post' },
              { icon: <Paperclip className="w-3.5 h-3.5" />, title: 'Attach file' },
              { icon: <Video className="w-3.5 h-3.5" />,     title: 'Attach video' },
              { icon: <GifIcon />,                             title: 'Add GIF' },
              { icon: <ImageIcon className="w-3.5 h-3.5" />, title: 'Add image' },
              { icon: <Smile className="w-3.5 h-3.5" />,     title: 'Add emoji' },
              { icon: <Mic className="w-3.5 h-3.5" />,       title: 'Voice message' },
            ].map((item, i) => (
              <button
                key={i} type="button" title={item.title}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {item.icon}
              </button>
            ))}
          </div>
          <button
            onClick={submit}
            disabled={!body.trim() || posting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold disabled:opacity-40 transition-colors"
          >
            {posting
              ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
              : <><Send className="w-3 h-3" /> Post</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Single comment ───────────────────────────────────────────────────────────
interface CommentData {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  author_role?: string;
  body: string;
  created_at: string;
  parent_id?: string;
  like_count?: number;
  replies?: CommentData[];
}

function CommentCard({
  comment, depth = 0, isAdmin = false, currentUser, onReply,
}: {
  comment: CommentData; depth?: number; isAdmin?: boolean;
  currentUser?: { displayName: string; avatarUrl?: string };
  onReply: (parentId: string, body: string) => Promise<void>;
}) {
  const [liked, setLiked]         = useState(false);
  const [likes, setLikes]         = useState(comment.like_count ?? 0);
  const [showReply, setShowReply] = useState(false);
  const [expanded, setExpanded]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const isLong = comment.body.length > 300;

  return (
    <div className={depth > 0 ? 'ml-10 mt-3' : ''}>
      <div className="flex gap-3">
        <Av name={comment.author_name} src={comment.author_avatar} size={depth > 0 ? 7 : 8} />
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-gray-900">{comment.author_name}</span>
              <RoleBadge role={comment.author_role} />
              <span className="text-xs text-gray-400">{timeAgo(comment.created_at)}</span>
            </div>
            <div className="relative shrink-0">
              <button
                onClick={() => setMenuOpen(m => !m)}
                className="p-1 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                    <button onClick={() => setMenuOpen(false)} className="w-full text-left px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50">Copy text</button>
                    <button onClick={() => setMenuOpen(false)} className="w-full text-left px-3.5 py-2 text-sm text-red-500 hover:bg-red-50">Report</button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Body */}
          <p className={`text-sm text-gray-700 leading-relaxed mt-1 whitespace-pre-line ${!expanded && isLong ? 'line-clamp-4' : ''}`}>
            {comment.body}
          </p>
          {isLong && (
            <button onClick={() => setExpanded(e => !e)} className="text-xs text-brand-500 font-medium mt-0.5">
              {expanded ? 'Show less' : 'See more'}
            </button>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => { setLiked(l => !l); setLikes(n => n + (liked ? -1 : 1)); }}
              className={`flex items-center gap-1 text-xs font-medium transition-colors ${liked ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-brand-600' : ''}`} />
              {likes > 0 ? `${likes} Like${likes !== 1 ? 's' : ''}` : 'Like'}
            </button>
            <button
              onClick={() => setShowReply(r => !r)}
              className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              Reply
            </button>
          </div>

          {/* Reply compose */}
          {showReply && currentUser && (
            <div className="mt-3">
              <CommentCompose
                avatar={currentUser.avatarUrl}
                name={currentUser.displayName}
                autoFocus
                placeholder={`Reply to ${comment.author_name}…`}
                onSubmit={async (body) => {
                  await onReply(comment.id, body);
                  setShowReply(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies?.map(reply => (
        <CommentCard
          key={reply.id} comment={reply} depth={depth + 1}
          isAdmin={isAdmin} currentUser={currentUser} onReply={onReply}
        />
      ))}
    </div>
  );
}

// ─── Post detail page ─────────────────────────────────────────────────────────
export default function PostDetailPage() {
  const params   = useParams();
  const postId   = params.id as string;
  const { user } = useAuthStore();

  const [post, setPost]           = useState<any>(null);
  const [comments, setComments]   = useState<CommentData[]>([]);
  const [loading, setLoading]     = useState(true);
  const [liked, setLiked]         = useState(false);
  const [likes, setLikes]         = useState(0);
  const [saved, setSaved]         = useState(false);
  const [pinned, setPinned]       = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [showMore, setShowMore]   = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const commentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getPost(postId).then(data => {
      setPost(data.post);
      setLikes(data.post.like_count ?? 0);
      setLiked(data.post.liked_by_me ?? false);
      setPinned(data.post.is_pinned ?? false);
      // Build threaded structure
      const flat: CommentData[] = data.comments ?? [];
      setComments(buildTree(flat));
      setShowMore(flat.length >= 20);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [postId]);

  function buildTree(flat: CommentData[]): CommentData[] {
    const map: Record<string, CommentData> = {};
    const roots: CommentData[] = [];
    flat.forEach(c => { map[c.id] = { ...c, replies: [] }; });
    flat.forEach(c => {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].replies!.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    });
    return roots;
  }

  function addCommentToTree(newComment: CommentData) {
    const withReplies = { ...newComment, replies: [] };
    if (newComment.parent_id) {
      setComments(prev => addReply(prev, newComment.parent_id!, withReplies));
    } else {
      setComments(prev => [...prev, withReplies]);
    }
  }

  function addReply(nodes: CommentData[], parentId: string, reply: CommentData): CommentData[] {
    return nodes.map(n => {
      if (n.id === parentId) return { ...n, replies: [...(n.replies ?? []), reply] };
      if (n.replies?.length) return { ...n, replies: addReply(n.replies, parentId, reply) };
      return n;
    });
  }

  const handleTopLevelComment = async (body: string) => {
    const { comment } = await api.createComment(postId, { body });
    addCommentToTree({
      ...comment,
      author_name: user?.displayName ?? '',
      author_avatar: user?.avatarUrl,
      author_role: user?.role,
    });
    setPost((p: any) => p ? { ...p, comment_count: (p.comment_count ?? 0) + 1 } : p);
  };

  const handleReply = async (parentId: string, body: string) => {
    const { comment } = await api.createComment(postId, { body, parentId });
    addCommentToTree({
      ...comment,
      author_name: user?.displayName ?? '',
      author_avatar: user?.avatarUrl,
      author_role: user?.role,
      parent_id: parentId,
    });
    setPost((p: any) => p ? { ...p, comment_count: (p.comment_count ?? 0) + 1 } : p);
  };

  const scrollToComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  if (!post) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto py-24 text-center px-6">
          <h2 className="text-lg font-semibold text-gray-900">Post not found</h2>
          <Link href="/dashboard" className="text-brand-600 text-sm mt-2 inline-block hover:underline">Back to Feed</Link>
        </div>
      </AppShell>
    );
  }

  const spaceSlug = post.space_slug;
  const spaceName = post.space_name;
  const totalComments = post.comment_count ?? 0;

  return (
    <AppShell>
      {/* ── Back bar ──────────────────────────────────────────── */}
      <div className="sticky top-14 z-10 bg-white border-b border-gray-100 px-4 py-2.5 flex items-center gap-3">
        <Link
          href={spaceSlug ? `/spaces/${spaceSlug}` : '/dashboard'}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {spaceName ?? 'Feed'}
        </Link>
        {spaceSlug && (
          <>
            <span className="text-gray-200">·</span>
            <Link href={`/spaces/${spaceSlug}`} className="flex items-center gap-1.5 text-sm">
              {post.space_color && (
                <span
                  className="w-4 h-4 rounded shrink-0 flex items-center justify-center text-white text-[9px] font-bold"
                  style={{ backgroundColor: post.space_color }}
                >
                  {spaceName?.[0]}
                </span>
              )}
              <span className="font-semibold text-gray-800">{spaceName}</span>
            </Link>
          </>
        )}
      </div>

      {/* ── Post content ───────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-5 py-7">

        {/* Author row */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <Av name={post.author_name} src={post.author_avatar} size={10} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-gray-900 text-sm">{post.author_name}</span>
                <RoleBadge role={post.author_role} />
                {pinned && (
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full font-semibold">📌 Pinned</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
                {spaceName && (
                  <>
                    <span>Posted in</span>
                    <Link href={`/spaces/${spaceSlug}`} className="text-brand-500 hover:underline font-medium">{spaceName}</Link>
                    <span>·</span>
                  </>
                )}
                <span>{timeAgo(post.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Post action buttons */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => setSaved(s => !s)}
              className={`p-2 rounded-lg transition-colors ${saved ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            >
              <Bookmark className={`w-4.5 h-4.5 ${saved ? 'fill-brand-600' : ''}`} style={{ width: 18, height: 18 }} />
            </button>
            <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <Share2 style={{ width: 18, height: 18 }} />
            </button>
            {/* Three-dot */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(m => !m)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <MoreHorizontal style={{ width: 18, height: 18 }} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => { api.pinPost(postId).then(r => setPinned(r.isPinned)); setMenuOpen(false); }}
                        className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <span>📌</span> {pinned ? 'Unpin post' : 'Pin post'}
                      </button>
                    )}
                    <button onClick={() => setMenuOpen(false)} className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <Share2 className="w-4 h-4 text-gray-400" /> Copy link
                    </button>
                    <button onClick={() => setMenuOpen(false)} className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-500 hover:bg-red-50">
                      <span>🚩</span> Report
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        {post.title && (
          <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-3">{post.title}</h1>
        )}

        {/* Body */}
        <div className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-line">
          {post.body}
        </div>

        {/* Engagement row */}
        <div className="flex items-center gap-1 mt-6 pt-5 border-t border-gray-100">
          <button
            onClick={() => {
              api.likePost(postId).catch(() => {});
              setLiked(l => !l);
              setLikes(n => n + (liked ? -1 : 1));
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              liked ? 'text-brand-600 bg-brand-50' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-brand-600' : ''}`} />
            {likes > 0 ? `${likes} Like${likes !== 1 ? 's' : ''}` : 'Like'}
          </button>

          <button
            onClick={scrollToComments}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            {totalComments > 0 ? `${totalComments} Comment${totalComments !== 1 ? 's' : ''}` : 'Comment'}
          </button>
        </div>
      </div>

      {/* ── Comments section ────────────────────────────────────── */}
      <div ref={commentsRef} className="max-w-2xl mx-auto px-5 pb-16">
        <div className="border-t-2 border-gray-100 pt-6">
          <h2 className="text-base font-bold text-gray-900 mb-5">
            {totalComments > 0 ? `${totalComments} Comment${totalComments !== 1 ? 's' : ''}` : 'Comments'}
          </h2>

          {/* Comment compose at top */}
          {user && (
            <div className="mb-7">
              <CommentCompose
                avatar={user.avatarUrl}
                name={user.displayName}
                onSubmit={handleTopLevelComment}
                placeholder="Write a comment…"
              />
            </div>
          )}

          {/* Comment list */}
          <div className="space-y-6">
            {comments.map(comment => (
              <CommentCard
                key={comment.id}
                comment={comment}
                isAdmin={user?.role === 'admin'}
                currentUser={user ? { displayName: user.displayName, avatarUrl: user.avatarUrl } : undefined}
                onReply={handleReply}
              />
            ))}
          </div>

          {/* Show more */}
          {showMore && (
            <button
              onClick={() => {/* future pagination */}}
              disabled={loadingMore}
              className="mt-6 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              {loadingMore
                ? <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                : <><ChevronDown className="w-4 h-4" /> Show more comments</>
              }
            </button>
          )}

          {comments.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">No comments yet. Be the first!</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
