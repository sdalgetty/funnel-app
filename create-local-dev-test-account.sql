-- Create Local Development Test Account
-- Run this in Supabase SQL Editor to set up a dedicated test account for local development
-- This account will have comprehensive mock data for testing all features

-- First, clean up any existing test account
DELETE FROM user_profiles WHERE email = 'test@localdev.com';
DELETE FROM auth.users WHERE email = 'test@localdev.com';

-- Create the test auth user
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Fixed UUID for test account
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'test@localdev.com',
  crypt('testpassword123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Create the user profile with Pro permissions
INSERT INTO user_profiles (
  id,
  email,
  full_name,
  company_name,
  subscription_tier,
  subscription_status,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@localdev.com',
  'Local Dev Tester',
  'Test Company',
  'pro',
  'active',
  now(),
  now()
);

-- Create service types
INSERT INTO service_types (id, user_id, name, description, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Consultation', 'Initial consultation service', now(), now()),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Implementation', 'Full implementation service', now(), now()),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Support', 'Ongoing support service', now(), now()),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Strategy', 'Strategic planning service', now(), now()),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Training', 'Training and education service', now(), now());

-- Create lead sources
INSERT INTO lead_sources (id, user_id, name, description, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'Website', 'Direct website inquiries', now(), now()),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'Referral', 'Client referrals', now(), now()),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'Social Media', 'Social media inquiries', now(), now()),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', 'Google Ads', 'Google advertising', now(), now()),
  ('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', 'Instagram Ads', 'Instagram advertising', now(), now()),
  ('00000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', 'LinkedIn', 'LinkedIn inquiries', now(), now()),
  ('00000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001', 'Email Marketing', 'Email marketing campaigns', now(), now());

-- Create ad sources
INSERT INTO ad_sources (id, user_id, name, lead_source_id, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 'Google Ads', '00000000-0000-0000-0000-000000000023', now(), now()),
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', 'Instagram Ads', '00000000-0000-0000-0000-000000000024', now(), now()),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', 'Facebook Ads', '00000000-0000-0000-0000-000000000024', now(), now()),
  ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000001', 'LinkedIn Ads', '00000000-0000-0000-0000-000000000025', now(), now());

-- Create comprehensive funnel data for 2024
INSERT INTO funnels (id, user_id, year, month, inquiries, calls_booked, calls_taken, closes, bookings, cash, name, bookings_goal, inquiry_to_call, call_to_booking, inquiries_ytd, calls_ytd, bookings_ytd, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', 2024, 1, 31, 16, 14, 4, 2909742, 2909742, '2024 January', 50, 0.52, 0.29, 31, 16, 4, now(), now()),
  ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000001', 2024, 2, 28, 11, 11, 1, 1287400, 1287400, '2024 February', 50, 0.39, 0.09, 59, 27, 5, now(), now()),
  ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000001', 2024, 3, 19, 9, 9, 8, 3895900, 3895900, '2024 March', 50, 0.47, 0.89, 78, 36, 13, now(), now()),
  ('00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000001', 2024, 4, 19, 5, 5, 0, 1343811, 1343811, '2024 April', 50, 0.26, 0.00, 97, 41, 13, now(), now()),
  ('00000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000001', 2024, 5, 15, 5, 5, 2, 1674800, 1674800, '2024 May', 50, 0.33, 0.40, 112, 46, 15, now(), now()),
  ('00000000-0000-0000-0000-000000000045', '00000000-0000-0000-0000-000000000001', 2024, 6, 11, 7, 5, 0, 773800, 773800, '2024 June', 50, 0.64, 0.00, 123, 53, 15, now(), now()),
  ('00000000-0000-0000-0000-000000000046', '00000000-0000-0000-0000-000000000001', 2024, 7, 10, 6, 6, 2, 1804421, 1804421, '2024 July', 50, 0.60, 0.33, 133, 59, 17, now(), now()),
  ('00000000-0000-0000-0000-000000000047', '00000000-0000-0000-0000-000000000001', 2024, 8, 14, 8, 8, 2, 1621800, 1621800, '2024 August', 50, 0.57, 0.25, 147, 67, 19, now(), now()),
  ('00000000-0000-0000-0000-000000000048', '00000000-0000-0000-0000-000000000001', 2024, 9, 26, 11, 11, 8, 5423600, 5423600, '2024 September', 50, 0.42, 0.73, 173, 78, 27, now(), now()),
  ('00000000-0000-0000-0000-000000000049', '00000000-0000-0000-0000-000000000001', 2024, 10, 13, 6, 6, 1, 1084260, 1084260, '2024 October', 50, 0.46, 0.17, 186, 84, 28, now(), now()),
  ('00000000-0000-0000-0000-00000000004a', '00000000-0000-0000-0000-000000000001', 2024, 11, 20, 12, 10, 1, 678400, 678400, '2024 November', 50, 0.60, 0.10, 206, 96, 29, now(), now()),
  ('00000000-0000-0000-0000-00000000004b', '00000000-0000-0000-0000-000000000001', 2024, 12, 28, 20, 17, 6, 4116000, 4116000, '2024 December', 50, 0.71, 0.35, 234, 116, 35, now(), now());

-- Create comprehensive funnel data for 2025
INSERT INTO funnels (id, user_id, year, month, inquiries, calls_booked, calls_taken, closes, bookings, cash, name, bookings_goal, inquiry_to_call, call_to_booking, inquiries_ytd, calls_ytd, bookings_ytd, created_at, updated_at) VALUES
  ('f_2025_01', '00000000-0000-0000-0000-000000000001', 2025, 1, 20, 12, 12, 9, 6125600, 6125600, '2025 January', 50, 0.60, 0.75, 20, 12, 9, now(), now()),
  ('f_2025_02', '00000000-0000-0000-0000-000000000001', 2025, 2, 18, 10, 9, 4, 2560000, 2560000, '2025 February', 50, 0.56, 0.44, 38, 22, 13, now(), now()),
  ('f_2025_03', '00000000-0000-0000-0000-000000000001', 2025, 3, 28, 17, 17, 5, 3200000, 3200000, '2025 March', 50, 0.61, 0.29, 66, 39, 18, now(), now()),
  ('f_2025_04', '00000000-0000-0000-0000-000000000001', 2025, 4, 22, 11, 10, 3, 1800000, 1800000, '2025 April', 50, 0.50, 0.30, 88, 50, 21, now(), now()),
  ('f_2025_05', '00000000-0000-0000-0000-000000000001', 2025, 5, 28, 14, 13, 2, 1200000, 1200000, '2025 May', 50, 0.50, 0.15, 116, 64, 23, now(), now()),
  ('f_2025_06', '00000000-0000-0000-0000-000000000001', 2025, 6, 15, 7, 6, 1, 800000, 800000, '2025 June', 50, 0.47, 0.17, 131, 71, 24, now(), now()),
  ('f_2025_07', '00000000-0000-0000-0000-000000000001', 2025, 7, 19, 9, 8, 0, 100000, 100000, '2025 July', 50, 0.47, 0.00, 150, 80, 24, now(), now()),
  ('f_2025_08', '00000000-0000-0000-0000-000000000001', 2025, 8, 16, 8, 7, 1, 500000, 500000, '2025 August', 50, 0.50, 0.14, 166, 88, 25, now(), now()),
  ('f_2025_09', '00000000-0000-0000-0000-000000000001', 2025, 9, 21, 10, 9, 1, 300000, 300000, '2025 September', 50, 0.48, 0.11, 187, 98, 26, now(), now()),
  ('f_2025_10', '00000000-0000-0000-0000-000000000001', 2025, 10, 17, 8, 7, 0, 0, 0, '2025 October', 50, 0.47, 0.00, 204, 106, 26, now(), now()),
  ('f_2025_11', '00000000-0000-0000-0000-000000000001', 2025, 11, 14, 6, 5, 0, 0, 0, '2025 November', 50, 0.43, 0.00, 218, 112, 26, now(), now()),
  ('f_2025_12', '00000000-0000-0000-0000-000000000001', 2025, 12, 12, 5, 4, 0, 0, 0, '2025 December', 50, 0.42, 0.00, 230, 117, 26, now(), now());

-- Create sample bookings
INSERT INTO bookings (id, user_id, client_name, client_email, client_phone, service_type_id, lead_source_id, booking_date, status, notes, created_at, updated_at) VALUES
  ('b_001', '00000000-0000-0000-0000-000000000001', 'E-commerce Strategy', 'john@example.com', '555-0123', 'st_001', 'ls_001', '2024-01-15', 'confirmed', 'Initial consultation for e-commerce strategy', now(), now()),
  ('b_002', '00000000-0000-0000-0000-000000000001', 'Social Media Campaign', 'jane@example.com', '555-0456', 'st_002', 'ls_003', '2024-01-18', 'confirmed', 'Full implementation of social media strategy', now(), now()),
  ('b_003', '00000000-0000-0000-0000-000000000001', 'Website Redesign', 'bob@example.com', '555-0789', 'st_002', 'ls_002', '2024-02-01', 'confirmed', 'Complete website redesign and development', now(), now()),
  ('b_004', '00000000-0000-0000-0000-000000000001', 'SEO Optimization', 'alice@example.com', '555-0321', 'st_003', 'ls_004', '2024-02-10', 'pending', 'Ongoing SEO support and optimization', now(), now()),
  ('b_005', '00000000-0000-0000-0000-000000000001', 'Brand Strategy Workshop', 'charlie@example.com', '555-0654', 'st_004', 'ls_006', '2024-02-20', 'confirmed', 'Full-day brand strategy workshop', now(), now()),
  ('b_006', '00000000-0000-0000-0000-000000000001', 'Marketing Automation', 'diana@example.com', '555-0987', 'st_002', 'ls_007', '2024-03-05', 'confirmed', 'Marketing automation setup and training', now(), now()),
  ('b_007', '00000000-0000-0000-0000-000000000001', 'Content Strategy', 'eve@example.com', '555-0123', 'st_004', 'ls_001', '2024-03-15', 'confirmed', 'Content strategy development and planning', now(), now()),
  ('b_008', '00000000-0000-0000-0000-000000000001', 'Analytics Setup', 'frank@example.com', '555-0456', 'st_003', 'ls_004', '2024-03-25', 'pending', 'Google Analytics and tracking setup', now(), now());

-- Create sample payments
INSERT INTO payments (id, user_id, booking_id, amount_cents, payment_date, payment_method, status, notes, created_at, updated_at) VALUES
  ('p_001', '00000000-0000-0000-0000-000000000001', 'b_001', 500000, '2024-02-01', 'credit_card', 'completed', 'E-commerce strategy consultation', now(), now()),
  ('p_002', '00000000-0000-0000-0000-000000000001', 'b_002', 350000, '2024-02-15', 'bank_transfer', 'completed', 'Social media campaign implementation', now(), now()),
  ('p_003', '00000000-0000-0000-0000-000000000001', 'b_003', 400000, '2024-03-01', 'credit_card', 'completed', 'Website redesign - 50% deposit', now(), now()),
  ('p_004', '00000000-0000-0000-0000-000000000001', 'b_003', 400000, '2024-04-01', 'credit_card', 'pending', 'Website redesign - final payment', now(), now()),
  ('p_005', '00000000-0000-0000-0000-000000000001', 'b_005', 450000, '2024-03-20', 'credit_card', 'completed', 'Brand strategy workshop', now(), now()),
  ('p_006', '00000000-0000-0000-0000-000000000001', 'b_006', 300000, '2024-04-05', 'bank_transfer', 'completed', 'Marketing automation setup', now(), now()),
  ('p_007', '00000000-0000-0000-0000-000000000001', 'b_007', 250000, '2024-04-15', 'credit_card', 'completed', 'Content strategy development', now(), now());

-- Create ad campaigns for 2024
INSERT INTO ad_campaigns (id, user_id, ad_source_id, month_year, ad_spend_cents, leads_generated, last_updated, created_at, updated_at) VALUES
  ('ac_2024_01_g', '00000000-0000-0000-0000-000000000001', 'as_001', '2024-01', 150000, 12, now(), now(), now()),
  ('ac_2024_01_i', '00000000-0000-0000-0000-000000000001', 'as_002', '2024-01', 80000, 8, now(), now(), now()),
  ('ac_2024_02_g', '00000000-0000-0000-0000-000000000001', 'as_001', '2024-02', 200000, 18, now(), now(), now()),
  ('ac_2024_02_i', '00000000-0000-0000-0000-000000000001', 'as_002', '2024-02', 120000, 15, now(), now(), now()),
  ('ac_2024_03_g', '00000000-0000-0000-0000-000000000001', 'as_001', '2024-03', 180000, 16, now(), now(), now()),
  ('ac_2024_03_i', '00000000-0000-0000-0000-000000000001', 'as_002', '2024-03', 100000, 12, now(), now(), now()),
  ('ac_2024_04_g', '00000000-0000-0000-0000-000000000001', 'as_001', '2024-04', 160000, 14, now(), now(), now()),
  ('ac_2024_04_i', '00000000-0000-0000-0000-000000000001', 'as_002', '2024-04', 90000, 10, now(), now(), now()),
  ('ac_2024_05_g', '00000000-0000-0000-0000-000000000001', 'as_001', '2024-05', 220000, 20, now(), now(), now()),
  ('ac_2024_05_i', '00000000-0000-0000-0000-000000000001', 'as_002', '2024-05', 110000, 13, now(), now(), now()),
  ('ac_2024_06_g', '00000000-0000-0000-0000-000000000001', 'as_001', '2024-06', 140000, 12, now(), now(), now()),
  ('ac_2024_06_i', '00000000-0000-0000-0000-000000000001', 'as_002', '2024-06', 75000, 9, now(), now(), now());

-- Create ad campaigns for 2025
INSERT INTO ad_campaigns (id, user_id, ad_source_id, month_year, ad_spend_cents, leads_generated, last_updated, created_at, updated_at) VALUES
  ('ac_2025_01_g', '00000000-0000-0000-0000-000000000001', 'as_001', '2025-01', 250000, 22, now(), now(), now()),
  ('ac_2025_01_i', '00000000-0000-0000-0000-000000000001', 'as_002', '2025-01', 130000, 16, now(), now(), now()),
  ('ac_2025_02_g', '00000000-0000-0000-0000-000000000001', 'as_001', '2025-02', 200000, 18, now(), now(), now()),
  ('ac_2025_02_i', '00000000-0000-0000-0000-000000000001', 'as_002', '2025-02', 110000, 14, now(), now(), now()),
  ('ac_2025_03_g', '00000000-0000-0000-0000-000000000001', 'as_001', '2025-03', 280000, 25, now(), now(), now()),
  ('ac_2025_03_i', '00000000-0000-0000-0000-000000000001', 'as_002', '2025-03', 150000, 18, now(), now(), now()),
  ('ac_2025_04_g', '00000000-0000-0000-0000-000000000001', 'as_001', '2025-04', 190000, 17, now(), now(), now()),
  ('ac_2025_04_i', '00000000-0000-0000-0000-000000000001', 'as_002', '2025-04', 100000, 12, now(), now(), now()),
  ('ac_2025_05_g', '00000000-0000-0000-0000-000000000001', 'as_001', '2025-05', 210000, 19, now(), now(), now()),
  ('ac_2025_05_i', '00000000-0000-0000-0000-000000000001', 'as_002', '2025-05', 120000, 15, now(), now(), now()),
  ('ac_2025_06_g', '00000000-0000-0000-0000-000000000001', 'as_001', '2025-06', 170000, 15, now(), now(), now()),
  ('ac_2025_06_i', '00000000-0000-0000-0000-000000000001', 'as_002', '2025-06', 90000, 11, now(), now(), now());

-- Verify the test account was created successfully
SELECT 
  'Test Account Created' as status,
  email, 
  full_name, 
  company_name, 
  subscription_tier, 
  subscription_status 
FROM user_profiles 
WHERE email = 'test@localdev.com';

-- Show data summary
SELECT 'Service Types' as table_name, COUNT(*) as count FROM service_types WHERE user_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Lead Sources', COUNT(*) FROM lead_sources WHERE user_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Funnel Data', COUNT(*) FROM funnels WHERE user_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Bookings', COUNT(*) FROM bookings WHERE user_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments WHERE user_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Ad Sources', COUNT(*) FROM ad_sources WHERE user_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Ad Campaigns', COUNT(*) FROM ad_campaigns WHERE user_id = '00000000-0000-0000-0000-000000000001';
