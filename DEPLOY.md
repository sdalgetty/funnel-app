# Deployment Guide

This guide covers CLI-based deployments to both Test and Production environments.

## Prerequisites

- Netlify CLI installed (`npm install -g netlify-cli`)
- Authenticated with Netlify (`netlify login`)
- Built the application (`cd analytics-vite-app && npm run build`)

## Deployment Process

### Step 1: Build the Application

```bash
cd analytics-vite-app
npm run build
cd ..
```

This creates the `dist` folder in `analytics-vite-app/dist`.

### Step 2: Deploy to Test Environment

```bash
# Link to test site
netlify link --name fnnl-app-test

# Deploy to test (preview/deploy preview - omit --prod flag)
netlify deploy --dir=analytics-vite-app/dist
```

**Test Site:** `https://fnnl-app-test.netlify.app`

### Step 3: Deploy to Production Environment

```bash
# Link to production site
netlify link --name fnnl-app-prod

# Deploy to production
netlify deploy --dir=analytics-vite-app/dist --prod
```

**Production Site:** `https://app.fnnlapp.com`

## Quick Deploy Script

You can also use these one-liners:

**Test:**
```bash
cd analytics-vite-app && npm run build && cd .. && netlify link --name fnnl-app-test && netlify deploy --dir=analytics-vite-app/dist
```

**Production:**
```bash
cd analytics-vite-app && npm run build && cd .. && netlify link --name fnnl-app-prod && netlify deploy --dir=analytics-vite-app/dist --prod
```

## Site IDs

- **Test:** `4e44bee4-893e-494e-be35-1a12f341b6c9`
- **Production:** `8313f660-c306-4d5e-af13-eeeb793bfd87`

## Configuration

The `netlify.toml` file in the repo root contains:
- Base directory: `analytics-vite-app`
- Build command: `npm install && npm run build`
- Publish directory: `dist`

**Note:** For CLI deployments, we build locally and deploy the `dist` folder directly, so the build command in `netlify.toml` is not used. The file is kept for reference and future Git-based deployments.

## Verification

After deployment:
1. Check the deployment URL provided by Netlify CLI
2. Visit the site and verify changes
3. Check browser console for errors
4. Test critical functionality

## Troubleshooting

**Build fails:**
- Ensure you're in the correct directory
- Run `npm install` in `analytics-vite-app` if needed
- Check for TypeScript/compilation errors

**Deploy fails:**
- Verify Netlify CLI is authenticated: `netlify status`
- Check site is linked: `netlify status`
- Ensure `dist` folder exists and contains built files

**Wrong site deployed:**
- Use `netlify link --name <site-name>` to switch sites
- Verify with `netlify status`

