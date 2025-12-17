# Test Environment Setup - Next Steps

## ✅ Completed
- [x] Test Supabase project created (`fnnl-app-test`)
- [x] Test branch created and pushed to GitHub

## 📋 Remaining Steps

### Step 1: Run Database Migrations (10-15 minutes)

Since Supabase requires manual SQL execution, you'll need to run migrations in the SQL Editor:

1. **Go to your test Supabase SQL Editor:**
   - Navigate to: https://app.supabase.com/
   - Select your `fnnl-app-test` project
   - Click "SQL Editor" in the left sidebar

2. **Run migrations in order:**
   - Open each file from `supabase/migrations/` in numerical order (001, 002, 003, etc.)
   - Copy the entire SQL content
   - Paste into SQL Editor
   - Click "Run" (or Cmd/Ctrl + Enter)
   - Wait for "Success" message
   - Move to the next migration

3. **Migration files (24 total):**
   ```
   001_init.sql
   002_add_company_name.sql
   003_add_company_name_only.sql
   004_company_name_final.sql
   005_add_monthly_funnel_data.sql
   006_add_funnel_unique_constraint.sql
   007_fix_funnel_data_constraints.sql
   008_add_booking_additional_fields.sql
   009_add_payment_schedule_fields.sql
   010_add_tracks_in_funnel_to_service_types.sql
   011_make_booking_date_nullable.sql
   012_add_first_last_name.sql
   013_simplify_advertising_remove_ad_source.sql
   014_add_notes_to_ad_campaigns.sql
   015_add_funnel_notes.sql
   016_add_funnel_manual_overrides.sql
   017_add_account_sharing.sql
   018_fix_account_share_steve.sql
   019_add_admin_support.sql
   020_add_phone_website_to_user_profiles.sql
   021_fix_performance_and_security_issues.sql
   022_fix_function_search_path.sql
   023_optimize_rls_policies_performance.sql
   024_add_crm_to_user_profiles.sql
   ```

4. **Verify migrations:**
   - Go to Database → Tables
   - You should see: `user_profiles`, `bookings`, `funnel_data`, `service_types`, `lead_sources`, `ad_campaigns`, etc.

**Tip:** You can open multiple migration files at once and run them sequentially. Some migrations may show "already exists" errors - that's okay, just continue.

---

### Step 2: Create Netlify Test Site (5 minutes)

1. **Go to Netlify Dashboard:**
   - Navigate to: https://app.netlify.com/
   - Click "Add new site" → "Import an existing project"

2. **Connect GitHub:**
   - Click "GitHub" to connect your repository
   - Authorize Netlify if prompted
   - Select the `funnel-app` repository

3. **Configure site settings:**
   - **Site name:** `fnnl-app-test` (or any name you prefer)
   - **Branch to deploy:** `test`
   - **Base directory:** Leave empty (or set to `analytics-vite-app` if needed)
   - **Build command:** `cd analytics-vite-app && npm install && npm run build`
   - **Publish directory:** `analytics-vite-app/dist`

4. **Deploy:**
   - Click "Deploy site"
   - Wait for the build to complete (2-3 minutes)

**Note:** The first deployment may fail if environment variables aren't set yet - that's okay, we'll add them next.

---

### Step 3: Set Environment Variables (3 minutes)

1. **Get your test Supabase credentials:**
   - Go to your test Supabase project: https://app.supabase.com/
   - Click "Settings" → "API"
   - Copy the "Project URL" (e.g., `https://xxxxx.supabase.co`)
   - Copy the "anon public" key (long JWT token)

2. **Add variables in Netlify:**
   - In your Netlify test site, go to: **Site settings** → **Environment variables**
   - Click "Add variable" and add:

   ```
   Variable name: VITE_SUPABASE_URL
   Value: [paste your test Supabase URL]
   Scope: All scopes
   ```

   ```
   Variable name: VITE_SUPABASE_ANON_KEY
   Value: [paste your test Supabase anon key]
   Scope: All scopes
   ```

3. **Optional - PostHog (if using analytics):**
   ```
   Variable name: VITE_POSTHOG_KEY
   Value: [your PostHog key]
   Scope: All scopes
   ```

   ```
   Variable name: VITE_POSTHOG_HOST
   Value: https://us.i.posthog.com
   Scope: All scopes
   ```

4. **Redeploy:**
   - After adding variables, go to "Deploys" tab
   - Click "Trigger deploy" → "Deploy site"
   - Wait for deployment to complete

---

### Step 4: Verify Test Environment (2 minutes)

1. **Visit your test site:**
   - Go to the Netlify site URL (e.g., `https://fnnl-app-test.netlify.app`)
   - Or check the "Deploys" tab for the live URL

2. **Test the application:**
   - Try to sign up or log in
   - Verify database connection works
   - Check browser console for errors

3. **Verify it's using test database:**
   - Create a test account
   - Check that it appears in your test Supabase project (not production)

---

## 🎉 You're Done!

Your test environment is now set up. You can now:

- **Deploy to test:** Merge changes to `test` branch → auto-deploys to test
- **Deploy to production:** Merge `test` → `main` → auto-deploys to production

## 📚 Reference

- **Detailed setup:** `docs/TEST_ENVIRONMENT_SETUP.md`
- **Deployment workflow:** `docs/DEPLOYMENT_WORKFLOW.md`
- **Environment variables:** `docs/ENVIRONMENT_VARIABLES.md`

## 🆘 Troubleshooting

**Build fails:**
- Check Netlify build logs
- Verify build command is correct
- Ensure `package.json` exists in `analytics-vite-app/`

**Database connection fails:**
- Verify Supabase URL and key are correct
- Check Supabase project is active
- Verify migrations ran successfully

**App doesn't load:**
- Check browser console for errors
- Verify environment variables are set
- Check Netlify deployment succeeded

---

**Need help?** Check the detailed documentation in the `docs/` folder.

