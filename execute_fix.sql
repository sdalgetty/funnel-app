-- Simplified version that can be executed via Supabase client
-- This uses a function approach

DO $$
DECLARE
    v_owner_id uuid;
    v_guest_id uuid;
BEGIN
    -- Get IDs
    SELECT id INTO v_owner_id FROM auth.users WHERE email = 'hello@anendlesspursuit.com';
    SELECT id INTO v_guest_id FROM auth.users WHERE email = 'stevedalgetty@gmail.com';
    
    -- Upsert the share
    INSERT INTO account_shares (
        owner_user_id, guest_user_id, guest_email, invitation_token, 
        status, role, accepted_at, created_at, updated_at
    ) VALUES (
        v_owner_id, v_guest_id, 'stevedalgetty@gmail.com', gen_random_uuid(),
        'accepted', 'viewer', NOW(), NOW(), NOW()
    )
    ON CONFLICT (owner_user_id, guest_email) 
    DO UPDATE SET
        guest_user_id = v_guest_id,
        status = 'accepted',
        role = 'viewer',
        accepted_at = COALESCE(account_shares.accepted_at, NOW()),
        updated_at = NOW();
END $$;
