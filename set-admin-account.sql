-- Set yourself as admin
-- Replace 'your-email@example.com' with your actual email address

UPDATE user_profiles
SET is_admin = TRUE
WHERE email = 'hello@anendlesspursuit.com';

-- Verify the update
SELECT id, email, full_name, is_admin, created_at
FROM user_profiles
WHERE email = 'hello@anendlesspursuit.com';




