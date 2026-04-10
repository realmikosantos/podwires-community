'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import AppShell from '@/components/AppShell';
import type { Project } from '@/types';
import { formatDistanceToNow } from 'date-fns';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'inquiry', label: 'Inquiries' },
  { value: 'proposal', label: 'Proposals' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

const statusColors: Record<string, string> = {
  inquiry: 'bg-yellow-100 text-yellow-700',
  proposal: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
  disputed: 'bg-red-100 text-red-700',
};

export default function DealRoomPage() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .getProjects(statusFilter || undefined)
      .then((data) => setProjects(data.projects))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Deal Room</h1>
            <p className="text-gray-500 text-sm mt-1">
              {user?.role === 'client'
                ? 'Manage your projects with podcast producers'
                : 'Your client projects and inquiries'}
            </p>
          </div>
          {user?.role === 'client' && (
            <Link href="/producers" className="btn-primary text-sm">
              Find a Producer
            </Link>
          )}
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === tab.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Projects list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">No projects yet</h3>
            <p className="text-gray-500 mt-1 text-sm">
              {user?.role === 'client'
                ? 'Browse the Talent Hub to find and hire a podcast producer.'
                : 'Projects will appear here when clients reach out to you.'}
            </p>
            {user?.role === 'client' && (
              <Link href="/producers" className="btn-primary mt-4 inline-flex text-sm">
                Browse Producers
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/deal-room/${project.id}`}
                className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors truncate">
                      {project.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${statusColors[project.status]}`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>
                      {user?.role === 'client' ? 'Producer: ' : 'Client: '}
                      <strong className="text-gray-700">
                        {user?.role === 'client' ? project.producer_name : project.client_name}
                      </strong>
                    </span>
                    {project.budget && (
                      <span>
                        ${Number(project.budget).toLocaleString()} {project.currency}
                      </span>
                    )}
                    <span>
                      {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-300 group-hover:text-brand-500 transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
