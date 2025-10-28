import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// Log warning if using placeholder values
if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-key') {
  console.warn('⚠️ Supabase environment variables not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (matching our schema)
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
          booking_date: string
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
          booking_date: string
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
          booking_date?: string
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
          payment_date: string
          payment_method: string | null
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          booking_id: string
          amount_cents: number
          payment_date: string
          payment_method?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          booking_id?: string
          amount_cents?: number
          payment_date?: string
          payment_method?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ad_sources: {
        Row: {
          id: string
          user_id: string
          name: string
          lead_source_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          lead_source_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          lead_source_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      ad_campaigns: {
        Row: {
          id: string
          user_id: string
          ad_source_id: string
          month_year: string
          ad_spend_cents: number
          leads_generated: number
          last_updated: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ad_source_id: string
          month_year: string
          ad_spend_cents?: number
          leads_generated?: number
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ad_source_id?: string
          month_year?: string
          ad_spend_cents?: number
          leads_generated?: number
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
      }
      funnels: {
        Row: {
          id: string
          user_id: string
          name: string
          bookings_goal: number | null
          inquiry_to_call: number | null
          call_to_booking: number | null
          inquiries_ytd: number | null
          calls_ytd: number | null
          bookings_ytd: number | null
          last_updated: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string
          bookings_goal?: number | null
          inquiry_to_call?: number | null
          call_to_booking?: number | null
          inquiries_ytd?: number | null
          calls_ytd?: number | null
          bookings_ytd?: number | null
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          bookings_goal?: number | null
          inquiry_to_call?: number | null
          call_to_booking?: number | null
          inquiries_ytd?: number | null
          calls_ytd?: number | null
          bookings_ytd?: number | null
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
      }
      forecast_models: {
        Row: {
          id: string
          user_id: string
          name: string
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
          description?: string | null
          model_type?: string
          parameters?: any | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
