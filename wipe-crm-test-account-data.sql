-- Wipe all data for CRM test account
-- Run this in Supabase SQL Editor (Production)
-- This will delete all bookings, funnel data, payments, service types, lead sources, etc.
-- for the test account crmtest@fnnlapp.com

-- Get the user ID
DO $$
DECLARE
  test_user_id uuid;
BEGIN
  -- Get the user ID
  SELECT id INTO test_user_id
  FROM auth.users
  WHERE email = 'crmtest@fnnlapp.com';

  IF test_user_id IS NULL THEN
    RAISE NOTICE 'Test user not found';
    RETURN;
  END IF;

  RAISE NOTICE 'Found test user ID: %', test_user_id;

  -- Delete payments first (they reference bookings)
  DELETE FROM payments
  WHERE booking_id IN (
    SELECT id FROM bookings WHERE user_id = test_user_id
  );

  -- Delete bookings
  DELETE FROM bookings
  WHERE user_id = test_user_id;

  -- Delete funnel data
  DELETE FROM funnels
  WHERE user_id = test_user_id;

  -- Delete ad campaigns
  DELETE FROM ad_campaigns
  WHERE user_id = test_user_id;

  -- Delete forecast models
  DELETE FROM forecast_models
  WHERE user_id = test_user_id;

  -- Delete service types (only if not used by other users)
  -- Note: We'll delete custom ones created by this user
  DELETE FROM service_types
  WHERE user_id = test_user_id;

  -- Delete lead sources (only if not used by other users)
  -- Note: We'll delete custom ones created by this user
  DELETE FROM lead_sources
  WHERE user_id = test_user_id;

  -- Delete account shares (if any)
  DELETE FROM account_shares
  WHERE owner_id = test_user_id OR guest_id = test_user_id;

  RAISE NOTICE 'Data wiped for test user: %', test_user_id;
END $$;

-- Verify data is wiped
SELECT 
  'Bookings' as table_name,
  COUNT(*) as remaining_count
FROM bookings b
JOIN auth.users u ON b.user_id = u.id
WHERE u.email = 'crmtest@fnnlapp.com'

UNION ALL

SELECT 
  'Funnel Data' as table_name,
  COUNT(*) as remaining_count
FROM funnels f
JOIN auth.users u ON f.user_id = u.id
WHERE u.email = 'crmtest@fnnlapp.com'

UNION ALL

SELECT 
  'Service Types' as table_name,
  COUNT(*) as remaining_count
FROM service_types st
JOIN auth.users u ON st.user_id = u.id
WHERE u.email = 'crmtest@fnnlapp.com'

UNION ALL

SELECT 
  'Lead Sources' as table_name,
  COUNT(*) as remaining_count
FROM lead_sources ls
JOIN auth.users u ON ls.user_id = u.id
WHERE u.email = 'crmtest@fnnlapp.com';

