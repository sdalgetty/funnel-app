# Admin Dashboard Setup Instructions

## ✅ Migration Status
The database migration (`019_add_admin_support.sql`) has been **successfully applied** to your production database!

## 🔧 Next Step: Set Your Admin Account

You need to set your account as admin. You have two options:

### Option 1: Supabase Dashboard (Recommended - Easiest)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/lqtzjwgsgimsnbmxfmra
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Set yourself as admin
UPDATE user_profiles
SET is_admin = TRUE
WHERE email = 'hello@anendlesspursuit.com';

-- Verify the update
SELECT id, email, full_name, company_name, is_admin, created_at
FROM user_profiles
WHERE email = 'hello@anendlesspursuit.com';
```

5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see your account with `is_admin = true`

### Option 2: Using the Complete Setup Script

If you prefer to run everything at once, use the `run-admin-setup.sql` file:

1. Go to Supabase Dashboard > SQL Editor
2. Copy the entire contents of `run-admin-setup.sql`
3. Paste and run it

**Note:** The migration part will be skipped (already applied), but the admin account setup will run.

## ✅ Verification

After setting your admin account, verify it worked:

```sql
SELECT id, email, full_name, is_admin, created_at
FROM user_profiles
WHERE is_admin = TRUE;
```

You should see your account listed.

## 🚀 Using the Admin Dashboard

Once your account is set as admin:

1. **Log in** to your app at https://fnnl-app-prod.netlify.app
2. You'll see an **"Admin"** button in the navigation bar
3. Click it to access the Admin Dashboard
4. You can now:
   - View all users
   - Search users
   - View user details and stats
   - Impersonate users (with full edit access)
   - View access logs

## 📝 Files Created

- ✅ `supabase/migrations/019_add_admin_support.sql` - Database migration (APPLIED)
- ✅ `run-admin-setup.sql` - Complete setup script (includes migration + admin setup)
- ✅ `set-admin-account.sql` - Simple admin account setup script

## 🔒 Security Notes

- Only accounts with `is_admin = TRUE` can access the admin dashboard
- All admin actions are logged in `admin_access_logs` table
- Impersonation sessions are tracked with unique session IDs
- 30-minute inactivity timeout automatically ends impersonation
- Logout automatically ends impersonation




