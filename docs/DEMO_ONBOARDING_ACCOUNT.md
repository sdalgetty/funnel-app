# Demo Onboarding Account

## Overview

The demo onboarding account is a special test account that automatically resets all user data (except profile information) on each login. This allows you to demonstrate the onboarding experience without manually creating new accounts or deleting data each time.

## How It Works

When a user with the demo onboarding email logs in:
1. All data is automatically cleared (funnel data, bookings, payments, ad campaigns, forecast models, etc.)
2. Profile information is **preserved** (name, company, email, etc.)
3. Default service types and lead sources are recreated
4. The user sees a fresh, first-time experience

## Setup

### 1. Create the Demo Account

Create a user account with the email: `demo-onboarding@test.com`

You can create this account through:
- The normal sign-up flow in the app
- Supabase Auth admin panel
- SQL script (see below)

### 2. Set Up Profile Information

After creating the account, log in and fill out the Profile page with the information you want to demonstrate:
- First Name
- Last Name
- Company Name
- Phone
- Website
- CRM

This profile information will be preserved across resets.

### 3. Configure (Optional)

The demo account email can be customized via environment variable:

```bash
VITE_DEMO_ONBOARDING_EMAIL=demo-onboarding@test.com
```

If not set, it defaults to `demo-onboarding@test.com`.

## Usage

1. Log in with the demo onboarding account
2. The system automatically clears all data (except profile)
3. Demonstrate the onboarding flow
4. Log out
5. Log back in to reset again for the next demonstration

## What Gets Reset

**Cleared:**
- Funnel data (all months/years)
- Bookings
- Payments
- Ad campaigns
- Ad sources
- Forecast models
- Service types (recreated as defaults)
- Lead sources (recreated as defaults)

**Preserved:**
- User profile (name, company, email, phone, website, CRM)
- Account settings
- Subscription tier

## Technical Details

The reset happens in `AuthContext.tsx` during the `SIGNED_IN` event, after the profile is loaded but before the user sees the app. The actual reset logic is in `UnifiedDataService.resetDemoAccountData()`.

## Security & Safety

### Multiple Safeguards

This feature has **multiple layers of protection** to ensure it can NEVER run in production:

1. **Environment Detection**: Only works in test environment (Netlify test sites with `netlify.app` domain)
2. **Production Block**: Explicitly blocks if hostname contains `app.fnnlapp.com` (production domain)
3. **Email Match**: Only works for the exact demo account email
4. **Event Check**: Only runs on `SIGNED_IN` event (not token refresh)
5. **Double Check**: Both AuthContext and UnifiedDataService verify test environment
6. **Optional Env Flag**: Can be further restricted with `VITE_ENABLE_DEMO_RESET=true` environment variable

### Production Safety

- **Production is completely protected**: If the demo account email is used in production, the reset will NOT run
- **Warning logs**: If demo account tries to log in to production, warnings are logged but no action is taken
- **No risk to real users**: Even if someone uses the demo email in production, their data is safe

### Test Environment Only

This feature is **designed for test/demo environments only**. The reset happens automatically on login, so be careful not to use this email for real user accounts.

### Environment Variable Control

You can add an additional safeguard by setting:
```bash
VITE_ENABLE_DEMO_RESET=true
```

If this is set, the feature will ONLY work when this variable is `true` or `1`. If not set, it defaults to allowing in test environments.

