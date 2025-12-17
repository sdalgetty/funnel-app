/**
 * Script to run all migrations on Supabase using Management API
 * 
 * Usage:
 *   SUPABASE_URL=https://your-test-project.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
 *   node run-migrations-via-api.mjs
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
  console.error('SUPABASE_URL=your-url SUPABASE_SERVICE_ROLE_KEY=your-key node run-migrations-via-api.mjs');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Error: Invalid Supabase URL format');
  console.error('Expected format: https://xxxxx.supabase.co');
  process.exit(1);
}

async function executeSQL(sql) {
  // Use Supabase Management API to execute SQL
  // This requires the service_role key
  const managementApiUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  
  try {
    const response = await fetch(managementApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Try to parse as JSON for better error messages
      try {
        const errorJson = JSON.parse(errorText);
        return { error: errorJson.message || errorJson.error || errorText };
      } catch {
        return { error: errorText };
      }
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (err) {
    return { error: err.message };
  }
}

async function runMigrations() {
  console.log('🚀 Running migrations on Supabase test database...\n');
  console.log(`📡 Connecting to: ${supabaseUrl}`);
  console.log(`🔑 Project: ${projectRef}\n`);

  const migrationsDir = join(__dirname, 'supabase', 'migrations');
  
  try {
    // Get all migration files, sorted by name
    const files = await readdir(migrationsDir);
    const migrationFiles = files
      .filter(file => file.endsWith('.sql') && !file.includes('seed'))
      .sort();

    console.log(`📋 Found ${migrationFiles.length} migration files\n`);

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const file of migrationFiles) {
      const filePath = join(migrationsDir, file);
      let sql = readFileSync(filePath, 'utf-8');

      // Clean up SQL - remove comments and empty lines for better execution
      sql = sql
        .split('\n')
        .filter(line => {
          const trimmed = line.trim();
          return trimmed.length > 0 && !trimmed.startsWith('--');
        })
        .join('\n')
        .trim();

      if (!sql) {
        console.log(`⏭️  Skipping: ${file} (empty or comments only)`);
        skippedCount++;
        continue;
      }

      console.log(`⏳ Running: ${file}...`);

      try {
        const result = await executeSQL(sql);

        if (result.error) {
          // Check if it's a "already exists" error (which is okay)
          const errorLower = result.error.toLowerCase();
          if (
            errorLower.includes('already exists') ||
            errorLower.includes('duplicate') ||
            errorLower.includes('relation') && errorLower.includes('already')
          ) {
            console.log(`   ✅ Already applied (skipped)`);
            skippedCount++;
          } else {
            console.log(`   ❌ Error: ${result.error.substring(0, 150)}...`);
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

      // Small delay between migrations to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⏭️  Skipped (already applied): ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📁 Total: ${migrationFiles.length}`);

    if (errorCount > 0) {
      console.log(`\n⚠️  Some migrations had errors:`);
      errors.forEach(({ file, error }) => {
        console.log(`\n   📄 ${file}:`);
        console.log(`      ${error.substring(0, 200)}${error.length > 200 ? '...' : ''}`);
      });
      console.log(`\n📝 If errors persist, you may need to run them manually in SQL Editor:`);
      console.log(`   ${supabaseUrl.replace('https://', 'https://app.supabase.com/project/').replace('.supabase.co', '')}/sql`);
    } else if (successCount + skippedCount === migrationFiles.length) {
      console.log(`\n✅ All migrations completed successfully!`);
      console.log(`\n🔍 Verifying database schema...`);
      
      // Try to verify by checking if key tables exist
      try {
        const verifyResult = await executeSQL('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' ORDER BY table_name;');
        if (verifyResult.success && verifyResult.data) {
          console.log(`\n📋 Tables created:`);
          const tables = verifyResult.data.map(row => row.table_name || Object.values(row)[0]).filter(Boolean);
          if (tables.length > 0) {
            tables.forEach(table => console.log(`   - ${table}`));
          } else {
            console.log(`   (Could not retrieve table list)`);
          }
        }
      } catch (err) {
        // Verification failed, but that's okay
        console.log(`   (Could not verify - this is okay)`);
      }
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

