-- Verify the account share exists and is correct
SELECT 
  as.id,
  as.status,
  as.role,
  owner.email as owner_email,
  guest.email as guest_email,
  as.accepted_at,
  as.created_at
FROM account_shares as
JOIN auth.users owner ON as.owner_user_id = owner.id
LEFT JOIN auth.users guest ON as.guest_user_id = guest.id
WHERE owner.email = 'hello@anendlesspursuit.com'
AND as.guest_email = 'stevedalgetty@gmail.com';




