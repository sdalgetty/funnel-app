-- Fix account share for stevedalgetty@gmail.com to view hello@anendlesspursuit.com's account

-- First, find the user IDs
DO $$
DECLARE
    owner_user_id uuid;
    guest_user_id uuid;
    existing_share_id uuid;
BEGIN
    -- Get owner user ID (hello@anendlesspursuit.com)
    SELECT id INTO owner_user_id
    FROM auth.users
    WHERE email = 'hello@anendlesspursuit.com';
    
    -- Get guest user ID (stevedalgetty@gmail.com)
    SELECT id INTO guest_user_id
    FROM auth.users
    WHERE email = 'stevedalgetty@gmail.com';
    
    -- Check if share already exists
    SELECT id INTO existing_share_id
    FROM account_shares
    WHERE account_shares.owner_user_id = owner_user_id
    AND account_shares.guest_email = 'stevedalgetty@gmail.com';
    
    IF owner_user_id IS NULL THEN
        RAISE EXCEPTION 'Owner user (hello@anendlesspursuit.com) not found';
    END IF;
    
    IF guest_user_id IS NULL THEN
        RAISE EXCEPTION 'Guest user (stevedalgetty@gmail.com) not found';
    END IF;
    
    -- If share exists, update it; otherwise create it
    IF existing_share_id IS NOT NULL THEN
        UPDATE account_shares
        SET 
            guest_user_id = guest_user_id,
            status = 'accepted',
            role = 'viewer',
            accepted_at = NOW(),
            updated_at = NOW()
        WHERE id = existing_share_id;
        
        RAISE NOTICE 'Updated existing share: %', existing_share_id;
    ELSE
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
            owner_user_id,
            guest_user_id,
            'stevedalgetty@gmail.com',
            gen_random_uuid(),
            'accepted',
            'viewer',
            NOW(),
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created new share for guest user: %', guest_user_id;
    END IF;
    
    RAISE NOTICE 'Account share configured successfully';
    RAISE NOTICE 'Owner: % (hello@anendlesspursuit.com)', owner_user_id;
    RAISE NOTICE 'Guest: % (stevedalgetty@gmail.com)', guest_user_id;
END $$;
