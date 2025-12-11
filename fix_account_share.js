// Node script to fix account share using Supabase client
// Run with: node fix_account_share.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  console.error('Please set these in your .env file or as environment variables');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAccountShare() {
  try {
    // Get owner user ID
    const { data: ownerUser, error: ownerError } = await supabase.auth.admin.listUsers();
    if (ownerError) throw ownerError;
    
    const owner = ownerUser.users.find(u => u.email === 'hello@anendlesspursuit.com');
    const guest = ownerUser.users.find(u => u.email === 'stevedalgetty@gmail.com');
    
    if (!owner) {
      throw new Error('Owner user (hello@anendlesspursuit.com) not found');
    }
    if (!guest) {
      throw new Error('Guest user (stevedalgetty@gmail.com) not found');
    }
    
    console.log('Owner ID:', owner.id);
    console.log('Guest ID:', guest.id);
    
    // Check if share exists
    const { data: existingShare, error: checkError } = await supabase
      .from('account_shares')
      .select('*')
      .eq('owner_user_id', owner.id)
      .eq('guest_email', 'stevedalgetty@gmail.com')
      .maybeSingle();
    
    if (checkError) throw checkError;
    
    if (existingShare) {
      // Update existing share
      const { data: updatedShare, error: updateError } = await supabase
        .from('account_shares')
        .update({
          guest_user_id: guest.id,
          status: 'accepted',
          role: 'viewer',
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingShare.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      console.log('✅ Updated existing share:', updatedShare);
    } else {
      // Create new share
      const { data: newShare, error: insertError } = await supabase
        .from('account_shares')
        .insert({
          owner_user_id: owner.id,
          guest_user_id: guest.id,
          guest_email: 'stevedalgetty@gmail.com',
          invitation_token: crypto.randomUUID(),
          status: 'accepted',
          role: 'viewer',
          accepted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      console.log('✅ Created new share:', newShare);
    }
    
    console.log('\n✅ Account share configured successfully!');
    console.log('Owner:', owner.email, '(', owner.id, ')');
    console.log('Guest:', guest.email, '(', guest.id, ')');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAccountShare();




