/**
 * Script to create demo onboarding account via Supabase REST API
 * Run with: node create-demo-onboarding-account-api.mjs
 * 
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 * 
 * This account will auto-reset all data (except profile) on each login.
 * Perfect for demonstrating onboarding flows.
 */

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
  console.error('SUPABASE_URL=your-url SUPABASE_SERVICE_ROLE_KEY=your-key node create-demo-onboarding-account-api.mjs');
  process.exit(1);
}

const DEMO_EMAIL = 'demo-onboarding@test.com';
const DEMO_PASSWORD = 'DemoOnboarding2024!'; // Secure password for demo account

async function createDemoAccount() {
  console.log('🔧 Creating demo onboarding account...\n');
  console.log(`📡 Connecting to: ${supabaseUrl}\n`);

  try {
    // Check if user already exists
    const listResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey
      }
    });

    if (!listResponse.ok) {
      const error = await listResponse.text();
      console.error('❌ Error listing users:', error);
      process.exit(1);
    }

    const usersData = await listResponse.json();
    const existingUser = usersData?.users?.find(u => u.email === DEMO_EMAIL);
    
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
    const createResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: 'Demo User'
        }
      })
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error('❌ Error creating user:', error);
      process.exit(1);
    }

    const newUserData = await createResponse.json();
    const userId = newUserData.user?.id;

    if (!userId) {
      console.error('❌ Error: User created but no ID returned');
      process.exit(1);
    }

    console.log('✅ User created successfully!');
    console.log(`   User ID: ${userId}`);

    // Check if profile exists, create if not
    const profileCheckResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}&select=id`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Prefer': 'return=representation'
      }
    });

    let profileExists = false;
    if (profileCheckResponse.ok) {
      const profileData = await profileCheckResponse.json();
      profileExists = profileData && profileData.length > 0;
    }

    if (!profileExists) {
      console.log('Creating user profile...');
      const profileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          id: userId,
          email: DEMO_EMAIL,
          full_name: 'Demo User',
          first_name: 'Demo',
          last_name: 'User',
          company_name: 'Demo Company',
          subscription_tier: 'pro',
          subscription_status: 'active'
        })
      });

      if (!profileResponse.ok) {
        const error = await profileResponse.text();
        console.error('⚠️  Warning: Could not create profile:', error);
        console.log('   Profile will be created automatically on first login');
      } else {
        console.log('✅ Profile created successfully!');
      }
    } else {
      console.log('✅ Profile already exists');
    }

    console.log('\n✅ Demo onboarding account created successfully!');
    console.log('\n📋 Account Details:');
    console.log(`   Email: ${DEMO_EMAIL}`);
    console.log(`   Password: ${DEMO_PASSWORD}`);
    console.log('\n📝 Next steps:');
    console.log('   1. Log in with the account on the TEST environment');
    console.log('   2. Fill out the Profile page with demo information');
    console.log('   3. The profile will be preserved across resets');
    console.log('   4. All other data will auto-reset on each login');
    console.log('\n💡 Usage:');
    console.log('   - Log in to start a fresh demo');
    console.log('   - All data (except profile) resets automatically');
    console.log('   - Perfect for onboarding demonstrations!');
    console.log('\n⚠️  IMPORTANT: This account only works in TEST environment!');
    console.log('   Production is protected - reset will NOT run in production.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

createDemoAccount();

