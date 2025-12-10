// ============================================================================
// DATA MANAGER TYPES
// ============================================================================

import type {
  FunnelData,
  Booking,
  Payment,
  ServiceType,
  LeadSource,
  AdCampaign,
  ForecastModel,
} from './index';

/**
 * Data manager interface - provides data and operations
 */
export interface DataManager {
  // State
  loading: boolean;
  error: string | null;
  funnelData: FunnelData[];
  bookings: Booking[];
  payments: Payment[];
  serviceTypes: ServiceType[];
  leadSources: LeadSource[];
  adCampaigns: AdCampaign[];
  forecastModels: ForecastModel[];

  // Funnel operations
  saveFunnelData: (funnelData: FunnelData) => Promise<boolean>;
  getAllFunnelData: () => Promise<void>;

  // Booking operations
  createBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'payments'>) => Promise<boolean>;
  updateBooking: (id: string, updates: Partial<Booking>) => Promise<boolean>;
  deleteBooking: (id: string) => Promise<boolean>;

  // Payment operations
  createPayment: (payment: Omit<Payment, 'id'>) => Promise<boolean>;
  updatePayment: (id: string, updates: Partial<Payment>) => Promise<boolean>;
  deletePayment: (id: string) => Promise<boolean>;

  // Service type operations
  createServiceType: (name: string, description?: string) => Promise<boolean>;
  updateServiceType: (id: string, name: string, description?: string) => Promise<boolean>;
  deleteServiceType: (id: string) => Promise<boolean>;
  toggleServiceTypeFunnelTracking: (id: string) => Promise<boolean>;

  // Lead source operations
  createLeadSource: (name: string, description?: string) => Promise<boolean>;
  updateLeadSource: (id: string, name: string, description?: string) => Promise<boolean>;
  deleteLeadSource: (id: string) => Promise<boolean>;

  // Ad campaign operations
  createAdCampaign: (campaign: Omit<AdCampaign, 'id' | 'createdAt' | 'lastUpdated'>) => Promise<boolean>;
  updateAdCampaign: (id: string, updates: Partial<AdCampaign>) => Promise<boolean>;
  deleteAdCampaign: (id: string) => Promise<boolean>;

  // Forecast operations
  saveForecastModel: (model: Omit<ForecastModel, 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  deleteForecastModel: (id: string) => Promise<boolean>;
  loadForecastModels: () => Promise<void>;
}



