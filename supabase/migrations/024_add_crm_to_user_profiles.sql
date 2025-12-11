-- Add CRM fields to user_profiles table
-- This allows users to specify their CRM for import functionality

alter table user_profiles 
add column if not exists crm text,
add column if not exists crm_other text;

-- Add comments
comment on column user_profiles.crm is 'CRM system used by the user (e.g., honeybook, dubsado, 17hats). Used to show relevant import options.';
comment on column user_profiles.crm_other is 'Custom CRM name when crm is set to "other".';

