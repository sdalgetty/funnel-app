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

  // Get production user profile (which contains the user ID)
  console.log('📥 Step 1: Getting production user...');
  const { data: prodProfile, error: prodProfileError } = await prodSupabase
    .from('user_profiles')
    .select('id, email')
    .eq('email', userEmail)
    .single();

  if (prodProfileError || !prodProfile) {
    console.error('❌ User not found in production:', prodProfileError?.message);
    process.exit(1);
  }
  const prodUserId = prodProfile.id;
  console.log(`✅ Found production user: ${prodProfile.email} (${prodUserId})\n`);

  // Get test user profile
  console.log('📥 Step 2: Getting test user...');
  const { data: testProfile, error: testProfileError } = await testSupabase
    .from('user_profiles')
    .select('id, email')
    .eq('email', userEmail)
    .single();

  if (testProfileError || !testProfile) {
    console.error('❌ User not found in test:', testProfileError?.message);
    process.exit(1);
  }
  const testUserId = testProfile.id;
  console.log(`✅ Found test user: ${testProfile.email} (${testUserId})\n`);

  // Update test profile with production data
  console.log('📤 Step 3: Updating user profile...');
  const { data: prodProfileData } = await prodSupabase
    .from('user_profiles')
    .select('*')
    .eq('id', prodUserId)
    .single();

  if (prodProfileData) {
    await testSupabase
      .from('user_profiles')
      .update({
        full_name: prodProfileData.full_name,
        company_name: prodProfileData.company_name,
        subscription_tier: prodProfileData.subscription_tier,
        subscription_status: prodProfileData.subscription_status,
        is_admin: true,
        phone: prodProfileData.phone,
        website: prodProfileData.website,
        crm: prodProfileData.crm,
        crm_other: prodProfileData.crm_other,
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
    const { error: deleteError } = await testSupabase.from('service_types').delete().eq('user_id', testUserId);
    if (deleteError) console.error(`⚠️  Error deleting service types: ${deleteError.message}`);
    
    const testServiceTypes = prodServiceTypes.map(st => ({
      user_id: testUserId,
      name: st.name,
      description: st.description,
      tracks_in_funnel: st.tracks_in_funnel,
    }));
    const { data: inserted, error: insertError } = await testSupabase.from('service_types').insert(testServiceTypes).select();
    if (insertError) {
      console.error(`❌ Error inserting service types: ${insertError.message}`);
    } else {
      console.log(`✅ Copied ${inserted?.length || prodServiceTypes.length} service types\n`);
    }
  }

  // Copy lead sources
  console.log('📥 Step 5: Copying lead sources...');
  const { data: prodLeadSources } = await prodSupabase
    .from('lead_sources')
    .select('*')
    .eq('user_id', prodUserId);

  if (prodLeadSources?.length > 0) {
    const { error: deleteError } = await testSupabase.from('lead_sources').delete().eq('user_id', testUserId);
    if (deleteError) console.error(`⚠️  Error deleting lead sources: ${deleteError.message}`);
    
    const testLeadSources = prodLeadSources.map(ls => ({
      user_id: testUserId,
      name: ls.name,
      description: ls.description,
    }));
    const { data: inserted, error: insertError } = await testSupabase.from('lead_sources').insert(testLeadSources).select();
    if (insertError) {
      console.error(`❌ Error inserting lead sources: ${insertError.message}`);
    } else {
      console.log(`✅ Copied ${inserted?.length || prodLeadSources.length} lead sources\n`);
    }
  }

  // Copy funnel data (stored in funnels table)
  console.log('📥 Step 6: Copying funnel data...');
  const { data: prodFunnels } = await prodSupabase
    .from('funnels')
    .select('*')
    .eq('user_id', prodUserId)
    .not('year', 'is', null) // Only get monthly data (year is not null)
    .not('month', 'is', null); // Only get monthly data (month is not null)

  if (prodFunnels?.length > 0) {
    const { error: deleteError } = await testSupabase
      .from('funnels')
      .delete()
      .eq('user_id', testUserId)
      .not('year', 'is', null)
      .not('month', 'is', null);
    
    if (deleteError) {
      console.error(`⚠️  Error deleting old funnel data: ${deleteError.message}`);
    }
    
    const testFunnels = prodFunnels.map(f => ({
      user_id: testUserId,
      name: f.name,
      year: f.year,
      month: f.month,
      inquiries: f.inquiries || 0,
      calls_taken: f.calls_taken || 0,
      calls_booked: f.calls_booked || 0,
      closes: f.closes || 0,
      bookings: f.bookings || 0,
      cash: f.cash || 0,
      notes: f.notes,
      bookings_goal: f.bookings_goal,
      inquiry_to_call: f.inquiry_to_call,
      call_to_booking: f.call_to_booking,
      inquiries_ytd: f.inquiries_ytd,
      calls_ytd: f.calls_ytd,
      bookings_ytd: f.bookings_ytd,
      last_updated: f.last_updated || new Date().toISOString(),
      created_at: f.created_at || new Date().toISOString(),
      updated_at: f.updated_at || new Date().toISOString(),
    }));
    
    const { data: insertedFunnels, error: insertError } = await testSupabase
      .from('funnels')
      .insert(testFunnels)
      .select();
    
    if (insertError) {
      console.error(`❌ Error inserting funnel data: ${insertError.message}`);
      console.error(`   Details: ${JSON.stringify(insertError, null, 2)}`);
    } else {
      console.log(`✅ Copied ${insertedFunnels?.length || prodFunnels.length} funnel data records\n`);
    }
  } else {
    console.log('ℹ️  No funnel data found (or all records have null year/month)\n');
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
          project_date: booking.project_date,
          booked_revenue: booking.booked_revenue || 0,
          status: booking.status || 'confirmed',
          notes: booking.notes,
        });
      }
    }

    if (testBookings.length > 0) {
      const { error: deleteError } = await testSupabase.from('bookings').delete().eq('user_id', testUserId);
      if (deleteError) console.error(`⚠️  Error deleting bookings: ${deleteError.message}`);
      
      const { data: inserted, error: insertError } = await testSupabase.from('bookings').insert(testBookings).select();
      if (insertError) {
        console.error(`❌ Error inserting bookings: ${insertError.message}`);
        console.error(`   Details: ${JSON.stringify(insertError, null, 2)}`);
      } else {
        console.log(`✅ Copied ${inserted?.length || testBookings.length} bookings\n`);
      }
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
    const { error: deleteError } = await testSupabase.from('forecast_models').delete().eq('user_id', testUserId);
    if (deleteError) console.error(`⚠️  Error deleting forecast models: ${deleteError.message}`);
    
    const testForecastModels = prodForecastModels.map(fm => ({
      user_id: testUserId,
      name: fm.name,
      description: fm.description,
      model_type: fm.model_type || 'linear',
      parameters: fm.parameters,
      is_active: fm.is_active || false,
    }));
    const { data: inserted, error: insertError } = await testSupabase.from('forecast_models').insert(testForecastModels).select();
    if (insertError) {
      console.error(`❌ Error inserting forecast models: ${insertError.message}`);
    } else {
      console.log(`✅ Copied ${inserted?.length || prodForecastModels.length} forecast models\n`);
    }
  }

  console.log('✅ Migration complete!\n');
  console.log('📋 Summary:');
  console.log(`   - User profile: ✅ (with admin access)`);
  console.log(`   - Service types: ${prodServiceTypes?.length || 0}`);
  console.log(`   - Lead sources: ${prodLeadSources?.length || 0}`);
  console.log(`   - Bookings: ${prodBookings?.length || 0}`);
    console.log(`   - Funnel data: ${prodFunnels?.length || 0}`);
  console.log(`   - Forecast models: ${prodForecastModels?.length || 0}\n`);
}

copyData().catch(err => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});

