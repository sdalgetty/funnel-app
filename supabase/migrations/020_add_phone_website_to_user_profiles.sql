-- Add phone and website fields to user_profiles table
alter table user_profiles 
add column if not exists phone text,
add column if not exists website text;


