/**
 * Script to create demo onboarding account via Supabase API
 * Run with: node create-demo-onboarding-account.mjs
 * 
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 * 
 * This account will auto-reset all data (except profile) on each login.
 * Perfect for demonstrating onboarding flows.
 */

import { createClient } from './analytics-vite-app/node_modules/@supabase/supabase-js/dist/module/index.js';

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
  console.error('SUPABASE_URL=your-url SUPABASE_SERVICE_ROLE_KEY=your-key node create-demo-onboarding-account.mjs');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const DEMO_EMAIL = 'demo-onboarding@test.com';
const DEMO_PASSWORD = 'DemoOnboarding2024!'; // Secure password for demo account

async function createDemoAccount() {
  console.log('🔧 Creating demo onboarding account...\n');

  try {
    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      process.exit(1);
    }

    const existingUser = existingUsers?.users?.find(u => u.email === DEMO_EMAIL);
    
    if (existingUser) {
      console.log(`⚠️  User ${DEMO_EMAIL} already exists (ID: ${existingUser.id})`);
      console.log('   Skipping account creation. You can use this account for demos.');
      console.log(`   Password: ${DEMO_PASSWORD}`);
      console.log('\n✅ Demo account is ready to use!');
      console.log('\n📝 Next steps:');
      console.log('   1. Log in with the account');
      console.log('   2. Fill out the Profile page with demo information');
      console.log('   3. The profile will be preserved across resets');
      console.log('   4. All other data will auto-reset on each login');
      return;
    }

    // Create the user
    console.log(`Creating user: ${DEMO_EMAIL}...`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: 'Demo User'
      }
    });

    if (createError) {
      console.error('❌ Error creating user:', createError);
      process.exit(1);
    }

    console.log('✅ User created successfully!');
    console.log(`   User ID: ${newUser.user.id}`);

    // Check if profile exists, create if not
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', newUser.user.id)
      .maybeSingle();

    if (!existingProfile) {
      console.log('Creating user profile...');
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: newUser.user.id,
          email: DEMO_EMAIL,
          full_name: 'Demo User',
          first_name: 'Demo',
          last_name: 'User',
          company_name: 'Demo Company',
          subscription_tier: 'pro',
          subscription_status: 'active'
        });

      if (profileError) {
        console.error('⚠️  Warning: Could not create profile:', profileError.message);
        console.log('   Profile will be created automatically on first login');
      } else {
        console.log('✅ Profile created successfully!');
      }
    }

    console.log('\n✅ Demo onboarding account created successfully!');
    console.log('\n📋 Account Details:');
    console.log(`   Email: ${DEMO_EMAIL}`);
    console.log(`   Password: ${DEMO_PASSWORD}`);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\n📝 Next steps:');
    console.log('   1. Log in with the account');
    console.log('   2. Fill out the Profile page with demo information');
    console.log('   3. The profile will be preserved across resets');
    console.log('   4. All other data will auto-reset on each login');
    console.log('\n💡 Usage:');
    console.log('   - Log in to start a fresh demo');
    console.log('   - All data (except profile) resets automatically');
    console.log('   - Perfect for onboarding demonstrations!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

createDemoAccount();

