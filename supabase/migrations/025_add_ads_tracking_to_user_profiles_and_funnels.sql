-- Add ads_tracking_enabled to user_profiles
-- This allows users to enable/disable ads tracking in the Funnel view
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS ads_tracking_enabled boolean DEFAULT false;

COMMENT ON COLUMN user_profiles.ads_tracking_enabled IS 'If true, user wants to track ads in the Funnel view instead of separate Advertising page';

-- Add ads_lead and ads_spend_cents columns to funnels table
-- These will store aggregated ad data per month (sum of all lead sources)
ALTER TABLE funnels
ADD COLUMN IF NOT EXISTS ads_lead int8 DEFAULT 0,
ADD COLUMN IF NOT EXISTS ads_spend_cents int8 DEFAULT 0;

COMMENT ON COLUMN funnels.ads_lead IS 'Number of ad leads generated for this month (aggregated across all lead sources)';
COMMENT ON COLUMN funnels.ads_spend_cents IS 'Total ad spend in cents for this month (aggregated across all lead sources)';
