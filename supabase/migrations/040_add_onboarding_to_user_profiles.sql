-- Add onboarding fields to user_profiles
-- onboarding_completed: false until user finishes the setup wizard
-- onboarding_step: current step (1-4) for resume capability
-- onboarding_completed_at: timestamp when wizard was completed

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

COMMENT ON COLUMN user_profiles.onboarding_completed IS 'If true, user has completed the onboarding setup wizard';
COMMENT ON COLUMN user_profiles.onboarding_step IS 'Current onboarding step (1-4) for resume when user leaves';
COMMENT ON COLUMN user_profiles.onboarding_completed_at IS 'Timestamp when onboarding wizard was completed';
