# Remaining Security Fixes

## ✅ Fixed via Migration

### 1. Function Search Path Mutable
**Status:** ✅ **FIXED**
- **Issue:** The `is_admin()` function had a mutable search_path
- **Fix Applied:** Updated function with `SET search_path = public, pg_temp`
- **Migration:** `022_fix_function_search_path.sql`

---

## 🔧 Manual Fixes Required (Dashboard)

### 2. Leaked Password Protection Disabled

**Issue:** Supabase Auth is not checking passwords against HaveIBeenPwned.org

**Status:** ⚠️ **Requires Pro Plan** - Optional Enhancement

**Note:** This feature is only available on Supabase Pro Plan ($25/month) or higher. It's a security enhancement but not critical for basic security.

**If you have Pro Plan:**
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **funnelapp-prod**
3. Navigate to: **Authentication** → **Settings** → **Password Security**
4. Enable: **"Check passwords against HaveIBeenPwned database"**
5. Save changes

**If you don't have Pro Plan:**
- This is a **non-critical** security warning
- Your authentication is still secure without this feature
- Consider upgrading to Pro Plan if you want this additional security layer
- The warning will remain but won't affect your app's security

**Reference:** https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

---

### 3. Vulnerable Postgres Version

**Issue:** Current version `supabase-postgres-17.4.1.074` has security patches available

**How to Fix:**
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **funnelapp-prod**
3. Navigate to: **Settings** → **Infrastructure** → **Database**
4. Look for: **Database Version** or **Upgrade Database**
5. Click: **"Upgrade Database"** or **"Apply Updates"**
6. Review the upgrade notes (usually minor version updates)
7. Confirm the upgrade (may require a brief maintenance window)

**Important Notes:**
- Database upgrades are usually safe and non-breaking
- Minor version upgrades (e.g., 17.4.1 → 17.4.2) are typically just security patches
- The upgrade may require a brief maintenance window (usually < 5 minutes)
- Supabase will handle the upgrade automatically

**Reference:** https://supabase.com/docs/guides/platform/upgrading

---

## Summary

| Issue | Status | Action Required | Priority |
|-------|--------|----------------|----------|
| Function Search Path | ✅ Fixed | None - Migration applied | ✅ Critical - Fixed |
| Leaked Password Protection | ⚠️ Pro Plan Only | Enable in Auth settings (if Pro Plan) | ⚠️ Optional Enhancement |
| Postgres Version | ⚠️ Manual | Upgrade via Dashboard | ✅ Important - Security Patches |

After completing the manual fixes, refresh your Supabase dashboard and the security issues should be resolved.

