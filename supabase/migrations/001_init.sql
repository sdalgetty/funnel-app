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
