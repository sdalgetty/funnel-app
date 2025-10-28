-- Add company_name field to user_profiles table
-- This is a safe migration that only adds the column
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company_name text;
