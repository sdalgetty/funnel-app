-- Add ads_setup_completed to user_profiles
-- When true, user has completed the advertising setup wizard (selected lead sources that count as ads)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS ads_setup_completed boolean DEFAULT false;

COMMENT ON COLUMN user_profiles.ads_setup_completed IS 'If true, user has completed the advertising setup wizard and selected which lead sources count as ads';
