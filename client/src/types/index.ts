export type UserRole = 'producer' | 'client' | 'admin';
export type SubscriptionTier = 'free' | 'pro' | 'vip';
export type ProjectStatus = 'inquiry' | 'proposal' | 'active' | 'completed' | 'cancelled' | 'disputed';
export type Availability = 'available' | 'busy' | 'unavailable' | 'on_vacation';
export type SpaceVisibility = 'public' | 'private' | 'secret';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  avatarUrl?: string;
  subscriptionTier: SubscriptionTier;
  emailVerified: boolean;
  profileSetupCompleted: boolean;
  createdAt: string;
}

export interface ProducerProfile {
  headline?: string;
  bio?: string;
  specialisation: string[];
  niches: string[];
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  projectRateMin?: number;
  projectRateMax?: number;
  currency: string;
  portfolioLinks: { title: string; url: string }[];
  availability: Availability;
  yearsExperience?: number;
  languages: string[];
  location?: string;
  timezone?: string;
  averageRating: number;
  totalReviews: number;
  featured: boolean;
}

export interface Space {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  visibility: SpaceVisibility;
  requiredTier: SubscriptionTier;
  allowedRoles: UserRole[];
  postCount: number;
  memberCount: number;
  hasAccess: boolean;
  isLocked: boolean;
}

export interface Post {
  id: string;
  spaceId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: UserRole;
  title?: string;
  body: string;
  postType: string;
  isPinned: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  clientId: string;
  clientName: string;
  producerId: string;
  producerName: string;
  status: ProjectStatus;
  budget?: number;
  currency: string;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  body: string;
  messageType: string;
  isSystemMessage: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
