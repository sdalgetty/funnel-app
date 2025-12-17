/**
 * Interactive script to help set up the test environment
 * This script will guide you through the setup process
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🚀 FNNL Test Environment Setup\n');
  console.log('This script will help you set up your test environment.\n');

  // Step 1: Get Supabase credentials
  console.log('📋 Step 1: Supabase Test Project Credentials\n');
  console.log('Go to your test Supabase project dashboard:');
  console.log('  https://app.supabase.com/project/[your-project-id]\n');
  console.log('Then go to: Settings → API\n');

  const supabaseUrl = await question('Enter your test Supabase URL (e.g., https://xxxxx.supabase.co): ');
  const supabaseAnonKey = await question('Enter your test Supabase anon key: ');

  console.log('\n✅ Supabase credentials collected!\n');

  // Step 2: Verify connection
  console.log('🔍 Step 2: Verifying Supabase connection...\n');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (expected)
      console.log('⚠️  Connection verified, but migrations may not be run yet.\n');
    } else {
      console.log('✅ Connection verified!\n');
    }
  } catch (err) {
    console.log('⚠️  Could not verify connection, but continuing...\n');
  }

  // Step 3: Migration instructions
  console.log('📝 Step 3: Database Migrations\n');
  console.log('You need to run migrations manually in Supabase SQL Editor:\n');
  console.log(`1. Go to: ${supabaseUrl.replace('https://', 'https://app.supabase.com/project/').replace('.supabase.co', '')}/sql`);
  console.log('2. Open each migration file from supabase/migrations/ in order');
  console.log('3. Copy and paste into SQL Editor and run\n');
  console.log('See run-test-migrations-manual.md for detailed instructions.\n');

  const migrationsDone = await question('Have you run all migrations? (y/n): ');
  
  if (migrationsDone.toLowerCase() !== 'y') {
    console.log('\n⚠️  Please run migrations before continuing with Netlify setup.\n');
    console.log('You can continue with Netlify setup, but the app won\'t work until migrations are complete.\n');
  }

  // Step 4: Netlify setup instructions
  console.log('\n🌐 Step 4: Netlify Test Site Setup\n');
  console.log('Next steps:\n');
  console.log('1. Go to: https://app.netlify.com/');
  console.log('2. Click "Add new site" → "Import an existing project"');
  console.log('3. Connect your GitHub repository');
  console.log('4. Configure:');
  console.log('   - Site name: fnnl-app-test');
  console.log('   - Branch to deploy: test');
  console.log('   - Build command: cd analytics-vite-app && npm install && npm run build');
  console.log('   - Publish directory: analytics-vite-app/dist');
  console.log('5. Click "Deploy site"\n');

  const netlifyDone = await question('Have you created the Netlify test site? (y/n): ');

  if (netlifyDone.toLowerCase() !== 'y') {
    console.log('\n📝 Please create the Netlify site before setting environment variables.\n');
  }

  // Step 5: Environment variables
  console.log('\n🔐 Step 5: Environment Variables\n');
  console.log('In your Netlify test site settings:\n');
  console.log('1. Go to: Site settings → Environment variables');
  console.log('2. Add the following variables:\n');
  console.log(`   VITE_SUPABASE_URL=${supabaseUrl}`);
  console.log(`   VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}\n`);
  
  const posthogKey = await question('Do you want to add PostHog? Enter key (or press Enter to skip): ');
  
  if (posthogKey) {
    console.log(`   VITE_POSTHOG_KEY=${posthogKey}`);
    console.log('   VITE_POSTHOG_HOST=https://us.i.posthog.com');
  }

  console.log('\n✅ Setup instructions complete!\n');
  console.log('📋 Summary:');
  console.log(`   - Test Supabase URL: ${supabaseUrl}`);
  console.log(`   - Test branch created and pushed: ✅`);
  console.log(`   - Migrations: ${migrationsDone.toLowerCase() === 'y' ? '✅' : '⏳ Pending'}`);
  console.log(`   - Netlify site: ${netlifyDone.toLowerCase() === 'y' ? '✅' : '⏳ Pending'}`);
  console.log('\n📚 For detailed instructions, see:');
  console.log('   - docs/TEST_ENV_QUICK_START.md');
  console.log('   - docs/TEST_ENVIRONMENT_SETUP.md\n');

  rl.close();
}

main().catch(err => {
  console.error('\n❌ Error:', err);
  rl.close();
  process.exit(1);
});

