# Production Deployment Instructions - Ads Tracking Feature

## Pre-Deployment Checklist

1. ✅ **Backup Production Data** (CRITICAL - DO THIS FIRST)
2. ✅ **Run Schema Migrations** (025 and 026)
3. ✅ **Deploy Code to Production**
4. ✅ **Run Data Migration Script**
5. ✅ **Verify Data Migration**
6. ✅ **Test in Production**

---

## Step 1: Backup Production Data

**⚠️ CRITICAL: Do this FIRST before any changes!**

1. Go to your **Production Supabase SQL Editor**: https://app.supabase.com/
2. Select your **production project**
3. Open the file: `backup-production-data.sql`
4. Copy and paste the entire SQL into the SQL Editor
5. Click **"Run"** (or Cmd/Ctrl + Enter)
6. Verify backups were created - you should see backup tables listed

**Backup tables created:**
- `ad_campaigns_backup_YYYYMMDD_HHMMSS`
- `lead_sources_backup_YYYYMMDD_HHMMSS`
- `funnels_backup_YYYYMMDD_HHMMSS`

---

## Step 2: Run Schema Migrations

Run these migrations in order in your **Production Supabase SQL Editor**:

### Migration 025: Add Ads Tracking to User Profiles and Funnels
1. Open: `supabase/migrations/025_add_ads_tracking_to_user_profiles_and_funnels.sql`
2. Copy and paste into SQL Editor
3. Click **"Run"**
4. Verify success

### Migration 026: Add is_ad_source to Lead Sources
1. Open: `supabase/migrations/026_add_is_ad_source_to_lead_sources.sql`
2. Copy and paste into SQL Editor
3. Click **"Run"**
4. Verify success

---

## Step 3: Deploy Code to Production

The code changes will be deployed automatically when you merge `test` to `prod` and push.

**After deployment:**
- Netlify will automatically build and deploy
- Wait for deployment to complete
- Verify the deployment succeeded

---

## Step 4: Run Data Migration Script

**⚠️ IMPORTANT: Only run this AFTER the code is deployed and migrations are complete!**

This script migrates existing `ad_campaigns` data to the new `funnels.ads_lead` and `funnels.ads_spend_cents` format.

1. Go to **Production Supabase SQL Editor**
2. Open: `migrate-ad-campaigns-to-funnels.sql`
3. Copy and paste the entire SQL into the SQL Editor
4. Click **"Run"**
5. Review the summary output - it will show:
   - Number of users migrated
   - Number of months with ads data
   - Total ads leads
   - Total ads spend in dollars

**What this does:**
- Aggregates all `ad_campaigns` by user, year, and month
- Sums `leads_generated` → `funnels.ads_lead`
- Sums `ad_spend_cents` → `funnels.ads_spend_cents`
- Only updates months where ads fields are currently empty/zero
- Creates new funnel records for months that don't exist yet

---

## Step 5: Verify Data Migration

Run this query to verify the migration:

```sql
-- Check migrated data
SELECT 
  COUNT(DISTINCT user_id) as users_with_ads_data,
  COUNT(*) as months_with_ads_data,
  SUM(ads_lead) as total_ads_leads,
  SUM(ads_spend_cents) / 100.0 as total_ads_spend_dollars
FROM funnels
WHERE ads_lead > 0 OR ads_spend_cents > 0;

-- Compare with original ad_campaigns data
SELECT 
  COUNT(DISTINCT user_id) as users_in_campaigns,
  COUNT(*) as total_campaigns,
  SUM(leads_generated) as total_leads,
  SUM(ad_spend_cents) / 100.0 as total_spend_dollars
FROM ad_campaigns;
```

The numbers should match (or be very close if there are any edge cases).

---

## Step 6: Test in Production

1. **Log in to production**
2. **Go to Funnel page** - verify "Track Advertising Data" toggle appears
3. **Toggle it ON** - verify Ads Lead and Ad Spend columns appear
4. **Check existing data** - verify migrated data appears in the table
5. **Go to Insights** - verify Advertising section appears with correct calculations
6. **Go to Bookings → Manage Lead Sources** - verify "Ad Source" checkbox appears
7. **Mark a lead source as Ad Source** - verify it saves
8. **Create a test booking** with that lead source
9. **Check Insights** - verify booking appears in "Total Booked from Ads"

---

## Rollback Plan (If Needed)

If something goes wrong:

1. **Restore from backup tables:**
   ```sql
   -- Find your backup tables
   SELECT table_name FROM information_schema.tables 
   WHERE table_name LIKE '%_backup_%' 
   ORDER BY table_name DESC LIMIT 3;
   
   -- Restore ad_campaigns (example - use your actual backup table name)
   -- TRUNCATE TABLE ad_campaigns;
   -- INSERT INTO ad_campaigns SELECT * FROM ad_campaigns_backup_YYYYMMDD_HHMMSS;
   ```

2. **Revert code deployment:**
   - Revert the merge in git
   - Push to prod branch
   - Netlify will redeploy

3. **Contact support** if data restoration is needed

---

## Notes

- The old `ad_campaigns` table is **NOT deleted** - data remains for reference
- Users can still access old data if needed
- The new system aggregates by month (all lead sources combined)
- Users can mark lead sources as "Ad Source" to include bookings in ROI calculations
