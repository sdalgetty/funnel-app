-- Add tracks_in_funnel column to service_types table
ALTER TABLE service_types
ADD COLUMN tracks_in_funnel boolean NOT NULL DEFAULT false;

-- Optional: Add an index for faster lookups if service types are frequently filtered by tracks_in_funnel
CREATE INDEX IF NOT EXISTS service_types_tracks_in_funnel_idx ON service_types (tracks_in_funnel);

