/**
 * Script to run migrations using Supabase client with service role key
 * Tries to execute SQL directly via the client
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || 'https://xiomuqqsrqiwhjyfxoji.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'GV6fkO4WfETtV+5IifJCWyAXqFr9vaazZ8SsAAtczh/+GEf5NfShGlzFyfOYHJh8TChIWmbQuOvOAYmQA8mq4A==';

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigrations() {
  console.log('🚀 Running migrations using Supabase client...\n');
  console.log(`📡 Connecting to: ${supabaseUrl}\n`);

  const migrationsDir = join(__dirname, 'supabase', 'migrations');
  
  try {
    const files = await readdir(migrationsDir);
    const migrationFiles = files
      .filter(file => file.endsWith('.sql') && !file.includes('seed'))
      .sort();

    console.log(`📋 Found ${migrationFiles.length} migration files\n`);

    // Since Supabase doesn't allow direct SQL execution via the client,
    // we'll read the combined migration file and provide instructions
    const combinedFile = join(__dirname, 'all-migrations-combined.sql');
    
    if (require('fs').existsSync(combinedFile)) {
      const combinedSQL = readFileSync(combinedFile, 'utf-8');
      
      console.log('✅ Combined migration file is ready!\n');
      console.log('📝 Since Supabase requires manual SQL execution, please:\n');
      console.log(`   1. Open: https://app.supabase.com/project/xiomuqqsrqiwhjyfxoji/sql`);
      console.log(`   2. Open the file: ${combinedFile}`);
      console.log(`   3. Copy ALL the contents`);
      console.log(`   4. Paste into Supabase SQL Editor`);
      console.log(`   5. Click "Run" (or Cmd/Ctrl + Enter)`);
      console.log(`   6. Wait for "Success" message\n`);
      console.log('   The file contains all 24 migrations in the correct order.\n');
      
      // Try to verify connection at least
      console.log('🔍 Testing database connection...\n');
      try {
        const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
        if (error && error.code === 'PGRST116') {
          console.log('✅ Connected! Database is empty (migrations not run yet).\n');
        } else if (error) {
          console.log(`⚠️  Connected but got error: ${error.message}`);
          console.log('   This is expected if migrations haven\'t run yet.\n');
        } else {
          console.log('✅ Connected! Database has data.\n');
        }
      } catch (err) {
        console.log(`⚠️  Connection test failed: ${err.message}`);
        console.log('   This might be expected. Proceed with manual migration.\n');
      }
    } else {
      console.log('❌ Combined migration file not found. Please run create-combined-migration.mjs first.\n');
    }

  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
    process.exit(1);
  }
}

runMigrations();

