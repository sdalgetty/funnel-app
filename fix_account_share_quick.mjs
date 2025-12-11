// Quick script to fix account share - uses Supabase client
import { createClient } from '@supabase/supabase-js';

// Get credentials from environment or use defaults
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://lqtzjwgsgimsnbmxfmra.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Error: Need SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY');
  console.error('Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.error('You can find it in Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  try {
    console.log('🔍 Finding users...');
    
    // Use admin API if service role key, otherwise try direct query
    let owner, guest;
    
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Use admin API
      const { data: users, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;
      owner = users.users.find(u => u.email === 'hello@anendlesspursuit.com');
      guest = users.users.find(u => u.email === 'stevedalgetty@gmail.com');
    } else {
      // Try to query via RPC or direct SQL (may not work without service role)
      console.log('⚠️  Using anon key - may have limited access');
      // We'll need to use a different approach
      throw new Error('Service role key required for this operation');
    }
    
    if (!owner) throw new Error('Owner (hello@anendlesspursuit.com) not found');
    if (!guest) throw new Error('Guest (stevedalgetty@gmail.com) not found');
    
    console.log('✅ Owner:', owner.email, owner.id);
    console.log('✅ Guest:', guest.email, guest.id);
    
    // Check existing share
    const { data: existing } = await supabase
      .from('account_shares')
      .select('*')
      .eq('owner_user_id', owner.id)
      .eq('guest_email', 'stevedalgetty@gmail.com')
      .maybeSingle();
    
    const shareData = {
      owner_user_id: owner.id,
      guest_user_id: guest.id,
      guest_email: 'stevedalgetty@gmail.com',
      invitation_token: crypto.randomUUID(),
      status: 'accepted',
      role: 'viewer',
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    let result;
    if (existing) {
      console.log('📝 Updating existing share...');
      const { data, error } = await supabase
        .from('account_shares')
        .update({
          guest_user_id: guest.id,
          status: 'accepted',
          role: 'viewer',
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      console.log('📝 Creating new share...');
      const { data, error } = await supabase
        .from('account_shares')
        .insert(shareData)
        .select()
        .single();
      if (error) throw error;
      result = data;
    }
    
    console.log('\n✅ Success! Account share configured:');
    console.log('   Share ID:', result.id);
    console.log('   Status:', result.status);
    console.log('   Role:', result.role);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  }
}

main();




