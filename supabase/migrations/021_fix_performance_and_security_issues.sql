-- Migration: Fix Performance and Security Issues
-- Addresses common Supabase dashboard warnings for missing indexes and security improvements

-- ============================================================================
-- PERFORMANCE: Missing Indexes on Foreign Keys
-- ============================================================================

-- service_types.user_id - frequently queried, should have index
CREATE INDEX IF NOT EXISTS idx_service_types_user_id ON service_types(user_id);

-- lead_sources.user_id - frequently queried, should have index  
CREATE INDEX IF NOT EXISTS idx_lead_sources_user_id ON lead_sources(user_id);

-- bookings.service_type_id - foreign key, frequently joined
CREATE INDEX IF NOT EXISTS idx_bookings_service_type_id ON bookings(service_type_id);

-- bookings.lead_source_id - foreign key, frequently joined
CREATE INDEX IF NOT EXISTS idx_bookings_lead_source_id ON bookings(lead_source_id);

-- payments.user_id - frequently queried for user's payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- ad_sources.user_id - frequently queried (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ad_sources') THEN
    CREATE INDEX IF NOT EXISTS idx_ad_sources_user_id ON ad_sources(user_id);
    CREATE INDEX IF NOT EXISTS idx_ad_sources_lead_source_id ON ad_sources(lead_source_id);
  END IF;
END $$;

-- ad_campaigns.ad_source_id - foreign key, frequently joined (only if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_campaigns' 
    AND column_name = 'ad_source_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_ad_campaigns_ad_source_id ON ad_campaigns(ad_source_id);
  END IF;
END $$;

-- funnels.user_id - already has index in some queries, but ensure it exists
CREATE INDEX IF NOT EXISTS idx_funnels_user_id ON funnels(user_id);

-- forecast_models.user_id - frequently queried
CREATE INDEX IF NOT EXISTS idx_forecast_models_user_id ON forecast_models(user_id);

-- ============================================================================
-- PERFORMANCE: Indexes on Frequently Queried/Sorted Columns
-- ============================================================================

-- bookings.booking_date - frequently filtered and sorted by date
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date DESC);

-- bookings.created_at - frequently sorted by creation date
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- payments.payment_date - frequently filtered and sorted by date
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date DESC);

-- payments.created_at - frequently sorted by creation date
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- ad_campaigns.created_at - frequently sorted (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ad_campaigns') THEN
    CREATE INDEX IF NOT EXISTS idx_ad_campaigns_created_at ON ad_campaigns(created_at DESC);
  END IF;
END $$;

-- forecast_models.is_active - frequently filtered for active models
CREATE INDEX IF NOT EXISTS idx_forecast_models_is_active ON forecast_models(is_active) WHERE is_active = TRUE;

-- forecast_models.created_at - frequently sorted
CREATE INDEX IF NOT EXISTS idx_forecast_models_created_at ON forecast_models(created_at DESC);

-- user_profiles.created_at - frequently sorted in admin dashboard
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at DESC);

-- ============================================================================
-- PERFORMANCE: Composite Indexes for Common Query Patterns
-- ============================================================================

-- Common query: Get bookings for user filtered by date range
CREATE INDEX IF NOT EXISTS idx_bookings_user_date ON bookings(user_id, booking_date DESC);

-- Common query: Get payments for user filtered by date range
CREATE INDEX IF NOT EXISTS idx_payments_user_date ON payments(user_id, payment_date DESC);

-- Common query: Get bookings for user by service type
CREATE INDEX IF NOT EXISTS idx_bookings_user_service ON bookings(user_id, service_type_id);

-- Common query: Get bookings for user by lead source
CREATE INDEX IF NOT EXISTS idx_bookings_user_lead_source ON bookings(user_id, lead_source_id);

-- Common query: Get ad campaigns for user by month (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ad_campaigns') THEN
    CREATE INDEX IF NOT EXISTS idx_ad_campaigns_user_month ON ad_campaigns(user_id, month_year);
  END IF;
END $$;

-- ============================================================================
-- SECURITY: Ensure RLS is enabled on all tables
-- ============================================================================

-- Double-check RLS is enabled (idempotent)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
-- Enable RLS on tables that exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ad_sources') THEN
    ALTER TABLE ad_sources ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ad_campaigns') THEN
    ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_models ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECURITY: Add missing RLS policies if they don't exist
-- ============================================================================

-- Ensure account_shares has RLS (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'account_shares') THEN
    ALTER TABLE account_shares ENABLE ROW LEVEL SECURITY;
    
    -- Owner can view their shares
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'account_shares' AND policyname = 'Owners can view their shares') THEN
      CREATE POLICY "Owners can view their shares" ON account_shares
        FOR SELECT USING (auth.uid() = owner_user_id);
    END IF;
    
    -- Guest can view shares they're invited to
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'account_shares' AND policyname = 'Guests can view their invitations') THEN
      CREATE POLICY "Guests can view their invitations" ON account_shares
        FOR SELECT USING (auth.uid() = guest_user_id OR auth.email() = guest_email);
    END IF;
  END IF;
END $$;

-- Ensure admin_access_logs has RLS (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_access_logs') THEN
    ALTER TABLE admin_access_logs ENABLE ROW LEVEL SECURITY;
    
    -- Only admins can view logs
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_access_logs' AND policyname = 'Admins can view all logs') THEN
      CREATE POLICY "Admins can view all logs" ON admin_access_logs
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
          )
        );
    END IF;
    
    -- Only admins can insert logs
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_access_logs' AND policyname = 'Admins can insert logs') THEN
      CREATE POLICY "Admins can insert logs" ON admin_access_logs
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
          )
        );
    END IF;
  END IF;
END $$;

-- ============================================================================
-- PERFORMANCE: Analyze tables to update statistics
-- ============================================================================

-- Update table statistics for query planner
ANALYZE user_profiles;
ANALYZE service_types;
ANALYZE lead_sources;
ANALYZE bookings;
ANALYZE payments;
-- Analyze tables that exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ad_sources') THEN
    ANALYZE ad_sources;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ad_campaigns') THEN
    ANALYZE ad_campaigns;
  END IF;
END $$;
ANALYZE funnels;
ANALYZE forecast_models;

-- Analyze account_shares if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'account_shares') THEN
    ANALYZE account_shares;
  END IF;
END $$;

-- Analyze admin_access_logs if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_access_logs') THEN
    ANALYZE admin_access_logs;
  END IF;
END $$;

