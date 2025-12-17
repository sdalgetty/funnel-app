# Manual Migration Instructions for Test Database

Since Supabase doesn't allow direct SQL execution via the API for security reasons, you'll need to run migrations manually in the SQL Editor.

## Steps

1. **Go to your test Supabase project SQL Editor:**
   - Navigate to: https://app.supabase.com/project/[your-project-id]/sql
   - Or: Dashboard → SQL Editor

2. **Run migrations in order:**
   - Open each file from `supabase/migrations/` in numerical order
   - Copy the entire SQL content
   - Paste into SQL Editor
   - Click "Run" or press Cmd/Ctrl + Enter
   - Wait for success confirmation
   - Move to the next migration

3. **Migration files (in order):**
   - 001_init.sql
   - 002_add_company_name.sql
   - 003_add_company_name_only.sql
   - 004_company_name_final.sql
   - 005_add_monthly_funnel_data.sql
   - 006_add_funnel_unique_constraint.sql
   - 007_fix_funnel_data_constraints.sql
   - 008_add_booking_additional_fields.sql
   - 009_add_payment_schedule_fields.sql
   - 010_add_tracks_in_funnel_to_service_types.sql
   - 011_make_booking_date_nullable.sql
   - 012_add_first_last_name.sql
   - 013_simplify_advertising_remove_ad_source.sql
   - 014_add_notes_to_ad_campaigns.sql
   - 015_add_funnel_notes.sql
   - 016_add_funnel_manual_overrides.sql
   - 017_add_account_sharing.sql
   - 018_fix_account_share_steve.sql
   - 019_add_admin_support.sql
   - 020_add_phone_website_to_user_profiles.sql
   - 021_fix_performance_and_security_issues.sql
   - 022_fix_function_search_path.sql
   - 023_optimize_rls_policies_performance.sql
   - 024_add_crm_to_user_profiles.sql

## Quick Copy-Paste Script

You can also use this to quickly view all migrations:

```bash
# List all migrations
ls -1 supabase/migrations/*.sql | grep -v seed

# View a specific migration
cat supabase/migrations/001_init.sql
```

## Verification

After running all migrations, verify the schema:

1. Go to Database → Tables in Supabase dashboard
2. You should see tables like:
   - user_profiles
   - bookings
   - funnel_data
   - service_types
   - lead_sources
   - ad_campaigns
   - account_shares
   - admin_access_logs
   - etc.

## Troubleshooting

- **Error: relation already exists** - Migration may have already run, skip it
- **Error: column already exists** - Migration may have already run, skip it
- **Permission errors** - Make sure you're using the SQL Editor (has full permissions)

