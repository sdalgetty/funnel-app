# Environment Setup

## Supabase Configuration

To use the full authentication and database features, you need to configure Supabase:

1. Create a `.env` file in the root directory
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development Mode

If Supabase is not configured, the app will run in development mode with:
- A mock user with Pro subscription (full access to all features)
- Mock authentication (any email/password will work)
- Console warning about missing environment variables

## Database Setup

Run the SQL migration in `run-migration.sql` in your Supabase SQL Editor to set up the database schema.

## Current Status

✅ App loads successfully on http://localhost:3004
✅ JavaScript errors fixed
✅ Authentication works (mock mode)
✅ All features accessible (Pro subscription)
