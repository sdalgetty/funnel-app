-- Test script to check funnel data saving
-- This will help us debug the issue

-- First, let's see what columns actually exist in the funnels table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'funnels' 
ORDER BY ordinal_position;

-- Let's also check if there are any existing funnel records for our test user
SELECT * FROM funnels WHERE user_id = '00000000-0000-0000-0000-000000000001' ORDER BY year, month;

-- Let's try a simple insert to see what happens
INSERT INTO funnels (
  user_id, 
  year, 
  month, 
  inquiries, 
  calls_booked, 
  calls_taken, 
  closes, 
  bookings, 
  cash, 
  name, 
  last_updated
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  2025,
  2,
  10,
  5,
  4,
  2,
  100000,
  100000,
  'Test February 2025',
  now()
);




