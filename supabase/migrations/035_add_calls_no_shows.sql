-- Add calls_no_shows column to funnels table
-- calls_no_shows: number of booked calls where the lead did not show up (no cancellation)
-- When null/empty, computed as (calls_booked - calls_cancelled) - calls_taken for display
-- When filled, used for accurate Show Up Rate: calls_taken / (calls_taken + calls_no_shows)
ALTER TABLE funnels
ADD COLUMN IF NOT EXISTS calls_no_shows int8;

COMMENT ON COLUMN funnels.calls_no_shows IS 'Number of booked calls where lead did not show. When null, inferred from booked-cancelled-taken. When set, used for Show Up Rate.';
