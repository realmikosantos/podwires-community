'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Info, Camera } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';

const TIMEZONES = [
  { label: '(GMT -12:00) International Date Line West', value: 'Etc/GMT+12' },
  { label: '(GMT -08:00) Pacific Time',                 value: 'America/Los_Angeles' },
  { label: '(GMT -07:00) Mountain Time',                value: 'America/Denver' },
  { label: '(GMT -06:00) Central Time',                 value: 'America/Chicago' },
  { label: '(GMT -05:00) Eastern Time',                 value: 'America/New_York' },
  { label: '(GMT -04:00) Atlantic Time',                value: 'America/Halifax' },
  { label: '(GMT +00:00) London',                       value: 'Europe/London' },
  { label: '(GMT +01:00) Paris, Berlin',                value: 'Europe/Paris' },
  { label: '(GMT +02:00) Cairo, Johannesburg',          value: 'Africa/Cairo' },
  { label: '(GMT +03:00) Moscow, Nairobi',              value: 'Europe/Moscow' },
  { label: '(GMT +05:30) Mumbai, Delhi',                value: 'Asia/Kolkata' },
  { label: '(GMT +08:00) Singapore, Perth',             value: 'Asia/Singapore' },
  { label: '(GMT +09:00) Tokyo, Seoul',                 value: 'Asia/Tokyo' },
  { label: '(GMT +09:30) Adelaide',                     value: 'Australia/Adelaide' },
  { label: '(GMT +10:00) Sydney, Melbourne',            value: 'Australia/Sydney' },
  { label: '(GMT +12:00) Auckland',                     value: 'Pacific/Auckland' },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
        checked ? 'bg-brand-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function ProfileSetupForm() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, loadUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName]     = useState('');
  const [timezone, setTimezone]           = useState('');
  const [headline, setHeadline]           = useState('');
  const [bio, setBio]                     = useState('');
  const [location, setLocation]           = useState('');
  const [websiteUrl, setWebsiteUrl]       = useState('');
  const [twitterUrl, setTwitterUrl]       = useState('');
  const [facebookUrl, setFacebookUrl]     = useState('');
  const [instagramUrl, setInstagramUrl]   = useState('');
  const [linkedinUrl, setLinkedinUrl]     = useState('');
  const [youtubeUrl, setYoutubeUrl]       = useState('');
  const [podcastUrl, setPodcastUrl]       = useState('');
  const [preventMessaging, setPreventMessaging] = useState(false);
  const [showInDirectory, setShowInDirectory]   = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Pre-fill display name from auth store once loaded
  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user?.displayName]);

  // Detect system timezone
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const match = TIMEZONES.find((t) => t.value === tz);
      if (match) setTimezone(match.value);
    } catch {}
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!timezone) {
      setError('Please select a timezone.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.profileSetup({
        displayName: displayName.trim(),
        timezone,
        headline: headline.trim() || undefined,
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        twitterUrl: twitterUrl.trim() || undefined,
        facebookUrl: facebookUrl.trim() || undefined,
        instagramUrl: instagramUrl.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        youtubeUrl: youtubeUrl.trim() || undefined,
        podcastUrl: podcastUrl.trim() || undefined,
        preventMessaging,
        showInDirectory,
      });
      await loadUser();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-md mx-auto">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6 justify-center">
            <img src="/podwires-logo.png" alt="Podwires" className="h-10 w-auto" />
            <span className="text-base font-display font-bold text-gray-900">Community</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create a profile</h1>
          <p className="mt-1.5 text-sm text-gray-500">This is how you&apos;ll appear in the community</p>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <button
            type="button"
            onClick={handleAvatarClick}
            className="relative w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center overflow-hidden hover:border-brand-400 transition-colors group"
            aria-label="Upload profile photo"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-gray-400">
                <Camera className="w-6 h-6" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            type="button"
            onClick={handleAvatarClick}
            className="mt-2 text-xs text-brand-600 font-medium hover:text-brand-700 transition-colors"
          >
            Add a photo
          </button>
        </div>

        <form onSubmit={handleContinue} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Full name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id="displayName"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              placeholder="Your name or brand name"
            />
          </div>

          {/* Timezone */}
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
              Timezone <span className="text-red-500">*</span>
            </label>
            <select
              id="timezone"
              required
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-gray-900 bg-white
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
            >
              <option value="" disabled>Select your timezone...</option>
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Headline */}
          <div>
            <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-1">
              Headline <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="headline"
              type="text"
              maxLength={200}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              placeholder="e.g. Podcast producer · 10 years experience"
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 resize-none
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              placeholder="Tell the community a bit about yourself..."
            />
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              placeholder="City, Country"
            />
          </div>

          {/* Website URL */}
          <div>
            <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Website URL <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="websiteUrl"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              placeholder="https://yourwebsite.com"
            />
          </div>

          {/* Twitter/X URL */}
          <div>
            <label htmlFor="twitterUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Twitter / X URL <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="twitterUrl"
              type="url"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              placeholder="https://x.com/yourhandle"
            />
          </div>

          {/* Facebook URL */}
          <div>
            <label htmlFor="facebookUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Facebook URL <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="facebookUrl"
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              placeholder="https://facebook.com/yourpage"
            />
          </div>

          {/* Instagram URL */}
          <div>
            <label htmlFor="instagramUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Instagram URL <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="instagramUrl"
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              placeholder="https://instagram.com/yourhandle"
            />
          </div>

          {/* LinkedIn URL */}
          <div>
            <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn URL <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="linkedinUrl"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          {/* YouTube URL */}
          <div>
            <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700 mb-1">
              YouTube URL <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="youtubeUrl"
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              placeholder="https://youtube.com/@yourchannel"
            />
          </div>

          {/* Podcast URL */}
          <div>
            <label htmlFor="podcastUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Podcast URL <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="podcastUrl"
              type="url"
              value={podcastUrl}
              onChange={(e) => setPodcastUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              placeholder="https://yourpodcast.com"
            />
          </div>

          {/* Permissions */}
          <div className="pt-2">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Permissions</h2>
            <div className="space-y-4">
              {/* Prevent messaging */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm text-gray-700">Prevent members from messaging me</span>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 flex-shrink-0"
                    title="When enabled, other members won't be able to send you direct messages."
                    aria-label="More info about messaging setting"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Toggle checked={preventMessaging} onChange={setPreventMessaging} />
              </div>

              {/* Show in directory */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm text-gray-700">Show my profile in the member directory</span>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 flex-shrink-0"
                    title="When enabled, your profile will be visible in the member directory."
                    aria-label="More info about directory visibility"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Toggle checked={showInDirectory} onChange={setShowInDirectory} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 space-y-2.5">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-full bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                'Continue'
              )}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={submitting}
              className="w-full py-3 rounded-full border border-gray-200 text-gray-700 font-medium hover:bg-gray-50
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfileSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ProfileSetupForm />
    </Suspense>
  );
}
