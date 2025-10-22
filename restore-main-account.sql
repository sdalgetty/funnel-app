-- Restore main account with Pro permissions
-- Run this in Supabase SQL Editor

-- First, clean up any existing account with this email
DELETE FROM user_profiles WHERE email = 'hello@anendlesspursuit.com';
DELETE FROM auth.users WHERE email = 'hello@anendlesspursuit.com';

-- Create the main auth user
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
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'hello@anendlesspursuit.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Create the user profile with Pro permissions
WITH user_id AS (
  SELECT id FROM auth.users WHERE email = 'hello@anendlesspursuit.com'
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
  'hello@anendlesspursuit.com',
  'An Endless Pursuit',
  'An Endless Pursuit',
  'pro',
  'active',
  now(),
  now()
FROM user_id ui;

-- Verify the account was created
SELECT email, full_name, company_name, subscription_tier, subscription_status 
FROM user_profiles 
WHERE email = 'hello@anendlesspursuit.com';
