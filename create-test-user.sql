-- Script to create test user with admin access
-- Run this in your TEST Supabase SQL Editor first
-- Then run the migrate-user-to-test.mjs script to copy data

-- Step 1: Create auth user (you'll need to sign up first, or use this to create)
-- Note: Creating auth.users directly requires special permissions
-- Easiest: Sign up in test environment first, then this script will set admin access

-- Step 2: Set admin access for the user
-- Replace 'USER_EMAIL_HERE' with hello@anendlesspursuit.com after you sign up
UPDATE user_profiles
SET is_admin = TRUE
WHERE email = 'hello@anendlesspursuit.com';

-- Verify
SELECT id, email, full_name, company_name, is_admin
FROM user_profiles
WHERE email = 'hello@anendlesspursuit.com';

