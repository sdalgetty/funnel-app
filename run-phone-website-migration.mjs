/**
 * Script to run the phone/website migration on production Supabase
 * Run with: node run-phone-website-migration.mjs
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
  console.error('SUPABASE_URL=your-url SUPABASE_SERVICE_ROLE_KEY=your-key node run-phone-website-migration.mjs');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🔧 Running phone/website migration...\n');

  try {
    // Read the migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '020_add_phone_website_to_user_profiles.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('Migration SQL:');
    console.log(migrationSQL);
    console.log('\n');

    // Execute the migration using RPC or direct SQL
    // Since Supabase JS client doesn't have a direct SQL execution method,
    // we'll use the REST API to execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    }).catch(async () => {
      // If RPC doesn't exist, try direct SQL execution via REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({ sql: migrationSQL })
      });

      if (!response.ok) {
        // Try alternative: execute SQL directly using pg_query
        // We'll need to use the PostgREST API differently
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return { data: await response.json(), error: null };
    });

    if (error) {
      // If RPC method doesn't work, we'll need to execute via direct database connection
      // For now, let's try a different approach - execute the ALTER TABLE directly
      console.log('⚠️  RPC method not available, trying direct table update...\n');
      
      // Check if columns already exist by trying to query them
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('phone, website')
        .limit(1);

      if (testError && (testError.message?.includes('column') || testError.code === '42703')) {
        // Columns don't exist, we need to add them
        // Since we can't execute DDL via the JS client, we'll provide instructions
        console.log('❌ Cannot execute DDL (ALTER TABLE) via Supabase JS client.');
        console.log('📝 Please run this SQL in your Supabase Dashboard SQL Editor:\n');
        console.log(migrationSQL);
        console.log('\n');
        console.log('Or use the Supabase CLI:');
        console.log('  supabase db push\n');
        process.exit(1);
      } else {
        console.log('✅ Columns already exist! Migration may have already been applied.\n');
        return;
      }
    }

    console.log('✅ Migration executed successfully!\n');
    console.log('Result:', data);

  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    console.error('\n📝 Please run this SQL manually in your Supabase Dashboard SQL Editor:\n');
    console.log('ALTER TABLE user_profiles');
    console.log('ADD COLUMN IF NOT EXISTS phone text,');
    console.log('ADD COLUMN IF NOT EXISTS website text;');
    console.log('\n');
    process.exit(1);
  }
}

runMigration();


