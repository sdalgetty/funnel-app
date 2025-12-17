/**
 * Script to run migrations using Supabase CLI
 * This uses the CLI which handles authentication automatically
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || 'https://xiomuqqsrqiwhjyfxoji.supabase.co';
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

async function runMigrationsWithCLI() {
  console.log('🚀 Running migrations using Supabase CLI...\n');
  console.log(`📡 Project: ${projectRef}\n`);

  try {
    // First, check if we're linked to a project
    console.log('🔍 Checking Supabase CLI status...\n');
    
    try {
      const { stdout: linkStatus } = await execAsync('supabase status');
      console.log('✅ Supabase CLI is ready\n');
    } catch (err) {
      console.log('⚠️  Project not linked locally. Linking to remote project...\n');
      
      // Link to the remote project
      // Note: This requires the user to be logged in via `supabase login`
      console.log('📝 To link your project, run:');
      console.log(`   supabase link --project-ref ${projectRef}`);
      console.log('\n   Or if you need to login first:');
      console.log('   supabase login');
      console.log(`   supabase link --project-ref ${projectRef}\n`);
      
      console.log('Alternatively, you can push migrations directly:');
      console.log(`   supabase db push --project-ref ${projectRef}\n`);
      
      // Try to push directly if project-ref is available
      console.log('🔄 Attempting to push migrations directly...\n');
    }

    // Try to push migrations
    console.log('📤 Pushing migrations to remote database...\n');
    
    try {
      const { stdout, stderr } = await execAsync(
        `supabase db push --project-ref ${projectRef} --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.${projectRef}.supabase.co:5432/postgres"`,
        { cwd: __dirname }
      );
      
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      
      console.log('\n✅ Migrations pushed successfully!');
    } catch (err) {
      console.log('❌ Direct push failed. Trying alternative method...\n');
      console.log('📝 Manual steps required:\n');
      console.log('1. Make sure you\'re logged in: supabase login');
      console.log(`2. Link your project: supabase link --project-ref ${projectRef}`);
      console.log('3. Push migrations: supabase db push\n');
      console.log('Or run migrations manually in SQL Editor:');
      console.log(`   https://app.supabase.com/project/${projectRef}/sql\n`);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📝 Alternative: Run migrations manually');
    console.log(`   Go to: https://app.supabase.com/project/${projectRef}/sql`);
    console.log('   Copy each migration file from supabase/migrations/ and run them in order\n');
  }
}

runMigrationsWithCLI();

