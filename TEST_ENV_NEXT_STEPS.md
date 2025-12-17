# Test Environment - Next Steps

## ✅ Completed
- [x] Test Supabase project created
- [x] Test branch created and pushed to GitHub
- [x] All 24 database migrations run successfully

## 📋 Remaining Steps

### Step 1: Create Netlify Test Site (5 minutes)

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

### Step 2: Set Environment Variables (3 minutes)

1. **Get your test Supabase credentials:**
   - **Supabase URL:** `https://xiomuqqsrqiwhjyfxoji.supabase.co`
   - **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpb211cXFzcnFpd2hqeWZ4b2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODUwNDIsImV4cCI6MjA4MTU2MTA0Mn0.NqcIMi9ItZQIZ_Ku0r00z2k1FjxO5bfpX2fzPmd5GMI`

2. **Add variables in Netlify:**
   - In your Netlify test site, go to: **Site settings** → **Environment variables**
   - Click "Add variable" and add:

   ```
   Variable name: VITE_SUPABASE_URL
   Value: https://xiomuqqsrqiwhjyfxoji.supabase.co
   Scope: All scopes
   ```

   ```
   Variable name: VITE_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpb211cXFzcnFpd2hqeWZ4b2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODUwNDIsImV4cCI6MjA4MTU2MTA0Mn0.NqcIMi9ItZQIZ_Ku0r00z2k1FjxO5bfpX2fzPmd5GMI
   Scope: All scopes
   ```

3. **Optional - PostHog (if using analytics):**
   - Add `VITE_POSTHOG_KEY` if you want analytics in test environment
   - Add `VITE_POSTHOG_HOST` = `https://us.i.posthog.com`

4. **Redeploy:**
   - After adding variables, go to "Deploys" tab
   - Click "Trigger deploy" → "Deploy site"
   - Wait for deployment to complete

---

### Step 3: Verify Test Environment (2 minutes)

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

Your test environment is now fully set up. You can now:

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
- Verify migrations ran successfully (✅ Done!)

**App doesn't load:**
- Check browser console for errors
- Verify environment variables are set
- Check Netlify deployment succeeded

---

**Current Status:**
- ✅ Test Supabase project: `xiomuqqsrqiwhjyfxoji`
- ✅ Test branch: `test` (pushed to GitHub)
- ✅ Database migrations: Complete
- ⏳ Netlify test site: Pending
- ⏳ Environment variables: Pending

