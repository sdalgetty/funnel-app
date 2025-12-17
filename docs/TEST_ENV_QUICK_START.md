# Test Environment Quick Start Checklist

Use this checklist to quickly set up your test environment.

## Prerequisites
- [ ] Netlify account with access to create new sites
- [ ] Supabase account with access to create new projects
- [ ] GitHub repository access

## Step-by-Step Setup

### 1. Create Test Supabase Project (5 minutes)
- [ ] Go to [Supabase Dashboard](https://app.supabase.com/)
- [ ] Click "New Project"
- [ ] Name: `fnnl-app-test`
- [ ] Set database password
- [ ] Choose region
- [ ] Wait for project creation
- [ ] Copy Project URL → Save for Step 5
- [ ] Copy anon public key → Save for Step 5

### 2. Run Migrations on Test Database (10 minutes)
- [ ] Go to test Supabase project > SQL Editor
- [ ] Open each migration file from `supabase/migrations/` in order
- [ ] Run migrations sequentially (001, 002, 003, etc.)
- [ ] Verify no errors
- [ ] Check that tables were created

### 3. Create Test Branch (2 minutes)
```bash
git checkout -b test
git push -u origin test
```

### 4. Create Test Netlify Site (5 minutes)
- [ ] Go to [Netlify Dashboard](https://app.netlify.com/)
- [ ] Click "Add new site" > "Import an existing project"
- [ ] Connect GitHub repository
- [ ] Site name: `fnnl-app-test`
- [ ] Branch to deploy: `test`
- [ ] Build command: `cd analytics-vite-app && npm install && npm run build`
- [ ] Publish directory: `analytics-vite-app/dist`
- [ ] Click "Deploy site"

### 5. Configure Environment Variables (3 minutes)
In Netlify test site:
- [ ] Go to Site settings > Environment variables
- [ ] Add `VITE_SUPABASE_URL` = (from Step 1)
- [ ] Add `VITE_SUPABASE_ANON_KEY` = (from Step 1)
- [ ] Add `VITE_POSTHOG_KEY` = (if using analytics)
- [ ] Add `VITE_POSTHOG_HOST` = `https://us.i.posthog.com` (if using analytics)

### 6. Verify Test Deployment (2 minutes)
- [ ] Wait for Netlify build to complete
- [ ] Visit test site URL
- [ ] Verify app loads correctly
- [ ] Test login/authentication
- [ ] Verify database connection works

### 7. Configure Production Site (if not already done)
- [ ] Verify production Netlify site has correct branch (`main`)
- [ ] Verify production environment variables are set
- [ ] Test production deployment

## Total Time: ~30 minutes

## Next Steps
1. Read [TEST_ENVIRONMENT_SETUP.md](./TEST_ENVIRONMENT_SETUP.md) for detailed information
2. Read [DEPLOYMENT_WORKFLOW.md](./DEPLOYMENT_WORKFLOW.md) for deployment procedures
3. Test the workflow: make a change, deploy to test, then to production

## Troubleshooting

**Build fails:**
- Check Netlify build logs
- Verify build command is correct
- Ensure `package.json` exists in `analytics-vite-app/`

**Database connection fails:**
- Verify Supabase URL and key are correct
- Check Supabase project is active
- Verify RLS policies are set up

**App doesn't load:**
- Check browser console for errors
- Verify environment variables are set
- Check Netlify deployment succeeded

## Support
Refer to [TEST_ENVIRONMENT_SETUP.md](./TEST_ENVIRONMENT_SETUP.md) for detailed troubleshooting.

