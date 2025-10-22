-- Add company_name field to user_profiles table
alter table user_profiles 
add column company_name text;

-- Update the database types to include company_name
-- This will be reflected in the TypeScript types
