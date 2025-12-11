import { createClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// Log warning if using placeholder values
if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-key') {
  logger.warn('⚠️ Supabase environment variables not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})

// Database types (matching our schema as of latest migrations)
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          company_name: string | null
          subscription_tier: string
          subscription_status: string
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          company_name?: string | null
          subscription_tier?: string
          subscription_status?: string
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          company_name?: string | null
          subscription_tier?: string
          subscription_status?: string
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      service_types: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          tracks_in_funnel: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          tracks_in_funnel?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          tracks_in_funnel?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      lead_sources: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          client_name: string
          client_email: string | null
          client_phone: string | null
          service_type_id: string
          lead_source_id: string
          date_inquired: string | null
          booking_date: string | null
          project_date: string | null
          booked_revenue: number
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_name: string
          client_email?: string | null
          client_phone?: string | null
          service_type_id: string
          lead_source_id: string
          date_inquired?: string | null
          booking_date?: string | null
          project_date?: string | null
          booked_revenue?: number
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_name?: string
          client_email?: string | null
          client_phone?: string | null
          service_type_id?: string
          lead_source_id?: string
          date_inquired?: string | null
          booking_date?: string | null
          project_date?: string | null
          booked_revenue?: number
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          booking_id: string
          amount_cents: number
          payment_date: string | null
          due_date: string | null
          expected_date: string | null
          is_expected: boolean
          paid_at: string | null
          payment_method: string | null
          status: string
          memo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          booking_id: string
          amount_cents: number
          payment_date?: string | null
          due_date?: string | null
          expected_date?: string | null
          is_expected?: boolean
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          memo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          booking_id?: string
          amount_cents?: number
          payment_date?: string | null
          due_date?: string | null
          expected_date?: string | null
          is_expected?: boolean
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          memo?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ad_campaigns: {
        Row: {
          id: string
          user_id: string
          lead_source_id: string
          name: string
          month_year: string
          ad_spend_cents: number
          leads_generated: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lead_source_id: string
          name: string
          month_year: string
          ad_spend_cents?: number
          leads_generated?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lead_source_id?: string
          name?: string
          month_year?: string
          ad_spend_cents?: number
          leads_generated?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      funnels: {
        Row: {
          id: string
          user_id: string
          name: string
          year: number | null
          month: number | null
          inquiries: number | null
          calls_booked: number | null
          calls_taken: number | null
          closes: number | null
          bookings: number | null
          cash: number | null
          bookings_goal: number | null
          inquiry_to_call: number | null
          call_to_booking: number | null
          inquiries_ytd: number | null
          calls_ytd: number | null
          bookings_ytd: number | null
          notes: string | null
          closes_manual: boolean
          bookings_manual: boolean
          cash_manual: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string
          year?: number | null
          month?: number | null
          inquiries?: number | null
          calls_booked?: number | null
          calls_taken?: number | null
          closes?: number | null
          bookings?: number | null
          cash?: number | null
          bookings_goal?: number | null
          inquiry_to_call?: number | null
          call_to_booking?: number | null
          inquiries_ytd?: number | null
          calls_ytd?: number | null
          bookings_ytd?: number | null
          notes?: string | null
          closes_manual?: boolean
          bookings_manual?: boolean
          cash_manual?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          year?: number | null
          month?: number | null
          inquiries?: number | null
          calls_booked?: number | null
          calls_taken?: number | null
          closes?: number | null
          bookings?: number | null
          cash?: number | null
          bookings_goal?: number | null
          inquiry_to_call?: number | null
          call_to_booking?: number | null
          inquiries_ytd?: number | null
          calls_ytd?: number | null
          bookings_ytd?: number | null
          notes?: string | null
          closes_manual?: boolean
          bookings_manual?: boolean
          cash_manual?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      forecast_models: {
        Row: {
          id: string
          user_id: string
          name: string
          year: number
          description: string | null
          model_type: string
          parameters: any | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          year: number
          description?: string | null
          model_type: string
          parameters?: any | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          year?: number
          description?: string | null
          model_type?: string
          parameters?: any | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      account_shares: {
        Row: {
          id: string
          owner_user_id: string
          guest_user_id: string | null
          guest_email: string
          invitation_token: string | null
          status: string
          role: string
          invited_at: string
          accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_user_id: string
          guest_user_id?: string | null
          guest_email: string
          invitation_token?: string | null
          status?: string
          role?: string
          invited_at?: string
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_user_id?: string
          guest_user_id?: string | null
          guest_email?: string
          invitation_token?: string | null
          status?: string
          role?: string
          invited_at?: string
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      admin_access_logs: {
        Row: {
          id: string
          admin_user_id: string
          target_user_id: string | null
          action_type: string
          action_details: any | null
          impersonation_session_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_user_id: string
          target_user_id?: string | null
          action_type: string
          action_details?: any | null
          impersonation_session_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_user_id?: string
          target_user_id?: string | null
          action_type?: string
          action_details?: any | null
          impersonation_session_id?: string | null
          created_at?: string
        }
      }
    }
  }
}
