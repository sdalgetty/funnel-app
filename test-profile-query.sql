-- Test profile query to debug the hanging issue
-- Run this in Supabase SQL Editor

-- First, check the structure of user_profiles table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Check if there are any records in user_profiles table
SELECT * FROM user_profiles LIMIT 5;

-- Check RLS policies on user_profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';
