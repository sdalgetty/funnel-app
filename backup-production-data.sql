-- Backup Production Data Before Migration
-- Run this in Supabase SQL Editor BEFORE deploying the new ads tracking feature
-- This creates backup tables with a timestamp

DO $$
DECLARE
  backup_suffix TEXT := TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS');
BEGIN
  -- Backup ad_campaigns
  EXECUTE format('CREATE TABLE ad_campaigns_backup_%s AS SELECT * FROM ad_campaigns', backup_suffix);
  
  -- Backup lead_sources (in case we need to check which were ad sources)
  EXECUTE format('CREATE TABLE lead_sources_backup_%s AS SELECT * FROM lead_sources', backup_suffix);
  
  -- Backup funnels (to preserve any existing data)
  EXECUTE format('CREATE TABLE funnels_backup_%s AS SELECT * FROM funnels', backup_suffix);
  
  RAISE NOTICE 'Backup tables created with suffix: %', backup_suffix;
END $$;

-- Verify backups were created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name LIKE '%_backup_%'
ORDER BY table_name DESC
LIMIT 10;
