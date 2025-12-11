# Custom Domain Setup Guide: app.fnnlapp.com

## Overview
This guide will help you configure `app.fnnlapp.com` to point to your Netlify site `fnnl-app-prod`.

## Step 1: Configure Domain in Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Select your site **"fnnl-app-prod"**
3. Go to **Site settings** → **Domain management**
4. Click **"Add custom domain"**
5. Enter: `app.fnnlapp.com`
6. Click **"Verify"** or **"Add domain"**
7. Netlify will show you the DNS records you need to configure

## Step 2: Configure DNS in GoDaddy

### Option A: Using CNAME (Recommended for subdomain)

1. Log into [GoDaddy](https://www.godaddy.com/)
2. Go to **My Products** → **DNS** (or **Domains** → **Manage DNS**)
3. Find `fnnlapp.com` domain
4. Look for the DNS records section

**For `app.fnnlapp.com` (subdomain):**
- **Type**: CNAME
- **Name**: `app` (or `app.fnnlapp.com` depending on GoDaddy's interface)
- **Value**: `fnnl-app-prod.netlify.app` (or the exact value Netlify shows you)
- **TTL**: 600 (or default)

**Important Notes:**
- The CNAME value should be exactly what Netlify provides (usually `fnnl-app-prod.netlify.app` or similar)
- Make sure there's NO A record for `app` - CNAME and A records can't coexist for the same subdomain
- Remove any existing A records for `app` if they exist

### Option B: If CNAME doesn't work, use A Records

If GoDaddy doesn't support CNAME for subdomains (unlikely but possible):

1. Get the IP addresses from Netlify:
   - In Netlify, go to **Domain management** → **DNS configuration**
   - Netlify will show you the A record IPs (usually 2-4 IP addresses)

2. In GoDaddy, create A records:
   - **Type**: A
   - **Name**: `app`
   - **Value**: [IP address from Netlify] (create one A record for each IP)
   - **TTL**: 600

## Step 3: Verify DNS Propagation

After updating DNS:

1. Wait 5-10 minutes (DNS can take up to 48 hours, but usually much faster)
2. Check DNS propagation using:
   - [whatsmydns.net](https://www.whatsmydns.net/#CNAME/app.fnnlapp.com)
   - Or run: `nslookup app.fnnlapp.com` in terminal
3. The CNAME should point to your Netlify domain

## Step 4: SSL Certificate (Automatic)

Netlify will automatically provision an SSL certificate once DNS is configured correctly. This usually takes 5-60 minutes after DNS propagates.

## Step 5: Update Supabase Redirect URLs

After the domain is working, update Supabase to allow redirects:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Add to **Redirect URLs**:
   - `https://app.fnnlapp.com`
   - `https://app.fnnlapp.com/**`
5. Update **Site URL** to: `https://app.fnnlapp.com`

## Common Issues & Solutions

### Issue: DNS not resolving after 36+ hours

**Possible causes:**
1. **Wrong CNAME value** - Double-check it matches exactly what Netlify shows
2. **A record conflict** - Remove any A records for `app` subdomain
3. **TTL too high** - Lower TTL to 600 seconds for faster updates
4. **DNS caching** - Clear your browser DNS cache or use a different network
5. **GoDaddy propagation delay** - Some GoDaddy accounts have slower propagation

**Troubleshooting steps:**
```bash
# Check what DNS sees
dig app.fnnlapp.com
# or
nslookup app.fnnlapp.com

# Should show CNAME pointing to Netlify domain
```

### Issue: "Domain not verified" in Netlify

- Make sure DNS is correctly configured
- Wait for DNS propagation (can take up to 48 hours)
- Check Netlify's domain verification status in Domain management

### Issue: SSL certificate not provisioning

- Ensure DNS is correctly pointing to Netlify
- Wait 5-60 minutes after DNS propagates
- Check Netlify's SSL status in Domain management

## Verification Checklist

- [ ] CNAME record added in GoDaddy for `app.fnnlapp.com`
- [ ] CNAME points to Netlify domain (check exact value in Netlify)
- [ ] No conflicting A records for `app` subdomain
- [ ] Domain added in Netlify Domain management
- [ ] DNS propagated (check with whatsmydns.net)
- [ ] SSL certificate provisioned (check in Netlify)
- [ ] Supabase redirect URLs updated
- [ ] Site accessible at https://app.fnnlapp.com

## Next Steps After Setup

1. Test the domain: Visit `https://app.fnnlapp.com`
2. Update any hardcoded URLs in the codebase if needed
3. Update documentation with the new domain
4. Consider setting up `fnnlapp.com` (root domain) if needed (requires different DNS setup)


