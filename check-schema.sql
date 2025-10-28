-- Check what columns actually exist in the funnels table
-- Run this first to see the actual schema

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'funnels' 
ORDER BY ordinal_position;
