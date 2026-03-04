-- Allow NULL lead_source_id on bookings so we can clear the association when deleting a lead source
-- (instead of blocking the delete with ON DELETE RESTRICT)
ALTER TABLE bookings
ALTER COLUMN lead_source_id DROP NOT NULL;

COMMENT ON COLUMN bookings.lead_source_id IS 'Lead source for this booking. NULL if association was removed (e.g. lead source deleted).';
