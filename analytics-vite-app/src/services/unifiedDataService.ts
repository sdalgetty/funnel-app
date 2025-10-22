import { supabase } from '../lib/supabase';
import type { 
  FunnelData, 
  ServiceType, 
  LeadSource, 
  Booking, 
  Payment,
  AdSource,
  AdCampaign
} from '../types';

export class UnifiedDataService {
  // ============================================================================
  // FUNNEL DATA
  // ============================================================================
  
  static async getFunnelData(userId: string, year: number): Promise<FunnelData[]> {
    try {
      const { data, error } = await supabase
        .from('funnels')
        .select('*')
        .eq('user_id', userId)
        .eq('year', year)
        .order('month', { ascending: true });

      if (error) {
        console.error('Error fetching funnel data:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching funnel data:', error);
      return [];
    }
  }

  static async saveFunnelData(userId: string, funnelData: FunnelData): Promise<boolean> {
    try {
      console.log('Saving funnel data:', { userId, funnelData });
      
      // First, check if a record exists for this user/year/month combination
      const { data: existingData, error: fetchError } = await supabase
        .from('funnels')
        .select('id')
        .eq('user_id', userId)
        .eq('year', funnelData.year)
        .eq('month', funnelData.month)
        .single();

      const recordId = existingData?.id || undefined;

      // Prepare the data for upsert - only include fields that exist in the database
      const upsertData: any = {
        id: recordId, // Use existing ID or let database generate new one
        user_id: userId,
        year: funnelData.year,
        month: funnelData.month,
        inquiries: funnelData.inquiries || 0,
        calls_booked: funnelData.callsBooked || 0,
        calls_taken: funnelData.callsTaken || 0,
        closes: funnelData.closes || 0,
        bookings: funnelData.bookings || 0,
        cash: funnelData.cash || 0,
        updated_at: new Date().toISOString()
      };

      // Add optional fields if they exist in the funnelData
      if (funnelData.name) upsertData.name = funnelData.name;
      if (funnelData.bookingsGoal) upsertData.bookings_goal = funnelData.bookingsGoal;
      if (funnelData.inquiryToCall) upsertData.inquiry_to_call = funnelData.inquiryToCall;
      if (funnelData.callToBooking) upsertData.call_to_booking = funnelData.callToBooking;
      if (funnelData.inquiriesYtd) upsertData.inquiries_ytd = funnelData.inquiriesYtd;
      if (funnelData.callsYtd) upsertData.calls_ytd = funnelData.callsYtd;
      if (funnelData.bookingsYtd) upsertData.bookings_ytd = funnelData.bookingsYtd;

      console.log('Upsert data:', upsertData);

      const { error } = await supabase
        .from('funnels')
        .upsert(upsertData, {
          onConflict: 'user_id,year,month'
        });

      if (error) {
        console.error('Error saving funnel data:', error);
        return false;
      }

      console.log('Successfully saved funnel data');
      return true;
    } catch (error) {
      console.error('Error saving funnel data:', error);
      return false;
    }
  }

  // ============================================================================
  // SERVICE TYPES
  // ============================================================================
  
  static async getServiceTypes(userId: string): Promise<ServiceType[]> {
    try {
      const { data, error } = await supabase
        .from('service_types')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) {
        console.error('Error fetching service types:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        name: item.name,
        isCustom: true, // All database items are considered custom
        tracksInFunnel: true // Default to true
      })) || [];
    } catch (error) {
      console.error('Error fetching service types:', error);
      return [];
    }
  }

  static async createServiceType(userId: string, name: string): Promise<ServiceType | null> {
    try {
      const { data, error } = await supabase
        .from('service_types')
        .insert({
          user_id: userId,
          name: name
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating service type:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        isCustom: true,
        tracksInFunnel: true
      };
    } catch (error) {
      console.error('Error creating service type:', error);
      return null;
    }
  }

  static async updateServiceType(userId: string, id: string, name: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('service_types')
        .update({ name })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating service type:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating service type:', error);
      return false;
    }
  }

  static async deleteServiceType(userId: string, id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('service_types')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting service type:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting service type:', error);
      return false;
    }
  }

  // ============================================================================
  // LEAD SOURCES
  // ============================================================================
  
  static async getLeadSources(userId: string): Promise<LeadSource[]> {
    try {
      const { data, error } = await supabase
        .from('lead_sources')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) {
        console.error('Error fetching lead sources:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        name: item.name,
        isCustom: true // All database items are considered custom
      })) || [];
    } catch (error) {
      console.error('Error fetching lead sources:', error);
      return [];
    }
  }

  static async createLeadSource(userId: string, name: string): Promise<LeadSource | null> {
    try {
      const { data, error } = await supabase
        .from('lead_sources')
        .insert({
          user_id: userId,
          name: name
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating lead source:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        isCustom: true
      };
    } catch (error) {
      console.error('Error creating lead source:', error);
      return null;
    }
  }

  static async updateLeadSource(userId: string, id: string, name: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lead_sources')
        .update({ name })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating lead source:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating lead source:', error);
      return false;
    }
  }

  static async deleteLeadSource(userId: string, id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lead_sources')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting lead source:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting lead source:', error);
      return false;
    }
  }

  // ============================================================================
  // BOOKINGS
  // ============================================================================
  
  static async getBookings(userId: string): Promise<Booking[]> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service_types(name),
          lead_sources(name)
        `)
        .eq('user_id', userId)
        .order('booking_date', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        projectName: item.client_name, // Map client_name to projectName
        serviceTypeId: item.service_type_id,
        leadSourceId: item.lead_source_id,
        dateInquired: item.booking_date, // Using booking_date as dateInquired
        dateBooked: item.booking_date,
        projectDate: item.booking_date, // Using booking_date as projectDate
        bookedRevenue: 0, // This would need to be calculated from payments
        status: item.status,
        notes: item.notes || '',
        createdAt: item.created_at
      })) || [];
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  }

  static async createBooking(userId: string, bookingData: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking | null> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: userId,
          client_name: bookingData.projectName,
          client_email: '', // Not in Booking type
          client_phone: '', // Not in Booking type
          service_type_id: bookingData.serviceTypeId,
          lead_source_id: bookingData.leadSourceId,
          booking_date: bookingData.dateBooked,
          status: bookingData.status || 'confirmed',
          notes: bookingData.notes || ''
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating booking:', error);
        return null;
      }

      return {
        id: data.id,
        ...bookingData,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error creating booking:', error);
      return null;
    }
  }

  static async updateBooking(userId: string, id: string, updates: Partial<Booking>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          client_name: updates.projectName,
          service_type_id: updates.serviceTypeId,
          lead_source_id: updates.leadSourceId,
          booking_date: updates.dateBooked,
          status: updates.status,
          notes: updates.notes
        })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating booking:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating booking:', error);
      return false;
    }
  }

  static async deleteBooking(userId: string, id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting booking:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting booking:', error);
      return false;
    }
  }

  // ============================================================================
  // PAYMENTS
  // ============================================================================
  
  static async getPayments(userId: string, bookingId?: string): Promise<Payment[]> {
    try {
      let query = supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId);

      if (bookingId) {
        query = query.eq('booking_id', bookingId);
      }

      const { data, error } = await query.order('payment_date', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        bookingId: item.booking_id,
        amount: item.amount_cents, // Map amount_cents to amount
        dueDate: item.payment_date,
        paidAt: item.status === 'completed' ? item.payment_date : null,
        memo: item.notes || '',
        paymentMethod: item.payment_method || ''
      })) || [];
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  }

  static async createPayment(userId: string, paymentData: Omit<Payment, 'id'>): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          booking_id: paymentData.bookingId,
          amount_cents: paymentData.amount,
          payment_date: paymentData.dueDate,
          payment_method: paymentData.paymentMethod,
          status: paymentData.paidAt ? 'completed' : 'pending',
          notes: paymentData.memo || ''
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating payment:', error);
        return null;
      }

      return {
        id: data.id,
        ...paymentData
      };
    } catch (error) {
      console.error('Error creating payment:', error);
      return null;
    }
  }

  static async updatePayment(userId: string, id: string, updates: Partial<Payment>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          booking_id: updates.bookingId,
          amount_cents: updates.amount,
          payment_date: updates.dueDate,
          payment_method: updates.paymentMethod,
          status: updates.paidAt ? 'completed' : 'pending',
          notes: updates.memo
        })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating payment:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating payment:', error);
      return false;
    }
  }

  static async deletePayment(userId: string, id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting payment:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting payment:', error);
      return false;
    }
  }
}
