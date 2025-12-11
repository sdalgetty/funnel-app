-- Fix account share for stevedalgetty@gmail.com to view hello@anendlesspursuit.com's account
-- This migration creates/updates the account share relationship

DO $$
DECLARE
    v_owner_id uuid;
    v_guest_id uuid;
BEGIN
    -- Get owner user ID (hello@anendlesspursuit.com)
    SELECT id INTO v_owner_id 
    FROM auth.users 
    WHERE email = 'hello@anendlesspursuit.com';
    
    -- Get guest user ID (stevedalgetty@gmail.com)
    SELECT id INTO v_guest_id 
    FROM auth.users 
    WHERE email = 'stevedalgetty@gmail.com';
    
    -- Check if users exist
    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION 'Owner user (hello@anendlesspursuit.com) not found';
    END IF;
    
    IF v_guest_id IS NULL THEN
        RAISE EXCEPTION 'Guest user (stevedalgetty@gmail.com) not found';
    END IF;
    
    -- Upsert the share
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
    ) VALUES (
        v_owner_id, 
        v_guest_id, 
        'stevedalgetty@gmail.com', 
        gen_random_uuid(),
        'accepted', 
        'viewer', 
        NOW(), 
        NOW(), 
        NOW()
    )
    ON CONFLICT (owner_user_id, guest_email) 
    DO UPDATE SET
        guest_user_id = v_guest_id,
        status = 'accepted',
        role = 'viewer',
        accepted_at = COALESCE(account_shares.accepted_at, NOW()),
        updated_at = NOW();
    
    RAISE NOTICE 'Account share configured: Owner % can be viewed by Guest %', v_owner_id, v_guest_id;
END $$;




