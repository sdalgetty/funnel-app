-- Data Restore Script
-- Use this to restore your data if something goes wrong
-- IMPORTANT: Replace the user_id with your actual user ID from auth.users

-- First, get your user ID
-- SELECT id FROM auth.users WHERE email = 'hello@anendlesspursuit.com';

-- Example restore statements (replace USER_ID_HERE with actual ID):
-- INSERT INTO service_types (id, user_id, name, description, created_at, updated_at) VALUES (...);
-- INSERT INTO lead_sources (id, user_id, name, description, created_at, updated_at) VALUES (...);
-- INSERT INTO bookings (id, user_id, service_type_id, lead_source_id, customer_name, amount, booking_date, status, notes, created_at, updated_at) VALUES (...);
-- INSERT INTO payments (id, user_id, booking_id, amount, payment_date, payment_method, status, notes, created_at, updated_at) VALUES (...);
-- INSERT INTO ad_campaigns (id, user_id, name, platform, budget, start_date, end_date, status, created_at, updated_at) VALUES (...);
-- INSERT INTO ad_sources (id, user_id, name, platform, cost_per_click, cost_per_impression, created_at, updated_at) VALUES (...);
-- INSERT INTO funnels (id, user_id, name, bookings_goal, inquiry_to_call, call_to_booking, inquiries_ytd, calls_ytd, bookings_ytd, created_at, updated_at) VALUES (...);

-- This file is a template - copy the backup results here when needed
