/**
 * Simple script to wipe all data for CRM test account
 * Run with: SUPABASE_URL=your-url SUPABASE_SERVICE_ROLE_KEY=your-key node wipe-crm-test-account-data-simple.mjs
 */

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing required environment variables');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function wipeTestAccountData() {
  console.log('🧹 Wiping test account data...\n');

  try {
    // Step 1: Get user ID
    console.log('1. Getting user ID...');
    const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=crmtest@fnnlapp.com`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });

    if (!userRes.ok) {
      throw new Error(`Failed to get user: ${userRes.status}`);
    }

    const usersData = await userRes.json();
    const user = usersData.users?.find(u => u.email === 'crmtest@fnnlapp.com');
    
    if (!user) {
      console.log('❌ Test user not found');
      return;
    }

    const userId = user.id;
    console.log(`   ✅ Found user ID: ${userId}`);

    // Step 2: Delete payments (they reference bookings)
    console.log('2. Deleting payments...');
    const paymentsRes = await fetch(`${supabaseUrl}/rest/v1/payments?booking_id=in.(SELECT id FROM bookings WHERE user_id=eq.${userId})`, {
      method: 'DELETE',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=minimal'
      }
    });
    console.log(`   ${paymentsRes.ok ? '✅' : '⚠️'} Payments deleted`);

    // Step 3: Delete bookings
    console.log('3. Deleting bookings...');
    const bookingsRes = await fetch(`${supabaseUrl}/rest/v1/bookings?user_id=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=minimal'
      }
    });
    console.log(`   ${bookingsRes.ok ? '✅' : '⚠️'} Bookings deleted`);

    // Step 4: Delete funnel data
    console.log('4. Deleting funnel data...');
    const funnelsRes = await fetch(`${supabaseUrl}/rest/v1/funnels?user_id=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=minimal'
      }
    });
    console.log(`   ${funnelsRes.ok ? '✅' : '⚠️'} Funnel data deleted`);

    // Step 5: Delete ad campaigns
    console.log('5. Deleting ad campaigns...');
    const adCampaignsRes = await fetch(`${supabaseUrl}/rest/v1/ad_campaigns?user_id=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=minimal'
      }
    });
    console.log(`   ${adCampaignsRes.ok ? '✅' : '⚠️'} Ad campaigns deleted`);

    // Step 6: Delete forecast models
    console.log('6. Deleting forecast models...');
    const forecastRes = await fetch(`${supabaseUrl}/rest/v1/forecast_models?user_id=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=minimal'
      }
    });
    console.log(`   ${forecastRes.ok ? '✅' : '⚠️'} Forecast models deleted`);

    // Step 7: Delete service types
    console.log('7. Deleting service types...');
    const serviceTypesRes = await fetch(`${supabaseUrl}/rest/v1/service_types?user_id=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=minimal'
      }
    });
    console.log(`   ${serviceTypesRes.ok ? '✅' : '⚠️'} Service types deleted`);

    // Step 8: Delete lead sources
    console.log('8. Deleting lead sources...');
    const leadSourcesRes = await fetch(`${supabaseUrl}/rest/v1/lead_sources?user_id=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=minimal'
      }
    });
    console.log(`   ${leadSourcesRes.ok ? '✅' : '⚠️'} Lead sources deleted`);

    // Step 9: Delete account shares
    console.log('9. Deleting account shares...');
    const sharesRes1 = await fetch(`${supabaseUrl}/rest/v1/account_shares?owner_id=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=minimal'
      }
    });
    const sharesRes2 = await fetch(`${supabaseUrl}/rest/v1/account_shares?guest_id=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=minimal'
      }
    });
    console.log(`   ${sharesRes1.ok && sharesRes2.ok ? '✅' : '⚠️'} Account shares deleted`);

    console.log('\n✅ Test account data wiped successfully!');
    console.log('\nThe account is now clean and ready for retesting.');

  } catch (error) {
    console.error('\n❌ Error wiping test account data:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

wipeTestAccountData();

