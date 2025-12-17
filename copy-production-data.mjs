/**
 * Script to copy production data to test environment
 * Uses service role keys to bypass RLS
 * 
 * Usage:
 *   PROD_SERVICE_ROLE_KEY=your-prod-service-role-key \
 *   TEST_SERVICE_ROLE_KEY=your-test-service-role-key \
 *   node copy-production-data.mjs
 */

import { createClient } from '@supabase/supabase-js';

const prodUrl = 'https://lqtzjwgsgimsnbmxfmra.supabase.co';
const testUrl = 'https://xiomuqqsrqiwhjyfxoji.supabase.co';
const userEmail = 'hello@anendlesspursuit.com';

const prodKey = process.env.PROD_SERVICE_ROLE_KEY;
const testKey = process.env.TEST_SERVICE_ROLE_KEY;

if (!prodKey || !testKey) {
  console.error('❌ Error: Missing service role keys');
  console.error('Required: PROD_SERVICE_ROLE_KEY and TEST_SERVICE_ROLE_KEY');
  console.error('\nYou can find these in Supabase dashboard:');
  console.error('Settings > API > service_role key (secret)\n');
  process.exit(1);
}

const prodSupabase = createClient(prodUrl, prodKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const testSupabase = createClient(testUrl, testKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function copyData() {
  console.log('🚀 Copying production data to test environment...\n');

  // Get production user
  console.log('📥 Step 1: Getting production user...');
  const { data: prodUser } = await prodSupabase.auth.admin.getUserByEmail(userEmail);
  if (!prodUser?.user) {
    console.error('❌ User not found in production');
    process.exit(1);
  }
  const prodUserId = prodUser.user.id;
  console.log(`✅ Found production user: ${prodUser.user.email} (${prodUserId})\n`);

  // Get test user
  console.log('📥 Step 2: Getting test user...');
  const { data: testUser } = await testSupabase.auth.admin.getUserByEmail(userEmail);
  if (!testUser?.user) {
    console.error('❌ User not found in test');
    process.exit(1);
  }
  const testUserId = testUser.user.id;
  console.log(`✅ Found test user: ${testUser.user.email} (${testUserId})\n`);

  // Update test profile with production data
  console.log('📤 Step 3: Updating user profile...');
  const { data: prodProfile } = await prodSupabase
    .from('user_profiles')
    .select('*')
    .eq('id', prodUserId)
    .single();

  if (prodProfile) {
    await testSupabase
      .from('user_profiles')
      .update({
        full_name: prodProfile.full_name,
        company_name: prodProfile.company_name,
        subscription_tier: prodProfile.subscription_tier,
        subscription_status: prodProfile.subscription_status,
        is_admin: true,
        phone: prodProfile.phone,
        website: prodProfile.website,
        crm: prodProfile.crm,
        crm_other: prodProfile.crm_other,
      })
      .eq('id', testUserId);
    console.log('✅ Profile updated\n');
  }

  // Copy service types
  console.log('📥 Step 4: Copying service types...');
  const { data: prodServiceTypes } = await prodSupabase
    .from('service_types')
    .select('*')
    .eq('user_id', prodUserId);

  if (prodServiceTypes?.length > 0) {
    await testSupabase.from('service_types').delete().eq('user_id', testUserId);
    const testServiceTypes = prodServiceTypes.map(st => ({
      user_id: testUserId,
      name: st.name,
      description: st.description,
      tracks_in_funnel: st.tracks_in_funnel,
    }));
    await testSupabase.from('service_types').insert(testServiceTypes);
    console.log(`✅ Copied ${prodServiceTypes.length} service types\n`);
  }

  // Copy lead sources
  console.log('📥 Step 5: Copying lead sources...');
  const { data: prodLeadSources } = await prodSupabase
    .from('lead_sources')
    .select('*')
    .eq('user_id', prodUserId);

  if (prodLeadSources?.length > 0) {
    await testSupabase.from('lead_sources').delete().eq('user_id', testUserId);
    const testLeadSources = prodLeadSources.map(ls => ({
      user_id: testUserId,
      name: ls.name,
      description: ls.description,
    }));
    await testSupabase.from('lead_sources').insert(testLeadSources);
    console.log(`✅ Copied ${prodLeadSources.length} lead sources\n`);
  }

  // Copy funnel data
  console.log('📥 Step 6: Copying funnel data...');
  const { data: prodFunnelData } = await prodSupabase
    .from('funnel_data')
    .select('*')
    .eq('user_id', prodUserId);

  if (prodFunnelData?.length > 0) {
    await testSupabase.from('funnel_data').delete().eq('user_id', testUserId);
    const testFunnelData = prodFunnelData.map(fd => ({
      user_id: testUserId,
      month_year: fd.month_year,
      year: fd.year,
      month: fd.month,
      inquiries: fd.inquiries,
      calls_taken: fd.calls_taken,
      calls_booked: fd.calls_booked,
      closes: fd.closes,
      bookings: fd.bookings,
      notes: fd.notes,
    }));
    await testSupabase.from('funnel_data').insert(testFunnelData);
    console.log(`✅ Copied ${prodFunnelData.length} funnel data records\n`);
  }

  // Copy bookings (need to map service types and lead sources)
  console.log('📥 Step 7: Copying bookings...');
  const { data: prodBookings } = await prodSupabase
    .from('bookings')
    .select('*, service_types(name), lead_sources(name)')
    .eq('user_id', prodUserId);

  if (prodBookings?.length > 0) {
    // Get test service types and lead sources for mapping
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

    await testSupabase.from('bookings').delete().eq('user_id', testUserId);

    const testBookings = [];
    for (const booking of prodBookings) {
      const serviceTypeName = booking.service_types?.name;
      const leadSourceName = booking.lead_sources?.name;
      
      const newServiceTypeId = serviceTypeName ? serviceTypeMap.get(serviceTypeName) : null;
      const newLeadSourceId = leadSourceName ? leadSourceMap.get(leadSourceName) : null;

      if (newServiceTypeId && newLeadSourceId) {
        testBookings.push({
          user_id: testUserId,
          client_name: booking.client_name,
          client_email: booking.client_email,
          client_phone: booking.client_phone,
          service_type_id: newServiceTypeId,
          lead_source_id: newLeadSourceId,
          booking_date: booking.booking_date,
          date_inquired: booking.date_inquired,
          date_booked: booking.date_booked,
          project_date: booking.project_date,
          booked_revenue: booking.booked_revenue,
          status: booking.status,
          notes: booking.notes,
        });
      }
    }

    if (testBookings.length > 0) {
      await testSupabase.from('bookings').insert(testBookings);
      console.log(`✅ Copied ${testBookings.length} bookings\n`);
    } else {
      console.log('⚠️  No bookings could be migrated (missing service types or lead sources)\n');
    }
  }

  // Copy forecast models
  console.log('📥 Step 8: Copying forecast models...');
  const { data: prodForecastModels } = await prodSupabase
    .from('forecast_models')
    .select('*')
    .eq('user_id', prodUserId);

  if (prodForecastModels?.length > 0) {
    await testSupabase.from('forecast_models').delete().eq('user_id', testUserId);
    const testForecastModels = prodForecastModels.map(fm => ({
      user_id: testUserId,
      name: fm.name,
      year: fm.year,
      is_active: fm.is_active,
      goals: fm.goals,
    }));
    await testSupabase.from('forecast_models').insert(testForecastModels);
    console.log(`✅ Copied ${prodForecastModels.length} forecast models\n`);
  }

  console.log('✅ Migration complete!\n');
  console.log('📋 Summary:');
  console.log(`   - User profile: ✅ (with admin access)`);
  console.log(`   - Service types: ${prodServiceTypes?.length || 0}`);
  console.log(`   - Lead sources: ${prodLeadSources?.length || 0}`);
  console.log(`   - Bookings: ${prodBookings?.length || 0}`);
  console.log(`   - Funnel data: ${prodFunnelData?.length || 0}`);
  console.log(`   - Forecast models: ${prodForecastModels?.length || 0}\n`);
}

copyData().catch(err => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});

