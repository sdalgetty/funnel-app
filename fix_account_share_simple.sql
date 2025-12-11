-- Fix account share for stevedalgetty@gmail.com to view hello@anendlesspursuit.com's account
-- Run this in the Supabase SQL Editor

-- First, find the user IDs and create/update the share
WITH owner_user AS (
  SELECT id FROM auth.users WHERE email = 'hello@anendlesspursuit.com'
),
guest_user AS (
  SELECT id FROM auth.users WHERE email = 'stevedalgetty@gmail.com'
),
existing_share AS (
  SELECT id FROM account_shares 
  WHERE owner_user_id = (SELECT id FROM owner_user)
  AND guest_email = 'stevedalgetty@gmail.com'
)
INSERT INTO account_shares (
  owner_user_id,
  guest_user_id,
  guest_email,
  invitation_token,
  status,
  role,
  accepted_at,
  created_at,
  updated_at
)
SELECT 
  (SELECT id FROM owner_user),
  (SELECT id FROM guest_user),
  'stevedalgetty@gmail.com',
  gen_random_uuid(),
  'accepted',
  'viewer',
  NOW(),
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM existing_share)
ON CONFLICT (owner_user_id, guest_email) 
DO UPDATE SET
  guest_user_id = (SELECT id FROM guest_user),
  status = 'accepted',
  role = 'viewer',
  accepted_at = COALESCE(account_shares.accepted_at, NOW()),
  updated_at = NOW();

-- Verify the share was created/updated
SELECT 
  as.id,
  as.status,
  as.role,
  owner.email as owner_email,
  guest.email as guest_email,
  as.accepted_at
FROM account_shares as
JOIN auth.users owner ON as.owner_user_id = owner.id
LEFT JOIN auth.users guest ON as.guest_user_id = guest.id
WHERE owner.email = 'hello@anendlesspursuit.com'
AND as.guest_email = 'stevedalgetty@gmail.com';




