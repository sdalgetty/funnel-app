-- Add archived flag to lead_sources and service_types
-- Archived items remain attached to past sales but are hidden from active lists and new sale dropdowns.
-- They stay available in filters for historical reporting and can be restored.

ALTER TABLE lead_sources
ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN lead_sources.archived IS 'If true, hidden from active lists and new sale dropdowns but remains in filters for historical reporting.';

ALTER TABLE service_types
ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN service_types.archived IS 'If true, hidden from active lists and new sale dropdowns but remains in filters for historical reporting.';
