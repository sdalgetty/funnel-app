-- Combined Migration File
-- Generated automatically - DO NOT EDIT
-- Run this entire file in Supabase SQL Editor
-- Project: Test Environment
-- Date: 2025-12-17T16:59:29.722Z

-- ============================================================================
-- MIGRATION: 001_init.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 001_init.sql
-- ============================================================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create users profiles table
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  company_name text,
  subscription_tier text not null default 'free',
  subscription_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create service_types table
create table if not exists service_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create lead_sources table
create table if not exists lead_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create bookings table
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  client_email text,
  client_phone text,
  service_type_id uuid not null references service_types(id) on delete restrict,
  lead_source_id uuid not null references lead_sources(id) on delete restrict,
  booking_date date not null,
  status text not null default 'confirmed',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create payments table
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  booking_id uuid not null references bookings(id) on delete cascade,
  amount_cents bigint not null,
  payment_date date not null,
  payment_method text,
  status text not null default 'completed',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create ad_sources table
create table if not exists ad_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  lead_source_id uuid not null references lead_sources(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create ad_campaigns table
create table if not exists ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ad_source_id uuid not null references ad_sources(id) on delete cascade,
  month_year text not null, -- Format: "2024-01"
  ad_spend_cents bigint not null default 0,
  leads_generated int not null default 0,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create funnels table (updated)
create table if not exists funnels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Default',
  bookings_goal int8,
  inquiry_to_call numeric,
  call_to_booking numeric,
  inquiries_ytd int8,
  calls_ytd int8,
  bookings_ytd int8,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create forecast_models table
create table if not exists forecast_models (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  model_type text not null, -- 'linear', 'exponential', 'seasonal'
  parameters jsonb,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security on all tables
alter table user_profiles enable row level security;
alter table service_types enable row level security;
alter table lead_sources enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;
alter table ad_sources enable row level security;
alter table ad_campaigns enable row level security;
alter table funnels enable row level security;
alter table forecast_models enable row level security;

-- Grant permissions
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Create RLS policies (only if they don't exist)
-- User profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Service types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_types' AND policyname = 'Users can manage own service types') THEN
    CREATE POLICY "Users can manage own service types" ON service_types FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Lead sources
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_sources' AND policyname = 'Users can manage own lead sources') THEN
    CREATE POLICY "Users can manage own lead sources" ON lead_sources FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Bookings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Users can manage own bookings') THEN
    CREATE POLICY "Users can manage own bookings" ON bookings FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Payments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can manage own payments') THEN
    CREATE POLICY "Users can manage own payments" ON payments FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Ad sources
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ad_sources' AND policyname = 'Users can manage own ad sources') THEN
    CREATE POLICY "Users can manage own ad sources" ON ad_sources FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Ad campaigns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ad_campaigns' AND policyname = 'Users can manage own ad campaigns') THEN
    CREATE POLICY "Users can manage own ad campaigns" ON ad_campaigns FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Funnels
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'funnels' AND policyname = 'Users can manage own funnels') THEN
    CREATE POLICY "Users can manage own funnels" ON funnels FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Forecast models
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'forecast_models' AND policyname = 'Users can manage own forecast models') THEN
    CREATE POLICY "Users can manage own forecast models" ON forecast_models FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for performance
create unique index if not exists funnels_user_name_key
on public.funnels (user_id, name);

create unique index if not exists ad_campaigns_source_month_key
on public.ad_campaigns (ad_source_id, month_year);

create index if not exists bookings_user_id_idx on bookings(user_id);
create index if not exists payments_booking_id_idx on payments(booking_id);
create index if not exists ad_campaigns_user_id_idx on ad_campaigns(user_id);


-- ============================================================================
-- End of 001_init.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 002_add_company_name.sql
-- ============================================================================

-- Add company_name field to user_profiles table
alter table user_profiles 
add column company_name text;

-- Update the database types to include company_name
-- This will be reflected in the TypeScript types


-- ============================================================================
-- End of 002_add_company_name.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 003_add_company_name_only.sql
-- ============================================================================

-- Add company_name field to user_profiles table
-- This migration only adds the column, avoiding conflicts with existing policies
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company_name text;


-- ============================================================================
-- End of 003_add_company_name_only.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 004_company_name_final.sql
-- ============================================================================

-- Add company_name field to user_profiles table
-- This is a safe migration that only adds the column
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company_name text;


-- ============================================================================
-- End of 004_company_name_final.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 005_add_monthly_funnel_data.sql
-- ============================================================================

-- Add monthly funnel data columns to funnels table
-- This allows storing monthly data instead of just yearly totals

ALTER TABLE funnels 
ADD COLUMN IF NOT EXISTS year int4,
ADD COLUMN IF NOT EXISTS month int4,
ADD COLUMN IF NOT EXISTS inquiries int8 DEFAULT 0,
ADD COLUMN IF NOT EXISTS calls_booked int8 DEFAULT 0,
ADD COLUMN IF NOT EXISTS calls_taken int8 DEFAULT 0,
ADD COLUMN IF NOT EXISTS closes int8 DEFAULT 0,
ADD COLUMN IF NOT EXISTS bookings int8 DEFAULT 0,
ADD COLUMN IF NOT EXISTS cash int8 DEFAULT 0;

-- Create index for efficient querying by user, year, and month
CREATE INDEX IF NOT EXISTS funnels_user_year_month_idx 
ON funnels (user_id, year, month);

-- Update existing records to have current year if they don't have a year
UPDATE funnels 
SET year = EXTRACT(YEAR FROM updated_at)::int4
WHERE year IS NULL;


-- ============================================================================
-- End of 005_add_monthly_funnel_data.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 006_add_funnel_unique_constraint.sql
-- ============================================================================

-- Add unique constraint for user_id, year, month combination
-- This ensures one record per user per month per year

CREATE UNIQUE INDEX IF NOT EXISTS funnels_user_year_month_unique 
ON funnels (user_id, year, month);


-- ============================================================================
-- End of 006_add_funnel_unique_constraint.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 007_fix_funnel_data_constraints.sql
-- ============================================================================

-- Fix funnel data constraints and ensure all records have proper year/month values

-- First, update any records that have NULL year or month values
UPDATE funnels 
SET year = EXTRACT(YEAR FROM updated_at)::int4,
    month = EXTRACT(MONTH FROM updated_at)::int4
WHERE year IS NULL OR month IS NULL;

-- Drop the existing unique index if it exists
DROP INDEX IF EXISTS funnels_user_year_month_unique;

-- Create a partial unique index that only applies to records with non-null year and month
CREATE UNIQUE INDEX funnels_user_year_month_unique 
ON funnels (user_id, year, month) 
WHERE year IS NOT NULL AND month IS NOT NULL;


-- ============================================================================
-- End of 007_fix_funnel_data_constraints.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 008_add_booking_additional_fields.sql
-- ============================================================================

-- Add missing fields to bookings table
alter table bookings 
  add column if not exists date_inquired date,
  add column if not exists project_date date,
  add column if not exists booked_revenue bigint default 0;



-- ============================================================================
-- End of 008_add_booking_additional_fields.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 009_add_payment_schedule_fields.sql
-- ============================================================================

-- Add fields to support payment scheduling for forecasting
alter table payments 
  add column if not exists expected_date date,
  add column if not exists is_expected boolean default false;

-- Add index for faster lookups
create index if not exists idx_payments_expected_date on payments(expected_date);
create index if not exists idx_payments_is_expected on payments(is_expected);



-- ============================================================================
-- End of 009_add_payment_schedule_fields.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 010_add_tracks_in_funnel_to_service_types.sql
-- ============================================================================

-- Add tracks_in_funnel column to service_types table
ALTER TABLE service_types
ADD COLUMN tracks_in_funnel boolean NOT NULL DEFAULT false;

-- Optional: Add an index for faster lookups if service types are frequently filtered by tracks_in_funnel
CREATE INDEX IF NOT EXISTS service_types_tracks_in_funnel_idx ON service_types (tracks_in_funnel);



-- ============================================================================
-- End of 010_add_tracks_in_funnel_to_service_types.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 011_make_booking_date_nullable.sql
-- ============================================================================

-- Make booking_date nullable to allow bookings without a booked date
-- (e.g., album upgrades that don't have a traditional booking date)
alter table bookings 
  alter column booking_date drop not null;




-- ============================================================================
-- End of 011_make_booking_date_nullable.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 012_add_first_last_name.sql
-- ============================================================================

-- Add first_name and last_name columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Optional: Populate first_name and last_name from existing full_name
-- This extracts first word as first_name and remaining as last_name
UPDATE user_profiles
SET 
  first_name = CASE 
    WHEN full_name IS NOT NULL AND full_name != '' THEN 
      SPLIT_PART(full_name, ' ', 1)
    ELSE NULL
  END,
  last_name = CASE 
    WHEN full_name IS NOT NULL AND full_name != '' AND POSITION(' ' IN full_name) > 0 THEN 
      SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
    ELSE NULL
  END
WHERE first_name IS NULL OR last_name IS NULL;



-- ============================================================================
-- End of 012_add_first_last_name.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 013_simplify_advertising_remove_ad_source.sql
-- ============================================================================

-- Simplify Advertising: Remove AdSource entity and link ad_campaigns directly to lead_sources
-- This migration:
-- 1. Adds lead_source_id to ad_campaigns
-- 2. Migrates data from ad_sources -> lead_sources via ad_campaigns
-- 3. Drops the foreign key constraint on ad_source_id
-- 4. Drops the ad_source_id column
-- 5. Adds foreign key constraint on lead_source_id
-- 6. Drops the ad_sources table (data will be lost, but AdSource was just a pass-through)

-- Step 1: Add lead_source_id column to ad_campaigns
ALTER TABLE ad_campaigns 
ADD COLUMN IF NOT EXISTS lead_source_id uuid REFERENCES lead_sources(id) ON DELETE RESTRICT;

-- Step 2: Migrate data: Copy lead_source_id from ad_sources through the relationship
UPDATE ad_campaigns ac
SET lead_source_id = (
  SELECT lead_source_id 
  FROM ad_sources ads 
  WHERE ads.id = ac.ad_source_id
)
WHERE ac.lead_source_id IS NULL 
  AND ac.ad_source_id IS NOT NULL;

-- Step 3: Drop the foreign key constraint on ad_source_id (if it exists with a specific name)
-- Note: We'll drop the column which will automatically drop the constraint
-- But first, let's check if any campaigns have null lead_source_id after migration
-- If there are orphaned campaigns, we'll set them to null and they can be cleaned up manually
-- (This shouldn't happen if data integrity was maintained, but we'll be safe)

-- Step 4: Drop the ad_source_id column (this will cascade drop the foreign key)
ALTER TABLE ad_campaigns 
DROP COLUMN IF EXISTS ad_source_id;

-- Step 5: Make lead_source_id NOT NULL now that data is migrated
-- But first check if there are any nulls
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM ad_campaigns WHERE lead_source_id IS NULL) THEN
    RAISE WARNING 'Found ad_campaigns with null lead_source_id. These will need manual cleanup.';
  END IF;
END $$;

-- Make it NOT NULL if there are no nulls
ALTER TABLE ad_campaigns 
ALTER COLUMN lead_source_id SET NOT NULL;

-- Step 6: Drop the ad_sources table (no longer needed)
DROP TABLE IF EXISTS ad_sources CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS ad_campaigns_lead_source_id_idx ON ad_campaigns(lead_source_id);
CREATE INDEX IF NOT EXISTS ad_campaigns_month_year_idx ON ad_campaigns(month_year);



-- ============================================================================
-- End of 013_simplify_advertising_remove_ad_source.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 014_add_notes_to_ad_campaigns.sql
-- ============================================================================

-- Add notes column to ad_campaigns table for tracking month-to-month advertising changes
ALTER TABLE ad_campaigns 
ADD COLUMN IF NOT EXISTS notes text;



-- ============================================================================
-- End of 014_add_notes_to_ad_campaigns.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 015_add_funnel_notes.sql
-- ============================================================================

-- Add notes column to funnels for monthly change logs
ALTER TABLE funnels
ADD COLUMN IF NOT EXISTS notes text;

COMMENT ON COLUMN funnels.notes IS 'Monthly change log notes for funnel entries';



-- ============================================================================
-- End of 015_add_funnel_notes.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 016_add_funnel_manual_overrides.sql
-- ============================================================================

-- Add manual override flags for Closes, Bookings, and Cash
ALTER TABLE funnels
ADD COLUMN IF NOT EXISTS closes_manual boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bookings_manual boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cash_manual boolean DEFAULT false;

COMMENT ON COLUMN funnels.closes_manual IS 'If true, closes value is manually entered and should not be calculated from sales data';
COMMENT ON COLUMN funnels.bookings_manual IS 'If true, bookings value is manually entered and should not be calculated from sales data';
COMMENT ON COLUMN funnels.cash_manual IS 'If true, cash value is manually entered and should not be calculated from scheduled payments';



-- ============================================================================
-- End of 016_add_funnel_manual_overrides.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 017_add_account_sharing.sql
-- ============================================================================

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







-- ============================================================================
-- End of 017_add_account_sharing.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 018_fix_account_share_steve.sql
-- ============================================================================

-- Fix account share for stevedalgetty@gmail.com to view hello@anendlesspursuit.com's account
-- This migration creates/updates the account share relationship

DO $$
DECLARE
    v_owner_id uuid;
    v_guest_id uuid;
BEGIN
    -- Get owner user ID (hello@anendlesspursuit.com)
    SELECT id INTO v_owner_id 
    FROM auth.users 
    WHERE email = 'hello@anendlesspursuit.com';
    
    -- Get guest user ID (stevedalgetty@gmail.com)
    SELECT id INTO v_guest_id 
    FROM auth.users 
    WHERE email = 'stevedalgetty@gmail.com';
    
    -- Check if users exist
    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION 'Owner user (hello@anendlesspursuit.com) not found';
    END IF;
    
    IF v_guest_id IS NULL THEN
        RAISE EXCEPTION 'Guest user (stevedalgetty@gmail.com) not found';
    END IF;
    
    -- Upsert the share
    INSERT INTO account_shares (
        owner_user_id, 
        guest_user_id, 
        guest_email, 
        invitation_token, 
        status, 
        role, 
        accepted_at, 
        created_at, 
        updated_at
    ) VALUES (
        v_owner_id, 
        v_guest_id, 
        'stevedalgetty@gmail.com', 
        gen_random_uuid(),
        'accepted', 
        'viewer', 
        NOW(), 
        NOW(), 
        NOW()
    )
    ON CONFLICT (owner_user_id, guest_email) 
    DO UPDATE SET
        guest_user_id = v_guest_id,
        status = 'accepted',
        role = 'viewer',
        accepted_at = COALESCE(account_shares.accepted_at, NOW()),
        updated_at = NOW();
    
    RAISE NOTICE 'Account share configured: Owner % can be viewed by Guest %', v_owner_id, v_guest_id;
END $$;







-- ============================================================================
-- End of 018_fix_account_share_steve.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 019_add_admin_support.sql
-- ============================================================================

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



-- ============================================================================
-- End of 019_add_admin_support.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 020_add_phone_website_to_user_profiles.sql
-- ============================================================================

-- Add phone and website fields to user_profiles table
alter table user_profiles 
add column if not exists phone text,
add column if not exists website text;




-- ============================================================================
-- End of 020_add_phone_website_to_user_profiles.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 021_fix_performance_and_security_issues.sql
-- ============================================================================

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



-- ============================================================================
-- End of 021_fix_performance_and_security_issues.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 022_fix_function_search_path.sql
-- ============================================================================

-- Fix Security Issue: Function Search Path Mutable
-- The is_admin() function needs to have search_path set to prevent security vulnerabilities
-- Using CREATE OR REPLACE to avoid breaking RLS policy dependencies

-- Update function with proper search_path (using CREATE OR REPLACE to preserve dependencies)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = TRUE
  );
END;
$$;

-- Grant execute permission (idempotent)
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;



-- ============================================================================
-- End of 022_fix_function_search_path.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 023_optimize_rls_policies_performance.sql
-- ============================================================================

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



-- ============================================================================
-- End of 023_optimize_rls_policies_performance.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: 024_add_crm_to_user_profiles.sql
-- ============================================================================

-- Add CRM fields to user_profiles table
-- This allows users to specify their CRM for import functionality

alter table user_profiles 
add column if not exists crm text,
add column if not exists crm_other text;

-- Add comments
comment on column user_profiles.crm is 'CRM system used by the user (e.g., honeybook, dubsado, 17hats). Used to show relevant import options.';
comment on column user_profiles.crm_other is 'Custom CRM name when crm is set to "other".';



-- ============================================================================
-- End of 024_add_crm_to_user_profiles.sql
-- ============================================================================

