import { supabase } from '../lib/supabase'
import type { 
  FunnelData, 
  ServiceType, 
  LeadSource, 
  Booking, 
  Payment, 
  AdSource, 
  AdCampaign, 
  ForecastModel 
} from '../types'

// Helper function to get current user ID
const getCurrentUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  return user.id
}

// Helper function to convert database row to our types
const convertToFunnelData = (row: any): FunnelData => ({
  id: row.id,
  name: row.name,
  bookingsGoal: row.bookings_goal,
  inquiryToCall: row.inquiry_to_call,
  callToBooking: row.call_to_booking,
  inquiriesYtd: row.inquiries_ytd,
  callsYtd: row.calls_ytd,
  bookingsYtd: row.bookings_ytd,
  lastUpdated: new Date(row.last_updated)
})

const convertToServiceType = (row: any): ServiceType => ({
  id: row.id,
  name: row.name,
  description: row.description || ''
})

const convertToLeadSource = (row: any): LeadSource => ({
  id: row.id,
  name: row.name,
  description: row.description || ''
})

const convertToBooking = (row: any): Booking => ({
  id: row.id,
  clientName: row.client_name,
  clientEmail: row.client_email || '',
  clientPhone: row.client_phone || '',
  serviceTypeId: row.service_type_id,
  leadSourceId: row.lead_source_id,
  bookingDate: new Date(row.booking_date),
  status: row.status,
  notes: row.notes || '',
  payments: [] // Will be loaded separately
})

const convertToPayment = (row: any): Payment => ({
  id: row.id,
  bookingId: row.booking_id,
  amountCents: row.amount_cents,
  paymentDate: new Date(row.payment_date),
  paymentMethod: row.payment_method || '',
  status: row.status,
  notes: row.notes || ''
})

const convertToAdSource = (row: any): AdSource => ({
  id: row.id,
  name: row.name,
  leadSourceId: row.lead_source_id
})

const convertToAdCampaign = (row: any): AdCampaign => ({
  id: row.id,
  adSourceId: row.ad_source_id,
  monthYear: row.month_year,
  adSpendCents: row.ad_spend_cents,
  leadsGenerated: row.leads_generated,
  lastUpdated: new Date(row.last_updated)
})

const convertToForecastModel = (row: any): ForecastModel => {
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
};

export class SupabaseDataService {
  // Funnel Service
  static async getAllFunnels(): Promise<FunnelData[]> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('funnels')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data.map(convertToFunnelData)
  }

  static async getFunnelById(id: string): Promise<FunnelData | null> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('funnels')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) return null
    return convertToFunnelData(data)
  }

  static async createFunnel(funnel: Omit<FunnelData, 'id' | 'lastUpdated'>): Promise<FunnelData> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('funnels')
      .insert({
        user_id: userId,
        name: funnel.name,
        bookings_goal: funnel.bookingsGoal,
        inquiry_to_call: funnel.inquiryToCall,
        call_to_booking: funnel.callToBooking,
        inquiries_ytd: funnel.inquiriesYtd,
        calls_ytd: funnel.callsYtd,
        bookings_ytd: funnel.bookingsYtd
      })
      .select()
      .single()

    if (error) throw error
    return convertToFunnelData(data)
  }

  static async updateFunnel(id: string, updates: Partial<FunnelData>): Promise<FunnelData> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('funnels')
      .update({
        name: updates.name,
        bookings_goal: updates.bookingsGoal,
        inquiry_to_call: updates.inquiryToCall,
        call_to_booking: updates.callToBooking,
        inquiries_ytd: updates.inquiriesYtd,
        calls_ytd: updates.callsYtd,
        bookings_ytd: updates.bookingsYtd,
        last_updated: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return convertToFunnelData(data)
  }

  static async deleteFunnel(id: string): Promise<void> {
    const userId = await getCurrentUserId()
    const { error } = await supabase
      .from('funnels')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Service Type Service
  static async getAllServiceTypes(): Promise<ServiceType[]> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (error) throw error
    return data.map(convertToServiceType)
  }

  static async createServiceType(serviceType: Omit<ServiceType, 'id'>): Promise<ServiceType> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('service_types')
      .insert({
        user_id: userId,
        name: serviceType.name,
        description: serviceType.description
      })
      .select()
      .single()

    if (error) throw error
    return convertToServiceType(data)
  }

  static async updateServiceType(id: string, updates: Partial<ServiceType>): Promise<ServiceType> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('service_types')
      .update({
        name: updates.name,
        description: updates.description
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return convertToServiceType(data)
  }

  static async deleteServiceType(id: string): Promise<void> {
    const userId = await getCurrentUserId()
    const { error } = await supabase
      .from('service_types')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Lead Source Service
  static async getAllLeadSources(): Promise<LeadSource[]> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('lead_sources')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (error) throw error
    return data.map(convertToLeadSource)
  }

  static async createLeadSource(leadSource: Omit<LeadSource, 'id'>): Promise<LeadSource> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('lead_sources')
      .insert({
        user_id: userId,
        name: leadSource.name,
        description: leadSource.description
      })
      .select()
      .single()

    if (error) throw error
    return convertToLeadSource(data)
  }

  static async updateLeadSource(id: string, updates: Partial<LeadSource>): Promise<LeadSource> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('lead_sources')
      .update({
        name: updates.name,
        description: updates.description
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return convertToLeadSource(data)
  }

  static async deleteLeadSource(id: string): Promise<void> {
    const userId = await getCurrentUserId()
    const { error } = await supabase
      .from('lead_sources')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Booking Service
  static async getAllBookings(): Promise<Booking[]> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        payments (*)
      `)
      .eq('user_id', userId)
      .order('booking_date', { ascending: false })

    if (error) throw error
    return data.map((row: any) => ({
      ...convertToBooking(row),
      payments: row.payments.map(convertToPayment)
    }))
  }

  static async createBooking(booking: Omit<Booking, 'id' | 'payments'>): Promise<Booking> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        client_name: booking.clientName,
        client_email: booking.clientEmail,
        client_phone: booking.clientPhone,
        service_type_id: booking.serviceTypeId,
        lead_source_id: booking.leadSourceId,
        booking_date: booking.bookingDate.toISOString().split('T')[0],
        status: booking.status,
        notes: booking.notes
      })
      .select()
      .single()

    if (error) throw error
    return { ...convertToBooking(data), payments: [] }
  }

  static async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('bookings')
      .update({
        client_name: updates.clientName,
        client_email: updates.clientEmail,
        client_phone: updates.clientPhone,
        service_type_id: updates.serviceTypeId,
        lead_source_id: updates.leadSourceId,
        booking_date: updates.bookingDate?.toISOString().split('T')[0],
        status: updates.status,
        notes: updates.notes
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return convertToBooking(data)
  }

  static async deleteBooking(id: string): Promise<void> {
    const userId = await getCurrentUserId()
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Payment Service
  static async getPaymentsByBookingId(bookingId: string): Promise<Payment[]> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('user_id', userId)
      .order('payment_date', { ascending: false })

    if (error) throw error
    return data.map(convertToPayment)
  }

  static async createPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        booking_id: payment.bookingId,
        amount_cents: payment.amountCents,
        payment_date: payment.paymentDate.toISOString().split('T')[0],
        payment_method: payment.paymentMethod,
        status: payment.status,
        notes: payment.notes
      })
      .select()
      .single()

    if (error) throw error
    return convertToPayment(data)
  }

  static async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('payments')
      .update({
        booking_id: updates.bookingId,
        amount_cents: updates.amountCents,
        payment_date: updates.paymentDate?.toISOString().split('T')[0],
        payment_method: updates.paymentMethod,
        status: updates.status,
        notes: updates.notes
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return convertToPayment(data)
  }

  static async deletePayment(id: string): Promise<void> {
    const userId = await getCurrentUserId()
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Ad Source Service
  static async getAllAdSources(): Promise<AdSource[]> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('ad_sources')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (error) throw error
    return data.map(convertToAdSource)
  }

  static async createAdSource(adSource: Omit<AdSource, 'id'>): Promise<AdSource> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('ad_sources')
      .insert({
        user_id: userId,
        name: adSource.name,
        lead_source_id: adSource.leadSourceId
      })
      .select()
      .single()

    if (error) throw error
    return convertToAdSource(data)
  }

  static async updateAdSource(id: string, updates: Partial<AdSource>): Promise<AdSource> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('ad_sources')
      .update({
        name: updates.name,
        lead_source_id: updates.leadSourceId
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return convertToAdSource(data)
  }

  static async deleteAdSource(id: string): Promise<void> {
    const userId = await getCurrentUserId()
    const { error } = await supabase
      .from('ad_sources')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Ad Campaign Service
  static async getAllAdCampaigns(): Promise<AdCampaign[]> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('month_year', { ascending: false })

    if (error) throw error
    return data.map(convertToAdCampaign)
  }

  static async getAdCampaignsBySourceId(adSourceId: string): Promise<AdCampaign[]> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('ad_source_id', adSourceId)
      .eq('user_id', userId)
      .order('month_year', { ascending: true })

    if (error) throw error
    return data.map(convertToAdCampaign)
  }

  static async createAdCampaign(adCampaign: Omit<AdCampaign, 'id' | 'lastUpdated'>): Promise<AdCampaign> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('ad_campaigns')
      .insert({
        user_id: userId,
        ad_source_id: adCampaign.adSourceId,
        month_year: adCampaign.monthYear,
        ad_spend_cents: adCampaign.adSpendCents,
        leads_generated: adCampaign.leadsGenerated
      })
      .select()
      .single()

    if (error) throw error
    return convertToAdCampaign(data)
  }

  static async updateAdCampaign(id: string, updates: Partial<AdCampaign>): Promise<AdCampaign> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('ad_campaigns')
      .update({
        ad_source_id: updates.adSourceId,
        month_year: updates.monthYear,
        ad_spend_cents: updates.adSpendCents,
        leads_generated: updates.leadsGenerated,
        last_updated: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return convertToAdCampaign(data)
  }

  static async deleteAdCampaign(id: string): Promise<void> {
    const userId = await getCurrentUserId()
    const { error } = await supabase
      .from('ad_campaigns')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Forecast Model Service
  static async getAllForecastModels(): Promise<ForecastModel[]> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('forecast_models')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data.map(convertToForecastModel)
  }

  static async createForecastModel(forecastModel: Omit<ForecastModel, 'id'>): Promise<ForecastModel> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('forecast_models')
      .insert({
        user_id: userId,
        name: forecastModel.name,
        description: forecastModel.description,
        model_type: forecastModel.modelType,
        parameters: forecastModel.parameters,
        is_active: forecastModel.isActive
      })
      .select()
      .single()

    if (error) throw error
    return convertToForecastModel(data)
  }

  static async updateForecastModel(id: string, updates: Partial<ForecastModel>): Promise<ForecastModel> {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('forecast_models')
      .update({
        name: updates.name,
        description: updates.description,
        model_type: updates.modelType,
        parameters: updates.parameters,
        is_active: updates.isActive
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return convertToForecastModel(data)
  }

  static async deleteForecastModel(id: string): Promise<void> {
    const userId = await getCurrentUserId()
    const { error } = await supabase
      .from('forecast_models')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  }
}
