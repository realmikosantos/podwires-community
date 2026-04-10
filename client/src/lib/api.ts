const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      const data = await response.json();
      if (data.code === 'TOKEN_EXPIRED') {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.getToken()}`;
          const retry = await fetch(`${this.baseUrl}${path}`, {
            ...options,
            headers,
          });
          if (retry.ok) return retry.json();
        }
      }
      // Clear auth state on unrecoverable 401
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  // Auth
  register(data: { email: string; password: string; displayName: string; role: string }) {
    return this.request<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  login(data: { email: string; password: string }) {
    return this.request<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getMe() {
    return this.request<any>('/api/auth/me');
  }

  // Spaces
  getSpaces() {
    return this.request<any>('/api/spaces');
  }

  getSpace(slug: string, page = 1) {
    return this.request<any>(`/api/spaces/${slug}?page=${page}`);
  }

  joinSpace(slug: string) {
    return this.request<any>(`/api/spaces/${slug}/join`, { method: 'POST' });
  }

  // Posts
  createPost(data: { spaceId: string; title?: string; body: string; postType?: string }) {
    return this.request<any>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getPost(id: string) {
    return this.request<any>(`/api/posts/${id}`);
  }

  // Users
  getProducers(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/api/users/producers${query}`);
  }

  getUserProfile(id: string) {
    return this.request<any>(`/api/users/${id}`);
  }

  updateProfile(data: Record<string, any>) {
    return this.request<any>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Projects (Deal Room)
  getProjects(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<any>(`/api/projects${query}`);
  }

  getProject(id: string) {
    return this.request<any>(`/api/projects/${id}`);
  }

  createProject(data: { producerId: string; title: string; description?: string; budget?: number }) {
    return this.request<any>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateProjectStatus(id: string, data: { status: string; note?: string }) {
    return this.request<any>(`/api/projects/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  sendMessage(projectId: string, body: string) {
    return this.request<any>(`/api/projects/${projectId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  }

  // Posts - comments & likes
  createComment(postId: string, data: { body: string; parentId?: string }) {
    return this.request<any>(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  likePost(postId: string) {
    return this.request<any>(`/api/posts/${postId}/like`, { method: 'POST' });
  }

  // Jobs
  getJobs(page = 1, search?: string) {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    return this.request<any>(`/api/jobs?${params}`);
  }

  // Subscriptions
  getPlans() {
    return this.request<any>('/api/subscriptions/plans');
  }

  createCheckout(plan: string) {
    return this.request<any>('/api/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  }

  createPortalSession() {
    return this.request<any>('/api/subscriptions/portal', { method: 'POST' });
  }

  // Notifications
  getNotifications(page = 1) {
    return this.request<any>(`/api/notifications?page=${page}`);
  }

  getNotificationCount() {
    return this.request<any>('/api/notifications/count');
  }

  markNotificationRead(id: string) {
    return this.request<any>(`/api/notifications/${id}/read`, { method: 'PATCH' });
  }

  markAllNotificationsRead() {
    return this.request<any>('/api/notifications/read-all', { method: 'PATCH' });
  }
}

export const api = new ApiClient(API_URL);
