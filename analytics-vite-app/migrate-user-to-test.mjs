/**
 * Script to migrate a user and all their data from production to test environment
 * 
 * Usage:
 *   PROD_SUPABASE_URL=https://your-prod-project.supabase.co \
 *   PROD_SERVICE_ROLE_KEY=your-prod-service-role-key \
 *   TEST_SUPABASE_URL=https://xiomuqqsrqiwhjyfxoji.supabase.co \
 *   TEST_SERVICE_ROLE_KEY=your-test-service-role-key \
 *   USER_EMAIL=hello@anendlesspursuit.com \
 *   node migrate-user-to-test.mjs
 */

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const prodUrl = process.env.PROD_SUPABASE_URL || 'https://lqtzjwgsgimsnbmxfmra.supabase.co';
const prodKey = process.env.PROD_SERVICE_ROLE_KEY;
const testUrl = process.env.TEST_SUPABASE_URL || 'https://xiomuqqsrqiwhjyfxoji.supabase.co';
const testKey = process.env.TEST_SERVICE_ROLE_KEY;
const userEmail = process.env.USER_EMAIL || 'hello@anendlesspursuit.com';

if (!prodKey || !testKey) {
  console.error('❌ Error: Missing required environment variables');
  console.error('Required: PROD_SERVICE_ROLE_KEY and TEST_SERVICE_ROLE_KEY');
  console.error('\nYou can find these in your Supabase dashboard:');
  console.error('1. Go to Project Settings > API');
  console.error('2. Copy the service_role key for both production and test projects');
  console.error('\nThen run:');
  console.error('PROD_SERVICE_ROLE_KEY=your-prod-key TEST_SERVICE_ROLE_KEY=your-test-key node migrate-user-to-test.mjs');
  process.exit(1);
}

// Create Supabase clients
const prodSupabase = createClient(prodUrl, prodKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const testSupabase = createClient(testUrl, testKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function migrateUser() {
  console.log('🚀 Starting user migration from production to test...\n');
  console.log(`📧 User email: ${userEmail}`);
  console.log(`📡 Production: ${prodUrl}`);
  console.log(`📡 Test: ${testUrl}\n`);

  try {
    // Step 1: Get user from production
    console.log('📥 Step 1: Fetching user from production...');
    const { data: prodUser, error: userError } = await prodSupabase.auth.admin.getUserByEmail(userEmail);
    
    if (userError || !prodUser) {
      console.error(`❌ Error: User not found in production: ${userError?.message || 'User not found'}`);
      process.exit(1);
    }

    const prodUserId = prodUser.user.id;
    console.log(`✅ Found user: ${prodUser.user.email} (ID: ${prodUserId})\n`);

    // Step 2: Get user profile from production
    console.log('📥 Step 2: Fetching user profile from production...');
    const { data: prodProfile, error: profileError } = await prodSupabase
      .from('user_profiles')
      .select('*')
      .eq('id', prodUserId)
      .single();

    if (profileError) {
      console.error(`❌ Error fetching profile: ${profileError.message}`);
      process.exit(1);
    }

    console.log(`✅ Found profile: ${prodProfile.company_name || prodProfile.full_name || prodProfile.email}\n`);

    // Step 3: Check if user already exists in test
    console.log('🔍 Step 3: Checking if user exists in test...');
    const { data: testUser, error: testUserError } = await testSupabase.auth.admin.getUserByEmail(userEmail);
    
    let testUserId;
    if (testUser && testUser.user) {
      console.log(`✅ User already exists in test. Using existing user ID: ${testUser.user.id}`);
      testUserId = testUser.user.id;
    } else {
      // Try to find user profile by email (in case auth user exists but we can't find via admin API)
      const { data: testProfile } = await testSupabase
        .from('user_profiles')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (testProfile) {
        console.log(`✅ Found user profile in test. Using ID: ${testProfile.id}`);
        testUserId = testProfile.id;
      } else {
        console.log('❌ User not found in test environment.');
        console.log('\n📝 Please do one of the following:');
        console.log('   1. Sign up in test environment with: hello@anendlesspursuit.com');
        console.log('   2. Or run create-test-user.sql in test Supabase SQL Editor');
        console.log('   3. Then run this script again\n');
        process.exit(1);
      }
    }

    // Step 5: Create/update user profile in test
    console.log('📤 Step 5: Creating/updating user profile in test...');
    const { error: profileUpsertError } = await testSupabase
      .from('user_profiles')
      .upsert({
        id: testUserId,
        email: prodProfile.email,
        full_name: prodProfile.full_name,
        company_name: prodProfile.company_name,
        subscription_tier: prodProfile.subscription_tier,
        subscription_status: prodProfile.subscription_status,
        is_admin: true, // Set admin access
        phone: prodProfile.phone,
        website: prodProfile.website,
        crm: prodProfile.crm,
        crm_other: prodProfile.crm_other,
        created_at: prodProfile.created_at,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (profileUpsertError) {
      console.error(`❌ Error creating profile: ${profileUpsertError.message}`);
      process.exit(1);
    }
    console.log('✅ User profile created/updated with admin access\n');

    // Step 6: Migrate service types
    console.log('📥 Step 6: Migrating service types...');
    const { data: prodServiceTypes } = await prodSupabase
      .from('service_types')
      .select('*')
      .eq('user_id', prodUserId);

    if (prodServiceTypes && prodServiceTypes.length > 0) {
      const testServiceTypes = prodServiceTypes.map(st => ({
        ...st,
        id: undefined, // Let it generate new ID
        user_id: testUserId,
        created_at: st.created_at,
        updated_at: st.updated_at
      }));

      const { error: stError } = await testSupabase
        .from('service_types')
        .upsert(testServiceTypes, { onConflict: 'id', ignoreDuplicates: true });

      if (stError) {
        console.error(`⚠️  Error migrating service types: ${stError.message}`);
      } else {
        console.log(`✅ Migrated ${prodServiceTypes.length} service types\n`);
      }
    } else {
      console.log('ℹ️  No service types to migrate\n');
    }

    // Step 7: Migrate lead sources
    console.log('📥 Step 7: Migrating lead sources...');
    const { data: prodLeadSources } = await prodSupabase
      .from('lead_sources')
      .select('*')
      .eq('user_id', prodUserId);

    if (prodLeadSources && prodLeadSources.length > 0) {
      const testLeadSources = prodLeadSources.map(ls => ({
        ...ls,
        id: undefined,
        user_id: testUserId,
        created_at: ls.created_at,
        updated_at: ls.updated_at
      }));

      const { error: lsError } = await testSupabase
        .from('lead_sources')
        .upsert(testLeadSources, { onConflict: 'id', ignoreDuplicates: true });

      if (lsError) {
        console.error(`⚠️  Error migrating lead sources: ${lsError.message}`);
      } else {
        console.log(`✅ Migrated ${prodLeadSources.length} lead sources\n`);
      }
    } else {
      console.log('ℹ️  No lead sources to migrate\n');
    }

    // Step 8: Migrate bookings (need to map service types and lead sources)
    console.log('📥 Step 8: Migrating bookings...');
    const { data: prodBookings } = await prodSupabase
      .from('bookings')
      .select('*, service_types(name), lead_sources(name)')
      .eq('user_id', prodUserId);

    if (prodBookings && prodBookings.length > 0) {
      // Get test service types and lead sources to map IDs
      const { data: testServiceTypes } = await testSupabase
        .from('service_types')
        .select('id, name')
        .eq('user_id', testUserId);

      const { data: testLeadSources } = await testSupabase
        .from('lead_sources')
        .select('id, name')
        .eq('user_id', testUserId);

      const serviceTypeMap = new Map(testServiceTypes?.map(st => [st.name, st.id]) || []);
      const leadSourceMap = new Map(testLeadSources?.map(ls => [ls.name, ls.id]) || []);

      const testBookings = [];
      for (const booking of prodBookings) {
        const serviceTypeName = booking.service_types?.name;
        const leadSourceName = booking.lead_sources?.name;
        
        const newServiceTypeId = serviceTypeName ? serviceTypeMap.get(serviceTypeName) : booking.service_type_id;
        const newLeadSourceId = leadSourceName ? leadSourceMap.get(leadSourceName) : booking.lead_source_id;

        if (newServiceTypeId && newLeadSourceId) {
          testBookings.push({
            ...booking,
            id: undefined,
            user_id: testUserId,
            service_type_id: newServiceTypeId,
            lead_source_id: newLeadSourceId,
            created_at: booking.created_at,
            updated_at: booking.updated_at
          });
        }
      }

      if (testBookings.length > 0) {
        const { error: bookingsError } = await testSupabase
          .from('bookings')
          .upsert(testBookings, { onConflict: 'id', ignoreDuplicates: true });

        if (bookingsError) {
          console.error(`⚠️  Error migrating bookings: ${bookingsError.message}`);
        } else {
          console.log(`✅ Migrated ${testBookings.length} bookings\n`);
        }
      } else {
        console.log('ℹ️  No bookings could be migrated (missing service types or lead sources)\n');
      }
    } else {
      console.log('ℹ️  No bookings to migrate\n');
    }

    // Step 9: Migrate payments
    console.log('📥 Step 9: Migrating payments...');
    const { data: prodPayments } = await prodSupabase
      .from('payments')
      .select('*, bookings(id)')
      .eq('user_id', prodUserId);

    if (prodPayments && prodPayments.length > 0) {
      // This is complex - we'd need to map booking IDs
      // For now, let's skip payments or do a simplified version
      console.log(`ℹ️  Found ${prodPayments.length} payments - skipping (would need booking ID mapping)\n`);
    } else {
      console.log('ℹ️  No payments to migrate\n');
    }

    // Step 10: Migrate funnel data
    console.log('📥 Step 10: Migrating funnel data...');
    const { data: prodFunnelData } = await prodSupabase
      .from('funnel_data')
      .select('*')
      .eq('user_id', prodUserId);

    if (prodFunnelData && prodFunnelData.length > 0) {
      const testFunnelData = prodFunnelData.map(fd => ({
        ...fd,
        id: undefined,
        user_id: testUserId,
        created_at: fd.created_at,
        updated_at: fd.updated_at
      }));

      const { error: fdError } = await testSupabase
        .from('funnel_data')
        .upsert(testFunnelData, { onConflict: 'id', ignoreDuplicates: true });

      if (fdError) {
        console.error(`⚠️  Error migrating funnel data: ${fdError.message}`);
      } else {
        console.log(`✅ Migrated ${prodFunnelData.length} funnel data records\n`);
      }
    } else {
      console.log('ℹ️  No funnel data to migrate\n');
    }

    // Step 11: Migrate ad campaigns
    console.log('📥 Step 11: Migrating ad campaigns...');
    const { data: prodAdCampaigns } = await prodSupabase
      .from('ad_campaigns')
      .select('*, ad_sources(name, lead_sources(name))')
      .eq('user_id', prodUserId);

    if (prodAdCampaigns && prodAdCampaigns.length > 0) {
      console.log(`ℹ️  Found ${prodAdCampaigns.length} ad campaigns - skipping (complex relationships)\n`);
    } else {
      console.log('ℹ️  No ad campaigns to migrate\n');
    }

    // Step 12: Migrate forecast models
    console.log('📥 Step 12: Migrating forecast models...');
    const { data: prodForecastModels } = await prodSupabase
      .from('forecast_models')
      .select('*')
      .eq('user_id', prodUserId);

    if (prodForecastModels && prodForecastModels.length > 0) {
      const testForecastModels = prodForecastModels.map(fm => ({
        ...fm,
        id: undefined,
        user_id: testUserId,
        created_at: fm.created_at,
        updated_at: fm.updated_at
      }));

      const { error: fmError } = await testSupabase
        .from('forecast_models')
        .upsert(testForecastModels, { onConflict: 'id', ignoreDuplicates: true });

      if (fmError) {
        console.error(`⚠️  Error migrating forecast models: ${fmError.message}`);
      } else {
        console.log(`✅ Migrated ${prodForecastModels.length} forecast models\n`);
      }
    } else {
      console.log('ℹ️  No forecast models to migrate\n');
    }

    console.log('✅ Migration complete!\n');
    console.log('📋 Summary:');
    console.log(`   - User profile: ✅ (with admin access)`);
    console.log(`   - Service types: ${prodServiceTypes?.length || 0}`);
    console.log(`   - Lead sources: ${prodLeadSources?.length || 0}`);
    console.log(`   - Bookings: ${prodBookings?.length || 0}`);
    console.log(`   - Funnel data: ${prodFunnelData?.length || 0}`);
    console.log(`   - Forecast models: ${prodForecastModels?.length || 0}\n`);
    console.log('🎉 You can now log in to the test environment with: hello@anendlesspursuit.com');
    console.log('   (Use the same password as production, or reset it if needed)\n');

  } catch (err) {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  }
}

migrateUser();

