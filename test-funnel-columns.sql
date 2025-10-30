-- Test script to check what columns exist in the funnels table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'funnels' 
ORDER BY ordinal_position;




