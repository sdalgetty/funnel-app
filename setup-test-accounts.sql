-- Setup test accounts with different permission levels
-- Run this in Supabase SQL Editor after creating accounts

-- Set your main account to Pro (replace with your actual email)
UPDATE user_profiles 
SET subscription_tier = 'pro', subscription_status = 'active'
WHERE email = 'your-email@example.com';

-- Set test accounts to Free tier
UPDATE user_profiles 
SET subscription_tier = 'free', subscription_status = 'active'
WHERE email IN ('test1@example.com', 'test2@example.com', 'demo@example.com');

-- Verify the changes
SELECT email, full_name, company_name, subscription_tier, subscription_status 
FROM user_profiles 
ORDER BY created_at DESC;
