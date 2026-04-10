'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import AppShell from '@/components/AppShell';

const SPECIALISATIONS = [
  'Audio Editing', 'Show Notes', 'Mixing & Mastering', 'Guest Booking',
  'Content Strategy', 'Full Production', 'Video Podcasting', 'Transcription',
  'Social Media', 'Launch Strategy',
];

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'Any Availability' },
  { value: 'available', label: 'Available Now' },
  { value: 'busy', label: 'Busy' },
];

const availabilityColors: Record<string, string> = {
  available: 'bg-green-500',
  busy: 'bg-yellow-500',
  unavailable: 'bg-red-500',
  on_vacation: 'bg-gray-400',
};

export default function ProducersPage() {
  const [producers, setProducers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialisation, setSpecialisation] = useState('');
  const [availability, setAvailability] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page) };
    if (specialisation) params.specialisation = specialisation;
    if (availability) params.availability = availability;

    api
      .getProducers(params)
      .then((data) => setProducers(data.producers))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [specialisation, availability, page]);

  const clearFilters = () => {
    setSpecialisation('');
    setAvailability('');
    setPage(1);
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Talent Hub</h1>
          <p className="text-gray-500 text-sm mt-1">
            Discover and connect with podcast production talent
          </p>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Specialisation filter */}
            <select
              value={specialisation}
              onChange={(e) => { setSpecialisation(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">All Specialisations</option>
              {SPECIALISATIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Availability filter */}
            <select
              value={availability}
              onChange={(e) => { setAvailability(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {AVAILABILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {(specialisation || availability) && (
              <button
                onClick={clearFilters}
                className="text-sm text-brand-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Producers grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : producers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No producers found matching your criteria.</p>
            <button onClick={clearFilters} className="text-brand-600 hover:underline text-sm mt-2">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {producers.map((producer) => (
              <Link
                key={producer.id}
                href={`/producers/${producer.id}`}
                className="card p-5 hover:shadow-md transition-shadow group"
              >
                {/* Avatar & name */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-brand-200 flex items-center justify-center text-lg font-semibold text-brand-700">
                      {producer.avatar_url ? (
                        <img src={producer.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        producer.display_name?.[0]?.toUpperCase()
                      )}
                    </div>
                    {producer.availability && (
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${availabilityColors[producer.availability] || 'bg-gray-400'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold group-hover:text-brand-700 transition-colors truncate">
                        {producer.display_name}
                      </h3>
                      {producer.featured && (
                        <span className="badge-vip text-[10px]">Featured</span>
                      )}
                    </div>
                    {producer.headline && (
                      <p className="text-sm text-gray-500 truncate">{producer.headline}</p>
                    )}
                  </div>
                </div>

                {/* Specialisations */}
                {producer.specialisation?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {producer.specialisation.slice(0, 3).map((s: string) => (
                      <span key={s} className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded text-[11px] font-medium">
                        {s}
                      </span>
                    ))}
                    {producer.specialisation.length > 3 && (
                      <span className="text-[11px] text-gray-400">+{producer.specialisation.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Stats row */}
                <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-3 text-gray-500">
                    {producer.average_rating > 0 && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-amber-400 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        {Number(producer.average_rating).toFixed(1)}
                        <span className="text-[11px]">({producer.total_reviews})</span>
                      </span>
                    )}
                    {producer.years_experience && (
                      <span>{producer.years_experience}yr exp</span>
                    )}
                  </div>
                  {producer.hourly_rate_min && (
                    <span className="font-medium text-gray-900">
                      ${producer.hourly_rate_min}
                      {producer.hourly_rate_max && producer.hourly_rate_max !== producer.hourly_rate_min
                        ? `–$${producer.hourly_rate_max}`
                        : ''}
                      /hr
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {producers.length >= 20 && (
          <div className="flex justify-center gap-2 mt-8">
            {page > 1 && (
              <button onClick={() => setPage(page - 1)} className="btn-secondary text-sm">
                Previous
              </button>
            )}
            <button onClick={() => setPage(page + 1)} className="btn-secondary text-sm">
              Next
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
