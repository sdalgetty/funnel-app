-- Set admin access for user in test environment
-- Run this in test Supabase SQL Editor: https://app.supabase.com/project/xiomuqqsrqiwhjyfxoji/sql

UPDATE user_profiles
SET is_admin = TRUE
WHERE email = 'hello@anendlesspursuit.com';

-- Verify
SELECT id, email, full_name, company_name, is_admin
FROM user_profiles
WHERE email = 'hello@anendlesspursuit.com';

