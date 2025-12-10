import { supabase } from '../lib/supabase';

export interface AccountShare {
  id: string;
  ownerUserId: string;
  guestUserId: string | null;
  guestEmail: string;
  invitationToken: string | null;
  status: 'pending' | 'accepted' | 'revoked';
  role: 'viewer' | 'editor';
  invitedAt: string;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShareWithOwnerInfo extends AccountShare {
  ownerName: string;
  ownerEmail: string;
}

/**
 * Share Management Service
 * Handles inviting guests, accepting invitations, and managing account shares
 */
export class ShareService {
  /**
   * Invite a guest to view the owner's account
   * Creates a pending share and generates an invitation token
   */
  static async inviteGuest(
    ownerUserId: string,
    guestEmail: string
  ): Promise<{ share: AccountShare; invitationLink: string }> {
    // Check if share already exists
    const { data: existing } = await supabase
      .from('account_shares')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('guest_email', guestEmail.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      if (existing.status === 'accepted') {
        throw new Error('This guest already has access to your account');
      }
      if (existing.status === 'pending') {
        throw new Error('An invitation has already been sent to this email');
      }
    }

    // Generate unique invitation token
    const invitationToken = crypto.randomUUID();

    // Create pending share
    const { data: share, error } = await supabase
      .from('account_shares')
      .insert({
        owner_user_id: ownerUserId,
        guest_email: guestEmail.toLowerCase().trim(),
        invitation_token: invitationToken,
        status: 'pending',
        role: 'viewer',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating share:', error);
      throw new Error('Failed to create invitation');
    }

    // Generate invitation link
    const appUrl = window.location.origin;
    const invitationLink = `${appUrl}/accept-invite?token=${invitationToken}`;

    return { share, invitationLink };
  }

  /**
   * Send invitation email (placeholder - will be replaced with Postmark later)
   */
  static async sendInvitationEmail(
    guestEmail: string,
    ownerName: string,
    invitationLink: string
  ): Promise<void> {
    // Note: Email integration pending - replace with Postmark when ready
    // See: https://github.com/your-org/funnel-app/issues/XXX (create issue when implementing)
    console.log('📧 [PLACEHOLDER] Sending invitation email:', {
      to: guestEmail,
      ownerName,
      invitationLink,
    });

    // In production, this would call Postmark API:
    // await fetch('https://api.postmarkapp.com/email', {
    //   method: 'POST',
    //   headers: {
    //     'X-Postmark-Server-Token': import.meta.env.VITE_POSTMARK_SERVER_TOKEN,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     From: import.meta.env.VITE_POSTMARK_FROM_EMAIL,
    //     To: guestEmail,
    //     Subject: `You've been invited to view ${ownerName}'s analytics`,
    //     HtmlBody: `...`,
    //   }),
    // });
  }

  /**
   * Get all shares for an owner (both pending and accepted)
   */
  static async getOwnerShares(ownerUserId: string): Promise<AccountShare[]> {
    const { data, error } = await supabase
      .from('account_shares')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching owner shares:', error);
      return [];
    }

    return data.map(this.transformShare);
  }

  /**
   * Get existing pending invitation for an email
   */
  static async getPendingInvitation(
    ownerUserId: string,
    guestEmail: string
  ): Promise<{ share: AccountShare; invitationLink: string } | null> {
    const { data, error } = await supabase
      .from('account_shares')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('guest_email', guestEmail.toLowerCase().trim())
      .eq('status', 'pending')
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const share = this.transformShare(data);
    const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const invitationLink = share.invitationToken 
      ? `${appUrl}/accept-invite?token=${share.invitationToken}`
      : '';

    return { share, invitationLink };
  }

  /**
   * Get all shares for a guest (accounts they can view)
   */
  static async getGuestShares(guestUserId: string): Promise<ShareWithOwnerInfo[]> {
    const { data, error } = await supabase
      .from('account_shares')
      .select(`
        *,
        owner:user_profiles!account_shares_owner_user_id_fkey(
          full_name,
          email,
          company_name
        )
      `)
      .eq('guest_user_id', guestUserId)
      .eq('status', 'accepted')
      .order('accepted_at', { ascending: false });

    if (error) {
      console.error('Error fetching guest shares:', error);
      return [];
    }

    return data.map((share: any) => ({
      ...this.transformShare(share),
      ownerName: share.owner?.full_name || share.owner?.email || 'Unknown',
      ownerEmail: share.owner?.email || '',
    }));
  }

  /**
   * Find pending invitation by token
   */
  static async findInvitationByToken(
    token: string
  ): Promise<AccountShare | null> {
    const { data, error } = await supabase
      .from('account_shares')
      .select('*')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .maybeSingle();

    if (error) {
      console.error('Error finding invitation:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return this.transformShare(data);
  }

  /**
   * Accept an invitation
   * Called when a guest clicks the invitation link and signs up/logs in
   */
  static async acceptInvitation(
    token: string,
    guestUserId: string
  ): Promise<AccountShare> {
    // Verify the invitation exists and is pending
    const invitation = await this.findInvitationByToken(token);
    if (!invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Verify the guest email matches the logged-in user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email?.toLowerCase() !== invitation.guestEmail.toLowerCase()) {
      throw new Error('Invitation email does not match your account email');
    }

    // Update the share to accepted
    const { data, error } = await supabase
      .from('account_shares')
      .update({
        guest_user_id: guestUserId,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id)
      .select()
      .single();

    if (error) {
      console.error('Error accepting invitation:', error);
      throw new Error('Failed to accept invitation');
    }

    return this.transformShare(data);
  }

  /**
   * Revoke a share (owner removes guest access)
   */
  static async revokeShare(
    ownerUserId: string,
    shareId: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('account_shares')
      .update({ status: 'revoked' })
      .eq('id', shareId)
      .eq('owner_user_id', ownerUserId);

    if (error) {
      console.error('Error revoking share:', error);
      return false;
    }

    return true;
  }

  /**
   * Delete a share completely (removes the record)
   */
  static async deleteShare(
    ownerUserId: string,
    shareId: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('account_shares')
      .delete()
      .eq('id', shareId)
      .eq('owner_user_id', ownerUserId);

    if (error) {
      console.error('Error deleting share:', error);
      return false;
    }

    return true;
  }

  /**
   * Get the effective user ID for data queries
   * Returns owner's ID if viewing as guest, otherwise returns current user's ID
   */
  static async getEffectiveUserId(
    currentUserId: string,
    viewingAsGuest: boolean,
    sharedAccountOwnerId: string | null
  ): Promise<string> {
    if (viewingAsGuest && sharedAccountOwnerId) {
      // Verify the share still exists and is accepted
      const { data } = await supabase
        .from('account_shares')
        .select('id')
        .eq('owner_user_id', sharedAccountOwnerId)
        .eq('guest_user_id', currentUserId)
        .eq('status', 'accepted')
        .maybeSingle();

      if (data) {
        return sharedAccountOwnerId;
      }
    }

    return currentUserId;
  }

  /**
   * Get all accepted shares for a guest user
   */
  static async getAcceptedSharesForGuest(
    guestUserId: string
  ): Promise<AccountShare[]> {
    const { data, error } = await supabase
      .from('account_shares')
      .select('*')
      .eq('guest_user_id', guestUserId)
      .eq('status', 'accepted')
      .order('accepted_at', { ascending: false });

    if (error) {
      console.error('Error fetching accepted shares for guest:', error);
      return [];
    }

    return data.map(this.transformShare);
  }

  /**
   * Check if current user is viewing as a guest
   */
  static async isViewingAsGuest(
    currentUserId: string,
    sharedAccountOwnerId: string | null
  ): Promise<boolean> {
    if (!sharedAccountOwnerId) {
      return false;
    }

    const { data } = await supabase
      .from('account_shares')
      .select('id')
      .eq('owner_user_id', sharedAccountOwnerId)
      .eq('guest_user_id', currentUserId)
      .eq('status', 'accepted')
      .maybeSingle();

    return !!data;
  }

  /**
   * Transform database record to AccountShare type
   */
  private static transformShare(record: any): AccountShare {
    return {
      id: record.id,
      ownerUserId: record.owner_user_id,
      guestUserId: record.guest_user_id,
      guestEmail: record.guest_email,
      invitationToken: record.invitation_token,
      status: record.status,
      role: record.role,
      invitedAt: record.invited_at,
      acceptedAt: record.accepted_at,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }
}

