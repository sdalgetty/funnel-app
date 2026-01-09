-- Migrate Ad Campaigns Data to New Funnel Format
-- This aggregates ad_campaigns data by month and populates funnels.ads_lead and funnels.ads_spend_cents
-- Run this AFTER deploying the new code and running the schema migrations (025 and 026)

-- Step 1: Aggregate ad campaigns by user, year, month
-- Parse month_year (format: "2024-01") to extract year and month
-- Sum leads_generated and ad_spend_cents for each month
WITH aggregated_ads AS (
  SELECT 
    ac.user_id,
    CAST(SPLIT_PART(ac.month_year, '-', 1) AS INTEGER) as year,
    CAST(SPLIT_PART(ac.month_year, '-', 2) AS INTEGER) as month,
    COALESCE(SUM(ac.leads_generated), 0) as total_ads_lead,
    COALESCE(SUM(ac.ad_spend_cents), 0) as total_ads_spend_cents
  FROM ad_campaigns ac
  WHERE (ac.leads_generated IS NOT NULL AND ac.leads_generated > 0) 
     OR (ac.ad_spend_cents IS NOT NULL AND ac.ad_spend_cents > 0)
  GROUP BY ac.user_id, year, month
)
-- Step 2: For existing funnel records, add the ad data (only if fields are empty/zero)
UPDATE funnels f
SET 
  ads_lead = COALESCE(aa.total_ads_lead, 0),
  ads_spend_cents = COALESCE(aa.total_ads_spend_cents, 0),
  updated_at = NOW()
FROM aggregated_ads aa
WHERE f.user_id = aa.user_id 
  AND f.year = aa.year 
  AND f.month = aa.month
  AND (f.ads_lead = 0 OR f.ads_lead IS NULL)
  AND (f.ads_spend_cents = 0 OR f.ads_spend_cents IS NULL);

-- Step 3: Insert new funnel records for months that don't exist yet (only for months with ad data)
-- Note: Only include columns that exist - let defaults handle created_at/updated_at if they exist
INSERT INTO funnels (user_id, year, month, name, ads_lead, ads_spend_cents, inquiries, calls_booked, calls_taken, closes, bookings, cash, last_updated)
SELECT 
  aa.user_id,
  aa.year,
  aa.month,
  TO_CHAR(TO_DATE(aa.year || '-' || aa.month || '-01', 'YYYY-MM-DD'), 'Month YYYY') as name,
  aa.total_ads_lead,
  aa.total_ads_spend_cents,
  0 as inquiries,
  0 as calls_booked,
  0 as calls_taken,
  0 as closes,
  0 as bookings,
  0 as cash,
  NOW() as last_updated
FROM aggregated_ads aa
WHERE NOT EXISTS (
  SELECT 1 
  FROM funnels f 
  WHERE f.user_id = aa.user_id 
    AND f.year = aa.year 
    AND f.month = aa.month
);

-- Step 4: Show summary of migrated data
SELECT 
  COUNT(DISTINCT user_id) as users_migrated,
  COUNT(*) as months_with_ads_data,
  SUM(ads_lead) as total_ads_leads,
  SUM(ads_spend_cents) / 100.0 as total_ads_spend_dollars
FROM funnels
WHERE ads_lead > 0 OR ads_spend_cents > 0;
