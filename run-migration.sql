-- Run this SQL in your Supabase SQL Editor
-- Copy and paste the contents of supabase/migrations/001_init.sql

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create users profiles table
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
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

-- Create RLS policies
-- User profiles
create policy "Users can view own profile" on user_profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on user_profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on user_profiles
  for insert with check (auth.uid() = id);

-- Service types
create policy "Users can manage own service types" on service_types
  for all using (auth.uid() = user_id);

-- Lead sources
create policy "Users can manage own lead sources" on lead_sources
  for all using (auth.uid() = user_id);

-- Bookings
create policy "Users can manage own bookings" on bookings
  for all using (auth.uid() = user_id);

-- Payments
create policy "Users can manage own payments" on payments
  for all using (auth.uid() = user_id);

-- Ad sources
create policy "Users can manage own ad sources" on ad_sources
  for all using (auth.uid() = user_id);

-- Ad campaigns
create policy "Users can manage own ad campaigns" on ad_campaigns
  for all using (auth.uid() = user_id);

-- Funnels
create policy "Users can manage own funnels" on funnels
  for all using (auth.uid() = user_id);

-- Forecast models
create policy "Users can manage own forecast models" on forecast_models
  for all using (auth.uid() = user_id);

-- Create indexes for performance
create unique index if not exists funnels_user_name_key
on public.funnels (user_id, name);

create unique index if not exists ad_campaigns_source_month_key
on public.ad_campaigns (ad_source_id, month_year);

create index if not exists bookings_user_id_idx on bookings(user_id);
create index if not exists payments_booking_id_idx on payments(booking_id);
create index if not exists ad_campaigns_user_id_idx on ad_campaigns(user_id);
