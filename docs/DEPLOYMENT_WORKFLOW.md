# Deployment Workflow Guide

This document outlines the standard workflow for deploying features and updates to the FNNL application.

## Branch Strategy

### Branches

- **`main`**: Production branch - deploys to production environment
- **`test`**: Test branch - deploys to test environment
- **`dev`**: Development branch - for active development (optional)
- **`feature/*`**: Feature branches - for new features
- **`hotfix/*`**: Hotfix branches - for urgent production fixes

## Standard Deployment Flow

### 1. Feature Development

```bash
# Create a feature branch from test
git checkout test
git pull origin test
git checkout -b feature/my-new-feature

# Make your changes, commit
git add .
git commit -m "Add new feature X"

# Push feature branch
git push -u origin feature/my-new-feature
```

### 2. Deploy to Test Environment

```bash
# Merge feature to test branch
git checkout test
git merge feature/my-new-feature
git push origin test
```

**Result**: Netlify automatically deploys to test environment

### 3. Testing in Test Environment

1. Navigate to test environment URL
2. Test all functionality thoroughly
3. Verify no regressions
4. Check edge cases
5. Test with various data scenarios

### 4. Deploy to Production

Once testing is complete and approved:

```bash
# Merge test to main
git checkout main
git pull origin main
git merge test
git push origin main
```

**Result**: Netlify automatically deploys to production environment

### 5. Post-Deployment Verification

1. Navigate to production URL
2. Verify deployment succeeded
3. Spot check critical functionality
4. Monitor for errors

## Hotfix Workflow (Urgent Production Fixes)

For urgent fixes that need to go directly to production:

```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/urgent-fix

# Make the fix, commit
git add .
git commit -m "Fix urgent issue X"

# Deploy to production
git checkout main
git merge hotfix/urgent-fix
git push origin main

# Also merge to test to keep in sync
git checkout test
git merge main
git push origin test
```

## Keeping Branches in Sync

Regularly sync test branch with main to keep them aligned:

```bash
# Sync test with main
git checkout test
git merge main
git push origin test
```

**When to sync:**
- After production deployments
- Before starting new features
- Weekly maintenance

## Database Migrations

### For Test Environment

1. Create migration file in `supabase/migrations/`
2. Test migration in test Supabase project first
3. Verify migration works correctly
4. Deploy code changes to test environment
5. Test application with new schema

### For Production Environment

1. After testing in test environment
2. Deploy code changes to production
3. Run migration in production Supabase project
4. Verify migration succeeded
5. Monitor for issues

**Important**: Always test migrations in test environment first!

## Environment Variables

### When to Update

- Adding new environment variables
- Changing existing variable values
- Updating API keys

### How to Update

1. **Test Environment:**
   - Go to Netlify test site
   - Site settings > Environment variables
   - Add/update variables
   - Redeploy if needed

2. **Production Environment:**
   - Go to Netlify production site
   - Site settings > Environment variables
   - Add/update variables
   - Redeploy if needed

## Rollback Procedure

If a deployment causes issues:

### Code Rollback

```bash
# Find the last good commit
git log --oneline

# Revert to that commit
git checkout main
git reset --hard <commit-hash>
git push origin main --force
```

**Warning**: Use `--force` carefully and only when necessary!

### Database Rollback

1. If migration caused issues, create a rollback migration
2. Run rollback migration in Supabase SQL Editor
3. Verify data integrity

## Checklist Before Production Deployment

- [ ] Feature tested in test environment
- [ ] No console errors in test environment
- [ ] All functionality works as expected
- [ ] Database migrations tested (if applicable)
- [ ] Environment variables updated (if needed)
- [ ] Code reviewed (if working with team)
- [ ] Breaking changes documented
- [ ] User-facing changes documented

## Checklist After Production Deployment

- [ ] Deployment succeeded in Netlify
- [ ] Production site loads correctly
- [ ] Critical functionality verified
- [ ] No errors in browser console
- [ ] Database migrations applied (if applicable)
- [ ] Monitoring alerts checked
- [ ] PostHog events tracking (if applicable)

## Common Commands

```bash
# View current branch
git branch

# Switch branches
git checkout <branch-name>

# Create and switch to new branch
git checkout -b <branch-name>

# View commit history
git log --oneline

# View uncommitted changes
git status

# Pull latest changes
git pull origin <branch-name>

# Push changes
git push origin <branch-name>

# Merge branch
git merge <branch-name>

# View Netlify deployment status
# (Check Netlify dashboard)
```

## Troubleshooting

### Deployment Fails

1. Check Netlify build logs
2. Verify build command is correct
3. Check for TypeScript/ESLint errors
4. Verify all dependencies are in `package.json`

### Environment Variables Not Working

1. Verify variables are set in Netlify
2. Check variable names match exactly (case-sensitive)
3. Ensure variables start with `VITE_` for Vite apps
4. Redeploy after adding variables

### Database Connection Issues

1. Verify Supabase URL and keys are correct
2. Check Supabase project is active
3. Verify RLS policies allow access
4. Check network connectivity

## Best Practices

1. **Always test in test environment first**
2. **Keep commits small and focused**
3. **Write descriptive commit messages**
4. **Test database migrations in test first**
5. **Monitor both environments after deployment**
6. **Document breaking changes**
7. **Keep test and main branches in sync**
8. **Use feature branches for new work**
9. **Review code before merging to main**
10. **Have a rollback plan ready**

