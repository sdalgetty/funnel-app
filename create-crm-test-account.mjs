/**
 * Script to create CRM test account via Supabase API
 * Run with: node create-crm-test-account.mjs
 * 
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 */

import { createClient } from './analytics-vite-app/node_modules/@supabase/supabase-js/dist/module/index.js';
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
  console.error('SUPABASE_URL=your-url SUPABASE_SERVICE_ROLE_KEY=your-key node create-crm-test-account.mjs');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestAccount() {
  console.log('🔧 Creating CRM test account...\n');

  try {
    // Read the SQL file
    const sqlPath = join(__dirname, 'create-crm-test-account.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    
    // Split SQL into individual statements (simple approach)
    // We'll execute the key parts via the Supabase client
    
    // Step 1: Delete existing account if it exists
    console.log('1. Cleaning up existing test account...');
    const { error: deleteProfileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('email', 'crmtest@fnnlapp.com');
    
    // Note: We can't delete from auth.users via the client, but that's okay
    // The profile deletion is the important part
    
    // Step 2: Create auth user (we'll need to use RPC or direct SQL for this)
    // Since we can't create auth.users directly via the client, we'll use a workaround
    // by creating the profile first and letting Supabase handle the auth user creation
    // OR we can use the Supabase Management API
    
    // Actually, let's use the REST API to execute raw SQL
    console.log('2. Creating auth user and profile...');
    
    // Execute the SQL via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({ sql: sql })
    }).catch(async () => {
      // If RPC doesn't exist, try executing via direct database connection
      // We'll need to break down the SQL into parts we can execute
      console.log('   Using alternative method...');
      
      // For now, let's try creating via the Supabase Auth Admin API
      // First, try to sign up the user (this will create the auth user)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'crmtest@fnnlapp.com',
        password: 'TestCRM123!',
        email_confirm: true
      });
      
      if (authError) {
        // User might already exist, try to get it
        console.log('   User might already exist, checking...');
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === 'crmtest@fnnlapp.com');
        
        if (existingUser) {
          // Update the profile
          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({
              id: existingUser.id,
              email: 'crmtest@fnnlapp.com',
              full_name: 'CRM Test User',
              company_name: 'CRM Test Company',
              crm: 'honeybook',
              crm_other: null,
              subscription_tier: 'pro',
              subscription_status: 'active'
            }, {
              onConflict: 'id'
            });
          
          if (profileError) {
            throw profileError;
          }
          
          console.log('✅ Test account updated successfully!');
        } else {
          throw authError;
        }
      } else if (authData?.user) {
        // Create the profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            email: 'crmtest@fnnlapp.com',
            full_name: 'CRM Test User',
            company_name: 'CRM Test Company',
            crm: 'honeybook',
            crm_other: null,
            subscription_tier: 'pro',
            subscription_status: 'active'
          });
        
        if (profileError) {
          throw profileError;
        }
        
        console.log('✅ Test account created successfully!');
      }
      
      return { ok: true };
    });

    if (!response?.ok && response?.status !== 200) {
      // If the RPC method failed, the catch block above should have handled it
      // If we get here, something else went wrong
      const errorText = await response?.text() || 'Unknown error';
      throw new Error(`HTTP ${response?.status}: ${errorText}`);
    }

    // Step 3: Verify the account was created
    console.log('3. Verifying account creation...');
    const { data: profile, error: verifyError } = await supabase
      .from('user_profiles')
      .select('email, full_name, company_name, crm, crm_other, subscription_tier, subscription_status')
      .eq('email', 'crmtest@fnnlapp.com')
      .single();

    if (verifyError) {
      throw verifyError;
    }

    console.log('\n✅ CRM Test Account Created Successfully!\n');
    console.log('Account Details:');
    console.log('  Email: crmtest@fnnlapp.com');
    console.log('  Password: TestCRM123!');
    console.log('  CRM: Honeybook');
    console.log('  Tier: Pro');
    console.log('\nProfile Data:');
    console.log(JSON.stringify(profile, null, 2));
    console.log('\nYou can now log in and test the CRM functionality!');

  } catch (error) {
    console.error('\n❌ Error creating test account:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    process.exit(1);
  }
}

createTestAccount();

