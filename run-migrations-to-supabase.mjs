/**
 * Script to run all migrations on Supabase test database
 * Uses Supabase REST API to execute SQL
 * 
 * Usage:
 *   SUPABASE_URL=https://your-test-project.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
 *   node run-migrations-to-supabase.mjs
 */

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
  console.error('SUPABASE_URL=your-url SUPABASE_SERVICE_ROLE_KEY=your-key node run-migrations-to-supabase.mjs');
  process.exit(1);
}

async function executeSQL(sql) {
  // Use Supabase REST API to execute SQL
  // Note: This requires the service_role key which has admin privileges
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`
    },
    body: JSON.stringify({ sql_query: sql })
  });

  if (response.status === 404) {
    // exec_sql function doesn't exist, try alternative method
    return { error: 'exec_sql_not_found' };
  }

  if (!response.ok) {
    const errorText = await response.text();
    return { error: errorText };
  }

  return { success: true };
}

async function runMigrations() {
  console.log('🚀 Running migrations on Supabase test database...\n');
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
    const errors = [];

    for (const file of migrationFiles) {
      const filePath = join(migrationsDir, file);
      const sql = readFileSync(filePath, 'utf-8');

      console.log(`⏳ Running: ${file}...`);

      try {
        // Try to execute via API
        const result = await executeSQL(sql);

        if (result.error === 'exec_sql_not_found') {
          // exec_sql function doesn't exist - we need to use a different approach
          // Supabase doesn't allow direct SQL execution via API for security
          console.log(`   ⚠️  Cannot execute via API - Supabase requires manual execution`);
          console.log(`   📝 Please run this migration manually in SQL Editor`);
          console.log(`   🔗 Go to: ${supabaseUrl.replace('https://', 'https://app.supabase.com/project/').replace('.supabase.co', '')}/sql`);
          errors.push({ file, error: 'Manual execution required' });
          errorCount++;
        } else if (result.error) {
          // Check if it's a "already exists" error (which is okay)
          if (result.error.includes('already exists') || result.error.includes('duplicate')) {
            console.log(`   ✅ Already applied (skipped)`);
            successCount++;
          } else {
            console.log(`   ❌ Error: ${result.error.substring(0, 100)}...`);
            errors.push({ file, error: result.error });
            errorCount++;
          }
        } else {
          console.log(`   ✅ Success`);
          successCount++;
        }
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
        errors.push({ file, error: err.message });
        errorCount++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📁 Total: ${migrationFiles.length}`);

    if (errorCount > 0) {
      console.log(`\n⚠️  Some migrations need manual execution.`);
      console.log(`\n📝 Manual Migration Instructions:`);
      console.log(`   1. Go to: ${supabaseUrl.replace('https://', 'https://app.supabase.com/project/').replace('.supabase.co', '')}/sql`);
      console.log(`   2. For each failed migration, open the file from supabase/migrations/`);
      console.log(`   3. Copy and paste the SQL into the editor`);
      console.log(`   4. Click "Run" or press Cmd/Ctrl + Enter`);
      console.log(`\n   Failed migrations:`);
      errors.forEach(({ file, error }) => {
        console.log(`   - ${file}: ${error.substring(0, 80)}...`);
      });
    } else {
      console.log(`\n✅ All migrations completed successfully!`);
    }

  } catch (err) {
    console.error(`\n❌ Error reading migrations directory: ${err.message}`);
    console.error(`\n📝 Please run migrations manually in Supabase SQL Editor`);
    console.error(`   ${supabaseUrl.replace('https://', 'https://app.supabase.com/project/').replace('.supabase.co', '')}/sql`);
    process.exit(1);
  }
}

// Run migrations
runMigrations().catch(err => {
  console.error('\n❌ Fatal error:', err);
  console.error('\n📝 Please run migrations manually in Supabase SQL Editor:');
  console.error(`   ${supabaseUrl.replace('https://', 'https://app.supabase.com/project/').replace('.supabase.co', '')}/sql`);
  process.exit(1);
});

