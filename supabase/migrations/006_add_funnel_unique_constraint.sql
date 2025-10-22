-- Add unique constraint for user_id, year, month combination
-- This ensures one record per user per month per year

CREATE UNIQUE INDEX IF NOT EXISTS funnels_user_year_month_unique 
ON funnels (user_id, year, month);
