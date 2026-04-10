'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import AppShell from '@/components/AppShell';
import type { Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface SpaceData {
  id: string;
  slug: string;
  name: string;
  description: string;
  color: string;
  member_count: number;
  post_count: number;
}

interface Comment {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  body: string;
  created_at: string;
}

export default function SpacePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const slug = params.slug as string;

  const [space, setSpace] = useState<SpaceData | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create post
  const [showComposer, setShowComposer] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [postType, setPostType] = useState('discussion');
  const [posting, setPosting] = useState(false);

  // Expanded post (comments)
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState('');
  const [commentingOn, setCommentingOn] = useState<string | null>(null);

  const loadSpace = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getSpace(slug);
      setSpace(data.space);
      setPosts(data.posts);
    } catch (err: any) {
      if (err.message?.includes('403') || err.message?.includes('Access denied')) {
        setError('upgrade');
      } else {
        setError(err.message || 'Failed to load space');
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadSpace();
  }, [loadSpace]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!space || !postBody.trim()) return;
    setPosting(true);
    try {
      const { post } = await api.createPost({
        spaceId: space.id,
        title: postTitle || undefined,
        body: postBody,
        postType,
      });
      setPosts([{ ...post, author_name: user?.displayName, author_role: user?.role }, ...posts]);
      setPostTitle('');
      setPostBody('');
      setShowComposer(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const { liked } = await api.likePost(postId);
      setPosts(posts.map((p) =>
        p.id === postId
          ? { ...p, like_count: liked ? p.like_count + 1 : p.like_count - 1 }
          : p
      ));
    } catch {}
  };

  const handleExpandPost = async (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }
    setExpandedPost(postId);
    if (!comments[postId]) {
      try {
        const data = await api.getPost(postId);
        setComments((prev) => ({ ...prev, [postId]: data.comments }));
      } catch {}
    }
  };

  const handleComment = async (postId: string) => {
    if (!commentText.trim()) return;
    setCommentingOn(postId);
    try {
      const { comment } = await api.createComment(postId, { body: commentText });
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), { ...comment, author_name: user?.displayName }],
      }));
      setPosts(posts.map((p) =>
        p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p
      ));
      setCommentText('');
    } catch {}
    setCommentingOn(null);
  };

  const POST_TYPES = [
    { value: 'discussion', label: 'Discussion' },
    { value: 'question', label: 'Question' },
    { value: 'showcase', label: 'Showcase' },
    { value: 'resource', label: 'Resource' },
  ];

  const postTypeColors: Record<string, string> = {
    discussion: 'bg-blue-100 text-blue-700',
    question: 'bg-purple-100 text-purple-700',
    announcement: 'bg-red-100 text-red-700',
    showcase: 'bg-green-100 text-green-700',
    resource: 'bg-amber-100 text-amber-700',
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (error === 'upgrade') {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto py-20 text-center px-6">
          <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Upgrade Required</h2>
          <p className="text-gray-600 mt-2">This space requires a higher subscription tier.</p>
          <Link href="/settings" className="btn-primary mt-4 inline-flex">
            View Plans
          </Link>
        </div>
      </AppShell>
    );
  }

  if (error || !space) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto py-20 text-center px-6">
          <h2 className="text-xl font-bold">Space not found</h2>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Space header */}
        <div className="flex items-start gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: space.color || '#3B82F6' }}
          >
            <span className="text-white font-bold text-lg">{space.name[0]}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{space.name}</h1>
            {space.description && (
              <p className="text-gray-600 mt-1">{space.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>{space.member_count} members</span>
              <span>{space.post_count} posts</span>
            </div>
          </div>
        </div>

        {/* Post composer */}
        {!showComposer ? (
          <button
            onClick={() => setShowComposer(true)}
            className="w-full card p-4 text-left text-gray-400 hover:text-gray-600 hover:shadow-md transition-all mb-6"
          >
            Share something with the community...
          </button>
        ) : (
          <form onSubmit={handleCreatePost} className="card p-5 mb-6">
            <div className="flex gap-2 mb-3">
              {POST_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setPostType(t.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    postType === t.value
                      ? postTypeColors[t.value]
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Title (optional)"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              className="w-full px-0 py-2 border-0 border-b border-gray-200 text-lg font-medium placeholder-gray-300 focus:outline-none focus:border-brand-500"
            />
            <textarea
              placeholder="Write your post..."
              value={postBody}
              onChange={(e) => setPostBody(e.target.value)}
              rows={4}
              required
              className="w-full px-0 py-3 border-0 resize-none placeholder-gray-300 focus:outline-none text-gray-800"
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowComposer(false)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button type="submit" disabled={posting || !postBody.trim()} className="btn-primary text-sm">
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        )}

        {/* Posts feed */}
        <div className="space-y-4">
          {posts.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg font-medium">No posts yet</p>
              <p className="text-sm mt-1">Be the first to start a conversation!</p>
            </div>
          )}
          {posts.map((post) => (
            <article key={post.id} className="card">
              <div className="p-5">
                {/* Post header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-brand-200 flex items-center justify-center text-sm font-medium text-brand-700">
                    {post.author_avatar ? (
                      <img src={post.author_avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      post.author_name?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{post.author_name}</span>
                      <span className="text-[11px] text-gray-400 capitalize">{post.author_role}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${postTypeColors[post.post_type] || postTypeColors.discussion}`}>
                        {post.post_type}
                      </span>
                    </div>
                  </div>
                  {post.is_pinned && (
                    <span className="ml-auto text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                      Pinned
                    </span>
                  )}
                </div>

                {/* Post content */}
                {post.title && (
                  <h3 className="text-lg font-semibold mb-1">{post.title}</h3>
                )}
                <p className="text-gray-700 whitespace-pre-wrap">{post.body}</p>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                    {post.like_count > 0 && <span>{post.like_count}</span>}
                  </button>
                  <button
                    onClick={() => handleExpandPost(post.id)}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                    </svg>
                    {post.comment_count > 0 && <span>{post.comment_count}</span>}
                    <span>{expandedPost === post.id ? 'Hide' : 'Comments'}</span>
                  </button>
                </div>
              </div>

              {/* Comments section */}
              {expandedPost === post.id && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                  {/* Existing comments */}
                  <div className="space-y-3 mb-4">
                    {(comments[post.id] || []).map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-medium text-brand-700 shrink-0">
                          {comment.author_name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{comment.author_name}</span>
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-0.5">{comment.body}</p>
                        </div>
                      </div>
                    ))}
                    {(comments[post.id] || []).length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-2">No comments yet</p>
                    )}
                  </div>

                  {/* New comment input */}
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-brand-200 flex items-center justify-center text-xs font-medium text-brand-700 shrink-0">
                      {user?.displayName?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={expandedPost === post.id ? commentText : ''}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleComment(post.id)}
                        className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                      />
                      <button
                        onClick={() => handleComment(post.id)}
                        disabled={commentingOn === post.id || !commentText.trim()}
                        className="btn-primary text-sm px-3 py-1.5"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
