-- Add notes column to ad_campaigns table for tracking month-to-month advertising changes
ALTER TABLE ad_campaigns 
ADD COLUMN IF NOT EXISTS notes text;

