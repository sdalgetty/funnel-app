/**
 * Script to combine all migrations into a single SQL file
 * This makes it easier to run all migrations at once in Supabase SQL Editor
 */

import { readFileSync, writeFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createCombinedMigration() {
  console.log('📦 Creating combined migration file...\n');

  const migrationsDir = join(__dirname, 'supabase', 'migrations');
  const outputFile = join(__dirname, 'all-migrations-combined.sql');

  try {
    // Get all migration files, sorted by name
    const files = await readdir(migrationsDir);
    const migrationFiles = files
      .filter(file => file.endsWith('.sql') && !file.includes('seed'))
      .sort();

    console.log(`📋 Found ${migrationFiles.length} migration files\n`);

    let combinedSQL = `-- Combined Migration File
-- Generated automatically - DO NOT EDIT
-- Run this entire file in Supabase SQL Editor
-- Project: Test Environment
-- Date: ${new Date().toISOString()}

-- ============================================================================
-- MIGRATION: 001_init.sql
-- ============================================================================

`;

    for (const file of migrationFiles) {
      const filePath = join(migrationsDir, file);
      const sql = readFileSync(filePath, 'utf-8');

      combinedSQL += `-- ============================================================================
-- MIGRATION: ${file}
-- ============================================================================

${sql}

-- ============================================================================
-- End of ${file}
-- ============================================================================

`;

      console.log(`✅ Added: ${file}`);
    }

    // Write combined file
    writeFileSync(outputFile, combinedSQL, 'utf-8');

    console.log(`\n✅ Combined migration file created: ${outputFile}`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Open: https://app.supabase.com/project/xiomuqqsrqiwhjyfxoji/sql`);
    console.log(`   2. Copy the contents of: ${outputFile}`);
    console.log(`   3. Paste into SQL Editor`);
    console.log(`   4. Click "Run" or press Cmd/Ctrl + Enter`);
    console.log(`   5. Wait for "Success" message\n`);

  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
    process.exit(1);
  }
}

createCombinedMigration();

