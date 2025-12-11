# Admin Dashboard Implementation

## Overview
Complete admin dashboard system for managing users, viewing data, and impersonating users with full edit capabilities.

## Features Implemented

### 1. Database Schema
- **Migration**: `019_add_admin_support.sql`
  - Added `is_admin` flag to `user_profiles` table
  - Created `admin_access_logs` table for tracking all admin actions
  - Added `is_admin()` function for RLS policy checks
  - Added admin bypass policies for all data tables (service_types, lead_sources, bookings, payments, ad_campaigns, funnels, forecast_models)

### 2. Admin Service (`adminService.ts`)
- `isAdmin()` - Check if current user is admin
- `getAllUsers()` - Get all users (for admin dashboard)
- `getUserById()` - Get specific user details
- `logAction()` - Log admin actions with session tracking
- `getAccessLogs()` - Get all access logs
- `getImpersonationSessions()` - Get impersonation sessions with start/end times
- `getSessionActions()` - Get actions taken during a specific session

### 3. AuthContext Updates
- Added `isAdmin`, `impersonatingUserId`, `impersonatingUser`, `impersonationSessionId` state
- Added `startImpersonation(userId)` - Start impersonating a user
- Added `stopImpersonation()` - End impersonation session
- **30-minute inactivity timeout** - Auto-ends impersonation after 30 minutes of inactivity
- **Auto-end on logout** - Impersonation ends when admin logs out
- **Activity tracking** - Resets timer on mouse/keyboard/scroll/touch events
- `effectiveUserId` now prioritizes: impersonated user > guest owner > current user

### 4. Admin Dashboard UI
- **AdminDashboard.tsx** - Main dashboard with:
  - User list with search functionality
  - User stats (bookings, payments, service types, lead sources, revenue)
  - Impersonation controls
  - Access logs viewer
- **AdminUserDetail.tsx** - Detailed user view with:
  - User information display
  - Data statistics
  - "Impersonate User" button
- **AdminAccessLogs.tsx** - Access logs viewer with:
  - All logs view
  - Impersonation sessions view
  - Session action details

### 5. Impersonation Banner
- Shows when admin is impersonating: "🔧 Admin Mode: Impersonating [User Name]"
- "Return to Admin" button to end impersonation
- Blue styling to distinguish from guest view banner

### 6. Action Logging
- Logs all data operations when impersonating:
  - `save_funnel_data` - When saving funnel data
  - `create_booking` - When creating bookings
  - `update_booking` - When updating bookings
  - `delete_booking` - When deleting bookings
- All logs include:
  - Admin user ID
  - Target user ID (impersonated user)
  - Action type
  - Action details (JSONB)
  - Impersonation session ID
  - Timestamp

### 7. Navigation
- Admin button in main navigation (only visible to admins)
- `/admin` route for admin dashboard
- Automatic redirect when impersonating starts

## Setup Instructions

### 1. Run Database Migration
```sql
-- Run the migration in Supabase SQL Editor
-- File: supabase/migrations/019_add_admin_support.sql
```

### 2. Set Yourself as Admin
```sql
-- Run this SQL script
-- File: set-admin-account.sql
UPDATE user_profiles
SET is_admin = TRUE
WHERE email = 'hello@anendlesspursuit.com';
```

### 3. Access Admin Dashboard
- Log in as admin
- Click "Admin" button in navigation
- Or navigate to `/admin`

## Usage

### Viewing Users
1. Go to Admin Dashboard
2. Browse all users in the list
3. Use search to find specific users
4. Click "View" to see user details

### Impersonating a User
1. Go to Admin Dashboard
2. Find the user you want to impersonate
3. Click "View" on the user
4. Click "Impersonate User" button
5. You'll be redirected to the main app as that user
6. All actions will be logged

### Ending Impersonation
- Click "Return to Admin" button in the banner
- Or wait 30 minutes of inactivity (auto-ends)
- Or log out (auto-ends)

### Viewing Access Logs
1. Go to Admin Dashboard
2. Click "Access Logs" tab
3. View all logs or filter by impersonation sessions
4. Click on a session to see actions taken

## Security Features

1. **RLS Policies**: All admin access is controlled by RLS policies
2. **Admin Check**: Every admin action verifies `is_admin = true`
3. **Audit Trail**: All actions are logged with timestamps
4. **Session Tracking**: Impersonation sessions are tracked with unique IDs
5. **Auto-timeout**: 30-minute inactivity timeout prevents unauthorized access
6. **No Password Exchange**: Admins use their own credentials, then impersonate

## Logged Actions

- `impersonate_start` - When impersonation begins
- `impersonate_end` - When impersonation ends
- `view_user` - When viewing a user's details
- `edit_data` - When editing user data (includes sub-actions like `save_funnel_data`, `create_booking`, etc.)

## Files Created/Modified

### New Files
- `supabase/migrations/019_add_admin_support.sql`
- `analytics-vite-app/src/services/adminService.ts`
- `analytics-vite-app/src/components/AdminDashboard.tsx`
- `analytics-vite-app/src/components/AdminUserDetail.tsx`
- `analytics-vite-app/src/components/AdminAccessLogs.tsx`
- `set-admin-account.sql`

### Modified Files
- `analytics-vite-app/src/contexts/AuthContext.tsx` - Added admin/impersonation state
- `analytics-vite-app/src/App.tsx` - Added admin route and impersonation banner
- `analytics-vite-app/src/hooks/useDataManager.ts` - Added action logging

## Next Steps (Future Enhancements)

1. Add more detailed action logging (view pages, filter data, etc.)
2. Add search/filter to access logs
3. Add bulk actions for users
4. Add user activity metrics
5. Add export functionality for logs
6. Add admin notifications/alerts




