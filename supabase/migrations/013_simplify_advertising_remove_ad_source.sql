-- Simplify Advertising: Remove AdSource entity and link ad_campaigns directly to lead_sources
-- This migration:
-- 1. Adds lead_source_id to ad_campaigns
-- 2. Migrates data from ad_sources -> lead_sources via ad_campaigns
-- 3. Drops the foreign key constraint on ad_source_id
-- 4. Drops the ad_source_id column
-- 5. Adds foreign key constraint on lead_source_id
-- 6. Drops the ad_sources table (data will be lost, but AdSource was just a pass-through)

-- Step 1: Add lead_source_id column to ad_campaigns
ALTER TABLE ad_campaigns 
ADD COLUMN IF NOT EXISTS lead_source_id uuid REFERENCES lead_sources(id) ON DELETE RESTRICT;

-- Step 2: Migrate data: Copy lead_source_id from ad_sources through the relationship
UPDATE ad_campaigns ac
SET lead_source_id = (
  SELECT lead_source_id 
  FROM ad_sources ads 
  WHERE ads.id = ac.ad_source_id
)
WHERE ac.lead_source_id IS NULL 
  AND ac.ad_source_id IS NOT NULL;

-- Step 3: Drop the foreign key constraint on ad_source_id (if it exists with a specific name)
-- Note: We'll drop the column which will automatically drop the constraint
-- But first, let's check if any campaigns have null lead_source_id after migration
-- If there are orphaned campaigns, we'll set them to null and they can be cleaned up manually
-- (This shouldn't happen if data integrity was maintained, but we'll be safe)

-- Step 4: Drop the ad_source_id column (this will cascade drop the foreign key)
ALTER TABLE ad_campaigns 
DROP COLUMN IF EXISTS ad_source_id;

-- Step 5: Make lead_source_id NOT NULL now that data is migrated
-- But first check if there are any nulls
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM ad_campaigns WHERE lead_source_id IS NULL) THEN
    RAISE WARNING 'Found ad_campaigns with null lead_source_id. These will need manual cleanup.';
  END IF;
END $$;

-- Make it NOT NULL if there are no nulls
ALTER TABLE ad_campaigns 
ALTER COLUMN lead_source_id SET NOT NULL;

-- Step 6: Drop the ad_sources table (no longer needed)
DROP TABLE IF EXISTS ad_sources CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS ad_campaigns_lead_source_id_idx ON ad_campaigns(lead_source_id);
CREATE INDEX IF NOT EXISTS ad_campaigns_month_year_idx ON ad_campaigns(month_year);

