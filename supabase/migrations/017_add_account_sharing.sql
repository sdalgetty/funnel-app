-- Account Sharing Migration
-- Allows users to share their account with guests for view-only access

-- Create account_shares table
create table if not exists account_shares (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  guest_user_id uuid references auth.users(id) on delete cascade, -- nullable until guest accepts
  guest_email text not null, -- email of invited guest
  invitation_token text unique, -- unique token for invitation link
  status text not null default 'pending', -- 'pending', 'accepted', 'revoked'
  role text not null default 'viewer', -- 'viewer', 'editor' (for future)
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_user_id, guest_email),
  unique(invitation_token)
);

-- Indexes for performance
create index if not exists account_shares_owner_idx on account_shares(owner_user_id);
create index if not exists account_shares_guest_idx on account_shares(guest_user_id);
create index if not exists account_shares_guest_email_idx on account_shares(guest_email);
create index if not exists account_shares_token_idx on account_shares(invitation_token);
create index if not exists account_shares_status_idx on account_shares(status);

-- Enable RLS
alter table account_shares enable row level security;

-- RLS Policies for account_shares
DO $$
BEGIN
  -- Owners can view their shares
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'account_shares' AND policyname = 'Owners can view their shares') THEN
    CREATE POLICY "Owners can view their shares"
      ON account_shares FOR SELECT
      USING (auth.uid() = owner_user_id);
  END IF;
  
  -- Guests can view shares they're part of
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'account_shares' AND policyname = 'Guests can view shares they are part of') THEN
    CREATE POLICY "Guests can view shares they are part of"
      ON account_shares FOR SELECT
      USING (auth.uid() = guest_user_id);
  END IF;
  
  -- Owners can create shares
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'account_shares' AND policyname = 'Owners can create shares') THEN
    CREATE POLICY "Owners can create shares"
      ON account_shares FOR INSERT
      WITH CHECK (auth.uid() = owner_user_id);
  END IF;
  
  -- Owners can update their shares (for accepting invitations)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'account_shares' AND policyname = 'Owners can update their shares') THEN
    CREATE POLICY "Owners can update their shares"
      ON account_shares FOR UPDATE
      USING (auth.uid() = owner_user_id);
  END IF;
  
  -- Guests can update shares to accept invitations
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'account_shares' AND policyname = 'Guests can accept invitations') THEN
    CREATE POLICY "Guests can accept invitations"
      ON account_shares FOR UPDATE
      USING (
        guest_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND status = 'pending'
      );
  END IF;
  
  -- Owners can delete their shares
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'account_shares' AND policyname = 'Owners can delete their shares') THEN
    CREATE POLICY "Owners can delete their shares"
      ON account_shares FOR DELETE
      USING (auth.uid() = owner_user_id);
  END IF;
END $$;

-- Update RLS policies for data tables to allow guests to read shared accounts
-- Service Types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_types' AND policyname = 'Guests can view shared accounts service types') THEN
    CREATE POLICY "Guests can view shared accounts service types"
      ON service_types FOR SELECT
      USING (
        user_id IN (
          SELECT owner_user_id 
          FROM account_shares 
          WHERE guest_user_id = auth.uid() 
          AND status = 'accepted'
          AND role = 'viewer'
        )
      );
  END IF;
END $$;

-- Lead Sources
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_sources' AND policyname = 'Guests can view shared accounts lead sources') THEN
    CREATE POLICY "Guests can view shared accounts lead sources"
      ON lead_sources FOR SELECT
      USING (
        user_id IN (
          SELECT owner_user_id 
          FROM account_shares 
          WHERE guest_user_id = auth.uid() 
          AND status = 'accepted'
          AND role = 'viewer'
        )
      );
  END IF;
END $$;

-- Bookings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Guests can view shared accounts bookings') THEN
    CREATE POLICY "Guests can view shared accounts bookings"
      ON bookings FOR SELECT
      USING (
        user_id IN (
          SELECT owner_user_id 
          FROM account_shares 
          WHERE guest_user_id = auth.uid() 
          AND status = 'accepted'
          AND role = 'viewer'
        )
      );
  END IF;
END $$;

-- Payments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Guests can view shared accounts payments') THEN
    CREATE POLICY "Guests can view shared accounts payments"
      ON payments FOR SELECT
      USING (
        user_id IN (
          SELECT owner_user_id 
          FROM account_shares 
          WHERE guest_user_id = auth.uid() 
          AND status = 'accepted'
          AND role = 'viewer'
        )
      );
  END IF;
END $$;

-- Ad Campaigns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ad_campaigns' AND policyname = 'Guests can view shared accounts ad campaigns') THEN
    CREATE POLICY "Guests can view shared accounts ad campaigns"
      ON ad_campaigns FOR SELECT
      USING (
        user_id IN (
          SELECT owner_user_id 
          FROM account_shares 
          WHERE guest_user_id = auth.uid() 
          AND status = 'accepted'
          AND role = 'viewer'
        )
      );
  END IF;
END $$;

-- Funnels
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'funnels' AND policyname = 'Guests can view shared accounts funnels') THEN
    CREATE POLICY "Guests can view shared accounts funnels"
      ON funnels FOR SELECT
      USING (
        user_id IN (
          SELECT owner_user_id 
          FROM account_shares 
          WHERE guest_user_id = auth.uid() 
          AND status = 'accepted'
          AND role = 'viewer'
        )
      );
  END IF;
END $$;

-- Forecast Models
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'forecast_models' AND policyname = 'Guests can view shared accounts forecast models') THEN
    CREATE POLICY "Guests can view shared accounts forecast models"
      ON forecast_models FOR SELECT
      USING (
        user_id IN (
          SELECT owner_user_id 
          FROM account_shares 
          WHERE guest_user_id = auth.uid() 
          AND status = 'accepted'
          AND role = 'viewer'
        )
      );
  END IF;
END $$;

-- User Profiles (for viewing owner's profile info)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Guests can view shared accounts profiles') THEN
    CREATE POLICY "Guests can view shared accounts profiles"
      ON user_profiles FOR SELECT
      USING (
        id IN (
          SELECT owner_user_id 
          FROM account_shares 
          WHERE guest_user_id = auth.uid() 
          AND status = 'accepted'
          AND role = 'viewer'
        )
      );
  END IF;
END $$;




