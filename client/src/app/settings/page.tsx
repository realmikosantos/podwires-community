'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import AppShell from '@/components/AppShell';
import Link from 'next/link';

interface Plan {
  name: string;
  price: number;
  priceId?: string;
  features: string[];
}

interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string;
  read_at: string | null;
  created_at: string;
}

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const [plans, setPlans] = useState<Record<string, Plan>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [activeTab, setActiveTab] = useState<'subscription' | 'notifications'>('subscription');

  useEffect(() => {
    api.getPlans().then((data) => setPlans(data.plans)).catch(() => {}).finally(() => setLoadingPlans(false));
    api.getNotifications().then((data) => setNotifications(data.notifications || [])).catch(() => {});
  }, []);

  const handleUpgrade = async (plan: string) => {
    try {
      const { url } = await api.createCheckout(plan);
      window.location.href = url;
    } catch (err: any) {
      alert(err.message || 'Failed to create checkout session');
    }
  };

  const handleManageBilling = async () => {
    try {
      const { url } = await api.createPortalSession();
      window.location.href = url;
    } catch (err: any) {
      alert(err.message || 'Failed to open billing portal');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(notifications.map((n) => ({ ...n, read_at: new Date().toISOString() })));
    } catch {}
  };

  const tierLevel: Record<string, number> = { free: 0, pro: 1, vip: 2 };
  const currentLevel = tierLevel[user?.subscriptionTier || 'free'] || 0;

  const TABS = [
    { value: 'subscription' as const, label: 'Subscription' },
    { value: 'notifications' as const, label: 'Notifications' },
  ];

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.value
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.value === 'notifications' && notifications.filter((n) => !n.read_at).length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-bold">
                  {notifications.filter((n) => !n.read_at).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Subscription tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            {/* Current plan */}
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Current Plan</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    You are on the <strong className="capitalize">{user?.subscriptionTier}</strong> plan
                  </p>
                </div>
                {user?.subscriptionTier !== 'free' && (
                  <button onClick={handleManageBilling} className="btn-secondary text-sm">
                    Manage Billing
                  </button>
                )}
              </div>
            </div>

            {/* Plan cards */}
            {loadingPlans ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(plans).map(([key, plan]) => {
                  const planLevel = tierLevel[key] || 0;
                  const isCurrent = key === user?.subscriptionTier;
                  const isUpgrade = planLevel > currentLevel;

                  return (
                    <div
                      key={key}
                      className={`card p-6 ${isCurrent ? 'ring-2 ring-brand-500 relative' : ''}`}
                    >
                      {isCurrent && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      <p className="mt-1 text-2xl font-bold">
                        {plan.price === 0 ? 'Free' : `$${(plan.price / 100).toFixed(0)}`}
                        {plan.price > 0 && <span className="text-sm font-normal text-gray-500">/mo</span>}
                      </p>
                      <ul className="mt-4 space-y-2">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {f}
                          </li>
                        ))}
                      </ul>
                      {isUpgrade && (
                        <button
                          onClick={() => handleUpgrade(key)}
                          className="btn-primary w-full mt-4 text-sm"
                        >
                          Upgrade to {plan.name}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Account actions */}
            <div className="card p-6">
              <h3 className="font-semibold mb-3">Account</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                  <p className="text-xs text-gray-400 capitalize">{user?.role} account</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/profile/edit" className="btn-secondary text-sm">
                    Edit Profile
                  </Link>
                  <button onClick={logout} className="btn-secondary text-sm text-red-600 hover:text-red-700">
                    Log Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications tab */}
        {activeTab === 'notifications' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {notifications.filter((n) => !n.read_at).length} unread
              </p>
              {notifications.some((n) => !n.read_at) && (
                <button onClick={handleMarkAllRead} className="text-sm text-brand-600 hover:underline">
                  Mark all as read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-gray-400">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`card p-4 ${!n.read_at ? 'border-l-4 border-l-brand-500 bg-brand-50/30' : ''}`}
                  >
                    <h4 className="text-sm font-medium">{n.title}</h4>
                    {n.body && <p className="text-sm text-gray-600 mt-0.5">{n.body}</p>}
                    <p className="text-[11px] text-gray-400 mt-1">
                      {new Date(n.created_at).toLocaleDateString()} at{' '}
                      {new Date(n.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
