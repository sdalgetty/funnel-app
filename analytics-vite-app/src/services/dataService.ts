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

// ============================================================================
// CONFIGURATION
// ============================================================================

const USE_MOCK_DATA = true; // Set to false when backend is ready

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
    
    // TODO: Replace with real Supabase query
    // const { data, error } = await supabase
    //   .from('funnel_data')
    //   .select('*')
    //   .eq('year', year)
    //   .order('month', { ascending: true });
    // if (error) throw error;
    // return data;
    
    return [];
  },

  /**
   * Get all funnel data for the current user
   */
  async getAll(): Promise<FunnelData[]> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return MOCK_FUNNEL_DATA;
    }
    
    // TODO: Replace with real Supabase query
    return [];
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
    
    // TODO: Replace with real Supabase mutation
    throw new Error('Not implemented');
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
    
    // TODO: Replace with real Supabase insert
    throw new Error('Not implemented');
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
    return [];
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
    throw new Error('Not implemented');
  },

  async update(id: string, data: Partial<Booking>): Promise<Booking> {
    if (USE_MOCK_DATA) {
      await delay(100);
      const existing = MOCK_BOOKINGS.find(b => b.id === id);
      if (!existing) throw new Error('Booking not found');
      return { ...existing, ...data };
    }
    throw new Error('Not implemented');
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return;
    }
    throw new Error('Not implemented');
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
    return [];
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
    throw new Error('Not implemented');
  },

  async update(id: string, data: Partial<Payment>): Promise<Payment> {
    if (USE_MOCK_DATA) {
      await delay(100);
      const existing = MOCK_PAYMENTS.find(p => p.id === id);
      if (!existing) throw new Error('Payment not found');
      return { ...existing, ...data };
    }
    throw new Error('Not implemented');
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return;
    }
    throw new Error('Not implemented');
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
    return [];
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
    throw new Error('Not implemented');
  },

  async update(id: string, data: Partial<ServiceType>): Promise<ServiceType> {
    if (USE_MOCK_DATA) {
      await delay(100);
      const existing = MOCK_SERVICE_TYPES.find(st => st.id === id);
      if (!existing) throw new Error('Service type not found');
      return { ...existing, ...data };
    }
    throw new Error('Not implemented');
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return;
    }
    throw new Error('Not implemented');
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
    return [];
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
    throw new Error('Not implemented');
  },

  async update(id: string, data: Partial<LeadSource>): Promise<LeadSource> {
    if (USE_MOCK_DATA) {
      await delay(100);
      const existing = MOCK_LEAD_SOURCES.find(ls => ls.id === id);
      if (!existing) throw new Error('Lead source not found');
      return { ...existing, ...data };
    }
    throw new Error('Not implemented');
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return;
    }
    throw new Error('Not implemented');
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
    return [];
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
    throw new Error('Not implemented');
  },

  async update(id: string, data: Partial<AdSource>): Promise<AdSource> {
    if (USE_MOCK_DATA) {
      await delay(100);
      const existing = MOCK_AD_SOURCES.find(ads => ads.id === id);
      if (!existing) throw new Error('Ad source not found');
      return { ...existing, ...data };
    }
    throw new Error('Not implemented');
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return;
    }
    throw new Error('Not implemented');
  }
};

export const AdCampaignService = {
  async getByYear(year: number): Promise<AdCampaign[]> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return MOCK_AD_CAMPAIGNS.filter(c => c.year === year);
    }
    return [];
  },

  async getByAdSource(adSourceId: string): Promise<AdCampaign[]> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return MOCK_AD_CAMPAIGNS.filter(c => c.adSourceId === adSourceId);
    }
    return [];
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
    throw new Error('Not implemented');
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
    throw new Error('Not implemented');
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return;
    }
    throw new Error('Not implemented');
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
    return [];
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
    throw new Error('Not implemented');
  },

  async update(id: string, data: Partial<ForecastModel>): Promise<ForecastModel> {
    if (USE_MOCK_DATA) {
      await delay(100);
      // Mock implementation - would come from database
      throw new Error('Forecast model not found');
    }
    throw new Error('Not implemented');
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await delay(100);
      return;
    }
    throw new Error('Not implemented');
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

