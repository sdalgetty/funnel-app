-- Create Demo Onboarding Account
-- Run this in your TEST Supabase SQL Editor: https://app.supabase.com/project/xiomuqqsrqiwhjyfxoji/sql
-- 
-- This account will auto-reset all data (except profile) on each login.
-- Perfect for demonstrating onboarding flows.

-- Email: demo-onboarding@test.com
-- Password: DemoOnboarding2024!

-- Step 1: Create the auth user
DO $$
DECLARE
  user_id uuid;
  existing_user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = 'demo-onboarding@test.com';

  IF existing_user_id IS NOT NULL THEN
    RAISE NOTICE 'User demo-onboarding@test.com already exists with ID: %', existing_user_id;
    user_id := existing_user_id;
  ELSE
    -- Create new user
    user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      user_id,
      '00000000-0000-0000-0000-000000000000',
      'demo-onboarding@test.com',
      crypt('DemoOnboarding2024!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Demo User"}',
      false,
      'authenticated'
    );

    RAISE NOTICE 'User created with ID: %', user_id;
  END IF;

  -- Step 2: Create or update user profile
  INSERT INTO user_profiles (
    id,
    email,
    full_name,
    first_name,
    last_name,
    company_name,
    subscription_tier,
    subscription_status,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    'demo-onboarding@test.com',
    'Demo User',
    'Demo',
    'User',
    'Demo Company',
    'pro',
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    company_name = EXCLUDED.company_name,
    updated_at = NOW();

  RAISE NOTICE 'Profile created/updated for user: %', user_id;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Demo onboarding account ready!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Account Details:';
  RAISE NOTICE '   Email: demo-onboarding@test.com';
  RAISE NOTICE '   Password: DemoOnboarding2024!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Log in with the account on the TEST environment';
  RAISE NOTICE '   2. Fill out the Profile page with demo information';
  RAISE NOTICE '   3. The profile will be preserved across resets';
  RAISE NOTICE '   4. All other data will auto-reset on each login';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: This account only works in TEST environment!';
  RAISE NOTICE '   Production is protected - reset will NOT run in production.';

END $$;

