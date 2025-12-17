# Environment Variables Reference

This document lists all environment variables used in the FNNL application and how to configure them.

## Required Variables

### `VITE_SUPABASE_URL`
- **Description**: The URL of your Supabase project
- **Format**: `https://<project-id>.supabase.co`
- **Where to find**: Supabase Dashboard > Settings > API > Project URL
- **Example**: `https://lqtzjwgsgimsnbmxfmra.supabase.co`
- **Required**: Yes

### `VITE_SUPABASE_ANON_KEY`
- **Description**: The anonymous/public key for Supabase client-side access
- **Format**: Long JWT token string
- **Where to find**: Supabase Dashboard > Settings > API > anon public key
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Required**: Yes
- **Security**: This is safe to expose in client-side code (RLS policies protect data)

## Optional Variables

### `VITE_POSTHOG_KEY`
- **Description**: PostHog project API key for analytics
- **Format**: String
- **Where to find**: PostHog Dashboard > Project Settings > Project API Key
- **Example**: `phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Required**: No (analytics will be disabled if not set)
- **Note**: Should be the same for both test and production if you want unified analytics

### `VITE_POSTHOG_HOST`
- **Description**: PostHog API host URL
- **Format**: URL string
- **Default**: `https://us.i.posthog.com`
- **Required**: No
- **Options**:
  - US: `https://us.i.posthog.com` (default)
  - EU: `https://eu.i.posthog.com`

## Environment-Specific Configuration

### Test Environment
Set these in Netlify test site:
```
VITE_SUPABASE_URL=https://your-test-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-test-anon-key
VITE_POSTHOG_KEY=your-posthog-key (optional)
VITE_POSTHOG_HOST=https://us.i.posthog.com (optional)
```

### Production Environment
Set these in Netlify production site:
```
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_POSTHOG_KEY=your-posthog-key (optional)
VITE_POSTHOG_HOST=https://us.i.posthog.com (optional)
```

## Local Development

Create a `.env` file in `analytics-vite-app/` directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_POSTHOG_KEY=your-posthog-key
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

**Important**: 
- Never commit `.env` files to git
- The `.env` file should be in `.gitignore`
- Use different values for local development if needed

## Setting Variables in Netlify

### Via Netlify Dashboard

1. Go to your Netlify site
2. Navigate to **Site settings** > **Environment variables**
3. Click **Add variable**
4. Enter variable name (e.g., `VITE_SUPABASE_URL`)
5. Enter variable value
6. Select scope:
   - **All scopes**: Available to all deployments
   - **Production**: Only production deployments
   - **Deploy previews**: Only preview deployments
   - **Branch deploys**: Only branch deployments
7. Click **Save**

### Via Netlify CLI

```bash
# Set a variable
netlify env:set VITE_SUPABASE_URL "https://your-project.supabase.co" --context production

# List all variables
netlify env:list

# Get a variable value
netlify env:get VITE_SUPABASE_URL
```

## Variable Naming Convention

All Vite environment variables **must** start with `VITE_` to be exposed to the client-side code.

**Why?** Vite only exposes variables prefixed with `VITE_` to the browser for security reasons.

## Security Notes

### Safe to Expose (Client-Side)
- `VITE_SUPABASE_URL`: Public URL, safe to expose
- `VITE_SUPABASE_ANON_KEY`: Public key, protected by RLS policies
- `VITE_POSTHOG_KEY`: Public API key, safe to expose

### Never Expose (Server-Side Only)
- `SUPABASE_SERVICE_ROLE_KEY`: Should NEVER be in client-side code
- Database passwords
- Private API keys

## Verification

### Check Variables Are Loaded

In browser console (after deployment):
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)
```

### Common Issues

1. **Variable not found**: 
   - Check variable name starts with `VITE_`
   - Verify variable is set in Netlify
   - Redeploy after adding variables

2. **Wrong value**:
   - Double-check the value in Netlify dashboard
   - Ensure no extra spaces or quotes
   - Redeploy after updating

3. **Variable undefined**:
   - Check variable is set for the correct scope
   - Verify build completed successfully
   - Check browser console for errors

## Updating Variables

### Test Environment
1. Update in Netlify test site settings
2. Trigger a new deployment (or wait for next push)
3. Verify in test environment

### Production Environment
1. Update in Netlify production site settings
2. Trigger a new deployment (or wait for next push)
3. Verify in production environment
4. Monitor for issues

**Best Practice**: Update test environment first, verify it works, then update production.

## Migration Checklist

When setting up a new environment:

- [ ] Create Supabase project (if separate)
- [ ] Get Supabase URL and anon key
- [ ] Set `VITE_SUPABASE_URL` in Netlify
- [ ] Set `VITE_SUPABASE_ANON_KEY` in Netlify
- [ ] Set `VITE_POSTHOG_KEY` (if using analytics)
- [ ] Set `VITE_POSTHOG_HOST` (if different from default)
- [ ] Verify variables are loaded correctly
- [ ] Test application functionality

