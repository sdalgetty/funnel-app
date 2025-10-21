/**
 * Data Service Layer
 * 
 * This service abstracts all data access operations.
 * Currently uses mock data, but will be replaced with real API calls to Supabase.
 * 
 * Benefits:
 * - Single source of truth for data operations
 * - Easy to swap mock data with real API
 * - Consistent error handling
 * - Type-safe operations
 */

import type {
  FunnelData,
  ServiceType,
  LeadSource,
  Booking,
  Payment,
  AdSource,
  AdCampaign,
  ForecastModel
} from '../types';

import {
  MOCK_FUNNEL_DATA,
  MOCK_SERVICE_TYPES,
  MOCK_LEAD_SOURCES,
  MOCK_BOOKINGS,
  MOCK_PAYMENTS,
  MOCK_AD_SOURCES,
  MOCK_AD_CAMPAIGNS
} from '../data/mockData';
import { SupabaseDataService } from './supabaseDataService';

// ============================================================================
// CONFIGURATION
// ============================================================================

const USE_MOCK_DATA = false; // Set to false when backend is ready

// ============================================================================
// FUNNEL DATA OPERATIONS
// ============================================================================

export const FunnelService = {
  /**
   * Get all funnel data for a specific year
   */
  async getByYear(year: number): Promise<FunnelData[]> {
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await delay(100);
      return MOCK_FUNNEL_DATA.filter(d => d.year === year);
    }
    
    return await SupabaseDataService.getAllFunnels();
  },

  /**
   * Get all funnel data for the current user
   */
  async getAll(): Promise<FunnelData[]> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return MOCK_FUNNEL_DATA;
    }
    
    return await SupabaseDataService.getAllFunnels();
  },

  /**
   * Update a specific month's funnel data
   */
  async update(id: string, data: Partial<FunnelData>): Promise<FunnelData> {
    if (USE_MOCK_DATA) {
      await delay(100);
      const existing = MOCK_FUNNEL_DATA.find(d => d.id === id);
      if (!existing) throw new Error('Funnel data not found');
      return { ...existing, ...data, lastUpdated: new Date().toISOString() };
    }
    
    return await SupabaseDataService.updateFunnel(id, data);
  },

  /**
   * Create new funnel data entry
   */
  async create(data: Omit<FunnelData, 'id'>): Promise<FunnelData> {
    if (USE_MOCK_DATA) {
      await delay(100);
      const newData: FunnelData = {
        ...data,
        id: `${data.year}_${getMonthName(data.month).toLowerCase()}`,
        lastUpdated: new Date().toISOString()
      };
      return newData;
    }
    
    return await SupabaseDataService.createFunnel(data);
  }
};

// ============================================================================
// BOOKING OPERATIONS
// ============================================================================

export const BookingService = {
  async getAll(): Promise<Booking[]> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return MOCK_BOOKINGS;
    }
    return await SupabaseDataService.getAllBookings();
  },

  async create(data: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
    if (USE_MOCK_DATA) {
      await delay(100);
      const newBooking: Booking = {
        ...data,
        id: `b_${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      return newBooking;
    }
    return await SupabaseDataService.createBooking(data);
  },

  async update(id: string, data: Partial<Booking>): Promise<Booking> {
    if (USE_MOCK_DATA) {
      await delay(100);
      const existing = MOCK_BOOKINGS.find(b => b.id === id);
      if (!existing) throw new Error('Booking not found');
      return { ...existing, ...data };
    }
    return await SupabaseDataService.updateBooking(id, data);
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return;
    }
    return await SupabaseDataService.deleteBooking(id);
  }
};

// ============================================================================
// PAYMENT OPERATIONS
// ============================================================================

export const PaymentService = {
  async getByBooking(bookingId: string): Promise<Payment[]> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return MOCK_PAYMENTS.filter(p => p.bookingId === bookingId);
    }
    return await SupabaseDataService.getPaymentsByBookingId(bookingId);
  },

  async create(data: Omit<Payment, 'id'>): Promise<Payment> {
    if (USE_MOCK_DATA) {
      await delay(100);
      const newPayment: Payment = {
        ...data,
        id: `p_${Date.now()}`
      };
      return newPayment;
    }
    return await SupabaseDataService.createPayment(data);
  },

  async update(id: string, data: Partial<Payment>): Promise<Payment> {
    if (USE_MOCK_DATA) {
      await delay(100);
      const existing = MOCK_PAYMENTS.find(p => p.id === id);
      if (!existing) throw new Error('Payment not found');
      return { ...existing, ...data };
    }
    return await SupabaseDataService.updatePayment(id, data);
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return;
    }
    return await SupabaseDataService.deletePayment(id);
  }
};

// ============================================================================
// SERVICE TYPE OPERATIONS
// ============================================================================

export const ServiceTypeService = {
  async getAll(): Promise<ServiceType[]> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return MOCK_SERVICE_TYPES;
    }
    return await SupabaseDataService.getAllServiceTypes();
  },

  async create(data: Omit<ServiceType, 'id'>): Promise<ServiceType> {
    if (USE_MOCK_DATA) {
      await delay(100);
      const newServiceType: ServiceType = {
        ...data,
        id: `st_${Date.now()}`
      };
      return newServiceType;
    }
    return await SupabaseDataService.createServiceType(data);
  },

  async update(id: string, data: Partial<ServiceType>): Promise<ServiceType> {
    if (USE_MOCK_DATA) {
      await delay(100);
      const existing = MOCK_SERVICE_TYPES.find(st => st.id === id);
      if (!existing) throw new Error('Service type not found');
      return { ...existing, ...data };
    }
    return await SupabaseDataService.updateServiceType(id, data);
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return;
    }
    return await SupabaseDataService.deleteServiceType(id);
  }
};

// ============================================================================
// LEAD SOURCE OPERATIONS
// ============================================================================

export const LeadSourceService = {
  async getAll(): Promise<LeadSource[]> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return MOCK_LEAD_SOURCES;
    }
    return await SupabaseDataService.getAllLeadSources();
  },

  async create(data: Omit<LeadSource, 'id'>): Promise<LeadSource> {
    if (USE_MOCK_DATA) {
      await delay(100);
      const newLeadSource: LeadSource = {
        ...data,
        id: `ls_${Date.now()}`
      };
      return newLeadSource;
    }
    return await SupabaseDataService.createLeadSource(data);
  },

  async update(id: string, data: Partial<LeadSource>): Promise<LeadSource> {
    if (USE_MOCK_DATA) {
      await delay(100);
      const existing = MOCK_LEAD_SOURCES.find(ls => ls.id === id);
      if (!existing) throw new Error('Lead source not found');
      return { ...existing, ...data };
    }
    return await SupabaseDataService.updateLeadSource(id, data);
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return;
    }
    return await SupabaseDataService.deleteLeadSource(id);
  }
};

// ============================================================================
// ADVERTISING OPERATIONS
// ============================================================================

export const AdSourceService = {
  async getAll(): Promise<AdSource[]> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return MOCK_AD_SOURCES;
    }
    return await SupabaseDataService.getAllAdSources();
  },

  async create(data: Omit<AdSource, 'id' | 'createdAt'>): Promise<AdSource> {
    if (USE_MOCK_DATA) {
      await delay(100);
      const newAdSource: AdSource = {
        ...data,
        id: `ads_${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      return newAdSource;
    }
    return await SupabaseDataService.createAdSource(data);
  },

  async update(id: string, data: Partial<AdSource>): Promise<AdSource> {
    if (USE_MOCK_DATA) {
      await delay(100);
      const existing = MOCK_AD_SOURCES.find(ads => ads.id === id);
      if (!existing) throw new Error('Ad source not found');
      return { ...existing, ...data };
    }
    return await SupabaseDataService.updateAdSource(id, data);
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return;
    }
    return await SupabaseDataService.deleteAdSource(id);
  }
};

export const AdCampaignService = {
  async getByYear(year: number): Promise<AdCampaign[]> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return MOCK_AD_CAMPAIGNS.filter(c => c.year === year);
    }
    return await SupabaseDataService.getAllAdCampaigns();
  },

  async getByAdSource(adSourceId: string): Promise<AdCampaign[]> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return MOCK_AD_CAMPAIGNS.filter(c => c.adSourceId === adSourceId);
    }
    return await SupabaseDataService.getAdCampaignsBySourceId(adSourceId);
  },

  async create(data: Omit<AdCampaign, 'id' | 'createdAt'>): Promise<AdCampaign> {
    if (USE_MOCK_DATA) {
      await delay(100);
      const newCampaign: AdCampaign = {
        ...data,
        id: `ac_${Date.now()}`,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      return newCampaign;
    }
    return await SupabaseDataService.createAdCampaign(data);
  },

  async update(id: string, data: Partial<AdCampaign>): Promise<AdCampaign> {
    if (USE_MOCK_DATA) {
      await delay(100);
      const existing = MOCK_AD_CAMPAIGNS.find(c => c.id === id);
      if (!existing) throw new Error('Campaign not found');
      return { 
        ...existing, 
        ...data, 
        lastUpdated: new Date().toISOString() 
      };
    }
    return await SupabaseDataService.updateAdCampaign(id, data);
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return;
    }
    return await SupabaseDataService.deleteAdCampaign(id);
  }
};

// ============================================================================
// FORECAST MODEL OPERATIONS
// ============================================================================

export const ForecastModelService = {
  async getAll(): Promise<ForecastModel[]> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return []; // No mock forecast models yet
    }
    return await SupabaseDataService.getAllForecastModels();
  },

  async create(data: Omit<ForecastModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<ForecastModel> {
    if (USE_MOCK_DATA) {
      await delay(100);
      const now = new Date().toISOString();
      const newModel: ForecastModel = {
        ...data,
        id: `fm_${Date.now()}`,
        createdAt: now,
        updatedAt: now
      };
      return newModel;
    }
    return await SupabaseDataService.createForecastModel(data);
  },

  async update(id: string, data: Partial<ForecastModel>): Promise<ForecastModel> {
    if (USE_MOCK_DATA) {
      await delay(100);
      // Mock implementation - would come from database
      throw new Error('Forecast model not found');
    }
    return await SupabaseDataService.updateForecastModel(id, data);
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return;
    }
    return await SupabaseDataService.deleteForecastModel(id);
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Simulates network delay for mock data
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get month name from month number
 */
function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
}

// ============================================================================
// FUTURE: SUPABASE CLIENT
// ============================================================================

/**
 * When ready to integrate with Supabase, uncomment and configure:
 * 
 * import { createClient } from '@supabase/supabase-js';
 * 
 * const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
 * const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
 * 
 * export const supabase = createClient(supabaseUrl, supabaseKey);
 */

