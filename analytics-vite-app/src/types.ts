// User and Subscription Types
export type SubscriptionTier = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'cancelled';

export interface User {
  id: string;
  email: string;
  name: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt?: Date;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface SubscriptionFeatures {
  canAccessSales: boolean;
  canAccessForecast: boolean;
  canUseDataIntegration: boolean;
  canEditFunnelManually: boolean;
  canSyncFunnelWithSales: boolean;
  advertising: boolean;
  maxDataRetentionMonths: number;
}

// Feature definitions for each tier
export const SUBSCRIPTION_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
  free: {
    canAccessSales: false,
    canAccessForecast: false,
    canUseDataIntegration: false,
    canEditFunnelManually: true,
    canSyncFunnelWithSales: false,
    advertising: false,
    maxDataRetentionMonths: 12, // 1 year
  },
  pro: {
    canAccessSales: true,
    canAccessForecast: true,
    canUseDataIntegration: true,
    canEditFunnelManually: true,
    canSyncFunnelWithSales: true,
    advertising: true,
    maxDataRetentionMonths: -1, // Unlimited
  },
};

// Mock users for development
export const MOCK_USERS: User[] = [
  {
    id: 'user_1',
    email: 'demo@example.com',
    name: 'Demo User',
    subscriptionTier: 'free',
    subscriptionStatus: 'active',
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date(),
  },
  {
    id: 'user_2',
    email: 'pro@example.com',
    name: 'Pro User',
    subscriptionTier: 'pro',
    subscriptionStatus: 'active',
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date(),
  },
  {
    id: 'user_3',
    email: 'trial@example.com',
    name: 'Trial User',
    subscriptionTier: 'pro',
    subscriptionStatus: 'trial',
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date(),
  },
];
