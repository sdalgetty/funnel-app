-- Add monthly funnel data columns to funnels table
-- This allows storing monthly data instead of just yearly totals

ALTER TABLE funnels 
ADD COLUMN IF NOT EXISTS year int4,
ADD COLUMN IF NOT EXISTS month int4,
ADD COLUMN IF NOT EXISTS inquiries int8 DEFAULT 0,
ADD COLUMN IF NOT EXISTS calls_booked int8 DEFAULT 0,
ADD COLUMN IF NOT EXISTS calls_taken int8 DEFAULT 0,
ADD COLUMN IF NOT EXISTS closes int8 DEFAULT 0,
ADD COLUMN IF NOT EXISTS bookings int8 DEFAULT 0,
ADD COLUMN IF NOT EXISTS cash int8 DEFAULT 0;

-- Create index for efficient querying by user, year, and month
CREATE INDEX IF NOT EXISTS funnels_user_year_month_idx 
ON funnels (user_id, year, month);

-- Update existing records to have current year if they don't have a year
UPDATE funnels 
SET year = EXTRACT(YEAR FROM updated_at)::int4
WHERE year IS NULL;
