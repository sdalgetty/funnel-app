-- Backfill: Set onboarding_completed = true for all existing users
-- Existing users signed up before the onboarding feature and should not be forced through the wizard.
-- New users (profiles created after this migration) will get onboarding_completed = false from the column default.

UPDATE user_profiles
SET onboarding_completed = true
WHERE onboarding_completed = false;
