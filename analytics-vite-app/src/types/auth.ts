// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

// Subscription types - defined inline to avoid circular dependency
export type SubscriptionTier = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'cancelled';

/**
 * Authenticated user with profile data
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phone?: string;
  website?: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  createdAt: Date;
  lastLoginAt: Date;
  trialEndsAt: Date | null;
}

/**
 * Supabase session object
 */
export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: {
    id: string;
    email?: string;
    [key: string]: unknown;
  };
}

/**
 * Subscription features configuration
 */
export interface SubscriptionFeatures {
  canAccessSales: boolean;
  canAccessForecast: boolean;
  canUseDataIntegration: boolean;
  canSyncFunnelWithSales: boolean;
  advertising: boolean;
}



