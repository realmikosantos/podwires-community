'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';

// ─── Sample event data (production: fetch from API) ───────────────────────────
const EVENTS = [
  {
    id: '1',
    title: 'Podcast Growth Masterclass',
    description: 'Join us for an in-depth session on growing your podcast audience through strategic partnerships and content marketing.',
    host: 'Marcus Webb',
    hostRole: 'producer',
    date: '2026-04-18',
    time: '3:00 PM EST',
    duration: '90 min',
    type: 'webinar',
    rsvpCount: 48,
    maxCapacity: 100,
    isFree: true,
    tags: ['growth', 'marketing', 'strategy'],
    coverColor: '#4840B0',
  },
  {
    id: '2',
    title: 'Brand–Podcast Pitch Workshop',
    description: 'Learn how to craft compelling pitches to brands and secure sponsorships for your podcast.',
    host: 'Sarah Kim',
    hostRole: 'client',
    date: '2026-04-24',
    time: '2:00 PM EST',
    duration: '60 min',
    type: 'workshop',
    rsvpCount: 22,
    maxCapacity: 40,
    isFree: false,
    price: 29,
    tags: ['sponsorship', 'pitching', 'brands'],
    coverColor: '#7c3aed',
  },
  {
    id: '3',
    title: 'Community AMA — Production Rates 2026',
    description: 'Open ask-me-anything session covering current market rates, negotiation tips, and contract best practices.',
    host: 'Podwires Team',
    hostRole: 'admin',
    date: '2026-05-02',
    time: '1:00 PM EST',
    duration: '45 min',
    type: 'ama',
    rsvpCount: 91,
    maxCapacity: 200,
    isFree: true,
    tags: ['rates', 'negotiation', 'community'],
    coverColor: '#059669',
  },
  {
    id: '4',
    title: 'Weekly Community Meetup',
    description: 'Our recurring weekly meetup — share wins, ask questions, and connect with the community.',
    host: 'Community Team',
    hostRole: 'admin',
    date: '2026-04-15',
    time: '5:00 PM EST',
    duration: '30 min',
    type: 'meetup',
    rsvpCount: 15,
    maxCapacity: 50,
    isFree: true,
    tags: ['community', 'weekly'],
    coverColor: '#d97706',
  },
];

const PAST_EVENTS = [
  {
    id: 'p1',
    title: 'Podcast Monetisation Strategies',
    date: '2026-03-28',
    host: 'Alex Rivera',
    duration: '75 min',
    recordingUrl: '#',
    coverColor: '#4840B0',
  },
  {
    id: 'p2',
    title: 'Intro to Remote Recording',
    date: '2026-03-14',
    host: 'Dana Lee',
    duration: '60 min',
    recordingUrl: '#',
    coverColor: '#7c3aed',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

const TYPE_LABELS: Record<string, string> = {
  webinar: '🎓 Webinar',
  workshop: '🛠 Workshop',
  ama: '💬 AMA',
  meetup: '☕ Meetup',
};

// ─── RSVP button ─────────────────────────────────────────────────────────────
function RsvpButton({ event }: { event: typeof EVENTS[0] }) {
  const [rsvp'd, setRsvpd] = useState(false);

  if (rsvp'd) {
    return (
      <button
        onClick={() => setRsvpd(false)}
        className="px-4 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
      >
        ✓ Going
      </button>
    );
  }

  if (!event.isFree && event.price) {
    return (
      <button
        onClick={() => setRsvpd(true)}
        className="px-4 py-1.5 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-500 transition-colors"
      >
        Buy Ticket · ${event.price}
      </button>
    );
  }

  return (
    <button
      onClick={() => setRsvpd(true)}
      className="px-4 py-1.5 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-500 transition-colors"
    >
      RSVP — Free
    </button>
  );
}

// ─── Event card ───────────────────────────────────────────────────────────────
function EventCard({ event }: { event: typeof EVENTS[0] }) {
  const pct = Math.round((event.rsvpCount / event.maxCapacity) * 100);
  const isAlmostFull = pct >= 80;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white">
      {/* Color header */}
      <div className="h-2" style={{ backgroundColor: event.coverColor }} />

      <div className="p-5">
        {/* Meta */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-gray-500">{TYPE_LABELS[event.type] ?? event.type}</span>
          {!event.isFree && (
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
              Paid · ${event.price}
            </span>
          )}
          {event.isFree && (
            <span className="text-xs font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
              Free
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-base leading-snug mb-1">{event.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>

        {/* Date / time */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <CalendarIcon className="w-3.5 h-3.5" />
            {formatDate(event.date)}
          </span>
          <span className="flex items-center gap-1">
            <ClockIcon className="w-3.5 h-3.5" />
            {event.time} · {event.duration}
          </span>
        </div>

        {/* Host */}
        <div className="flex items-center gap-2 mt-3">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
            style={{ backgroundColor: event.coverColor }}
          >
            {event.host[0]}
          </div>
          <span className="text-xs text-gray-600">Hosted by <strong>{event.host}</strong></span>
        </div>

        {/* RSVP bar + button */}
        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
              <span>{event.rsvpCount} going</span>
              {isAlmostFull && (
                <span className="text-amber-600 font-medium">Almost full!</span>
              )}
            </div>
            <div className="h-1.5 rounded-full bg-gray-100">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: event.coverColor }}
              />
            </div>
          </div>
          <RsvpButton event={event} />
        </div>

        {/* Tags */}
        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {event.tags.map(t => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Past recording card ──────────────────────────────────────────────────────
function RecordingCard({ event }: { event: typeof PAST_EVENTS[0] }) {
  return (
    <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: event.coverColor + '20' }}
      >
        <PlayIcon className="w-5 h-5" style={{ color: event.coverColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 text-sm truncate">{event.title}</div>
        <div className="text-xs text-gray-400 mt-0.5">
          {formatDate(event.date)} · {event.duration} · {event.host}
        </div>
      </div>
      <a
        href={event.recordingUrl}
        className="shrink-0 text-sm font-medium text-brand-600 hover:text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        Watch →
      </a>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function EventsPage() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Events</h1>
            <p className="text-sm text-gray-500 mt-0.5">Webinars, workshops, and community meetups</p>
          </div>
          <button className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-500 transition-colors flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> Create Event
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-gray-100 mb-6">
          {(['upcoming', 'past'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                tab === t
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'upcoming' ? 'Upcoming' : 'Recordings'}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'upcoming' ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {EVENTS.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        ) : (
          <div className="space-y-3">
            {PAST_EVENTS.map(e => <RecordingCard key={e.id} event={e} />)}
            {PAST_EVENTS.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">No recordings yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
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
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function PlayIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="5" y2="19" />
      <line x1="5" x2="19" y1="12" y2="12" />
    </svg>
  );
}
