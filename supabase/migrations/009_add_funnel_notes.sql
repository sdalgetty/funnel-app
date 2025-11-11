-- Add notes column to funnels for monthly change logs
ALTER TABLE funnels
ADD COLUMN IF NOT EXISTS notes text;

COMMENT ON COLUMN funnels.notes IS 'Monthly change log notes for funnel entries';

