-- Create CRM Test Account for Production
-- Run this in Supabase SQL Editor (Production)
-- This account is set up to test the new CRM dropdown functionality

-- First, clean up any existing test account with this email
DELETE FROM user_profiles WHERE email = 'crmtest@fnnlapp.com';
DELETE FROM auth.users WHERE email = 'crmtest@fnnlapp.com';

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
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'crmtest@fnnlapp.com',
  crypt('TestCRM123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Create the user profile with Pro permissions and Honeybook CRM
WITH user_id AS (
  SELECT id FROM auth.users WHERE email = 'crmtest@fnnlapp.com'
)
INSERT INTO user_profiles (
  id,
  email,
  full_name,
  company_name,
  crm,
  crm_other,
  subscription_tier,
  subscription_status,
  created_at,
  updated_at
)
SELECT 
  ui.id,
  'crmtest@fnnlapp.com',
  'CRM Test User',
  'CRM Test Company',
  'honeybook', -- Set to Honeybook so import buttons will show
  NULL, -- No custom CRM name needed
  'pro',
  'active',
  now(),
  now()
FROM user_id ui;

-- Verify the account was created
SELECT 
  email, 
  full_name, 
  company_name, 
  crm, 
  crm_other,
  subscription_tier, 
  subscription_status 
FROM user_profiles 
WHERE email = 'crmtest@fnnlapp.com';

-- Instructions:
-- Email: crmtest@fnnlapp.com
-- Password: TestCRM123!
-- CRM: Honeybook (so import buttons will be visible)
-- You can test:
-- 1. Viewing the CRM dropdown in Profile
-- 2. Changing CRM to different options
-- 3. Selecting "Other" and entering a custom CRM name
-- 4. Import buttons on Funnel and Sales pages (should be visible with Honeybook)

