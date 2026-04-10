'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import AppShell from '@/components/AppShell';

const SPECIALISATION_OPTIONS = [
  'Audio Editing', 'Show Notes', 'Mixing & Mastering', 'Guest Booking',
  'Content Strategy', 'Full Production', 'Video Podcasting', 'Transcription',
  'Social Media', 'Launch Strategy', 'Podcast Consulting', 'Sound Design',
];

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available for work' },
  { value: 'busy', label: 'Busy — limited availability' },
  { value: 'unavailable', label: 'Not available' },
  { value: 'on_vacation', label: 'On vacation' },
];

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, loadUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Common fields
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Producer fields
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [specialisation, setSpecialisation] = useState<string[]>([]);
  const [niches, setNiches] = useState('');
  const [hourlyRateMin, setHourlyRateMin] = useState('');
  const [hourlyRateMax, setHourlyRateMax] = useState('');
  const [projectRateMin, setProjectRateMin] = useState('');
  const [projectRateMax, setProjectRateMax] = useState('');
  const [availability, setAvailability] = useState('available');
  const [yearsExperience, setYearsExperience] = useState('');
  const [languages, setLanguages] = useState('');
  const [location, setLocation] = useState('');
  const [timezone, setTimezone] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');

  // Client fields
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [podcastGoals, setPodcastGoals] = useState('');
  const [budgetRange, setBudgetRange] = useState('');

  useEffect(() => {
    if (!user) return;
    api
      .getUserProfile(user.id)
      .then((data) => {
        setDisplayName(data.user.display_name || '');
        setAvatarUrl(data.user.avatar_url || '');

        if (user.role === 'producer' && data.profile) {
          const p = data.profile;
          setHeadline(p.headline || '');
          setBio(p.bio || '');
          setSpecialisation(p.specialisation || []);
          setNiches((p.niches || []).join(', '));
          setHourlyRateMin(p.hourly_rate_min ? String(p.hourly_rate_min) : '');
          setHourlyRateMax(p.hourly_rate_max ? String(p.hourly_rate_max) : '');
          setProjectRateMin(p.project_rate_min ? String(p.project_rate_min) : '');
          setProjectRateMax(p.project_rate_max ? String(p.project_rate_max) : '');
          setAvailability(p.availability || 'available');
          setYearsExperience(p.years_experience ? String(p.years_experience) : '');
          setLanguages((p.languages || []).join(', '));
          setLocation(p.location || '');
          setTimezone(p.timezone || '');
          setWebsiteUrl(p.website_url || '');
          setLinkedinUrl(p.linkedin_url || '');
          setTwitterHandle(p.twitter_handle || '');
        } else if (user.role === 'client' && data.profile) {
          const p = data.profile;
          setBio(p.bio || '');
          setCompanyName(p.company_name || '');
          setCompanyWebsite(p.company_website || '');
          setIndustry(p.industry || '');
          setCompanySize(p.company_size || '');
          setPodcastGoals(p.podcast_goals || '');
          setBudgetRange(p.budget_range || '');
          setLocation(p.location || '');
          setTimezone(p.timezone || '');
          setLinkedinUrl(p.linkedin_url || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const data: Record<string, any> = { displayName, avatarUrl: avatarUrl || undefined };

    if (user?.role === 'producer') {
      Object.assign(data, {
        headline, bio, specialisation,
        niches: niches.split(',').map((n) => n.trim()).filter(Boolean),
        hourlyRateMin: hourlyRateMin ? parseFloat(hourlyRateMin) : null,
        hourlyRateMax: hourlyRateMax ? parseFloat(hourlyRateMax) : null,
        projectRateMin: projectRateMin ? parseFloat(projectRateMin) : null,
        projectRateMax: projectRateMax ? parseFloat(projectRateMax) : null,
        availability, yearsExperience: yearsExperience ? parseInt(yearsExperience) : null,
        languages: languages.split(',').map((l) => l.trim()).filter(Boolean),
        location, timezone, websiteUrl, linkedinUrl, twitterHandle,
      });
    } else if (user?.role === 'client') {
      Object.assign(data, {
        bio, companyName, companyWebsite, industry, companySize,
        podcastGoals, budgetRange, location, timezone, linkedinUrl,
      });
    }

    try {
      await api.updateProfile(data);
      await loadUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save profile');
    }
    setSaving(false);
  };

  const toggleSpecialisation = (s: string) => {
    setSpecialisation((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
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

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-1">Edit Profile</h1>
        <p className="text-gray-500 text-sm mb-6">
          {user?.role === 'producer'
            ? 'Make your profile stand out to attract clients'
            : 'Tell producers about your brand and podcast goals'}
        </p>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic info */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold">Basic Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="https://..."
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder="e.g., Los Angeles, CA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder="e.g., America/Los_Angeles"
                />
              </div>
            </div>
          </div>

          {/* Producer-specific fields */}
          {user?.role === 'producer' && (
            <>
              <div className="card p-6 space-y-4">
                <h2 className="font-semibold">Professional Details</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                    placeholder="e.g., Award-winning podcast editor with 8+ years experience"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
                    placeholder="Tell potential clients about your experience..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
                  >
                    {AVAILABILITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  />
                </div>
              </div>

              <div className="card p-6 space-y-4">
                <h2 className="font-semibold">Specialisations</h2>
                <div className="flex flex-wrap gap-2">
                  {SPECIALISATION_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSpecialisation(s)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        specialisation.includes(s)
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Podcast Niches <span className="text-gray-400">(comma separated)</span>
                  </label>
                  <input
                    type="text"
                    value={niches}
                    onChange={(e) => setNiches(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                    placeholder="e.g., True Crime, Business, Tech, Health"
                  />
                </div>
              </div>

              <div className="card p-6 space-y-4">
                <h2 className="font-semibold">Pricing</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate Min ($)</label>
                    <input type="number" min="0" step="0.01" value={hourlyRateMin} onChange={(e) => setHourlyRateMin(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate Max ($)</label>
                    <input type="number" min="0" step="0.01" value={hourlyRateMax} onChange={(e) => setHourlyRateMax(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Rate Min ($)</label>
                    <input type="number" min="0" step="0.01" value={projectRateMin} onChange={(e) => setProjectRateMin(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Rate Max ($)</label>
                    <input type="number" min="0" step="0.01" value={projectRateMax} onChange={(e) => setProjectRateMax(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
                  </div>
                </div>
              </div>

              <div className="card p-6 space-y-4">
                <h2 className="font-semibold">Links & Social</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                  <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="https://linkedin.com/in/..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Twitter / X Handle</label>
                  <input type="text" value={twitterHandle} onChange={(e) => setTwitterHandle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="@username" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Languages <span className="text-gray-400">(comma separated)</span>
                  </label>
                  <input type="text" value={languages} onChange={(e) => setLanguages(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="English, Spanish" />
                </div>
              </div>
            </>
          )}

          {/* Client-specific fields */}
          {user?.role === 'client' && (
            <>
              <div className="card p-6 space-y-4">
                <h2 className="font-semibold">Company Details</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Website</label>
                  <input type="url" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="https://..." />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="e.g., Technology" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                    <input type="text" value={companySize} onChange={(e) => setCompanySize(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="e.g., 50-200" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">About Your Company</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none" placeholder="Tell producers about your brand..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Podcast Goals</label>
                  <textarea value={podcastGoals} onChange={(e) => setPodcastGoals(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none" placeholder="What are you looking to achieve with podcasting?" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
                  <input type="text" value={budgetRange} onChange={(e) => setBudgetRange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="e.g., $500 - $2,000/month" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                  <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="https://linkedin.com/in/..." />
                </div>
              </div>
            </>
          )}

          {/* Save button */}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="btn-primary px-8">
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            {saved && (
              <span className="text-sm text-green-600 font-medium">Profile saved successfully!</span>
            )}
          </div>
        </form>
      </div>
    </AppShell>
  );
}
