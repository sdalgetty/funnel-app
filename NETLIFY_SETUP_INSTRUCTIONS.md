# Netlify Test Site Setup - Step by Step

Since the Netlify CLI has some limitations with GitHub integration, here's the easiest way to set up your test site:

## Step 1: Create the Site (5 minutes)

1. **Go to Netlify Dashboard:**
   - Open: https://app.netlify.com/
   - Make sure you're logged in

2. **Add New Site:**
   - Click the **"Add new site"** button (top right)
   - Select **"Import an existing project"**

3. **Connect GitHub:**
   - Click **"GitHub"** to connect your repository
   - If prompted, authorize Netlify to access your repositories
   - Select the **`funnel-app`** repository from the list

4. **Configure Build Settings:**
   - **Branch to deploy:** `test` (important - this is your test branch)
   - **Base directory:** Leave empty (or set to `analytics-vite-app` if needed)
   - **Build command:** `cd analytics-vite-app && npm install && npm run build`
   - **Publish directory:** `analytics-vite-app/dist`

5. **Deploy:**
   - Click **"Deploy site"**
   - Wait for the build to complete (2-3 minutes)
   - The first build may fail if environment variables aren't set - that's okay!

---

## Step 2: Set Environment Variables (3 minutes)

1. **Go to Site Settings:**
   - In your new test site dashboard, click **"Site settings"** (gear icon)
   - Click **"Environment variables"** in the left sidebar

2. **Add Variables:**
   Click **"Add variable"** for each:

   **Variable 1:**
   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** `https://xiomuqqsrqiwhjyfxoji.supabase.co`
   - **Scopes:** Select "All scopes" (or just "Production" if you prefer)

   **Variable 2:**
   - **Key:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpb211cXFzcnFpd2hqeWZ4b2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODUwNDIsImV4cCI6MjA4MTU2MTA0Mn0.NqcIMi9ItZQIZ_Ku0r00z2k1FjxO5bfpX2fzPmd5GMI`
   - **Scopes:** Select "All scopes"

3. **Save:**
   - Click **"Save"** after adding each variable
   - Variables are saved automatically

---

## Step 3: Redeploy (2 minutes)

1. **Trigger New Deploy:**
   - Go to the **"Deploys"** tab in your site dashboard
   - Click **"Trigger deploy"** → **"Deploy site"**
   - This will rebuild with the new environment variables

2. **Wait for Build:**
   - The build should complete successfully now
   - You'll see a green "Published" status when done

---

## Step 4: Verify (2 minutes)

1. **Visit Your Test Site:**
   - Click on the site URL (e.g., `https://fnnl-app-test.netlify.app`)
   - Or find it in the site overview

2. **Test the Application:**
   - Try to sign up or log in
   - Verify the app loads correctly
   - Check browser console for errors (should be minimal)

3. **Verify Database Connection:**
   - Create a test account
   - Check your test Supabase project to confirm the user was created there (not in production)

---

## ✅ Done!

Your test environment is now fully set up!

**Test Site URL:** Will be shown in Netlify dashboard (e.g., `https://fnnl-app-test.netlify.app`)

**Workflow:**
- Push to `test` branch → Auto-deploys to test site
- Merge `test` → `main` → Auto-deploys to production

---

## 🆘 Troubleshooting

**Build fails:**
- Check build logs in Netlify
- Verify build command is correct
- Ensure environment variables are set

**App doesn't load:**
- Check browser console for errors
- Verify environment variables are correct
- Check that Supabase URL and key are valid

**Database connection fails:**
- Verify `VITE_SUPABASE_URL` matches your test project
- Verify `VITE_SUPABASE_ANON_KEY` is correct
- Check Supabase project is active

---

## 📝 Quick Reference

**Test Environment:**
- Supabase: `https://xiomuqqsrqiwhjyfxoji.supabase.co`
- Branch: `test`
- Netlify Site: `fnnl-app-test` (or your chosen name)

**Production Environment:**
- Supabase: (your production project)
- Branch: `main`
- Netlify Site: (your existing production site)

