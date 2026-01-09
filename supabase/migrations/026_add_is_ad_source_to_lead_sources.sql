-- Add is_ad_source flag to lead_sources table
-- This allows users to mark lead sources as advertising sources for ROI calculations
ALTER TABLE lead_sources 
ADD COLUMN IF NOT EXISTS is_ad_source boolean DEFAULT false;

COMMENT ON COLUMN lead_sources.is_ad_source IS 'If true, this lead source is used for advertising. Bookings from this source will be included in advertising ROI calculations.';
