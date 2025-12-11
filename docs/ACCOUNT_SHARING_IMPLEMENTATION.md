# Account Sharing Implementation Plan

## Overview
Allow users to share their account with guests (coaches/mentors) who can view data in read-only mode.

## Database Schema

### 1. Create `account_shares` table
```sql
create table account_shares (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  guest_user_id uuid references auth.users(id) on delete cascade, -- nullable until guest accepts
  guest_email text not null, -- email of invited guest
  invitation_token text unique, -- unique token for invitation link
  status text not null default 'pending', -- 'pending', 'accepted', 'revoked'
  role text not null default 'viewer', -- 'viewer', 'editor' (for future)
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_user_id, guest_email),
  unique(invitation_token)
);

-- Indexes
create index account_shares_owner_idx on account_shares(owner_user_id);
create index account_shares_guest_idx on account_shares(guest_user_id);

-- RLS
alter table account_shares enable row level security;

-- Policies
create policy "Owners can view their shares"
  on account_shares for select
  using (auth.uid() = owner_user_id);

create policy "Guests can view shares they're part of"
  on account_shares for select
  using (auth.uid() = guest_user_id);

create policy "Owners can create shares"
  on account_shares for insert
  with check (auth.uid() = owner_user_id);

create policy "Owners can delete their shares"
  on account_shares for delete
  using (auth.uid() = owner_user_id);
```

### 2. Update RLS Policies for Data Tables

For each data table (bookings, payments, funnels, etc.), add a policy that allows guests to read:

```sql
-- Example for bookings table
create policy "Guests can view shared accounts' bookings"
  on bookings for select
  using (
    user_id in (
      select owner_user_id 
      from account_shares 
      where guest_user_id = auth.uid() 
      and role = 'viewer'
    )
  );
```

## Application Changes

### 1. AuthContext Updates
- Add `viewingAsGuest` boolean flag
- Add `sharedAccountOwnerId` to track which account is being viewed
- Add `isViewOnly` computed property
- Add methods: `switchToSharedAccount(ownerId)`, `switchToOwnAccount()`

### 2. Data Service Updates
- Modify all data service methods to use `effectiveUserId` instead of `userId`
- `effectiveUserId = viewingAsGuest ? sharedAccountOwnerId : currentUserId`
- For write operations, check `isViewOnly` and block if true

### 3. UI Changes
- Add "Share Account" section in UserProfile
- Show "Viewing as Guest" banner when in guest mode
- Disable all edit/delete buttons when `isViewOnly` is true
- Add "Switch to My Account" button when viewing as guest

## Implementation Steps

1. **Database Migration**
   - Create `account_shares` table
   - Update RLS policies for all data tables

2. **Backend/Service Layer**
   - Update `AuthContext` with guest viewing logic
   - Update `UnifiedDataService` to use effective user ID
   - Add share management service methods

3. **UI Components**
   - Add share management UI in UserProfile
   - Add view-only mode indicators
   - Disable edit operations in view-only mode

4. **Testing**
   - Test guest can view owner's data
   - Test guest cannot edit/delete
   - Test owner can revoke access
   - Test multiple guests can view same account

## Security Considerations

1. **RLS is Critical**: All data access must go through RLS policies
2. **No Write Access**: Guests should never be able to write, even if RLS allows it
3. **Audit Trail**: Log all share creation/revocation
4. **Rate Limiting**: Prevent abuse of share creation

## Email Invitation Flow

### Overview
When an owner invites a guest, the guest receives an email with a special invitation link. The link allows them to:
1. Create an account (if they don't have one)
2. Accept the invitation
3. Automatically gain view-only access to the owner's data

### Implementation Options

#### Option 1: Supabase Admin API + Custom Email Service (Recommended)
**Pros**: Full control over email design, can use any email service (SendGrid, Resend, etc.)
**Cons**: Requires setting up email service

**Steps:**
1. Owner enters guest email in UI
2. Generate unique `invitation_token` (UUID)
3. Create `account_shares` record with `status='pending'` and `invitation_token`
4. Send email via email service (Resend, SendGrid, etc.) with link:
   ```
   https://yourapp.com/accept-invite?token={invitation_token}
   ```
5. Guest clicks link → redirected to signup/login page with token
6. After guest signs up/logs in → automatically accept invitation
7. Update `account_shares` with `guest_user_id` and `status='accepted'`

#### Option 2: Supabase Auth Invitations (Simpler)
**Pros**: Built-in, no email service setup needed
**Cons**: Less control over email template, requires Supabase Pro plan

**Steps:**
1. Use Supabase Admin API to invite user:
   ```typescript
   await supabaseAdmin.auth.admin.inviteUserByEmail(guestEmail, {
     data: { invitation_type: 'guest_viewer' }
   })
   ```
2. Create `account_shares` record when invitation is sent
3. Guest receives Supabase's default invitation email
4. Guest signs up via invitation link
5. In auth callback, check for pending invitations and auto-accept

### Email Template Example

```html
Subject: You've been invited to view [Owner Name]'s analytics

Hi there,

[Owner Name] has invited you to view their business analytics as a guest viewer.

Click the link below to accept the invitation and create your account:
https://yourapp.com/accept-invite?token={invitation_token}

This link will expire in 7 days.

As a guest viewer, you'll be able to:
- View all analytics and reports
- See bookings, revenue, and forecasts
- View advertising performance

You will NOT be able to:
- Edit or delete any data
- Change settings
- Invite other guests

If you didn't expect this invitation, you can safely ignore this email.

Best regards,
Your Analytics App Team
```

### Invitation Acceptance Flow

1. **Guest clicks invitation link** → `/accept-invite?token={token}`
2. **Check if token is valid**:
   - Query `account_shares` where `invitation_token = token` and `status = 'pending'`
   - If not found or expired → show error
3. **If guest is logged in**:
   - Auto-accept invitation
   - Update `account_shares` with `guest_user_id` and `status='accepted'`
   - Redirect to app with guest view enabled
4. **If guest is NOT logged in**:
   - Show signup/login form
   - Store token in session/localStorage
   - After successful auth → auto-accept invitation
   - Redirect to app with guest view enabled

### Code Example: Invite Guest

```typescript
// In share management service
async function inviteGuest(ownerId: string, guestEmail: string) {
  // Generate unique token
  const invitationToken = crypto.randomUUID();
  
  // Create pending share
  const { data, error } = await supabase
    .from('account_shares')
    .insert({
      owner_user_id: ownerId,
      guest_email: guestEmail,
      invitation_token: invitationToken,
      status: 'pending',
      role: 'viewer'
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Send invitation email (via your email service)
  await sendInvitationEmail({
    to: guestEmail,
    ownerName: ownerProfile.name,
    invitationLink: `${APP_URL}/accept-invite?token=${invitationToken}`
  });
  
  return data;
}
```

### Code Example: Accept Invitation

```typescript
// In AuthContext or invitation handler
async function acceptInvitation(token: string, guestUserId: string) {
  // Find pending invitation
  const { data: share, error: findError } = await supabase
    .from('account_shares')
    .select('*')
    .eq('invitation_token', token)
    .eq('status', 'pending')
    .single();
  
  if (findError || !share) {
    throw new Error('Invalid or expired invitation');
  }
  
  // Update share to accepted
  const { error: updateError } = await supabase
    .from('account_shares')
    .update({
      guest_user_id: guestUserId,
      status: 'accepted',
      accepted_at: new Date().toISOString()
    })
    .eq('id', share.id);
  
  if (updateError) throw updateError;
  
  // Auto-switch to guest view
  await switchToSharedAccount(share.owner_user_id);
}
```

## Future Enhancements

- Expiring shares (time-limited access)
- Editor role (read + write access)
- Share-specific permissions (e.g., only view bookings, not payments)
- Resend invitation functionality
- Invitation expiration (e.g., 7 days)

