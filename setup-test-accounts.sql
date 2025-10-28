-- Setup test accounts with different permission levels
-- Run this in Supabase SQL Editor after creating accounts

-- Set Trial account (trial tier with active status)
UPDATE user_profiles 
SET subscription_tier = 'trial', subscription_status = 'active'
WHERE email = 'trial@example.com';

-- Set Free account (free tier with active status)
UPDATE user_profiles 
SET subscription_tier = 'free', subscription_status = 'active'
WHERE email = 'free@example.com';

-- Set Pro account (pro tier with active status)
UPDATE user_profiles 
SET subscription_tier = 'pro', subscription_status = 'active'
WHERE email = 'pro@example.com';

-- Verify the changes
SELECT email, full_name, company_name, subscription_tier, subscription_status 
FROM user_profiles 
ORDER BY created_at DESC;
