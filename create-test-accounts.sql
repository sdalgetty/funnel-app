-- Create test accounts directly in Supabase
-- Run this in Supabase SQL Editor

-- First, let's check if accounts already exist and clean them up
DELETE FROM user_profiles WHERE email IN ('trial@example.com', 'free@example.com', 'pro@example.com');
DELETE FROM auth.users WHERE email IN ('trial@example.com', 'free@example.com', 'pro@example.com');

-- Create auth users
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
) VALUES 
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'trial@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'free@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'pro@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

-- Get the user IDs for profile creation
WITH user_ids AS (
  SELECT id, email FROM auth.users 
  WHERE email IN ('trial@example.com', 'free@example.com', 'pro@example.com')
)
INSERT INTO user_profiles (
  id,
  email,
  full_name,
  company_name,
  subscription_tier,
  subscription_status,
  created_at,
  updated_at
)
SELECT 
  ui.id,
  ui.email,
  CASE 
    WHEN ui.email = 'trial@example.com' THEN 'Trial User'
    WHEN ui.email = 'free@example.com' THEN 'Free User'
    WHEN ui.email = 'pro@example.com' THEN 'Pro User'
  END,
  CASE 
    WHEN ui.email = 'trial@example.com' THEN 'Trial Company'
    WHEN ui.email = 'free@example.com' THEN 'Free Company'
    WHEN ui.email = 'pro@example.com' THEN 'Pro Company'
  END,
  CASE 
    WHEN ui.email = 'trial@example.com' THEN 'trial'
    WHEN ui.email = 'free@example.com' THEN 'free'
    WHEN ui.email = 'pro@example.com' THEN 'pro'
  END,
  'active',
  now(),
  now()
FROM user_ids ui;

-- Verify the accounts were created
SELECT email, full_name, company_name, subscription_tier, subscription_status 
FROM user_profiles 
WHERE email IN ('trial@example.com', 'free@example.com', 'pro@example.com')
ORDER BY created_at DESC;
