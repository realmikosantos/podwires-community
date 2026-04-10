'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { connectSocket, joinProject, leaveProject, emitTyping, getSocket } from '@/lib/socket';
import AppShell from '@/components/AppShell';
import type { Message } from '@/types';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

const statusColors: Record<string, string> = {
  inquiry: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  proposal: 'bg-blue-100 text-blue-800 border-blue-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const statusActions: Record<string, { label: string; next: string; color: string }[]> = {
  inquiry: [
    { label: 'Send Proposal', next: 'proposal', color: 'btn-primary' },
    { label: 'Decline', next: 'cancelled', color: 'btn-secondary text-red-600' },
  ],
  proposal: [
    { label: 'Accept & Start', next: 'active', color: 'btn-primary' },
    { label: 'Cancel', next: 'cancelled', color: 'btn-secondary text-red-600' },
  ],
  active: [
    { label: 'Mark Complete', next: 'completed', color: 'btn-primary' },
  ],
};

function formatMessageDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday ' + format(d, 'h:mm a');
  return format(d, 'MMM d, h:mm a');
}

export default function DealRoomChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getProject(projectId);
      setProject(data.project);
      setMessages(data.messages);
      setStatusHistory(data.statusHistory);
    } catch {
      router.push('/deal-room');
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  // Load project data
  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Socket.io setup for real-time messaging
  useEffect(() => {
    if (!projectId || !user) return;

    let socket: ReturnType<typeof getSocket>;
    try {
      socket = connectSocket();
      joinProject(projectId);

      socket?.on('new-message', (msg: any) => {
        setMessages((prev) => [...prev, msg]);
        setTimeout(scrollToBottom, 100);
      });

      socket?.on('user-typing', (data: { userId: string }) => {
        if (data.userId !== user.id) {
          setTypingUser(data.userId);
          clearTimeout(typingTimeout.current);
          typingTimeout.current = setTimeout(() => setTypingUser(null), 2000);
        }
      });
    } catch {}

    return () => {
      leaveProject(projectId);
      socket?.off('new-message');
      socket?.off('user-typing');
    };
  }, [projectId, user]);

  // Scroll to bottom when messages load
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sending) return;

    setSending(true);
    try {
      const { message } = await api.sendMessage(projectId, messageText);
      // Add to local messages (socket will also deliver, but this ensures instant feedback)
      const exists = messages.find((m) => m.id === message.id);
      if (!exists) {
        setMessages((prev) => [...prev, { ...message, sender_name: user?.displayName }]);
      }
      setMessageText('');
      setTimeout(scrollToBottom, 100);
    } catch {}
    setSending(false);
  };

  const handleTyping = () => {
    emitTyping(projectId);
  };

  const handleStatusChange = async (nextStatus: string) => {
    const note = nextStatus === 'cancelled' ? prompt('Reason for cancellation:') : undefined;
    if (nextStatus === 'cancelled' && note === null) return;

    try {
      await api.updateProjectStatus(projectId, { status: nextStatus, note: note || undefined });
      await loadProject();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  if (loading || !project) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  const otherParty = user?.role === 'client' ? project.producer_name : project.client_name;
  const actions = statusActions[project.status] || [];

  return (
    <AppShell>
      <div className="h-[calc(100vh-56px)] lg:h-screen flex flex-col">
        {/* Chat header */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/deal-room" className="text-gray-400 hover:text-gray-600 shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
            <div className="min-w-0">
              <h2 className="font-semibold truncate">{project.title}</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">with {otherParty}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize border ${statusColors[project.status]}`}>
                  {project.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {actions.map((action) => (
              <button
                key={action.next}
                onClick={() => handleStatusChange(action.next)}
                className={`${action.color} text-xs px-3 py-1.5`}
              >
                {action.label}
              </button>
            ))}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Messages area */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Status history as system messages */}
              {statusHistory.map((h) => (
                <div key={h.id} className="flex justify-center my-3">
                  <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                    {h.changed_by_name} changed status to <strong className="capitalize">{h.to_status}</strong>
                    {h.note && <> &mdash; {h.note}</>}
                    {' '}&middot; {formatDistanceToNow(new Date(h.created_at), { addSuffix: true })}
                  </div>
                </div>
              ))}

              {/* Chat messages */}
              {messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                if (msg.is_system_message) {
                  return (
                    <div key={msg.id} className="flex justify-center my-3">
                      <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                        {msg.body}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={msg.id} className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div className="w-8 h-8 rounded-full bg-brand-200 flex items-center justify-center text-xs font-medium text-brand-700 shrink-0">
                        {msg.sender_avatar ? (
                          <img src={msg.sender_avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          (msg.sender_name || msg.senderId)?.[0]?.toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className={`flex items-center gap-2 mb-0.5 ${isMe ? 'justify-end' : ''}`}>
                          <span className="text-xs font-medium text-gray-700">
                            {isMe ? 'You' : msg.sender_name}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {formatMessageDate(msg.created_at || msg.timestamp)}
                          </span>
                        </div>
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm ${
                            isMe
                              ? 'bg-brand-600 text-white rounded-br-md'
                              : 'bg-gray-100 text-gray-800 rounded-bl-md'
                          }`}
                        >
                          {msg.body}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {typingUser && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-gray-100 rounded-2xl px-4 py-2 rounded-bl-md">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            {project.status !== 'completed' && project.status !== 'cancelled' && (
              <form onSubmit={handleSend} className="border-t border-gray-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleTyping}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim() || sending}
                    className="btn-primary px-4 py-2.5"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Project details sidebar */}
          {showDetails && (
            <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto p-6 hidden md:block">
              <h3 className="font-semibold mb-4">Project Details</h3>

              <div className="space-y-4 text-sm">
                <div>
                  <label className="text-gray-500 text-xs uppercase tracking-wide">Status</label>
                  <div className={`mt-1 inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[project.status]}`}>
                    {project.status}
                  </div>
                </div>

                {project.description && (
                  <div>
                    <label className="text-gray-500 text-xs uppercase tracking-wide">Description</label>
                    <p className="mt-1 text-gray-700">{project.description}</p>
                  </div>
                )}

                {project.budget && (
                  <div>
                    <label className="text-gray-500 text-xs uppercase tracking-wide">Budget</label>
                    <p className="mt-1 font-semibold">${Number(project.budget).toLocaleString()} {project.currency}</p>
                  </div>
                )}

                {project.proposal_amount && (
                  <div>
                    <label className="text-gray-500 text-xs uppercase tracking-wide">Proposal Amount</label>
                    <p className="mt-1 font-semibold">${Number(project.proposal_amount).toLocaleString()}</p>
                  </div>
                )}

                {project.deadline && (
                  <div>
                    <label className="text-gray-500 text-xs uppercase tracking-wide">Deadline</label>
                    <p className="mt-1">{format(new Date(project.deadline), 'MMM d, yyyy')}</p>
                  </div>
                )}

                <div>
                  <label className="text-gray-500 text-xs uppercase tracking-wide">Client</label>
                  <p className="mt-1 font-medium">{project.client_name}</p>
                </div>

                <div>
                  <label className="text-gray-500 text-xs uppercase tracking-wide">Producer</label>
                  <p className="mt-1 font-medium">{project.producer_name}</p>
                </div>

                <div>
                  <label className="text-gray-500 text-xs uppercase tracking-wide">Created</label>
                  <p className="mt-1">{format(new Date(project.created_at), 'MMM d, yyyy')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
