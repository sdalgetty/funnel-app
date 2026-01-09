// Script to fix account share using Supabase Management API
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to get Supabase URL from environment or use the one from the codebase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://lqtzjwgsgimsnbmxfmra.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Please set it in your environment or .env file');
  console.error('You can find it in your Supabase dashboard: Settings > API > service_role key');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixAccountShare() {
  try {
    console.log('🔍 Looking up users...');
    
    // Get owner user ID (hello@anendlesspursuit.com)
    const { data: ownerUsers, error: ownerError } = await supabase.auth.admin.listUsers();
    if (ownerError) throw ownerError;
    
    const owner = ownerUsers.users.find(u => u.email === 'hello@anendlesspursuit.com');
    const guest = ownerUsers.users.find(u => u.email === 'stevedalgetty@gmail.com');
    
    if (!owner) {
      throw new Error('Owner user (hello@anendlesspursuit.com) not found');
    }
    if (!guest) {
      throw new Error('Guest user (stevedalgetty@gmail.com) not found');
    }
    
    console.log('✅ Found owner:', owner.email, '(', owner.id, ')');
    console.log('✅ Found guest:', guest.email, '(', guest.id, ')');
    
    // Check if share exists
    const { data: existingShare, error: checkError } = await supabase
      .from('account_shares')
      .select('*')
      .eq('owner_user_id', owner.id)
      .eq('guest_email', 'stevedalgetty@gmail.com')
      .maybeSingle();
    
    if (checkError) throw checkError;
    
    if (existingShare) {
      console.log('📝 Updating existing share...');
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
      console.log('✅ Updated existing share:', updatedShare.id);
    } else {
      console.log('📝 Creating new share...');
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
      console.log('✅ Created new share:', newShare.id);
    }
    
    // Verify the share
    const { data: verifyShare, error: verifyError } = await supabase
      .from('account_shares')
      .select(`
        id,
        status,
        role,
        accepted_at,
        owner_user_id,
        guest_user_id
      `)
      .eq('owner_user_id', owner.id)
      .eq('guest_email', 'stevedalgetty@gmail.com')
      .single();
    
    if (verifyError) throw verifyError;
    
    console.log('\n✅ Account share configured successfully!');
    console.log('📊 Share details:');
    console.log('   - ID:', verifyShare.id);
    console.log('   - Status:', verifyShare.status);
    console.log('   - Role:', verifyShare.role);
    console.log('   - Owner:', owner.email, '(', owner.id, ')');
    console.log('   - Guest:', guest.email, '(', guest.id, ')');
    console.log('   - Accepted at:', verifyShare.accepted_at);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.details) console.error('Details:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  }
}

fixAccountShare();








