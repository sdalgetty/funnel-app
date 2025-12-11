-- Add manual override flags for Closes, Bookings, and Cash
ALTER TABLE funnels
ADD COLUMN IF NOT EXISTS closes_manual boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bookings_manual boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cash_manual boolean DEFAULT false;

COMMENT ON COLUMN funnels.closes_manual IS 'If true, closes value is manually entered and should not be calculated from sales data';
COMMENT ON COLUMN funnels.bookings_manual IS 'If true, bookings value is manually entered and should not be calculated from sales data';
COMMENT ON COLUMN funnels.cash_manual IS 'If true, cash value is manually entered and should not be calculated from scheduled payments';

