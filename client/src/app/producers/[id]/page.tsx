'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import AppShell from '@/components/AppShell';

const availabilityLabels: Record<string, { text: string; color: string }> = {
  available: { text: 'Available for work', color: 'text-green-600 bg-green-50' },
  busy: { text: 'Currently busy', color: 'text-yellow-600 bg-yellow-50' },
  unavailable: { text: 'Not available', color: 'text-red-600 bg-red-50' },
  on_vacation: { text: 'On vacation', color: 'text-gray-600 bg-gray-50' },
};

export default function ProducerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const producerId = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [producerUser, setProducerUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Hire modal
  const [showHireModal, setShowHireModal] = useState(false);
  const [hireTitle, setHireTitle] = useState('');
  const [hireDescription, setHireDescription] = useState('');
  const [hireBudget, setHireBudget] = useState('');
  const [hiring, setHiring] = useState(false);

  useEffect(() => {
    api
      .getUserProfile(producerId)
      .then((data) => {
        setProducerUser(data.user);
        setProfile(data.profile);
      })
      .catch(() => router.push('/producers'))
      .finally(() => setLoading(false));
  }, [producerId, router]);

  const handleHire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hireTitle.trim()) return;
    setHiring(true);
    try {
      const { project } = await api.createProject({
        producerId,
        title: hireTitle,
        description: hireDescription || undefined,
        budget: hireBudget ? parseFloat(hireBudget) : undefined,
      });
      router.push(`/deal-room/${project.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    }
    setHiring(false);
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

  if (!producerUser || !profile) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto py-20 text-center">
          <h2 className="text-xl font-bold">Producer not found</h2>
          <Link href="/producers" className="text-brand-600 hover:underline text-sm mt-2 inline-block">
            Back to Talent Hub
          </Link>
        </div>
      </AppShell>
    );
  }

  const avail = availabilityLabels[profile.availability] || availabilityLabels.unavailable;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back link */}
        <Link href="/producers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Talent Hub
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column — profile info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-2xl bg-brand-200 flex items-center justify-center text-2xl font-bold text-brand-700 shrink-0">
                  {producerUser.avatar_url ? (
                    <img src={producerUser.avatar_url} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                  ) : (
                    producerUser.display_name?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold">{producerUser.display_name}</h1>
                    {profile.featured && <span className="badge-vip">Featured</span>}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${avail.color}`}>
                      {avail.text}
                    </span>
                  </div>
                  {profile.headline && (
                    <p className="text-gray-600 mt-1">{profile.headline}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                    {profile.location && <span>{profile.location}</span>}
                    {profile.years_experience && <span>{profile.years_experience} years experience</span>}
                    {profile.timezone && <span>{profile.timezone}</span>}
                  </div>
                </div>
              </div>

              {profile.bio && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}
            </div>

            {/* Specialisations */}
            {profile.specialisation?.length > 0 && (
              <div className="card p-6">
                <h3 className="font-semibold mb-3">Specialisations</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.specialisation.map((s: string) => (
                    <span key={s} className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg text-sm font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Niches */}
            {profile.niches?.length > 0 && (
              <div className="card p-6">
                <h3 className="font-semibold mb-3">Podcast Niches</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.niches.map((n: string) => (
                    <span key={n} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio */}
            {profile.portfolio_links && JSON.parse(profile.portfolio_links || '[]').length > 0 && (
              <div className="card p-6">
                <h3 className="font-semibold mb-3">Portfolio</h3>
                <div className="space-y-2">
                  {JSON.parse(profile.portfolio_links).map((link: { title: string; url: string }, i: number) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-brand-600 hover:text-brand-700 text-sm"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" x2="21" y1="14" y2="3" />
                      </svg>
                      {link.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment & Software */}
            {(profile.equipment?.length > 0 || profile.software?.length > 0) && (
              <div className="card p-6">
                <h3 className="font-semibold mb-3">Tools & Equipment</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {profile.equipment?.length > 0 && (
                    <div>
                      <h4 className="text-sm text-gray-500 mb-1.5">Equipment</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.equipment.map((e: string) => (
                          <span key={e} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{e}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.software?.length > 0 && (
                    <div>
                      <h4 className="text-sm text-gray-500 mb-1.5">Software</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.software.map((s: string) => (
                          <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right column — pricing & actions */}
          <div className="space-y-4">
            {/* Pricing card */}
            <div className="card p-6">
              <h3 className="font-semibold mb-3">Pricing</h3>
              {profile.hourly_rate_min ? (
                <div className="mb-3">
                  <div className="text-sm text-gray-500">Hourly Rate</div>
                  <div className="text-xl font-bold">
                    ${profile.hourly_rate_min}
                    {profile.hourly_rate_max && profile.hourly_rate_max !== profile.hourly_rate_min
                      ? ` – $${profile.hourly_rate_max}`
                      : ''}
                    <span className="text-sm font-normal text-gray-500"> / hr</span>
                  </div>
                </div>
              ) : null}
              {profile.project_rate_min ? (
                <div>
                  <div className="text-sm text-gray-500">Project Rate</div>
                  <div className="text-xl font-bold">
                    ${profile.project_rate_min}
                    {profile.project_rate_max && profile.project_rate_max !== profile.project_rate_min
                      ? ` – $${profile.project_rate_max}`
                      : ''}
                  </div>
                </div>
              ) : null}
              {!profile.hourly_rate_min && !profile.project_rate_min && (
                <p className="text-sm text-gray-400">Rates not listed</p>
              )}

              {/* Hire button (only for clients) */}
              {user?.role === 'client' && (
                <button
                  onClick={() => setShowHireModal(true)}
                  className="btn-primary w-full mt-4"
                >
                  Start a Project
                </button>
              )}
            </div>

            {/* Reviews summary */}
            {profile.average_rating > 0 && (
              <div className="card p-6">
                <h3 className="font-semibold mb-3">Reviews</h3>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(profile.average_rating)
                            ? 'text-amber-400 fill-current'
                            : 'text-gray-200 fill-current'
                        }`}
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <span className="font-semibold">{Number(profile.average_rating).toFixed(1)}</span>
                </div>
                <p className="text-sm text-gray-500">{profile.total_reviews} review{profile.total_reviews !== 1 ? 's' : ''}</p>
              </div>
            )}

            {/* Languages */}
            {profile.languages?.length > 0 && (
              <div className="card p-6">
                <h3 className="font-semibold mb-3">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((lang: string) => (
                    <span key={lang} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-sm">{lang}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            <div className="card p-6">
              <h3 className="font-semibold mb-3">Connect</h3>
              <div className="space-y-2 text-sm">
                {profile.website_url && (
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-brand-600 hover:underline">
                    Website
                  </a>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-brand-600 hover:underline">
                    LinkedIn
                  </a>
                )}
                {profile.twitter_handle && (
                  <span className="text-gray-600">@{profile.twitter_handle}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hire modal */}
      {showHireModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-1">Start a Project</h2>
            <p className="text-sm text-gray-500 mb-4">
              Send an inquiry to {producerUser.display_name}
            </p>
            <form onSubmit={handleHire} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={hireTitle}
                  onChange={(e) => setHireTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder="e.g., Weekly podcast editing"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={hireDescription}
                  onChange={(e) => setHireDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
                  placeholder="Describe what you're looking for..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={hireBudget}
                  onChange={(e) => setHireBudget(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder="Optional"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowHireModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={hiring} className="btn-primary">
                  {hiring ? 'Sending...' : 'Send Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
