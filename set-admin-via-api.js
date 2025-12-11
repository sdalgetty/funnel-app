/**
 * Script to set admin account via Supabase API
 * Run with: node set-admin-via-api.js
 * 
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing required environment variables');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nYou can find these in your Supabase dashboard:');
  console.error('1. Go to Project Settings > API');
  console.error('2. Copy the Project URL (SUPABASE_URL)');
  console.error('3. Copy the service_role key (SUPABASE_SERVICE_ROLE_KEY)');
  console.error('\nThen run:');
  console.error('SUPABASE_URL=your-url SUPABASE_SERVICE_ROLE_KEY=your-key node set-admin-via-api.js');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setAdminAccount() {
  console.log('🔧 Setting up admin account...\n');

  try {
    // Update user profile to set is_admin = true
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .update({ is_admin: true })
      .eq('email', 'hello@anendlesspursuit.com')
      .select();

    if (profileError) {
      console.error('❌ Error updating user profile:', profileError);
      return;
    }

    if (!profileData || profileData.length === 0) {
      console.error('❌ No user found with email: hello@anendlesspursuit.com');
      console.error('Please verify the email address is correct.');
      return;
    }

    console.log('✅ Successfully set admin account!');
    console.log('\nAdmin account details:');
    console.log('  Email:', profileData[0].email);
    console.log('  Name:', profileData[0].full_name || 'N/A');
    console.log('  Company:', profileData[0].company_name || 'N/A');
    console.log('  Admin:', profileData[0].is_admin);
    console.log('\n🎉 Setup complete! You can now access the admin dashboard.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setAdminAccount();




