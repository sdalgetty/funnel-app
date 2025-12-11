-- Optimize RLS Policies for Performance
-- Fix auth_rls_initplan issues by wrapping auth functions in subqueries
-- This caches the auth function result instead of re-evaluating for each row

-- ============================================================================
-- USER_PROFILES POLICIES
-- ============================================================================

-- Update "Users can view own profile"
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles 
  FOR SELECT 
  USING ((select auth.uid()) = id);

-- Update "Users can update own profile"
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles 
  FOR UPDATE 
  USING ((select auth.uid()) = id);

-- Update "Users can insert own profile"
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles 
  FOR INSERT 
  WITH CHECK ((select auth.uid()) = id);

-- ============================================================================
-- SERVICE_TYPES POLICIES
-- ============================================================================

-- Update "Users can manage own service types"
DROP POLICY IF EXISTS "Users can manage own service types" ON service_types;
CREATE POLICY "Users can manage own service types" ON service_types 
  FOR ALL 
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- LEAD_SOURCES POLICIES
-- ============================================================================

-- Update "Users can manage own lead sources"
DROP POLICY IF EXISTS "Users can manage own lead sources" ON lead_sources;
CREATE POLICY "Users can manage own lead sources" ON lead_sources 
  FOR ALL 
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- BOOKINGS POLICIES
-- ============================================================================

-- Update "Users can manage own bookings"
DROP POLICY IF EXISTS "Users can manage own bookings" ON bookings;
CREATE POLICY "Users can manage own bookings" ON bookings 
  FOR ALL 
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- PAYMENTS POLICIES
-- ============================================================================

-- Update "Users can manage own payments"
DROP POLICY IF EXISTS "Users can manage own payments" ON payments;
CREATE POLICY "Users can manage own payments" ON payments 
  FOR ALL 
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- AD_CAMPAIGNS POLICIES
-- ============================================================================

-- Update "Users can manage own ad campaigns" (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ad_campaigns') THEN
    DROP POLICY IF EXISTS "Users can manage own ad campaigns" ON ad_campaigns;
    CREATE POLICY "Users can manage own ad campaigns" ON ad_campaigns 
      FOR ALL 
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

-- ============================================================================
-- FUNNELS POLICIES
-- ============================================================================

-- Update "Users can manage own funnels"
DROP POLICY IF EXISTS "Users can manage own funnels" ON funnels;
CREATE POLICY "Users can manage own funnels" ON funnels 
  FOR ALL 
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- FORECAST_MODELS POLICIES
-- ============================================================================

-- Update "Users can manage own forecast models"
DROP POLICY IF EXISTS "Users can manage own forecast models" ON forecast_models;
CREATE POLICY "Users can manage own forecast models" ON forecast_models 
  FOR ALL 
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- ACCOUNT_SHARES POLICIES
-- ============================================================================

-- Update account_shares policies (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'account_shares') THEN
    -- Owners can view their shares
    DROP POLICY IF EXISTS "Owners can view their shares" ON account_shares;
    CREATE POLICY "Owners can view their shares" ON account_shares 
      FOR SELECT 
      USING ((select auth.uid()) = owner_user_id);
    
    -- Guests can view shares they are part of
    DROP POLICY IF EXISTS "Guests can view shares they are part of" ON account_shares;
    CREATE POLICY "Guests can view shares they are part of" ON account_shares 
      FOR SELECT 
      USING ((select auth.uid()) = guest_user_id);
    
    -- Owners can create shares
    DROP POLICY IF EXISTS "Owners can create shares" ON account_shares;
    CREATE POLICY "Owners can create shares" ON account_shares 
      FOR INSERT 
      WITH CHECK ((select auth.uid()) = owner_user_id);
    
    -- Owners can update their shares
    DROP POLICY IF EXISTS "Owners can update their shares" ON account_shares;
    CREATE POLICY "Owners can update their shares" ON account_shares 
      FOR UPDATE 
      USING ((select auth.uid()) = owner_user_id);
    
    -- Owners can delete their shares
    DROP POLICY IF EXISTS "Owners can delete their shares" ON account_shares;
    CREATE POLICY "Owners can delete their shares" ON account_shares 
      FOR DELETE 
      USING ((select auth.uid()) = owner_user_id);
    
    -- Guests can accept invitations (uses auth.email())
    DROP POLICY IF EXISTS "Guests can accept invitations" ON account_shares;
    CREATE POLICY "Guests can accept invitations" ON account_shares 
      FOR UPDATE 
      USING (
        (select auth.email()) = guest_email
        AND status = 'pending'
      );
    
    -- Guests can view their invitations (uses auth.email())
    DROP POLICY IF EXISTS "Guests can view their invitations" ON account_shares;
    CREATE POLICY "Guests can view their invitations" ON account_shares 
      FOR SELECT 
      USING ((select auth.email()) = guest_email);
  END IF;
END $$;

-- ============================================================================
-- ADMIN_ACCESS_LOGS POLICIES
-- ============================================================================

-- Update admin_access_logs policies (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_access_logs') THEN
    -- Admins can view all access logs (uses is_admin() function which we already fixed)
    -- The is_admin() function already uses (select auth.uid()) internally, so this should be fine
    -- But let's make sure the policy names are correct
    
    -- Check if "Admins can view all access logs" exists, if not use "Admins can view all logs"
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_access_logs' AND policyname = 'Admins can view all access logs') THEN
      -- Policy already exists with correct name
      NULL;
    ELSIF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_access_logs' AND policyname = 'Admins can view all logs') THEN
      -- Rename to standardize
      DROP POLICY IF EXISTS "Admins can view all logs" ON admin_access_logs;
      CREATE POLICY "Admins can view all access logs" ON admin_access_logs 
        FOR SELECT 
        USING (is_admin());
    END IF;
    
    -- Check if "Admins can insert access logs" exists, if not use "Admins can insert logs"
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_access_logs' AND policyname = 'Admins can insert access logs') THEN
      -- Policy already exists with correct name
      NULL;
    ELSIF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_access_logs' AND policyname = 'Admins can insert logs') THEN
      -- Rename to standardize
      DROP POLICY IF EXISTS "Admins can insert logs" ON admin_access_logs;
      CREATE POLICY "Admins can insert access logs" ON admin_access_logs 
        FOR INSERT 
        WITH CHECK (is_admin());
    END IF;
  END IF;
END $$;

-- ============================================================================
-- GUEST SHARING POLICIES (for viewing shared accounts)
-- ============================================================================

-- Update all "Guests can view shared accounts *" policies to wrap auth.uid() in subqueries

-- Service Types
DROP POLICY IF EXISTS "Guests can view shared accounts service types" ON service_types;
CREATE POLICY "Guests can view shared accounts service types" ON service_types
  FOR SELECT
  USING (
    user_id IN (
      SELECT owner_user_id 
      FROM account_shares 
      WHERE guest_user_id = (select auth.uid())
      AND status = 'accepted'
      AND role = 'viewer'
    )
  );

-- Lead Sources
DROP POLICY IF EXISTS "Guests can view shared accounts lead sources" ON lead_sources;
CREATE POLICY "Guests can view shared accounts lead sources" ON lead_sources
  FOR SELECT
  USING (
    user_id IN (
      SELECT owner_user_id 
      FROM account_shares 
      WHERE guest_user_id = (select auth.uid())
      AND status = 'accepted'
      AND role = 'viewer'
    )
  );

-- Bookings
DROP POLICY IF EXISTS "Guests can view shared accounts bookings" ON bookings;
CREATE POLICY "Guests can view shared accounts bookings" ON bookings
  FOR SELECT
  USING (
    user_id IN (
      SELECT owner_user_id 
      FROM account_shares 
      WHERE guest_user_id = (select auth.uid())
      AND status = 'accepted'
      AND role = 'viewer'
    )
  );

-- Payments
DROP POLICY IF EXISTS "Guests can view shared accounts payments" ON payments;
CREATE POLICY "Guests can view shared accounts payments" ON payments
  FOR SELECT
  USING (
    user_id IN (
      SELECT owner_user_id 
      FROM account_shares 
      WHERE guest_user_id = (select auth.uid())
      AND status = 'accepted'
      AND role = 'viewer'
    )
  );

-- Ad Campaigns (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ad_campaigns') THEN
    DROP POLICY IF EXISTS "Guests can view shared accounts ad campaigns" ON ad_campaigns;
    CREATE POLICY "Guests can view shared accounts ad campaigns" ON ad_campaigns
      FOR SELECT
      USING (
        user_id IN (
          SELECT owner_user_id 
          FROM account_shares 
          WHERE guest_user_id = (select auth.uid())
          AND status = 'accepted'
          AND role = 'viewer'
        )
      );
  END IF;
END $$;

-- Funnels
DROP POLICY IF EXISTS "Guests can view shared accounts funnels" ON funnels;
CREATE POLICY "Guests can view shared accounts funnels" ON funnels
  FOR SELECT
  USING (
    user_id IN (
      SELECT owner_user_id 
      FROM account_shares 
      WHERE guest_user_id = (select auth.uid())
      AND status = 'accepted'
      AND role = 'viewer'
    )
  );

-- Forecast Models
DROP POLICY IF EXISTS "Guests can view shared accounts forecast models" ON forecast_models;
CREATE POLICY "Guests can view shared accounts forecast models" ON forecast_models
  FOR SELECT
  USING (
    user_id IN (
      SELECT owner_user_id 
      FROM account_shares 
      WHERE guest_user_id = (select auth.uid())
      AND status = 'accepted'
      AND role = 'viewer'
    )
  );

-- User Profiles
DROP POLICY IF EXISTS "Guests can view shared accounts profiles" ON user_profiles;
CREATE POLICY "Guests can view shared accounts profiles" ON user_profiles
  FOR SELECT
  USING (
    id IN (
      SELECT owner_user_id 
      FROM account_shares 
      WHERE guest_user_id = (select auth.uid())
      AND status = 'accepted'
      AND role = 'viewer'
    )
  );

