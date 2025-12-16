import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_USER_EMAIL = 'crmtest@fnnlapp.com';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing required environment variables');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function deleteTestForecastModels() {
  console.log('🧹 Deleting forecast models for test account...');

  try {
    // 1. Get user ID from user_profiles table
    console.log('1. Getting user ID...');
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', TEST_USER_EMAIL)
      .single();
    
    if (profileError || !profileData) {
      console.error('❌ Error getting user profile:', profileError?.message || 'User not found');
      return;
    }
    const userId = profileData.id;
    console.log(`   ✅ Found user ID: ${userId}`);

    // 2. Get forecast models
    console.log('2. Getting forecast models...');
    const { data: models, error: modelsError } = await supabase
      .from('forecast_models')
      .select('*')
      .eq('user_id', userId);

    if (modelsError) {
      console.error('❌ Error getting forecast models:', modelsError.message);
      return;
    }

    console.log(`   Found ${models?.length || 0} forecast model(s)`);

    if (!models || models.length === 0) {
      console.log('   ✅ No forecast models to delete');
      return;
    }

    // 3. Delete all forecast models
    console.log('3. Deleting forecast models...');
    for (const model of models) {
      const { error: deleteError } = await supabase
        .from('forecast_models')
        .delete()
        .eq('id', model.id);
      
      if (deleteError) {
        console.warn(`   ⚠️ Error deleting model "${model.name}":`, deleteError.message);
      } else {
        console.log(`   ✅ Deleted model: "${model.name}"`);
      }
    }

    console.log('\n✅ All forecast models deleted for test account');
    console.log('The test account will now start with a blank forecast state.');

  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  }
}

deleteTestForecastModels();

