'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, ExternalLink, Play, RefreshCw, Mic2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface WpEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  link: string;
  slug: string;
  coverImage?: string;
  coverAlt?: string;
  eventDate?: string;
  eventTime?: string;
  eventType?: string;
  location?: string;
  ticketUrl?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getEventColor(id: number) {
  const colors = ['#1e3a8a', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];
  return colors[id % colors.length];
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').trim();
}

// ─── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white animate-pulse">
      <div className="h-40 bg-gray-100" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-1/3" />
        <div className="h-5 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-9 bg-gray-100 rounded-full mt-4" />
      </div>
    </div>
  );
}

// ─── Event card ────────────────────────────────────────────────────────────────
function EventCard({ event }: { event: WpEvent }) {
  const color = getEventColor(event.id);
  const displayDate = event.eventDate || event.date;
  const cleanDesc = stripHtml(event.description).slice(0, 200);

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all bg-white group">
      {/* Cover image or gradient */}
      <div className="relative h-44 overflow-hidden">
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.coverAlt || event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${color}dd, ${color}88)` }}
          >
            <Mic2 className="w-10 h-10 text-white/60" />
          </div>
        )}
        {/* Date badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-800 shadow-sm">
          <div className="text-center leading-tight">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">
              {new Date(displayDate).toLocaleDateString('en-US', { month: 'short' })}
            </div>
            <div className="text-lg font-black text-gray-900 leading-none">
              {new Date(displayDate).getDate()}
            </div>
          </div>
        </div>
        {/* Type badge */}
        {event.eventType && event.eventType !== 'event' && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] font-semibold text-gray-700">
            {event.eventType}
          </div>
        )}
      </div>

      <div className="p-5">
        {/* Title */}
        <h3
          className="font-bold text-gray-900 text-base leading-snug mb-2 line-clamp-2"
          dangerouslySetInnerHTML={{ __html: event.title }}
        />

        {/* Description */}
        {cleanDesc && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{cleanDesc}</p>
        )}

        {/* Meta */}
        <div className="flex flex-col gap-1 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {formatDate(displayDate)}
          </div>
          {event.eventTime && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              {event.eventTime}
            </div>
          )}
          {event.location && (
            <div className="text-xs text-gray-500 truncate">📍 {event.location}</div>
          )}
        </div>

        {/* CTA */}
        <a
          href={event.ticketUrl || event.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors"
        >
          View Event
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

// ─── Past / recording card ─────────────────────────────────────────────────────
function PastCard({ event }: { event: WpEvent }) {
  const color = getEventColor(event.id);
  return (
    <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors group">
      {/* Thumb */}
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
        {event.coverImage ? (
          <img src={event.coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: color + '20' }}
          >
            <Play className="w-5 h-5" style={{ color }} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4
          className="font-semibold text-gray-900 text-sm line-clamp-1"
          dangerouslySetInnerHTML={{ __html: event.title }}
        />
        <div className="text-xs text-gray-400 mt-0.5">{formatShortDate(event.date)}</div>
      </div>

      <a
        href={event.link}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        View <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function EventsPage() {
  const [tab, setTab]         = useState<'upcoming' | 'past'>('upcoming');
  const [events, setEvents]   = useState<WpEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.getEvents();
      setEvents(data.events ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Split events: future = upcoming, past = older than now
  const now = Date.now();
  const upcoming = events.filter(e => new Date(e.eventDate || e.date).getTime() >= now - 86400000 * 1);
  const past     = events.filter(e => new Date(e.eventDate || e.date).getTime() <  now - 86400000 * 1);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 py-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Events</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Webinars, workshops, and community meetups from{' '}
              <a href="https://podwires.com/events/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline font-medium">
                podwires.com/events
              </a>
            </p>
          </div>
          <a
            href="https://podwires.com/events/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-brand-600 border border-brand-200 rounded-full hover:bg-brand-50 transition-colors"
          >
            All events <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-gray-100 mb-6">
          {(['upcoming', 'past'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'upcoming' ? `Upcoming${!loading && upcoming.length ? ` (${upcoming.length})` : ''}` : 'Past'}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-gray-500 text-sm mb-3">Could not load events from podwires.com</p>
            <button
              onClick={load}
              className="flex items-center gap-1.5 text-sm text-brand-600 font-medium hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try again
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {!error && loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Upcoming */}
        {!error && !loading && tab === 'upcoming' && (
          <>
            {upcoming.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">No upcoming events</h3>
                <p className="text-sm text-gray-400 mb-4">Check back soon or browse past events</p>
                <a
                  href="https://podwires.com/events/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-600 hover:underline font-medium"
                >
                  View all events on podwires.com →
                </a>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {upcoming.map(e => <EventCard key={e.id} event={e} />)}
              </div>
            )}
          </>
        )}

        {/* Past */}
        {!error && !loading && tab === 'past' && (
          <>
            {past.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-sm">No past events yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-w-2xl">
                {past.map(e => <PastCard key={e.id} event={e} />)}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
