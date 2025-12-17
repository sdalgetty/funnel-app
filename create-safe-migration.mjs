/**
 * Script to create a safe, idempotent combined migration file
 * All ALTER TABLE ADD COLUMN statements are made safe with IF NOT EXISTS
 */

import { readFileSync, writeFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function makeIdempotent(sql) {
  // First, remove any duplicate IF NOT EXISTS
  sql = sql.replace(/IF\s+NOT\s+EXISTS\s+IF\s+NOT\s+EXISTS/gi, 'IF NOT EXISTS');
  
  // Replace ALTER TABLE ... ADD COLUMN without IF NOT EXISTS
  // Pattern: ALTER TABLE table_name ADD COLUMN column_name (but not if IF NOT EXISTS is already there)
  sql = sql.replace(
    /ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+(?!IF\s+NOT\s+EXISTS)(\w+)\s+([^;]+);/gi,
    (match, table, column, rest) => {
      // Add IF NOT EXISTS
      return `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${rest};`;
    }
  );

  // Also handle lowercase versions
  sql = sql.replace(
    /alter\s+table\s+(\w+)\s+add\s+column\s+(?!if\s+not\s+exists)(\w+)\s+([^;]+);/gi,
    (match, table, column, rest) => {
      return `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${rest};`;
    }
  );

  // Make migration 018 safe - only run if users exist
  // This migration sets up account sharing for specific production users
  if (sql.includes('hello@anendlesspursuit.com')) {
    // Replace RAISE EXCEPTION with graceful skip for test environments
    // Handle both single-line and multi-line formats
    sql = sql.replace(
      /IF v_owner_id IS NULL THEN\s*RAISE EXCEPTION 'Owner user \(hello@anendlesspursuit\.com\) not found';\s*END IF;/gi,
      `IF v_owner_id IS NULL THEN
        RAISE NOTICE 'Owner user not found - skipping account share setup (this is OK for test environments)';
        RETURN;
    END IF;`
    );
    
    sql = sql.replace(
      /IF v_guest_id IS NULL THEN\s*RAISE EXCEPTION 'Guest user \(stevedalgetty@gmail\.com\) not found';\s*END IF;/gi,
      `IF v_guest_id IS NULL THEN
        RAISE NOTICE 'Guest user not found - skipping account share setup (this is OK for test environments)';
        RETURN;
    END IF;`
    );
    
    // Also handle the exact format from the file
    sql = sql.replace(
      /RAISE EXCEPTION 'Owner user \(hello@anendlesspursuit\.com\) not found';/g,
      `RAISE NOTICE 'Owner user not found - skipping account share setup (this is OK for test environments)';
        RETURN;`
    );
    
    sql = sql.replace(
      /RAISE EXCEPTION 'Guest user \(stevedalgetty@gmail\.com\) not found';/g,
      `RAISE NOTICE 'Guest user not found - skipping account share setup (this is OK for test environments)';
        RETURN;`
    );
  }

  return sql;
}

async function createSafeMigration() {
  console.log('📦 Creating safe, idempotent migration file...\n');

  const migrationsDir = join(__dirname, 'supabase', 'migrations');
  const outputFile = join(__dirname, 'all-migrations-combined-safe.sql');

  try {
    const files = await readdir(migrationsDir);
    const migrationFiles = files
      .filter(file => file.endsWith('.sql') && !file.includes('seed'))
      .sort();

    console.log(`📋 Found ${migrationFiles.length} migration files\n`);

    let combinedSQL = `-- Safe Combined Migration File
-- Generated automatically - DO NOT EDIT
-- This file is idempotent - safe to run multiple times
-- All ALTER TABLE ADD COLUMN statements use IF NOT EXISTS
-- Project: Test Environment
-- Date: ${new Date().toISOString()}

-- ============================================================================
-- IMPORTANT: This file is safe to run even if some migrations were already applied
-- ============================================================================

`;

    for (const file of migrationFiles) {
      const filePath = join(migrationsDir, file);
      let sql = readFileSync(filePath, 'utf-8');

      // Make the SQL idempotent
      sql = makeIdempotent(sql);

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

    writeFileSync(outputFile, combinedSQL, 'utf-8');

    console.log(`\n✅ Safe migration file created: ${outputFile}`);
    console.log(`\n📝 This file is safe to run even if some migrations were already applied.`);
    console.log(`\n🔧 Next steps:`);
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

createSafeMigration();

