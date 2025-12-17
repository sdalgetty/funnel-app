import { supabase } from '../lib/supabase';
import { MockDataService } from './mockDataService';
import { logger } from '../utils/logger';
import type { 
  FunnelData, 
  ServiceType, 
  LeadSource, 
  Booking, 
  Payment,
  AdCampaign,
  ForecastModel
} from '../types';

export class UnifiedDataService {
  /**
   * Check if a write operation is allowed
   * Throws an error if in view-only mode
   */
  private static checkWritePermission(isViewOnly: boolean = false): void {
    if (isViewOnly) {
      throw new Error('You are viewing this account in read-only mode. Editing is not allowed.');
    }
  }
  // Helper function to check if Supabase is configured
  private static isSupabaseConfigured(): boolean {
    const isConfigured = import.meta.env.VITE_SUPABASE_URL && 
      import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
      import.meta.env.VITE_SUPABASE_ANON_KEY &&
      import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your_supabase_anon_key';
    
    if (!isConfigured) {
      logger.warn('🔧 Supabase not configured, using mock data for development');
    }
    
    return isConfigured;
  }

  // Helper function to convert month/year format (YYYY-MM) to full date (YYYY-MM-01)
  private static convertMonthYearToDate(monthYear: string | undefined): string | null {
    if (!monthYear || monthYear.length === 0) {
      return null;
    }
    // If already in YYYY-MM-DD format, return as-is
    if (monthYear.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return monthYear;
    }
    // If in YYYY-MM format, append -01
    if (monthYear.match(/^\d{4}-\d{2}$/)) {
      return `${monthYear}-01`;
    }
    return null;
  }

  // Helper function to convert full date (YYYY-MM-DD) back to month/year format (YYYY-MM)
  private static convertDateToMonthYear(date: string | null | undefined): string | undefined {
    if (!date || date.length === 0) {
      return undefined;
    }
    // If in YYYY-MM-DD format, extract YYYY-MM
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date.substring(0, 7); // Extract YYYY-MM
    }
    // If already in YYYY-MM format, return as-is
    if (date.match(/^\d{4}-\d{2}$/)) {
      return date;
    }
    return undefined;
  }

  // ============================================================================
  // FUNNEL DATA
  // ============================================================================
  
  private static transformFunnelRecords(records: any[] | null | undefined): FunnelData[] {
    if (!records) return [];
    return records.map(record => ({
      id: record.id,
      year: record.year,
      month: record.month,
      inquiries: record.inquiries || 0,
      callsBooked: record.calls_booked || 0,
      callsTaken: record.calls_taken || 0,
      closes: record.closes || 0,
      bookings: record.bookings || 0,
      cash: record.cash || 0,
      name: record.name || '',
      bookingsGoal: record.bookings_goal || 0,
      inquiryToCall: record.inquiry_to_call || 0,
      callToBooking: record.call_to_booking || 0,
      inquiriesYtd: record.inquiries_ytd || 0,
      callsYtd: record.calls_ytd || 0,
      bookingsYtd: record.bookings_ytd || 0,
      notes: record.notes || '',
      closesManual: record.closes_manual || false,
      bookingsManual: record.bookings_manual || false,
      cashManual: record.cash_manual || false,
      lastUpdated: record.updated_at || new Date().toISOString()
    }));
  }

  /**
   * Get funnel data for a specific user and year
   * 
   * @param userId - The ID of the user owning the funnel data
   * @param year - The year to fetch data for (e.g., 2024)
   * @returns Promise resolving to an array of FunnelData for the specified year, ordered by month
   * 
   * @example
   * ```typescript
   * const data = await UnifiedDataService.getFunnelData('user-123', 2024);
   * // Returns all months of 2024 for user-123
   * ```
   */
  static async getFunnelData(userId: string, year: number): Promise<FunnelData[]> {
    if (!this.isSupabaseConfigured()) {
      return MockDataService.getFunnelData(userId, year);
    }

    try {
      logger.debug('Loading funnel data for user', { userId, year });
      
      const { data, error } = await supabase
        .from('funnels')
        .select('*')
        .eq('user_id', userId)
        .eq('year', year)
        .order('month', { ascending: true });

      if (error) {
        logger.error('Error fetching funnel data:', error);
        return [];
      }

      const transformedData = this.transformFunnelRecords(data);
      logger.debug('Transformed funnel data', { count: transformedData.length });
      return transformedData;
    } catch (error) {
      logger.error('Error fetching funnel data:', error);
      return [];
    }
  }

  /**
   * Get all funnel data for a specific user across all years
   * 
   * @param userId - The ID of the user owning the funnel data
   * @returns Promise resolving to an array of all FunnelData for the user, ordered by year and month
   * 
   * @example
   * ```typescript
   * const allData = await UnifiedDataService.getAllFunnelData('user-123');
   * // Returns all funnel data for user-123 across all years
   * ```
   */
  static async getAllFunnelData(userId: string): Promise<FunnelData[]> {
    if (!this.isSupabaseConfigured()) {
      return MockDataService.getAllFunnelData(userId);
    }

    try {
      logger.debug('Loading ALL funnel data for user', { userId });

      const { data, error } = await supabase
        .from('funnels')
        .select('*')
        .eq('user_id', userId)
        .order('year', { ascending: true })
        .order('month', { ascending: true });

      if (error) {
        logger.error('Error fetching all funnel data:', error);
        return [];
      }

      const transformedData = this.transformFunnelRecords(data);
      logger.debug('Transformed all funnel data', { count: transformedData.length });
      return transformedData;
    } catch (error) {
      logger.error('Error fetching all funnel data:', error);
      return [];
    }
  }

  /**
   * Save funnel data for a specific user and month/year
   * 
   * Creates a new record if none exists, or updates an existing record for the same user/year/month.
   * 
   * @param userId - The ID of the user owning the funnel data
   * @param funnelData - The funnel data to save (must include year and month)
   * @param isViewOnly - If true, throws error (view-only mode). Defaults to false.
   * @returns Promise resolving to true if save successful, false otherwise
   * @throws {Error} If in view-only mode or validation fails
   * 
   * @example
   * ```typescript
   * const success = await UnifiedDataService.saveFunnelData(
   *   'user-123',
   *   { year: 2024, month: 1, inquiries: 100, callsBooked: 50 },
   *   false
   * );
   * ```
   */
  static async saveFunnelData(userId: string, funnelData: FunnelData, isViewOnly: boolean = false): Promise<boolean> {
    this.checkWritePermission(isViewOnly);
    
    if (!this.isSupabaseConfigured()) {
      return MockDataService.saveFunnelData(userId, funnelData);
    }

    try {
      logger.debug('Saving funnel data', { 
        userId, 
        funnelId: funnelData.id, 
        year: funnelData.year, 
        month: funnelData.month 
      });
      
      // First, check if a record exists for this user/year/month combination
      logger.debug('Checking for existing record', { userId, year: funnelData.year, month: funnelData.month });
      const { data: existingData, error: fetchError } = await supabase
        .from('funnels')
        .select('id, name')
        .eq('user_id', userId)
        .eq('year', funnelData.year)
        .eq('month', funnelData.month);

      if (fetchError) {
        logger.error('Error checking for existing record:', fetchError);
      }

      const recordId = existingData && existingData.length > 0 ? existingData[0].id : undefined;

      // Prepare the data for upsert - only include fields that exist in the database
      const upsertData: any = {
        user_id: userId,
        year: Number(funnelData.year),
        month: Number(funnelData.month),
        inquiries: Number(funnelData.inquiries || 0),
        calls_booked: Number(funnelData.callsBooked || 0),
        calls_taken: Number(funnelData.callsTaken || 0),
        closes: Number(funnelData.closes || 0),
        bookings: Number(funnelData.bookings || 0),
        cash: Number(funnelData.cash || 0),
        updated_at: new Date().toISOString()
      };

      // Don't include ID in upsertData - we'll use it separately for the update query

      // Add optional fields if they exist in the funnelData
      // Use a unique name for each month to avoid constraint conflicts
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = monthNames[funnelData.month - 1];
      upsertData.name = `${funnelData.year} ${monthName}`;
      
      if (funnelData.bookingsGoal) upsertData.bookings_goal = Number(funnelData.bookingsGoal);
      if (funnelData.inquiryToCall) upsertData.inquiry_to_call = Number(funnelData.inquiryToCall);
      if (funnelData.callToBooking) upsertData.call_to_booking = Number(funnelData.callToBooking);
      if (funnelData.inquiriesYtd) upsertData.inquiries_ytd = Number(funnelData.inquiriesYtd);
      if (funnelData.callsYtd) upsertData.calls_ytd = Number(funnelData.callsYtd);
      if (funnelData.bookingsYtd) upsertData.bookings_ytd = Number(funnelData.bookingsYtd);
      if (funnelData.notes !== undefined) upsertData.notes = funnelData.notes || null;
      
      // Manual override flags
      upsertData.closes_manual = funnelData.closesManual || false;
      upsertData.bookings_manual = funnelData.bookingsManual || false;
      upsertData.cash_manual = funnelData.cashManual || false;

      logger.debug('Upsert data prepared', {
        year: upsertData.year,
        month: upsertData.month,
        inquiries: typeof upsertData.inquiries,
        calls_booked: typeof upsertData.calls_booked,
        calls_taken: typeof upsertData.calls_taken
      });

      // Handle the unique constraint by using a more robust approach
      let error;
      
      try {
        if (recordId) {
          // Update existing record
          logger.debug('Updating existing record', { recordId });
          const { error: updateError } = await supabase
          .from('funnels')
            .update(upsertData)
            .eq('id', recordId);
          error = updateError;
          if (updateError) {
            logger.error('Update error:', updateError);
          }
        } else {
          // Insert new record
          logger.debug('Inserting new record');
        const { error: insertError } = await supabase
          .from('funnels')
          .insert(upsertData);
        error = insertError;
          if (insertError) {
            logger.error('Insert error:', insertError);
          }
        }
        
      } catch (err) {
        logger.error('Unexpected error in funnel save:', err);
        error = err;
      }

      if (error) {
        logger.error('Error saving funnel data:', error);
        return false;
      }

      logger.debug('Successfully saved funnel data');
      return true;
    } catch (error) {
      logger.error('Error saving funnel data:', error);
      return false;
    }
  }

  // ============================================================================
  // SERVICE TYPES
  // ============================================================================
  
  /**
   * Get all service types for a specific user
   * 
   * @param userId - The ID of the user owning the service types
   * @returns Promise resolving to an array of ServiceType objects, ordered by name
   * 
   * @example
   * ```typescript
   * const types = await UnifiedDataService.getServiceTypes('user-123');
   * // Returns all service types for user-123
   * ```
   */
  static async getServiceTypes(userId: string): Promise<ServiceType[]> {
    if (!this.isSupabaseConfigured()) {
      return MockDataService.getServiceTypes(userId);
    }

    try {
      const { data, error } = await supabase
        .from('service_types')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) {
        logger.error('Error fetching service types:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        name: item.name,
        isCustom: true, // All database items are considered custom
        tracksInFunnel: item.tracks_in_funnel ?? false // Read from database, default to false if null
      })) || [];
    } catch (error) {
      logger.error('Error fetching service types:', error);
      return [];
    }
  }

  /**
   * Create a new service type for a user
   * 
   * @param userId - The ID of the user creating the service type
   * @param name - The name of the service type
   * @param tracksInFunnel - Whether this service type should be tracked in the funnel. Defaults to false.
   * @param isViewOnly - If true, throws error (view-only mode). Defaults to false.
   * @returns Promise resolving to the created ServiceType, or null if creation failed
   * @throws {Error} If in view-only mode
   * 
   * @example
   * ```typescript
   * const type = await UnifiedDataService.createServiceType('user-123', 'Web Design', true);
   * ```
   */
  static async createServiceType(userId: string, name: string, tracksInFunnel: boolean = false, isViewOnly: boolean = false): Promise<ServiceType | null> {
    this.checkWritePermission(isViewOnly);
    
    if (!this.isSupabaseConfigured()) {
      return MockDataService.createServiceType(userId, name, tracksInFunnel);
    }

    try {
      const { data, error } = await supabase
        .from('service_types')
        .insert({
          user_id: userId,
          name: name,
          tracks_in_funnel: tracksInFunnel
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating service type:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        isCustom: true,
        tracksInFunnel: data.tracks_in_funnel ?? false
      };
    } catch (error) {
      logger.error('Error creating service type:', error);
      return null;
    }
  }

  /**
   * Update an existing service type's name
   * 
   * @param userId - The ID of the user owning the service type
   * @param id - The ID of the service type to update
   * @param name - The new name for the service type
   * @param isViewOnly - If true, throws error (view-only mode). Defaults to false.
   * @returns Promise resolving to true if update successful, false otherwise
   * @throws {Error} If in view-only mode
   */
  static async updateServiceType(userId: string, id: string, name: string, isViewOnly: boolean = false): Promise<boolean> {
    this.checkWritePermission(isViewOnly);
    
    if (!this.isSupabaseConfigured()) {
      return MockDataService.updateServiceType(userId, id, name);
    }

    try {
      const { error } = await supabase
        .from('service_types')
        .update({ name })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error updating service type:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error updating service type:', error);
      return false;
    }
  }

  static async updateServiceTypeFunnelTracking(userId: string, id: string, tracksInFunnel: boolean, isViewOnly: boolean = false): Promise<boolean> {
    this.checkWritePermission(isViewOnly);
    
    if (!this.isSupabaseConfigured()) {
      return MockDataService.updateServiceType(userId, id, ''); // Mock service doesn't support this yet
    }

    try {
      const { error } = await supabase
        .from('service_types')
        .update({ tracks_in_funnel: tracksInFunnel })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error updating service type funnel tracking:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error updating service type funnel tracking:', error);
      return false;
    }
  }

  /**
   * Delete a service type
   * 
   * @param userId - The ID of the user owning the service type
   * @param id - The ID of the service type to delete
   * @param isViewOnly - If true, throws error (view-only mode). Defaults to false.
   * @returns Promise resolving to true if deletion successful, false otherwise
   * @throws {Error} If in view-only mode
   * 
   * @remarks
   * Note: This does not check if any bookings are using this service type.
   * The UI should handle that validation before calling this method.
   */
  static async deleteServiceType(userId: string, id: string, isViewOnly: boolean = false): Promise<boolean> {
    this.checkWritePermission(isViewOnly);
    
    if (!this.isSupabaseConfigured()) {
      return MockDataService.deleteServiceType(userId, id);
    }

    try {
      const { error } = await supabase
        .from('service_types')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error deleting service type:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error deleting service type:', error);
      return false;
    }
  }

  // ============================================================================
  // LEAD SOURCES
  // ============================================================================
  
  static async getLeadSources(userId: string): Promise<LeadSource[]> {
    if (!this.isSupabaseConfigured()) {
      return MockDataService.getLeadSources(userId);
    }

    try {
      const { data, error } = await supabase
        .from('lead_sources')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) {
        logger.error('Error fetching lead sources:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        name: item.name,
        isCustom: true // All database items are considered custom
      })) || [];
    } catch (error) {
      logger.error('Error fetching lead sources:', error);
      return [];
    }
  }

  static async createLeadSource(userId: string, name: string, isViewOnly: boolean = false): Promise<LeadSource | null> {
    this.checkWritePermission(isViewOnly);
    
    if (!this.isSupabaseConfigured()) {
      return MockDataService.createLeadSource(userId, name);
    }

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
        logger.error('Error creating lead source:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        isCustom: true
      };
    } catch (error) {
      logger.error('Error creating lead source:', error);
      return null;
    }
  }

  static async updateLeadSource(userId: string, id: string, name: string, isViewOnly: boolean = false): Promise<boolean> {
    this.checkWritePermission(isViewOnly);
    
    if (!this.isSupabaseConfigured()) {
      return MockDataService.updateLeadSource(userId, id, name);
    }

    try {
      const { error } = await supabase
        .from('lead_sources')
        .update({ name })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error updating lead source:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error updating lead source:', error);
      return false;
    }
  }

  static async deleteLeadSource(userId: string, id: string, isViewOnly: boolean = false): Promise<boolean> {
    this.checkWritePermission(isViewOnly);
    
    if (!this.isSupabaseConfigured()) {
      return MockDataService.deleteLeadSource(userId, id);
    }

    try {
      const { error } = await supabase
        .from('lead_sources')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error deleting lead source:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error deleting lead source:', error);
      return false;
    }
  }

  // ============================================================================
  // BOOKINGS
  // ============================================================================
  
  static async getBookings(userId: string): Promise<Booking[]> {
    if (!this.isSupabaseConfigured()) {
      return MockDataService.getBookings(userId);
    }

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
        logger.error('Error fetching bookings:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        projectName: item.client_name, // Map client_name to projectName
        serviceTypeId: item.service_type_id,
        leadSourceId: item.lead_source_id,
        dateInquired: item.date_inquired || item.booking_date, // Use new column or fallback
        dateBooked: item.booking_date,
        projectDate: item.project_date || item.booking_date, // Use new column or fallback
        bookedRevenue: item.booked_revenue || 0, // Use new column
        status: item.status,
        notes: item.notes || '',
        createdAt: item.created_at
      })) || [];
    } catch (error) {
      logger.error('Error fetching bookings:', error);
      return [];
    }
  }

  static async createBooking(userId: string, bookingData: Omit<Booking, 'id' | 'createdAt'>, isViewOnly: boolean = false): Promise<Booking | null> {
    this.checkWritePermission(isViewOnly);
    
    if (!this.isSupabaseConfigured()) {
      return MockDataService.createBooking(userId, bookingData);
    }

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
          booking_date: bookingData.dateBooked || null,
          date_inquired: bookingData.dateInquired || null,
          project_date: bookingData.projectDate || null,
          booked_revenue: bookingData.bookedRevenue || 0,
          status: bookingData.status || 'confirmed',
          notes: bookingData.notes || ''
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating booking:', error);
        return null;
      }

      return {
        id: data.id,
        ...bookingData,
        createdAt: data.created_at
      };
    } catch (error) {
      logger.error('Error creating booking:', error);
      return null;
    }
  }

  static async updateBooking(userId: string, id: string, updates: Partial<Booking>, isViewOnly: boolean = false): Promise<boolean> {
    this.checkWritePermission(isViewOnly);
    
    if (!this.isSupabaseConfigured()) {
      return MockDataService.updateBooking(userId, id, updates);
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          client_name: updates.projectName,
          service_type_id: updates.serviceTypeId,
          lead_source_id: updates.leadSourceId,
          booking_date: updates.dateBooked !== undefined ? (updates.dateBooked || null) : undefined,
          status: updates.status,
          notes: updates.notes
        })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error updating booking:', error);
        return false;
      }

      // Update additional fields if they exist
      if (updates.dateInquired !== undefined || updates.projectDate !== undefined || updates.bookedRevenue !== undefined) {
        const additionalUpdates: any = {};
        
        if (updates.dateInquired !== undefined) {
          additionalUpdates.date_inquired = updates.dateInquired || null;
        }
        
        if (updates.projectDate !== undefined) {
          additionalUpdates.project_date = updates.projectDate || null;
        }
        
        if (updates.bookedRevenue !== undefined) {
          additionalUpdates.booked_revenue = updates.bookedRevenue;
        }
        
        // Only update if we have additional fields
        if (Object.keys(additionalUpdates).length > 0) {
          const { error: additionalError } = await supabase
            .from('bookings')
            .update(additionalUpdates)
            .eq('id', id)
            .eq('user_id', userId);

          if (additionalError) {
            logger.error('Error updating additional booking fields:', additionalError);
            // Don't return false here - the main update succeeded
          }
        }
      }

      return true;
    } catch (error) {
      logger.error('Error updating booking:', error);
      return false;
    }
  }

  static async deleteBooking(userId: string, id: string, isViewOnly: boolean = false): Promise<boolean> {
    this.checkWritePermission(isViewOnly);
    
    if (!this.isSupabaseConfigured()) {
      return MockDataService.deleteBooking(userId, id);
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error deleting booking:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error deleting booking:', error);
      return false;
    }
  }

  // ============================================================================
  // PAYMENTS
  // ============================================================================
  
  static async getPayments(userId: string, bookingId?: string): Promise<Payment[]> {
    if (!this.isSupabaseConfigured()) {
      return MockDataService.getPayments(userId, bookingId);
    }

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
        logger.error('Error fetching payments:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        bookingId: item.booking_id,
        amount: item.amount_cents, // Map amount_cents to amount
        amountCents: item.amount_cents,
        paymentDate: item.payment_date,
        dueDate: item.payment_date,
        paidAt: item.status === 'completed' ? item.payment_date : null,
        memo: item.notes || '',
        paymentMethod: item.payment_method || '',
        status: item.status,
        expectedDate: this.convertDateToMonthYear(item.expected_date),
        isExpected: item.is_expected || false
      })) || [];
    } catch (error) {
      logger.error('Error fetching payments:', error);
      return [];
    }
  }

  static async createPayment(userId: string, paymentData: Omit<Payment, 'id'>, isViewOnly: boolean = false): Promise<Payment | null> {
    this.checkWritePermission(isViewOnly);
    
    if (!this.isSupabaseConfigured()) {
      return MockDataService.createPayment(userId, paymentData);
    }

    try {
      // For scheduled payments (isExpected = true), use expected_date for payment_date
      // For actual payments, use the provided payment date
      const actualPaymentDate = paymentData.expectedDate || paymentData.dueDate;
      
      const insertData: any = {
          user_id: userId,
          booking_id: paymentData.bookingId,
          amount_cents: paymentData.amount,
        payment_method: paymentData.paymentMethod || null,
          status: paymentData.paidAt ? 'completed' : 'pending',
        notes: paymentData.memo || null,
        expected_date: this.convertMonthYearToDate(paymentData.expectedDate),
        is_expected: paymentData.isExpected || false
      };
      
      // Only include payment_date if we have a date value
      // The NOT NULL constraint requires a date, so use expected_date for scheduled payments
      const convertedActualDate = this.convertMonthYearToDate(actualPaymentDate);
      if (convertedActualDate) {
        insertData.payment_date = convertedActualDate;
      } else if (paymentData.isExpected && paymentData.expectedDate) {
        // For expected payments, use expected_date if available
        const convertedExpectedDate = this.convertMonthYearToDate(paymentData.expectedDate);
        insertData.payment_date = convertedExpectedDate || new Date().toISOString().split('T')[0];
      } else {
        // For non-expected payments without a date, use today's date
        insertData.payment_date = new Date().toISOString().split('T')[0];
      }
      
      const { data, error } = await supabase
        .from('payments')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        logger.error('Error creating payment:', error);
        logger.error('Payment data being inserted:', insertData);
        return null;
      }

      return {
        id: data.id,
        ...paymentData
      };
    } catch (error) {
      logger.error('Error creating payment:', error);
      return null;
    }
  }

  static async updatePayment(userId: string, id: string, updates: Partial<Payment>, isViewOnly: boolean = false): Promise<boolean> {
    this.checkWritePermission(isViewOnly);
    
    if (!this.isSupabaseConfigured()) {
      return MockDataService.updatePayment(userId, id, updates);
    }

    try {
      const updateData: any = {};
      if (updates.bookingId !== undefined) updateData.booking_id = updates.bookingId;
      if (updates.amount !== undefined) updateData.amount_cents = updates.amount;
      if (updates.dueDate !== undefined || updates.expectedDate !== undefined) {
        const dateToUse = updates.expectedDate || updates.dueDate;
        const convertedDate = this.convertMonthYearToDate(dateToUse);
        if (convertedDate) {
          updateData.payment_date = convertedDate;
        }
      }
      if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod;
      if (updates.paidAt !== undefined) updateData.status = updates.paidAt ? 'completed' : 'pending';
      if (updates.memo !== undefined) updateData.notes = updates.memo;
      if (updates.expectedDate !== undefined) {
        updateData.expected_date = this.convertMonthYearToDate(updates.expectedDate);
      }
      if (updates.isExpected !== undefined) updateData.is_expected = updates.isExpected;

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error updating payment:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error updating payment:', error);
      return false;
    }
  }

  static async deletePayment(userId: string, id: string, isViewOnly: boolean = false): Promise<boolean> {
    this.checkWritePermission(isViewOnly);
    
    if (!this.isSupabaseConfigured()) {
      return MockDataService.deletePayment(userId, id);
    }

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error deleting payment:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error deleting payment:', error);
      return false;
    }
  }

  // ============================================================================
  // AD CAMPAIGNS (AdSource removed - campaigns now link directly to LeadSource)
  // ============================================================================
  
  static async getAdCampaigns(userId: string): Promise<AdCampaign[]> {
    if (!this.isSupabaseConfigured()) {
      return MockDataService.getAdCampaigns(userId);
    }

    try {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('month_year', { ascending: false });

      if (error) {
        logger.error('Error fetching ad campaigns:', error);
        return [];
      }

      return data?.map(item => {
        // Parse month_year (format: "2024-01") into year and month
        const [yearStr, monthStr] = item.month_year.split('-');
        const year = parseInt(yearStr);
        const month = parseInt(monthStr);
        
        return {
          id: item.id,
          leadSourceId: item.lead_source_id,
          year: year,
          month: month,
          monthYear: item.month_year,
          adSpendCents: item.ad_spend_cents,
          spend: item.ad_spend_cents, // Same value, different field name
          leadsGenerated: item.leads_generated,
          notes: item.notes || undefined,
          createdAt: item.created_at,
          lastUpdated: item.last_updated
        };
      }) || [];
    } catch (error) {
      logger.error('Error fetching ad campaigns:', error);
      return [];
    }
  }

  static async createAdCampaign(userId: string, adCampaignData: Omit<AdCampaign, 'id' | 'createdAt'>, isViewOnly: boolean = false): Promise<AdCampaign | null> {
    this.checkWritePermission(isViewOnly);
    
    if (!this.isSupabaseConfigured()) {
      return MockDataService.createAdCampaign(userId, adCampaignData);
    }

    try {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .insert({
          user_id: userId,
          lead_source_id: adCampaignData.leadSourceId,
          month_year: adCampaignData.monthYear,
          ad_spend_cents: adCampaignData.adSpendCents,
          leads_generated: adCampaignData.leadsGenerated,
          notes: adCampaignData.notes || null
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating ad campaign:', error);
        return null;
      }

      // Parse month_year back to year and month
      const [yearStr, monthStr] = data.month_year.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);

      return {
        id: data.id,
        leadSourceId: data.lead_source_id,
        year: year,
        month: month,
        monthYear: data.month_year,
        adSpendCents: data.ad_spend_cents,
        spend: data.ad_spend_cents,
        leadsGenerated: data.leads_generated,
        notes: data.notes || undefined,
        createdAt: data.created_at,
        lastUpdated: data.last_updated
      };
    } catch (error) {
      logger.error('Error creating ad campaign:', error);
      return null;
    }
  }

  static async updateAdCampaign(userId: string, id: string, updates: Partial<AdCampaign>, isViewOnly: boolean = false): Promise<boolean> {
    this.checkWritePermission(isViewOnly);
    
    if (!this.isSupabaseConfigured()) {
      return MockDataService.updateAdCampaign(userId, id, updates);
    }

    try {
      const updateData: any = {};
      if (updates.adSpendCents !== undefined) updateData.ad_spend_cents = updates.adSpendCents;
      if (updates.leadsGenerated !== undefined) updateData.leads_generated = updates.leadsGenerated;
      if (updates.monthYear !== undefined) updateData.month_year = updates.monthYear;
      if (updates.notes !== undefined) updateData.notes = updates.notes || null;

      const { error } = await supabase
        .from('ad_campaigns')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error updating ad campaign:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error updating ad campaign:', error);
      return false;
    }
  }

  static async deleteAdCampaign(userId: string, id: string, isViewOnly: boolean = false): Promise<boolean> {
    this.checkWritePermission(isViewOnly);
    
    if (!this.isSupabaseConfigured()) {
      return MockDataService.deleteAdCampaign(userId, id);
    }

    try {
      const { error } = await supabase
        .from('ad_campaigns')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error deleting ad campaign:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error deleting ad campaign:', error);
      return false;
    }
  }

  // Forecast Model operations
  static async getForecastModels(userId: string): Promise<ForecastModel[]> {
    if (!this.isSupabaseConfigured()) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('forecast_models')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error loading forecast models:', error);
        return [];
      }

      // Convert database rows to ForecastModel format
      return (data || []).map((row: any) => {
        const params = row.parameters || {};
        return {
          id: row.id,
          name: row.name,
          description: row.description || '',
          modelType: row.model_type || 'forecast',
          parameters: params,
          year: params.year || new Date().getFullYear(),
          isActive: row.is_active || false,
          serviceTypes: params.serviceTypes || [],
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.updated_at || new Date().toISOString()
        };
      });
    } catch (error) {
      logger.error('Error loading forecast models:', error);
      return [];
    }
  }

  static async saveForecastModel(userId: string, model: ForecastModel, isViewOnly: boolean = false): Promise<ForecastModel | null> {
    this.checkWritePermission(isViewOnly);
    
    if (!this.isSupabaseConfigured()) {
      logger.debug('saveForecastModel: Supabase not configured');
      return null;
    }

    try {
      logger.debug('saveForecastModel: Saving model:', { id: model.id, name: model.name, serviceTypesCount: model.serviceTypes?.length });
      
      const modelData: any = {
        user_id: userId,
        name: model.name,
        description: model.description || '',
        model_type: model.modelType || 'forecast',
        is_active: model.isActive || false,
        parameters: {
          year: model.year,
          serviceTypes: model.serviceTypes || []
        },
        updated_at: new Date().toISOString()
      };

      logger.debug('saveForecastModel: Model data to save:', modelData);

      // If model has an ID, update; otherwise create
      if (model.id && !model.id.startsWith('model_')) {
        logger.debug('saveForecastModel: Updating existing model with ID:', model.id);
        // It's a real database ID, update
        const { data, error } = await supabase
          .from('forecast_models')
          .update(modelData)
          .eq('id', model.id)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          logger.error('Error updating forecast model:', error);
          return null;
        }

        logger.debug('saveForecastModel: Update successful, data:', data);
        // Convert back to ForecastModel format
        const params = data.parameters || {};
        const savedModel = {
          id: data.id,
          name: data.name,
          description: data.description || '',
          modelType: data.model_type || 'forecast',
          parameters: params,
          year: params.year || new Date().getFullYear(),
          isActive: data.is_active || false,
          serviceTypes: params.serviceTypes || [],
          createdAt: data.created_at || new Date().toISOString(),
          updatedAt: data.updated_at || new Date().toISOString()
        };
        logger.debug('saveForecastModel: Returning saved model:', savedModel);
        return savedModel;
      } else {
        // It's a new model or temporary ID, create
        logger.debug('saveForecastModel: Creating new model');
        modelData.created_at = model.createdAt || new Date().toISOString();
        const { data, error } = await supabase
          .from('forecast_models')
          .insert(modelData)
          .select()
          .single();

        if (error) {
          logger.error('Error creating forecast model:', error);
          return null;
        }
        
        logger.debug('saveForecastModel: Create successful, data:', data);
        // Convert back to ForecastModel format
        const params = data.parameters || {};
        const savedModel = {
          id: data.id,
          name: data.name,
          description: data.description || '',
          modelType: data.model_type || 'forecast',
          parameters: params,
          year: params.year || new Date().getFullYear(),
          isActive: data.is_active || false,
          serviceTypes: params.serviceTypes || [],
          createdAt: data.created_at || new Date().toISOString(),
          updatedAt: data.updated_at || new Date().toISOString()
        };
        logger.debug('saveForecastModel: Returning saved model:', savedModel);
        return savedModel;
      }
    } catch (error) {
      logger.error('Error saving forecast model:', error);
      return null;
    }
  }

  static async deleteForecastModel(userId: string, id: string, isViewOnly: boolean = false): Promise<boolean> {
    this.checkWritePermission(isViewOnly);
    
    if (!this.isSupabaseConfigured()) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('forecast_models')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error deleting forecast model:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error deleting forecast model:', error);
      return false;
    }
  }

  // Calculator Goals - stored as a special row in funnels table with year=0, month=0
  static async getCalculatorGoals(userId: string): Promise<{
    bookingsGoal: number;
    inquiryToCall: number;
    callToBooking: number;
  } | null> {
    if (!this.isSupabaseConfigured()) {
      return { bookingsGoal: 0, inquiryToCall: 0, callToBooking: 0 };
    }

    try {
      const { data, error } = await supabase
        .from('funnels')
        .select('bookings_goal, inquiry_to_call, call_to_booking')
        .eq('user_id', userId)
        .eq('year', 0)
        .eq('month', 0)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching calculator goals:', error);
        return null;
      }

      if (!data) {
        return null; // No goals saved yet
      }

      return {
        bookingsGoal: data.bookings_goal || 0,
        inquiryToCall: data.inquiry_to_call || 0,
        callToBooking: data.call_to_booking || 0,
      };
    } catch (error) {
      logger.error('Error fetching calculator goals:', error);
      return null;
    }
  }

  static async saveCalculatorGoals(
    userId: string,
    goals: { bookingsGoal: number; inquiryToCall: number; callToBooking: number },
    isViewOnly: boolean = false
  ): Promise<boolean> {
    this.checkWritePermission(isViewOnly);
    
    if (!this.isSupabaseConfigured()) {
      return true; // Mock success
    }

    try {
      // Check if calculator goals record exists
      const { data: existingData, error: fetchError } = await supabase
        .from('funnels')
        .select('id')
        .eq('user_id', userId)
        .eq('year', 0)
        .eq('month', 0)
        .maybeSingle();

      if (fetchError) {
        logger.error('Error checking for existing calculator goals:', fetchError);
        return false;
      }

      const recordId = existingData?.id;

      const upsertData: any = {
        user_id: userId,
        name: 'Calculator',
        year: 0,
        month: 0,
        bookings_goal: goals.bookingsGoal,
        inquiry_to_call: goals.inquiryToCall,
        call_to_booking: goals.callToBooking,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (recordId) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('funnels')
          .update(upsertData)
          .eq('id', recordId);
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('funnels')
          .insert(upsertData);
        error = insertError;
      }

      if (error) {
        logger.error('Error saving calculator goals:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error saving calculator goals:', error);
      return false;
    }
  }

  /**
   * Creates default service types and lead sources for new users
   * Called automatically when a user signs up
   */
  static async createDefaultDataForNewUser(userId: string): Promise<void> {
    try {
      // Create default Service Type: "Wedding" with tracks_in_funnel = true
      await this.createServiceType(userId, 'Wedding', true);

      // Create default Lead Sources
      const defaultLeadSources = ['Client Referral', 'Google', 'Returning Client'];
      for (const leadSourceName of defaultLeadSources) {
        await this.createLeadSource(userId, leadSourceName);
      }

      logger.debug('Default service types and lead sources created for new user:', userId);
    } catch (error) {
      logger.error('Error creating default data for new user:', error);
      // Don't throw - we don't want to fail signup if default data creation fails
    }
  }
}
