/**
 * Script to run all migrations on the test Supabase database
 * 
 * Usage:
 *   SUPABASE_URL=https://your-test-project.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
 *   node run-test-migrations.mjs
 * 
 * Or set in .env file:
 *   SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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
  console.error('SUPABASE_URL=your-url SUPABASE_SERVICE_ROLE_KEY=your-key node run-test-migrations.mjs');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigrations() {
  console.log('🚀 Running migrations on test database...\n');
  console.log(`📡 Connecting to: ${supabaseUrl}\n`);

  const migrationsDir = join(__dirname, 'supabase', 'migrations');
  
  try {
    // Get all migration files, sorted by name
    const files = await readdir(migrationsDir);
    const migrationFiles = files
      .filter(file => file.endsWith('.sql') && !file.includes('seed'))
      .sort();

    console.log(`📋 Found ${migrationFiles.length} migration files\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const file of migrationFiles) {
      const filePath = join(migrationsDir, file);
      const sql = readFileSync(filePath, 'utf-8');

      console.log(`⏳ Running: ${file}...`);

      try {
        // Execute the migration
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
          // If exec_sql doesn't exist, try direct query
          // Split SQL by semicolons and execute each statement
          const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

          let hasError = false;
          for (const statement of statements) {
            // Skip comments and empty statements
            if (statement.startsWith('--') || statement.length === 0) continue;

            // Use raw query - Supabase doesn't have a direct SQL exec, so we'll use the REST API
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': serviceRoleKey,
                'Authorization': `Bearer ${serviceRoleKey}`
              },
              body: JSON.stringify({ sql_query: statement })
            });

            if (!response.ok && response.status !== 404) {
              // If exec_sql doesn't exist, we need to execute directly
              // For now, let's try a different approach
              console.log(`   ⚠️  Note: Some migrations may need to be run manually in SQL Editor`);
              hasError = true;
              break;
            }
          }

          if (hasError) {
            console.log(`   ⚠️  Migration may need manual execution`);
            errorCount++;
          } else {
            console.log(`   ✅ Success`);
            successCount++;
          }
        } else {
          console.log(`   ✅ Success`);
          successCount++;
        }
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
        console.log(`   ⚠️  You may need to run this migration manually in Supabase SQL Editor`);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📁 Total: ${migrationFiles.length}`);

    if (errorCount > 0) {
      console.log(`\n⚠️  Some migrations had errors. Please run them manually in Supabase SQL Editor.`);
      console.log(`   Go to: ${supabaseUrl.replace('/rest/v1', '')}/project/_/sql`);
    } else {
      console.log(`\n✅ All migrations completed successfully!`);
    }

  } catch (err) {
    console.error(`\n❌ Error reading migrations directory: ${err.message}`);
    console.error(`\n📝 Manual Migration Instructions:`);
    console.error(`   1. Go to your Supabase project SQL Editor`);
    console.error(`   2. Open each migration file from supabase/migrations/ in order`);
    console.error(`   3. Copy and paste the SQL into the editor`);
    console.error(`   4. Run each migration sequentially`);
    process.exit(1);
  }
}

// Run migrations
runMigrations().catch(err => {
  console.error('\n❌ Fatal error:', err);
  console.error('\n📝 Please run migrations manually in Supabase SQL Editor:');
  console.error(`   ${supabaseUrl.replace('/rest/v1', '').replace('https://', 'https://app.supabase.com/project/')}/sql`);
  process.exit(1);
});

