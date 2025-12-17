# Fix Test Environment Database Connection

## Issue
The test environment is currently connected to the **production database** instead of the **test database**.

## Fix Steps

### 1. Go to Netlify Test Site Settings
1. Go to: https://app.netlify.com/
2. Find your test site: `fnnl-app-test`
3. Click on it
4. Go to **Site settings** (gear icon)
5. Click **Environment variables** in the left sidebar

### 2. Update Environment Variables

**Check and update these variables:**

**VITE_SUPABASE_URL:**
- **Current (WRONG):** `https://lqtzjwgsgimsnbmxfmra.supabase.co` (production)
- **Should be:** `https://xiomuqqsrqiwhjyfxoji.supabase.co` (test)
- Click the variable to edit it
- Change to: `https://xiomuqqsrqiwhjyfxoji.supabase.co`
- Click **Save**

**VITE_SUPABASE_ANON_KEY:**
- **Current (WRONG):** Production anon key
- **Should be:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpb211cXFzcnFpd2hqeWZ4b2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODUwNDIsImV4cCI6MjA4MTU2MTA0Mn0.NqcIMi9ItZQIZ_Ku0r00z2k1FjxO5bfpX2fzPmd5GMI` (test anon key)
- Click the variable to edit it
- Change to the test anon key above
- Click **Save**

### 3. Redeploy
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait for deployment to complete (2-3 minutes)

### 4. Verify
1. Visit your test site: `https://fnnl-app-test.netlify.app`
2. Log out and log back in (to refresh the connection)
3. Add a test record (e.g., "Test Call Taken")
4. Check production: `https://app.fnnlapp.com` - the test record should **NOT** appear there
5. Check test Supabase: https://app.supabase.com/project/xiomuqqsrqiwhjyfxoji - the test record **SHOULD** appear there

## Correct Values

**Test Environment:**
- `VITE_SUPABASE_URL` = `https://xiomuqqsrqiwhjyfxoji.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpb211cXFzcnFpd2hqeWZ4b2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODUwNDIsImV4cCI6MjA4MTU2MTA0Mn0.NqcIMi9ItZQIZ_Ku0r00z2k1FjxO5bfpX2fzPmd5GMI`

**Production Environment:**
- `VITE_SUPABASE_URL` = `https://lqtzjwgsgimsnbmxfmra.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = (your production anon key)

## Important
After fixing, you'll need to:
1. Log out and log back in to test environment
2. Your test data will be separate from production
3. You may need to re-migrate your user data to test (since it was going to production before)

