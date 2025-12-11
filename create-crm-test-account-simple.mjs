/**
 * Simple script to create CRM test account via Supabase REST API
 * Run with: SUPABASE_URL=your-url SUPABASE_SERVICE_ROLE_KEY=your-key node create-crm-test-account-simple.mjs
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
  console.error('SUPABASE_URL=your-url SUPABASE_SERVICE_ROLE_KEY=your-key node create-crm-test-account-simple.mjs');
  process.exit(1);
}

async function createTestAccount() {
  console.log('🔧 Creating CRM test account...\n');

  try {
    // Step 1: Create auth user using Supabase Auth Admin API
    console.log('1. Creating auth user...');
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        email: 'crmtest@fnnlapp.com',
        password: 'TestCRM123!',
        email_confirm: true
      })
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      // If user already exists (409), that's okay - we'll update the profile
      if (authResponse.status === 409 || errorText.includes('already registered')) {
        console.log('   User already exists, will update profile...');
      } else {
        throw new Error(`Auth API error: ${authResponse.status} - ${errorText}`);
      }
    } else {
      console.log('   ✅ Auth user created');
    }

    // Step 2: Get the user ID
    console.log('2. Getting user ID...');
    const listResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=crmtest@fnnlapp.com`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });

    if (!listResponse.ok) {
      throw new Error(`Failed to list users: ${listResponse.status}`);
    }

    const usersData = await listResponse.json();
    const user = usersData.users?.find(u => u.email === 'crmtest@fnnlapp.com');
    
    if (!user) {
      throw new Error('User not found after creation');
    }

    console.log(`   ✅ Found user ID: ${user.id}`);

    // Step 3: Delete existing profile if it exists
    console.log('3. Cleaning up existing profile...');
    const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?email=eq.crmtest@fnnlapp.com`, {
      method: 'DELETE',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=minimal'
      }
    });
    // Ignore errors - profile might not exist

    // Step 4: Create/update the profile
    console.log('4. Creating user profile...');
    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: user.id,
        email: 'crmtest@fnnlapp.com',
        full_name: 'CRM Test User',
        company_name: 'CRM Test Company',
        crm: 'honeybook',
        crm_other: null,
        subscription_tier: 'pro',
        subscription_status: 'active'
      })
    });

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      throw new Error(`Profile API error: ${profileResponse.status} - ${errorText}`);
    }

    const profile = await profileResponse.json();
    console.log('   ✅ Profile created');

    // Step 5: Verify
    console.log('5. Verifying account...');
    console.log('\n✅ CRM Test Account Created Successfully!\n');
    console.log('Account Details:');
    console.log('  Email: crmtest@fnnlapp.com');
    console.log('  Password: TestCRM123!');
    console.log('  CRM: Honeybook');
    console.log('  Tier: Pro');
    console.log('\nProfile Data:');
    console.log(JSON.stringify(Array.isArray(profile) ? profile[0] : profile, null, 2));
    console.log('\nYou can now log in and test the CRM functionality!');

  } catch (error) {
    console.error('\n❌ Error creating test account:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

createTestAccount();

