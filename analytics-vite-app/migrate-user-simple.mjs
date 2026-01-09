/**
 * Simplified migration script that uses REST API
 * This approach doesn't require service role keys if we create the user first
 */

import { createClient } from '@supabase/supabase-js';

const prodUrl = 'https://lqtzjwgsgimsnbmxfmra.supabase.co';
const prodAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxdHpqd2dzZ2ltc25ibXhmbXJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODMwNTgsImV4cCI6MjA3MTM1OTA1OH0.qsbEUVXYbuw4oefZu7nBMUXFqWtMbaOCtn9yytRem3U';

const testUrl = 'https://xiomuqqsrqiwhjyfxoji.supabase.co';
const testAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpb211cXFzcnFpd2hqeWZ4b2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODUwNDIsImV4cCI6MjA4MTU2MTA0Mn0.NqcIMi9ItZQIZ_Ku0r00z2k1FjxO5bfpX2fzPmd5GMI';

const userEmail = 'hello@anendlesspursuit.com';

const prodSupabase = createClient(prodUrl, prodAnonKey);
const testSupabase = createClient(testUrl, testAnonKey);

async function migrateData() {
  console.log('🚀 Starting data migration...\n');
  console.log('⚠️  Note: This script copies data only.');
  console.log('   Make sure you\'ve signed up in test environment first!\n');

  // Get user profile from test to get the user ID
  console.log('🔍 Step 1: Finding user in test environment...');
  let { data: testProfile, error: testProfileError } = await testSupabase
    .from('user_profiles')
    .select('id, email')
    .eq('email', userEmail)
    .single();

  let testUserId;

  if (testProfileError || !testProfile) {
    // User might exist in auth but not have a profile yet
    // Try to get user from auth and create profile
    console.log('⚠️  User profile not found. Checking auth users...');
    
    // We can't directly query auth.users with anon key, so we'll need to create the profile
    // The user needs to log in first to trigger profile creation, or we can create it manually
    console.log('📝 User exists in auth but profile is missing.');
    console.log('   Please log in to test environment once to create the profile.');
    console.log('   Then run this script again.\n');
    process.exit(1);
  }

  testUserId = testProfile.id;
  console.log(`✅ Found user in test: ${testProfile.email} (ID: ${testUserId})\n`);

  // Get production user ID (we'll use email to find data)
  console.log('📥 Step 2: Fetching data from production...');
  
  // Get production user profile
  const { data: prodProfile } = await prodSupabase
    .from('user_profiles')
    .select('*')
    .eq('email', userEmail)
    .single();

  if (!prodProfile) {
    console.error('❌ User not found in production');
    process.exit(1);
  }

  const prodUserId = prodProfile.id;
  console.log(`✅ Found production user: ${prodProfile.email} (ID: ${prodUserId})\n`);

  // Update test profile with production data and set admin
  console.log('📤 Step 3: Updating user profile in test...');
  const { error: profileError } = await testSupabase
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

  if (profileError) {
    console.error(`❌ Error updating profile: ${profileError.message}`);
    process.exit(1);
  }
  console.log('✅ User profile updated with admin access\n');

  // Copy service types
  console.log('📥 Step 4: Copying service types...');
  const { data: prodServiceTypes } = await prodSupabase
    .from('service_types')
    .select('*')
    .eq('user_id', prodUserId);

  if (prodServiceTypes && prodServiceTypes.length > 0) {
    const testServiceTypes = prodServiceTypes.map(st => ({
      user_id: testUserId,
      name: st.name,
      description: st.description,
    }));

    // Delete existing and insert new
    await testSupabase.from('service_types').delete().eq('user_id', testUserId);
    
    const { error: stError } = await testSupabase
      .from('service_types')
      .insert(testServiceTypes);

    if (stError) {
      console.error(`⚠️  Error: ${stError.message}`);
    } else {
      console.log(`✅ Copied ${prodServiceTypes.length} service types\n`);
    }
  } else {
    console.log('ℹ️  No service types to copy\n');
  }

  // Copy lead sources
  console.log('📥 Step 5: Copying lead sources...');
  const { data: prodLeadSources } = await prodSupabase
    .from('lead_sources')
    .select('*')
    .eq('user_id', prodUserId);

  if (prodLeadSources && prodLeadSources.length > 0) {
    const testLeadSources = prodLeadSources.map(ls => ({
      user_id: testUserId,
      name: ls.name,
      description: ls.description,
    }));

    await testSupabase.from('lead_sources').delete().eq('user_id', testUserId);
    
    const { error: lsError } = await testSupabase
      .from('lead_sources')
      .insert(testLeadSources);

    if (lsError) {
      console.error(`⚠️  Error: ${lsError.message}`);
    } else {
      console.log(`✅ Copied ${prodLeadSources.length} lead sources\n`);
    }
  } else {
    console.log('ℹ️  No lead sources to copy\n');
  }

  // Copy funnel data
  console.log('📥 Step 6: Copying funnel data...');
  const { data: prodFunnelData } = await prodSupabase
    .from('funnel_data')
    .select('*')
    .eq('user_id', prodUserId);

  if (prodFunnelData && prodFunnelData.length > 0) {
    const testFunnelData = prodFunnelData.map(fd => ({
      user_id: testUserId,
      month_year: fd.month_year,
      inquiries: fd.inquiries,
      calls_taken: fd.calls_taken,
      calls_booked: fd.calls_booked,
      closes: fd.closes,
      bookings: fd.bookings,
      notes: fd.notes,
    }));

    await testSupabase.from('funnel_data').delete().eq('user_id', testUserId);
    
    const { error: fdError } = await testSupabase
      .from('funnel_data')
      .insert(testFunnelData);

    if (fdError) {
      console.error(`⚠️  Error: ${fdError.message}`);
    } else {
      console.log(`✅ Copied ${prodFunnelData.length} funnel data records\n`);
    }
  } else {
    console.log('ℹ️  No funnel data to copy\n');
  }

  console.log('✅ Migration complete!\n');
  console.log('🎉 You can now log in to test environment with admin access!\n');
}

migrateData().catch(err => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});

