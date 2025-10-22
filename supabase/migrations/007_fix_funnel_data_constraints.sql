-- Fix funnel data constraints and ensure all records have proper year/month values

-- First, update any records that have NULL year or month values
UPDATE funnels 
SET year = EXTRACT(YEAR FROM updated_at)::int4,
    month = EXTRACT(MONTH FROM updated_at)::int4
WHERE year IS NULL OR month IS NULL;

-- Drop the existing unique index if it exists
DROP INDEX IF EXISTS funnels_user_year_month_unique;

-- Create a partial unique index that only applies to records with non-null year and month
CREATE UNIQUE INDEX funnels_user_year_month_unique 
ON funnels (user_id, year, month) 
WHERE year IS NOT NULL AND month IS NOT NULL;
