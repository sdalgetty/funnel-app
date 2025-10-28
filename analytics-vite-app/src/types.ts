// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

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

// ============================================================================
// FUNNEL TYPES
// ============================================================================

export interface FunnelData {
  id: string;
  name: string;
  year: number;
  month: number;
  inquiries: number;
  inquiriesYtd: number;
  callsBooked: number;
  callsTaken: number;
  callsYtd: number;
  inquiryToCall: number;
  callToBooking: number;
  closes: number;
  bookings: number; // in cents
  bookingsYtd: number;
  bookingsGoal: number;
  cash: number; // in cents
  lastUpdated?: string;
}

// ============================================================================
// SALES/BOOKINGS TYPES
// ============================================================================

export interface Client {
  id: string;
  name: string;
  email?: string;
}

export interface ServiceType {
  id: string;
  name: string;
  description?: string;
  isCustom: boolean;
  tracksInFunnel: boolean;
}

export interface LeadSource {
  id: string;
  name: string;
  description?: string;
  isCustom: boolean;
}

export interface Booking {
  id: string;
  projectName: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  serviceTypeId: string;
  leadSourceId: string;
  bookingDate: string;
  status: string;
  notes?: string;
  dateInquired?: string;
  dateBooked?: string;
  projectDate?: string;
  bookedRevenue: number; // in cents
  revenue?: number; // in cents
  createdAt: string;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number; // in cents
  amountCents: number; // in cents
  paymentDate: string;
  paymentMethod?: string;
  status: string;
  notes?: string;
  dueDate: string;
  paidAt?: string | null;
  memo?: string;
  expectedDate?: string; // For scheduled payments
  isExpected?: boolean; // True if payment is scheduled/expected, false if paid
}

// ============================================================================
// ADVERTISING TYPES
// ============================================================================

export interface AdSource {
  id: string;
  name: string;
  leadSourceId: string; // Reference to LeadSource for ROI tracking
  isActive: boolean;
  createdAt: string;
}

export interface AdCampaign {
  id: string;
  adSourceId: string;
  year: number;
  month: number;
  monthYear: string;
  adSpendCents: number; // in cents
  spend: number; // in cents
  leadsGenerated: number;
  createdAt: string;
  lastUpdated?: string;
}

// ============================================================================
// FORECAST TYPES
// ============================================================================

export interface ForecastModel {
  id: string;
  name: string;
  description?: string;
  modelType: string;
  parameters?: any;
  year: number;
  isActive: boolean;
  serviceTypes: {
    serviceTypeId: string;
    quantity: number;
    avgBooking: number;
    totalForecast: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// FEATURE DEFINITIONS
// ============================================================================

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

// ============================================================================
// MOCK USERS (Development Only)
// ============================================================================

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

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Page = 'funnel' | 'advertising' | 'forecast' | 'bookings' | 'profile';

export type SortOrder = 'asc' | 'desc';

export interface Filters {
  serviceTypes: string[];
  search: string;
}
