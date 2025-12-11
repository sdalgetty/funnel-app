import type { 
  FunnelData, 
  ServiceType, 
  LeadSource, 
  Booking, 
  Payment,
  AdCampaign
} from '../types';
import { 
  mockFunnelData, 
  mockServiceTypes, 
  mockLeadSources, 
  mockBookings, 
  mockPayments,
  mockAdCampaigns
} from '../mockData';

export class MockDataService {
  // ============================================================================
  // FUNNEL DATA
  // ============================================================================
  
  static async getFunnelData(userId: string, year: number): Promise<FunnelData[]> {
    console.log('Using mock funnel data for development');
    return mockFunnelData.filter(data => data.year === year);
  }

  static async getAllFunnelData(userId: string): Promise<FunnelData[]> {
    console.log('Using mock funnel data for development (all years)');
    return [...mockFunnelData].sort((a, b) => {
      if (a.year === b.year) {
        return a.month - b.month;
      }
      return a.year - b.year;
    });
  }

  static async saveFunnelData(userId: string, funnelData: FunnelData): Promise<boolean> {
    console.log('Mock save funnel data:', funnelData);
    // In mock mode, we just log the data - it's not persisted
    return true;
  }

  // ============================================================================
  // SERVICE TYPES
  // ============================================================================
  
  static async getServiceTypes(userId: string): Promise<ServiceType[]> {
    console.log('Using mock service types for development');
    return [...mockServiceTypes];
  }

  static async createServiceType(userId: string, name: string, tracksInFunnel: boolean = false): Promise<ServiceType | null> {
    console.log('Mock create service type:', name, 'tracksInFunnel:', tracksInFunnel);
    const newServiceType: ServiceType = {
      id: `mock_${Date.now()}`,
      name,
      isCustom: true,
      tracksInFunnel
    };
    return newServiceType;
  }

  static async updateServiceType(userId: string, id: string, name: string): Promise<boolean> {
    console.log('Mock update service type:', id, name);
    return true;
  }

  static async deleteServiceType(userId: string, id: string): Promise<boolean> {
    console.log('Mock delete service type:', id);
    return true;
  }

  // ============================================================================
  // LEAD SOURCES
  // ============================================================================
  
  static async getLeadSources(userId: string): Promise<LeadSource[]> {
    console.log('Using mock lead sources for development');
    return [...mockLeadSources];
  }

  static async createLeadSource(userId: string, name: string): Promise<LeadSource | null> {
    console.log('Mock create lead source:', name);
    const newLeadSource: LeadSource = {
      id: `mock_${Date.now()}`,
      name,
      isCustom: true
    };
    return newLeadSource;
  }

  static async updateLeadSource(userId: string, id: string, name: string): Promise<boolean> {
    console.log('Mock update lead source:', id, name);
    return true;
  }

  static async deleteLeadSource(userId: string, id: string): Promise<boolean> {
    console.log('Mock delete lead source:', id);
    return true;
  }

  // ============================================================================
  // BOOKINGS
  // ============================================================================
  
  static async getBookings(userId: string): Promise<Booking[]> {
    console.log('Using mock bookings for development');
    return [...mockBookings];
  }

  static async createBooking(userId: string, bookingData: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking | null> {
    console.log('Mock create booking:', bookingData);
    const newBooking: Booking = {
      id: `mock_${Date.now()}`,
      ...bookingData,
      createdAt: new Date().toISOString()
    };
    return newBooking;
  }

  static async updateBooking(userId: string, id: string, updates: Partial<Booking>): Promise<boolean> {
    console.log('Mock update booking:', id, updates);
    return true;
  }

  static async deleteBooking(userId: string, id: string): Promise<boolean> {
    console.log('Mock delete booking:', id);
    return true;
  }

  // ============================================================================
  // PAYMENTS
  // ============================================================================
  
  static async getPayments(userId: string, bookingId?: string): Promise<Payment[]> {
    console.log('Using mock payments for development');
    if (bookingId) {
      return mockPayments.filter(payment => payment.bookingId === bookingId);
    }
    return [...mockPayments];
  }

  static async createPayment(userId: string, paymentData: Omit<Payment, 'id'>): Promise<Payment | null> {
    console.log('Mock create payment:', paymentData);
    const newPayment: Payment = {
      id: `mock_${Date.now()}`,
      ...paymentData
    };
    return newPayment;
  }

  static async updatePayment(userId: string, id: string, updates: Partial<Payment>): Promise<boolean> {
    console.log('Mock update payment:', id, updates);
    return true;
  }

  static async deletePayment(userId: string, id: string): Promise<boolean> {
    console.log('Mock delete payment:', id);
    return true;
  }

  // ============================================================================
  // AD CAMPAIGNS (AdSource removed - campaigns now link directly to LeadSource)
  // ============================================================================
  
  static async getAdCampaigns(userId: string): Promise<AdCampaign[]> {
    console.log('Using mock ad campaigns for development');
    return [...mockAdCampaigns];
  }

  static async createAdCampaign(userId: string, adCampaignData: Omit<AdCampaign, 'id' | 'createdAt'>): Promise<AdCampaign | null> {
    console.log('Mock create ad campaign:', adCampaignData);
    const newAdCampaign: AdCampaign = {
      id: `mock_ac_${Date.now()}`,
      adSourceId: adCampaignData.adSourceId,
      year: adCampaignData.year,
      month: adCampaignData.month,
      monthYear: adCampaignData.monthYear,
      adSpendCents: adCampaignData.adSpendCents,
      spend: adCampaignData.spend,
      leadsGenerated: adCampaignData.leadsGenerated,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    return newAdCampaign;
  }

  static async updateAdCampaign(userId: string, id: string, updates: Partial<AdCampaign>): Promise<boolean> {
    console.log('Mock update ad campaign:', id, updates);
    return true;
  }

  static async deleteAdCampaign(userId: string, id: string): Promise<boolean> {
    console.log('Mock delete ad campaign:', id);
    return true;
  }
}

