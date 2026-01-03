# Deployment Reference - Quick Guide

## ⚠️ CRITICAL: Branch Configuration

**Production deploys from `dev` branch, NOT `main`!**
**Test deploys from `test` branch.**

## Test Environment

- **Git Branch:** `test`
- **Netlify Site Name:** `fnnl-app-test`
- **Netlify Site ID:** `4e44bee4-893e-494e-be35-1a12f341b6c9`
- **URL:** `https://fnnl-app-test.netlify.app`
- **Deployment:** Automatic on push to `test` branch

### To Deploy to Test:
```bash
git checkout test
git merge <your-feature-branch>
git push origin test
```

## Production Environment

- **Git Branch:** `dev` ⚠️ **NOT `main`**
- **Netlify Site Name:** `fnnl-app-prod`
- **Netlify Site ID:** `8313f660-c306-4d5e-af13-eeeb793bfd87`
- **URL:** `https://app.fnnlapp.com`
- **Deployment:** Automatic on push to `dev` branch

### To Deploy to Production:
```bash
git checkout dev
git merge test  # or merge from your feature branch
git push origin dev
```

## Netlify Configuration

- **Base Directory:** `analytics-vite-app` (set in `netlify.toml`)
- **Build Command:** `npm install && npm run build` (runs in base directory)
- **Publish Directory:** `dist` (relative to base directory, resolves to `analytics-vite-app/dist`)

## Standard Workflow

1. **Develop** → Create feature branch
2. **Test** → Merge to `test` branch → Auto-deploys to test environment
3. **Production** → Merge to `dev` branch → Auto-deploys to production

## Important Notes

- The `main` branch exists but is **NOT used for deployments**
- Always verify which branch production is configured to use in Netlify dashboard
- When deploying, always push to `dev` for production, not `main`

