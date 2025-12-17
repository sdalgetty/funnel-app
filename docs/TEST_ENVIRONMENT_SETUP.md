# Test Environment Setup Guide

This guide explains how to set up and use a separate test environment for deploying and testing features before they go to production.

## Overview

The application uses two environments:
- **Test Environment**: For testing new features and updates before production
- **Production Environment**: The live environment used by actual users

## Architecture

### Deployment Strategy
- **Test Environment**: Deploys from the `test` branch
- **Production Environment**: Deploys from the `main` branch

### Database Strategy
You have two options:

#### Option 1: Separate Supabase Project (Recommended)
- Create a separate Supabase project for the test environment
- Completely isolated data
- Safe for testing without affecting production data
- Can be reset/cleared without concern

#### Option 2: Same Supabase Project, Different Schema
- Use the same Supabase project but with separate test data
- More cost-effective
- Requires careful data management
- Test users should be clearly marked (e.g., email domain `@test.fnnlapp.com`)

**Recommendation**: Use Option 1 (separate Supabase project) for complete isolation.

## Setup Instructions

### Step 1: Create Test Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Name it: `fnnl-app-test` (or similar)
4. Set a strong database password
5. Choose a region close to your users
6. Wait for the project to be created

### Step 2: Run Migrations on Test Database

1. In your test Supabase project, go to SQL Editor
2. Run all migrations from `supabase/migrations/` in order
3. Verify the schema matches production

**Quick migration script:**
```bash
# You can create a script to run all migrations
# Or manually copy/paste each migration file into SQL Editor
```

### Step 3: Create Test Netlify Site

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click "Add new site" > "Import an existing project"
3. Connect your GitHub repository
4. Configure the site:
   - **Site name**: `fnnl-app-test` (or similar)
   - **Branch to deploy**: `test`
   - **Build command**: `cd analytics-vite-app && npm install && npm run build`
   - **Publish directory**: `analytics-vite-app/dist`
5. Click "Deploy site"

### Step 4: Configure Netlify Branch Deployments

#### For Test Site:
1. Go to Site settings > Build & deploy > Continuous Deployment
2. Set **Production branch** to: `test`
3. Enable "Deploy only the production branch"

#### For Production Site:
1. Go to your existing production site settings
2. Ensure **Production branch** is set to: `main`
3. Enable "Deploy only the production branch"

### Step 5: Set Environment Variables

#### Test Environment (Netlify Test Site):
1. Go to Site settings > Environment variables
2. Add the following variables:

```
VITE_SUPABASE_URL=https://your-test-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-test-anon-key
VITE_POSTHOG_KEY=your-posthog-key (optional)
VITE_POSTHOG_HOST=https://us.i.posthog.com (optional)
```

**To get Supabase credentials:**
- Go to your test Supabase project
- Settings > API
- Copy "Project URL" → `VITE_SUPABASE_URL`
- Copy "anon public" key → `VITE_SUPABASE_ANON_KEY`

#### Production Environment (Netlify Production Site):
Ensure these are already set (verify they're correct):
```
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_POSTHOG_KEY=your-posthog-key (optional)
VITE_POSTHOG_HOST=https://us.i.posthog.com (optional)
```

### Step 6: Create Test Branch

```bash
# Create and push the test branch
git checkout -b test
git push -u origin test
```

## Deployment Workflow

### Testing New Features

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Develop and test locally:**
   ```bash
   cd analytics-vite-app
   npm run dev
   ```

3. **Merge to test branch:**
   ```bash
   git checkout test
   git merge feature/my-new-feature
   git push origin test
   ```

4. **Netlify automatically deploys to test environment**

5. **Test thoroughly in the test environment:**
   - Verify all functionality works
   - Test edge cases
   - Check for regressions
   - Test with real data scenarios

6. **Once confirmed, deploy to production:**
   ```bash
   git checkout main
   git merge test
   git push origin main
   ```

7. **Netlify automatically deploys to production**

### Quick Fixes to Production

For urgent production fixes that don't need testing:

1. **Create hotfix branch:**
   ```bash
   git checkout -b hotfix/urgent-fix main
   ```

2. **Make the fix and test locally**

3. **Merge directly to main:**
   ```bash
   git checkout main
   git merge hotfix/urgent-fix
   git push origin main
   ```

4. **Also merge to test to keep branches in sync:**
   ```bash
   git checkout test
   git merge main
   git push origin test
   ```

## Environment URLs

After setup, you'll have:
- **Test Environment**: `https://fnnl-app-test.netlify.app` (or your custom domain)
- **Production Environment**: `https://app.fnnlapp.com` (existing production URL)

## Custom Domain for Test (Optional)

If you want a custom domain for the test environment:

1. In Netlify test site settings, go to Domain management
2. Add custom domain: `test.fnnlapp.com` (or similar)
3. Configure DNS records as instructed by Netlify
4. Update `netlify.toml` if needed for redirects

## Database Management

### Test Database Reset

If you need to reset the test database:

1. In Supabase test project, go to SQL Editor
2. Run a script to clear all data (be careful!)
3. Or use the Supabase dashboard to delete and recreate tables

### Syncing Test Data

To populate test data similar to production:

1. Export sample data from production (if needed)
2. Import into test database
3. Or use test data generation scripts

## Monitoring

### Test Environment Monitoring

- Monitor test deployments in Netlify dashboard
- Check test Supabase project for errors
- Review PostHog events (if configured) to see test usage

### Production Environment Monitoring

- Monitor production deployments
- Watch for errors in production Supabase
- Track user analytics in PostHog

## Best Practices

1. **Always test in test environment first** before deploying to production
2. **Keep test and main branches in sync** - merge main → test regularly
3. **Use descriptive commit messages** for easier tracking
4. **Document breaking changes** in test environment before production
5. **Test database migrations** in test environment first
6. **Monitor both environments** for issues

## Troubleshooting

### Test environment not deploying
- Check Netlify build logs
- Verify branch is set correctly in Netlify settings
- Ensure environment variables are set

### Database connection issues
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check Supabase project is active
- Verify RLS policies are set up correctly

### Build failures
- Check `package.json` dependencies
- Review build logs in Netlify
- Test build locally: `npm run build`

## Next Steps

1. ✅ Create test Supabase project
2. ✅ Run migrations on test database
3. ✅ Create test Netlify site
4. ✅ Configure branch deployments
5. ✅ Set environment variables
6. ✅ Create test branch
7. ✅ Test the deployment workflow

## Support

If you encounter issues:
1. Check Netlify deployment logs
2. Check Supabase logs
3. Review this documentation
4. Test locally first to isolate issues

