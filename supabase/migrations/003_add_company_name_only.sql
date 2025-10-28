-- Add company_name field to user_profiles table
-- This migration only adds the column, avoiding conflicts with existing policies
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company_name text;
