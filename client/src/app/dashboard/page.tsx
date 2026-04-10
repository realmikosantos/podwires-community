'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import AppShell from '@/components/AppShell';
import type { Space } from '@/types';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);

  useEffect(() => {
    api.getSpaces().then((data) => setSpaces(data.spaces)).catch(() => {});
    api.getProjects().then((data) => setRecentProjects(data.projects.slice(0, 3))).catch(() => {});
  }, []);

  if (!user) return null;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Welcome back, {user.displayName}</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {user.role === 'producer' ? 'Podcast Producer' : 'Brand / Business'} &middot;{' '}
            <span className="capitalize">{user.subscriptionTier}</span> plan
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Link href="/profile/edit" className="card p-5 hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" x2="19" y1="8" y2="14" />
                <line x1="22" x2="16" y1="11" y2="11" />
              </svg>
            </div>
            <h3 className="font-semibold group-hover:text-brand-700 transition-colors">Complete Your Profile</h3>
            <p className="text-sm text-gray-500 mt-1">
              {user.role === 'producer'
                ? 'Add specialisations, rates, and portfolio links'
                : 'Tell producers about your brand and podcast goals'}
            </p>
          </Link>

          <Link href="/jobs" className="card p-5 hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m3 11 18-5v12L3 13v-2z" />
                <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
              </svg>
            </div>
            <h3 className="font-semibold group-hover:text-brand-700 transition-colors">Browse Jobs</h3>
            <p className="text-sm text-gray-500 mt-1">Latest opportunities from Podwires.com</p>
          </Link>

          {user.subscriptionTier === 'free' ? (
            <div className="card p-5 bg-gradient-to-br from-brand-50 to-accent-50">
              <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-accent-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h3 className="font-semibold">Upgrade Your Plan</h3>
              <p className="text-sm text-gray-500 mt-1">Unlock Deal Room, Talent Hub, and more</p>
              <Link href="/settings" className="btn-primary text-sm mt-3 inline-flex">
                View Plans
              </Link>
            </div>
          ) : (
            <Link href="/deal-room" className="card p-5 hover:shadow-md transition-shadow group">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <h3 className="font-semibold group-hover:text-brand-700 transition-colors">Deal Room</h3>
              <p className="text-sm text-gray-500 mt-1">
                {user.role === 'client' ? 'Manage your projects' : 'View client inquiries'}
              </p>
            </Link>
          )}
        </div>

        {/* Community Spaces */}
        <h2 className="text-lg font-semibold mb-4">Community Spaces</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {spaces.map((space) => (
            <div
              key={space.id}
              className={`card p-5 ${space.isLocked ? 'opacity-60' : 'hover:shadow-md transition-shadow'}`}
            >
              <div
                className="w-10 h-10 rounded-lg mb-3 flex items-center justify-center"
                style={{ backgroundColor: space.color || '#3B82F6' }}
              >
                <span className="text-white font-bold text-sm">{space.name[0]}</span>
              </div>
              <h3 className="font-semibold text-sm">{space.name}</h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{space.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-400">{space.memberCount} members</span>
                {space.isLocked ? (
                  <span className="text-[10px] text-gray-400 capitalize">Requires {space.requiredTier}</span>
                ) : (
                  <Link
                    href={`/spaces/${space.slug}`}
                    className="text-xs text-brand-600 font-medium hover:underline"
                  >
                    Enter
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Deal Room activity */}
        {recentProjects.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Projects</h2>
              <Link href="/deal-room" className="text-sm text-brand-600 hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recentProjects.map((project) => {
                const statusColors: Record<string, string> = {
                  inquiry: 'bg-yellow-100 text-yellow-700',
                  proposal: 'bg-blue-100 text-blue-700',
                  active: 'bg-green-100 text-green-700',
                  completed: 'bg-gray-100 text-gray-700',
                };
                return (
                  <Link
                    key={project.id}
                    href={`/deal-room/${project.id}`}
                    className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <h3 className="font-medium text-sm">{project.title}</h3>
                      <span className="text-xs text-gray-500">
                        {user.role === 'client' ? project.producer_name : project.client_name}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${statusColors[project.status] || 'bg-gray-100 text-gray-700'}`}>
                      {project.status}
                    </span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
