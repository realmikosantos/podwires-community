'use client';

import { useState } from 'react';
import AppShell from '@/components/AppShell';
import { useAuthStore } from '@/lib/auth-store';

// ─── Fake attendees ───────────────────────────────────────────────────────────
const SAMPLE_ATTENDEES = [
  { id: '1', name: 'Marcus Webb',   role: 'producer', initials: 'MW', speaking: true },
  { id: '2', name: 'Sarah Kim',     role: 'client',   initials: 'SK', speaking: false },
  { id: '3', name: 'Alex Rivera',   role: 'producer', initials: 'AR', speaking: false },
  { id: '4', name: 'Priya Singh',   role: 'producer', initials: 'PS', speaking: false },
  { id: '5', name: 'Tom Baker',     role: 'client',   initials: 'TB', speaking: false },
  { id: '6', name: 'Dana Lee',      role: 'producer', initials: 'DL', speaking: false },
];

const SAMPLE_CHAT = [
  { id: '1', name: 'Marcus Webb',   body: 'Welcome everyone! Glad you could join.',              time: '14:02' },
  { id: '2', name: 'Sarah Kim',     body: 'Excited for this one 🎙️',                            time: '14:03' },
  { id: '3', name: 'Alex Rivera',   body: 'Quick question — are we recording this session?',    time: '14:03' },
  { id: '4', name: 'Marcus Webb',   body: 'Yes! Recording will be posted in Events > Recordings', time: '14:04' },
  { id: '5', name: 'Priya Singh',   body: '👍',                                                  time: '14:04' },
  { id: '6', name: 'Dana Lee',      body: 'Can\'t wait to hear the tips on rate negotiation',    time: '14:05' },
];

// ─── Attendee tile ────────────────────────────────────────────────────────────
function AttendeeTile({ a, isYou }: { a: typeof SAMPLE_ATTENDEES[0]; isYou?: boolean }) {
  const colors: Record<string, string> = {
    producer: 'bg-brand-600',
    client:   'bg-green-600',
    admin:    'bg-red-600',
  };
  return (
    <div className={`relative aspect-video rounded-xl flex flex-col items-center justify-center gap-2 ${
      a.speaking ? 'ring-2 ring-green-400' : 'bg-ink-700'
    } overflow-hidden`}>
      {/* Background gradient */}
      <div className={`absolute inset-0 ${colors[a.role] ?? 'bg-brand-600'} opacity-10`} />

      {/* Avatar */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold z-10 ${colors[a.role] ?? 'bg-brand-600'}`}>
        {a.initials}
      </div>
      <span className="text-xs text-white/80 z-10">{isYou ? `${a.name} (You)` : a.name}</span>

      {/* Speaking indicator */}
      {a.speaking && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-green-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          Speaking
        </div>
      )}

      {/* Mute icon if not speaking */}
      {!a.speaking && (
        <div className="absolute bottom-2 right-2">
          <MicOffIcon className="w-3.5 h-3.5 text-white/40" />
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LivePage() {
  const { user } = useAuthStore();
  const [inRoom, setInRoom]     = useState(false);
  const [micOn, setMicOn]       = useState(true);
  const [camOn, setCamOn]       = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [chatMsg, setChatMsg]   = useState('');
  const [messages, setMessages] = useState(SAMPLE_CHAT);

  function sendMsg() {
    if (!chatMsg.trim()) return;
    setMessages(m => [...m, {
      id: String(Date.now()),
      name: user?.displayName ?? 'You',
      body: chatMsg.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    }]);
    setChatMsg('');
  }

  if (!inRoom) {
    return (
      <AppShell>
        {/* Pre-join lobby */}
        <div className="min-h-full bg-ink-900 flex flex-col items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center">
            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <VideoIcon className="w-10 h-10 text-red-400" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">Community Live Room</h1>
            <p className="text-ink-400 text-sm mb-8">
              Join the live session — ask questions, share your screen, and connect in real time.
            </p>

            {/* Session info */}
            <div className="bg-ink-800 border border-ink-700 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Live Now</span>
              </div>
              <div className="font-semibold text-white">Podcast Growth Masterclass</div>
              <div className="text-ink-400 text-sm mt-1">Hosted by Marcus Webb · {SAMPLE_ATTENDEES.length} attendees</div>
            </div>

            {/* Camera / mic preview */}
            <div className="bg-ink-800 border border-ink-700 rounded-xl p-4 mb-6">
              <div className="aspect-video bg-ink-900 rounded-lg flex items-center justify-center mb-4">
                {camOn ? (
                  <div className="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.displayName?.[0] ?? '?'}
                  </div>
                ) : (
                  <CamOffIcon className="w-8 h-8 text-ink-500" />
                )}
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setMicOn(!micOn)}
                  className={`p-3 rounded-full border transition-colors ${
                    micOn ? 'bg-ink-700 border-ink-600 text-white' : 'bg-red-500/20 border-red-500/30 text-red-400'
                  }`}
                >
                  {micOn ? <MicIcon className="w-5 h-5" /> : <MicOffIcon className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setCamOn(!camOn)}
                  className={`p-3 rounded-full border transition-colors ${
                    camOn ? 'bg-ink-700 border-ink-600 text-white' : 'bg-red-500/20 border-red-500/30 text-red-400'
                  }`}
                >
                  {camOn ? <CamIcon className="w-5 h-5" /> : <CamOffIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => setInRoom(true)}
              className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-500 transition-colors"
            >
              Join Session
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── In-room view ────────────────────────────────────────────────────────────
  return (
    <AppShell>
      <div className="h-full bg-ink-900 flex flex-col">

        {/* Room header */}
        <div className="h-12 border-b border-ink-700 flex items-center px-4 gap-3 shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Live</span>
          </span>
          <span className="text-white font-medium text-sm">Podcast Growth Masterclass</span>
          <span className="text-ink-400 text-xs ml-2">{SAMPLE_ATTENDEES.length} attendees</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className={`p-1.5 rounded-md transition-colors text-sm ${
                chatOpen ? 'bg-ink-700 text-white' : 'text-ink-400 hover:text-white hover:bg-ink-700'
              }`}
            >
              <ChatIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setInRoom(false)}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors"
            >
              Leave
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Video grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Current user */}
              <AttendeeTile
                a={{ id: 'me', name: user?.displayName ?? 'You', role: user?.role ?? 'producer', initials: user?.displayName?.[0] ?? '?', speaking: false }}
                isYou
              />
              {/* Other attendees */}
              {SAMPLE_ATTENDEES.map(a => <AttendeeTile key={a.id} a={a} />)}
            </div>
          </div>

          {/* Chat sidebar */}
          {chatOpen && (
            <div className="w-72 border-l border-ink-700 flex flex-col shrink-0">
              <div className="px-4 py-3 border-b border-ink-700">
                <span className="text-sm font-semibold text-white">Chat</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map(m => (
                  <div key={m.id} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {m.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-semibold text-white">{m.name}</span>
                        <span className="text-[10px] text-ink-500">{m.time}</span>
                      </div>
                      <p className="text-xs text-ink-300 mt-0.5 leading-relaxed">{m.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-ink-700 p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMsg}
                    onChange={e => setChatMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMsg()}
                    placeholder="Message…"
                    className="flex-1 bg-ink-700 border border-ink-600 rounded-lg px-3 py-1.5 text-xs text-white placeholder-ink-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <button
                    onClick={sendMsg}
                    disabled={!chatMsg.trim()}
                    className="p-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-500 disabled:opacity-40 transition-colors"
                  >
                    <SendIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls bar */}
        <div className="h-16 border-t border-ink-700 flex items-center justify-center gap-4 shrink-0">
          <button
            onClick={() => setMicOn(!micOn)}
            title={micOn ? 'Mute' : 'Unmute'}
            className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${
              micOn ? 'bg-ink-700 text-white hover:bg-ink-600' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {micOn ? <MicIcon className="w-5 h-5" /> : <MicOffIcon className="w-5 h-5" />}
            <span className="text-[9px]">{micOn ? 'Mute' : 'Unmuted'}</span>
          </button>

          <button
            onClick={() => setCamOn(!camOn)}
            title={camOn ? 'Stop Camera' : 'Start Camera'}
            className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${
              camOn ? 'bg-ink-700 text-white hover:bg-ink-600' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {camOn ? <CamIcon className="w-5 h-5" /> : <CamOffIcon className="w-5 h-5" />}
            <span className="text-[9px]">{camOn ? 'Cam' : 'No Cam'}</span>
          </button>

          <button
            className="flex flex-col items-center gap-0.5 p-2 rounded-xl bg-ink-700 text-white hover:bg-ink-600 transition-colors"
          >
            <ScreenIcon className="w-5 h-5" />
            <span className="text-[9px]">Share</span>
          </button>

          <button
            className="flex flex-col items-center gap-0.5 p-2 rounded-xl bg-ink-700 text-white hover:bg-ink-600 transition-colors"
          >
            <HandIcon className="w-5 h-5" />
            <span className="text-[9px]">Raise</span>
          </button>

          <button
            onClick={() => setInRoom(false)}
            className="flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-500 transition-colors"
          >
            <PhoneOffIcon className="w-5 h-5" />
            <span className="text-[9px]">Leave</span>
          </button>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect width="15" height="14" x="1" y="5" rx="2" ry="2" />
    </svg>
  );
}
function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}
function MicOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
      <path d="M5 10v2a7 7 0 0 0 12 5" />
      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}
function CamIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect width="15" height="14" x="1" y="5" rx="2" ry="2" />
    </svg>
  );
}
function CamOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M10.66 6H14a2 2 0 0 1 2 2v2.34l1 1L23 7v10" />
      <path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2l10 10Z" />
    </svg>
  );
}
function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function ScreenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="15" x="2" y="3" rx="2" />
      <polyline points="8 21 12 17 16 21" />
    </svg>
  );
}
function HandIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
      <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  );
}
function PhoneOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.43 9.88a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.34 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.32 8.91" />
      <line x1="23" x2="1" y1="1" y2="23" />
    </svg>
  );
}
function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" x2="11" y1="2" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
