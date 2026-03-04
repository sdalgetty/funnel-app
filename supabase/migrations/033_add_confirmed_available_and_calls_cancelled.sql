-- Add confirmed_available and calls_cancelled columns to funnels table
-- confirmed_available: number of leads who confirmed availability (before calls booked)
-- calls_cancelled: number of booked calls that were cancelled (before calls taken)
ALTER TABLE funnels
ADD COLUMN IF NOT EXISTS confirmed_available int8 DEFAULT 0,
ADD COLUMN IF NOT EXISTS calls_cancelled int8 DEFAULT 0;

COMMENT ON COLUMN funnels.confirmed_available IS 'Number of leads who confirmed availability, sits left of Calls Booked';
COMMENT ON COLUMN funnels.calls_cancelled IS 'Number of booked calls that were cancelled, sits left of Calls Taken';
