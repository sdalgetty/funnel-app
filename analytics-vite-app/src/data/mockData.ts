/**
 * Mock Data for Development
 * 
 * This file contains all mock data used throughout the application.
 * When integrating with a backend, this data will be replaced by API calls.
 */

import type { 
  FunnelData, 
  ServiceType, 
  LeadSource, 
  Booking, 
  Payment,
  AdSource,
  AdCampaign 
} from '../types';

// ============================================================================
// FUNNEL DATA
// ============================================================================

export const MOCK_FUNNEL_DATA: FunnelData[] = [
  // 2024 Data
  { id: "2024_january", year: 2024, month: 1, inquiries: 31, callsBooked: 16, callsTaken: 14, closes: 4, bookings: 2909742, cash: 1500000 },
  { id: "2024_february", year: 2024, month: 2, inquiries: 28, callsBooked: 11, callsTaken: 11, closes: 1, bookings: 1287400, cash: 800000 },
  { id: "2024_march", year: 2024, month: 3, inquiries: 19, callsBooked: 9, callsTaken: 9, closes: 8, bookings: 3895900, cash: 2000000 },
  { id: "2024_april", year: 2024, month: 4, inquiries: 19, callsBooked: 5, callsTaken: 5, closes: 0, bookings: 1343811, cash: 600000 },
  { id: "2024_may", year: 2024, month: 5, inquiries: 15, callsBooked: 5, callsTaken: 5, closes: 2, bookings: 1674800, cash: 900000 },
  { id: "2024_june", year: 2024, month: 6, inquiries: 11, callsBooked: 7, callsTaken: 5, closes: 0, bookings: 773800, cash: 400000 },
  { id: "2024_july", year: 2024, month: 7, inquiries: 10, callsBooked: 6, callsTaken: 6, closes: 2, bookings: 1804421, cash: 1000000 },
  { id: "2024_august", year: 2024, month: 8, inquiries: 14, callsBooked: 8, callsTaken: 8, closes: 2, bookings: 1621800, cash: 800000 },
  { id: "2024_september", year: 2024, month: 9, inquiries: 26, callsBooked: 11, callsTaken: 11, closes: 8, bookings: 5423600, cash: 3000000 },
  { id: "2024_october", year: 2024, month: 10, inquiries: 13, callsBooked: 6, callsTaken: 6, closes: 1, bookings: 1084260, cash: 500000 },
  { id: "2024_november", year: 2024, month: 11, inquiries: 20, callsBooked: 12, callsTaken: 10, closes: 1, bookings: 678400, cash: 300000 },
  { id: "2024_december", year: 2024, month: 12, inquiries: 28, callsBooked: 20, callsTaken: 17, closes: 6, bookings: 4116000, cash: 2500000 },
  
  // 2025 Data
  { id: "2025_january", year: 2025, month: 1, inquiries: 20, callsBooked: 12, callsTaken: 12, closes: 9, bookings: 6125600, cash: 3500000, lastUpdated: '2025-01-20T14:30:00Z' },
  { id: "2025_february", year: 2025, month: 2, inquiries: 18, callsBooked: 10, callsTaken: 9, closes: 4, bookings: 2560000, cash: 1500000, lastUpdated: '2025-02-15T09:45:00Z' },
  { id: "2025_march", year: 2025, month: 3, inquiries: 28, callsBooked: 17, callsTaken: 17, closes: 5, bookings: 3200000, cash: 2000000, lastUpdated: '2025-03-10T16:20:00Z' },
  { id: "2025_april", year: 2025, month: 4, inquiries: 22, callsBooked: 11, callsTaken: 10, closes: 3, bookings: 1800000, cash: 1200000 },
  { id: "2025_may", year: 2025, month: 5, inquiries: 28, callsBooked: 14, callsTaken: 13, closes: 2, bookings: 1200000, cash: 800000 },
  { id: "2025_june", year: 2025, month: 6, inquiries: 15, callsBooked: 7, callsTaken: 6, closes: 1, bookings: 800000, cash: 500000 },
  { id: "2025_july", year: 2025, month: 7, inquiries: 19, callsBooked: 9, callsTaken: 8, closes: 0, bookings: 100000, cash: 50000 },
  { id: "2025_august", year: 2025, month: 8, inquiries: 16, callsBooked: 8, callsTaken: 7, closes: 1, bookings: 500000, cash: 250000 },
  { id: "2025_september", year: 2025, month: 9, inquiries: 21, callsBooked: 10, callsTaken: 9, closes: 1, bookings: 300000, cash: 150000 },
  { id: "2025_october", year: 2025, month: 10, inquiries: 17, callsBooked: 8, callsTaken: 7, closes: 0, bookings: 0, cash: 300000 },
  { id: "2025_november", year: 2025, month: 11, inquiries: 14, callsBooked: 6, callsTaken: 5, closes: 0, bookings: 0, cash: 0 },
  { id: "2025_december", year: 2025, month: 12, inquiries: 12, callsBooked: 5, callsTaken: 4, closes: 0, bookings: 0, cash: 0 },
];

// ============================================================================
// SERVICE TYPES
// ============================================================================

export const MOCK_SERVICE_TYPES: ServiceType[] = [
  { id: "st_wedding", name: "Wedding Photography", isCustom: false, tracksInFunnel: true },
  { id: "st_engagement", name: "Engagement Photography", isCustom: false, tracksInFunnel: true },
];

// ============================================================================
// LEAD SOURCES
// ============================================================================

export const MOCK_LEAD_SOURCES: LeadSource[] = [
  { id: "ls_instagram", name: "Instagram Ads", isCustom: true },
  { id: "ls_google", name: "Google", isCustom: true },
  { id: "ls_referral", name: "Client Referral", isCustom: true },
];

// ============================================================================
// BOOKINGS
// ============================================================================

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: "b_1",
    projectName: "Kelly & Shig Wedding",
    serviceTypeId: "st_wedding",
    leadSourceId: "ls_instagram",
    dateInquired: "2025-01-15",
    dateBooked: "2025-02-03",
    projectDate: "2025-10-18",
    bookedRevenue: 800000, // $8,000
    createdAt: "2025-02-03",
  },
  {
    id: "b_2",
    projectName: "Ashley & Devon Engagement",
    serviceTypeId: "st_engagement",
    leadSourceId: "ls_google",
    dateInquired: "2025-02-20",
    dateBooked: "2025-03-01",
    projectDate: "2025-05-12",
    bookedRevenue: 120000, // $1,200
    createdAt: "2025-03-01",
  }
];

// ============================================================================
// PAYMENTS
// ============================================================================

export const MOCK_PAYMENTS: Payment[] = [
  { id: "p_1", bookingId: "b_1", dueDate: "2025-02-10", amount: 200000, paidAt: "2025-02-10", memo: "Retainer" },
  { id: "p_2", bookingId: "b_1", dueDate: "2025-06-15", amount: 300000, paidAt: "2025-06-15", memo: "Milestone" },
  { id: "p_3", bookingId: "b_1", dueDate: "2025-10-05", amount: 300000, paidAt: "2025-10-05", memo: "Balance" },
  { id: "p_4", bookingId: "b_2", dueDate: "2025-03-05", amount: 60000, paidAt: "2025-03-05", memo: "Retainer" },
  { id: "p_5", bookingId: "b_2", dueDate: "2025-04-20", amount: 60000, paidAt: "2025-04-20", memo: "Final Payment" },
];

// ============================================================================
// AD SOURCES
// ============================================================================

export const MOCK_AD_SOURCES: AdSource[] = [
  { id: 'ads_instagram', name: 'Instagram Ads', leadSourceId: 'ls_instagram', isActive: true, createdAt: '2025-01-01' },
  { id: 'ads_google', name: 'Google Ads', leadSourceId: 'ls_google', isActive: true, createdAt: '2025-01-01' },
];

// ============================================================================
// AD CAMPAIGNS
// ============================================================================

export const MOCK_AD_CAMPAIGNS: AdCampaign[] = [
  { id: 'ac_1', adSourceId: 'ads_instagram', year: 2025, month: 1, spend: 200000, leadsGenerated: 15, createdAt: '2025-01-01', lastUpdated: '2025-01-15T10:30:00Z' },
  { id: 'ac_2', adSourceId: 'ads_instagram', year: 2025, month: 2, spend: 250000, leadsGenerated: 18, createdAt: '2025-02-01', lastUpdated: '2025-02-10T14:20:00Z' },
  { id: 'ac_3', adSourceId: 'ads_instagram', year: 2025, month: 3, spend: 300000, leadsGenerated: 22, createdAt: '2025-03-01', lastUpdated: '2025-03-05T09:15:00Z' },
  { id: 'ac_4', adSourceId: 'ads_google', year: 2025, month: 1, spend: 150000, leadsGenerated: 12, createdAt: '2025-01-01', lastUpdated: '2025-01-20T16:45:00Z' },
  { id: 'ac_5', adSourceId: 'ads_google', year: 2025, month: 2, spend: 180000, leadsGenerated: 14, createdAt: '2025-02-01', lastUpdated: '2025-02-12T11:30:00Z' },
];

