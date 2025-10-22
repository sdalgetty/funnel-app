-- Test Data Entry Script
-- Use this to test entering a small amount of data safely
-- Run this AFTER creating your backup

-- First, get your user ID
SELECT id, email FROM auth.users WHERE email = 'hello@anendlesspursuit.com';

-- Example: Add a test service type (replace USER_ID_HERE with your actual ID)
-- INSERT INTO service_types (user_id, name, description) 
-- VALUES ('USER_ID_HERE', 'Test Service', 'This is a test service to verify data entry works');

-- Example: Add a test lead source
-- INSERT INTO lead_sources (user_id, name, description) 
-- VALUES ('USER_ID_HERE', 'Test Lead Source', 'This is a test lead source');

-- Example: Add a test booking
-- INSERT INTO bookings (user_id, client_name, client_email, client_phone, service_type_id, lead_source_id, booking_date, status) 
-- VALUES ('USER_ID_HERE', 'Test Customer', 'test@example.com', '555-1234', 'SERVICE_TYPE_ID_HERE', 'LEAD_SOURCE_ID_HERE', '2025-01-15', 'confirmed');

-- Example: Add a test payment (amount in cents)
-- INSERT INTO payments (user_id, booking_id, amount_cents, payment_date, payment_method, status) 
-- VALUES ('USER_ID_HERE', 'BOOKING_ID_HERE', 100000, '2025-01-15', 'credit_card', 'completed');

-- After adding test data, run the backup script again to see your data
