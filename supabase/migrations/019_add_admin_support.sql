-- Add admin flag to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin) WHERE is_admin = TRUE;

-- Create admin access logs table
CREATE TABLE IF NOT EXISTS admin_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'view_user', 'edit_data', 'impersonate_start', 'impersonate_end', 'view_logs', etc.
  action_details JSONB, -- Store relevant details about the action (e.g., what was edited, which page viewed)
  impersonation_session_id UUID, -- Link start/end events together
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for admin logs
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user ON admin_access_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target_user ON admin_access_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_session ON admin_access_logs(impersonation_session_id);

-- Enable RLS on admin_access_logs
ALTER TABLE admin_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can view all logs
CREATE POLICY "Admins can view all access logs"
  ON admin_access_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = TRUE
    )
  );

-- RLS Policy: Admins can insert logs (for logging their own actions)
CREATE POLICY "Admins can insert access logs"
  ON admin_access_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = TRUE
    )
  );

-- Function to check if current user is admin (for use in RLS policies)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- Add admin bypass policies for all user data tables
-- This allows admins to read and write all user data

-- User Profiles: Admins can view and edit all profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Admins can view all profiles') THEN
    CREATE POLICY "Admins can view all profiles"
      ON user_profiles FOR SELECT
      USING (is_admin());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Admins can update all profiles') THEN
    CREATE POLICY "Admins can update all profiles"
      ON user_profiles FOR UPDATE
      USING (is_admin());
  END IF;
END $$;

-- Service Types: Admins can view and edit all service types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_types' AND policyname = 'Admins can view all service types') THEN
    CREATE POLICY "Admins can view all service types"
      ON service_types FOR SELECT
      USING (is_admin());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_types' AND policyname = 'Admins can insert service types') THEN
    CREATE POLICY "Admins can insert service types"
      ON service_types FOR INSERT
      WITH CHECK (is_admin());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_types' AND policyname = 'Admins can update service types') THEN
    CREATE POLICY "Admins can update service types"
      ON service_types FOR UPDATE
      USING (is_admin());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_types' AND policyname = 'Admins can delete service types') THEN
    CREATE POLICY "Admins can delete service types"
      ON service_types FOR DELETE
      USING (is_admin());
  END IF;
END $$;

-- Lead Sources: Admins can view and edit all lead sources
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_sources' AND policyname = 'Admins can view all lead sources') THEN
    CREATE POLICY "Admins can view all lead sources"
      ON lead_sources FOR SELECT
      USING (is_admin());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_sources' AND policyname = 'Admins can insert lead sources') THEN
    CREATE POLICY "Admins can insert lead sources"
      ON lead_sources FOR INSERT
      WITH CHECK (is_admin());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_sources' AND policyname = 'Admins can update lead sources') THEN
    CREATE POLICY "Admins can update lead sources"
      ON lead_sources FOR UPDATE
      USING (is_admin());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_sources' AND policyname = 'Admins can delete lead sources') THEN
    CREATE POLICY "Admins can delete lead sources"
      ON lead_sources FOR DELETE
      USING (is_admin());
  END IF;
END $$;

-- Bookings: Admins can view and edit all bookings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Admins can view all bookings') THEN
    CREATE POLICY "Admins can view all bookings"
      ON bookings FOR SELECT
      USING (is_admin());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Admins can insert bookings') THEN
    CREATE POLICY "Admins can insert bookings"
      ON bookings FOR INSERT
      WITH CHECK (is_admin());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Admins can update bookings') THEN
    CREATE POLICY "Admins can update bookings"
      ON bookings FOR UPDATE
      USING (is_admin());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Admins can delete bookings') THEN
    CREATE POLICY "Admins can delete bookings"
      ON bookings FOR DELETE
      USING (is_admin());
  END IF;
END $$;

-- Payments: Admins can view and edit all payments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Admins can view all payments') THEN
    CREATE POLICY "Admins can view all payments"
      ON payments FOR SELECT
      USING (is_admin());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Admins can insert payments') THEN
    CREATE POLICY "Admins can insert payments"
      ON payments FOR INSERT
      WITH CHECK (is_admin());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Admins can update payments') THEN
    CREATE POLICY "Admins can update payments"
      ON payments FOR UPDATE
      USING (is_admin());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Admins can delete payments') THEN
    CREATE POLICY "Admins can delete payments"
      ON payments FOR DELETE
      USING (is_admin());
  END IF;
END $$;

-- Ad Campaigns: Admins can view and edit all ad campaigns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ad_campaigns' AND policyname = 'Admins can view all ad campaigns') THEN
    CREATE POLICY "Admins can view all ad campaigns"
      ON ad_campaigns FOR SELECT
      USING (is_admin());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ad_campaigns' AND policyname = 'Admins can insert ad campaigns') THEN
    CREATE POLICY "Admins can insert ad campaigns"
      ON ad_campaigns FOR INSERT
      WITH CHECK (is_admin());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ad_campaigns' AND policyname = 'Admins can update ad campaigns') THEN
    CREATE POLICY "Admins can update ad campaigns"
      ON ad_campaigns FOR UPDATE
      USING (is_admin());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ad_campaigns' AND policyname = 'Admins can delete ad campaigns') THEN
    CREATE POLICY "Admins can delete ad campaigns"
      ON ad_campaigns FOR DELETE
      USING (is_admin());
  END IF;
END $$;

-- Funnels: Admins can view and edit all funnels
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'funnels' AND policyname = 'Admins can view all funnels') THEN
    CREATE POLICY "Admins can view all funnels"
      ON funnels FOR SELECT
      USING (is_admin());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'funnels' AND policyname = 'Admins can insert funnels') THEN
    CREATE POLICY "Admins can insert funnels"
      ON funnels FOR INSERT
      WITH CHECK (is_admin());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'funnels' AND policyname = 'Admins can update funnels') THEN
    CREATE POLICY "Admins can update funnels"
      ON funnels FOR UPDATE
      USING (is_admin());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'funnels' AND policyname = 'Admins can delete funnels') THEN
    CREATE POLICY "Admins can delete funnels"
      ON funnels FOR DELETE
      USING (is_admin());
  END IF;
END $$;

-- Forecast Models: Admins can view and edit all forecast models
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'forecast_models' AND policyname = 'Admins can view all forecast models') THEN
    CREATE POLICY "Admins can view all forecast models"
      ON forecast_models FOR SELECT
      USING (is_admin());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'forecast_models' AND policyname = 'Admins can insert forecast models') THEN
    CREATE POLICY "Admins can insert forecast models"
      ON forecast_models FOR INSERT
      WITH CHECK (is_admin());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'forecast_models' AND policyname = 'Admins can update forecast models') THEN
    CREATE POLICY "Admins can update forecast models"
      ON forecast_models FOR UPDATE
      USING (is_admin());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'forecast_models' AND policyname = 'Admins can delete forecast models') THEN
    CREATE POLICY "Admins can delete forecast models"
      ON forecast_models FOR DELETE
      USING (is_admin());
  END IF;
END $$;

