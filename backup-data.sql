-- Manual Data Backup Script
-- Run this in Supabase SQL Editor to backup your data before making changes
-- Date: $(date)

-- Backup user_profiles
SELECT 'user_profiles' as table_name, 
       id, email, full_name, company_name, subscription_tier, subscription_status, created_at, updated_at
FROM user_profiles
WHERE email = 'hello@anendlesspursuit.com';

-- Backup service_types (if any exist)
SELECT 'service_types' as table_name, 
       id, user_id, name, description, created_at, updated_at
FROM service_types
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'hello@anendlesspursuit.com');

-- Backup lead_sources (if any exist)
SELECT 'lead_sources' as table_name, 
       id, user_id, name, description, created_at, updated_at
FROM lead_sources
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'hello@anendlesspursuit.com');

-- Backup bookings (if any exist)
SELECT 'bookings' as table_name, 
       id, user_id, client_name, client_email, client_phone, service_type_id, lead_source_id, booking_date, status, notes, created_at, updated_at
FROM bookings
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'hello@anendlesspursuit.com');

-- Backup payments (if any exist)
SELECT 'payments' as table_name, 
       id, user_id, booking_id, amount_cents, payment_date, payment_method, status, notes, created_at, updated_at
FROM payments
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'hello@anendlesspursuit.com');

-- Backup ad_campaigns (if any exist)
SELECT 'ad_campaigns' as table_name, 
       id, user_id, ad_source_id, month_year, ad_spend_cents, leads_generated, last_updated, created_at, updated_at
FROM ad_campaigns
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'hello@anendlesspursuit.com');

-- Backup ad_sources (if any exist)
SELECT 'ad_sources' as table_name, 
       id, user_id, name, lead_source_id, created_at, updated_at
FROM ad_sources
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'hello@anendlesspursuit.com');

-- Backup funnels (if any exist)
SELECT 'funnels' as table_name, 
       id, user_id, name, bookings_goal, inquiry_to_call, call_to_booking, inquiries_ytd, calls_ytd, bookings_ytd, updated_at
FROM funnels
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'hello@anendlesspursuit.com');

-- Backup forecast_models (if any exist)
SELECT 'forecast_models' as table_name, 
       id, user_id, name, description, model_type, parameters, is_active, created_at, updated_at
FROM forecast_models
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'hello@anendlesspursuit.com');
