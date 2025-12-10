import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { LIMITS } from '../constants/app';

export type AdminAccessLog = {
  id: string;
  admin_user_id: string;
  target_user_id: string | null;
  action_type: string;
  action_details: any;
  impersonation_session_id: string | null;
  created_at: string;
};

export type UserProfile = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  website: string | null;
  subscription_tier: string;
  subscription_status: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export class AdminService {
  /**
   * Check if current user is an admin
   */
  static async isAdmin(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.debug('isAdmin: No authenticated user');
      return false;
    }

    logger.debug('isAdmin: Checking user profile', { userId: user.id });
    const { data, error } = await supabase
      .from('user_profiles')
      .select('is_admin, email')
      .eq('id', user.id)
      .single();

    if (error) {
      logger.error('isAdmin: Error fetching profile:', error);
      return false;
    }
    
    if (!data) {
      logger.debug('isAdmin: No profile data found');
      return false;
    }
    
    logger.debug('isAdmin: Profile data', { email: data.email, is_admin: data.is_admin });
    return data.is_admin === true;
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching users:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get a specific user by ID (admin only)
   */
  static async getUserById(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      logger.error('Error fetching user:', error);
      return null;
    }

    return data;
  }

  /**
   * Log an admin action
   */
  static async logAction(
    actionType: string,
    targetUserId?: string | null,
    actionDetails?: any,
    impersonationSessionId?: string | null
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.error('Cannot log action: No authenticated user');
      return;
    }

    const { error } = await supabase
      .from('admin_access_logs')
      .insert({
        admin_user_id: user.id,
        target_user_id: targetUserId || null,
        action_type: actionType,
        action_details: actionDetails || null,
        impersonation_session_id: impersonationSessionId || null,
      });

    if (error) {
      logger.error('Error logging admin action:', error);
    }
  }

  /**
   * Get access logs (admin only)
   */
  static async getAccessLogs(limit: number = LIMITS.ADMIN_ACCESS_LOGS_DEFAULT): Promise<AdminAccessLog[]> {
    const { data, error } = await supabase
      .from('admin_access_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching access logs:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get impersonation sessions (start and end events grouped)
   */
  static async getImpersonationSessions(limit: number = LIMITS.IMPERSONATION_SESSIONS_DEFAULT): Promise<any[]> {
    const { data, error } = await supabase
      .from('admin_access_logs')
      .select('*')
      .in('action_type', ['impersonate_start', 'impersonate_end'])
      .order('created_at', { ascending: false })
      .limit(limit * 2); // Get more to account for pairs

    if (error) {
      logger.error('Error fetching impersonation sessions:', error);
      return [];
    }

    // Group by session_id and pair start/end events
    const sessions: { [key: string]: any } = {};
    
    (data || []).forEach(log => {
      if (!log.impersonation_session_id) return;
      
      const sessionId = log.impersonation_session_id;
      if (!sessions[sessionId]) {
        sessions[sessionId] = {
          session_id: sessionId,
          admin_user_id: log.admin_user_id,
          target_user_id: log.target_user_id,
          start_time: null,
          end_time: null,
          actions: [],
        };
      }

      if (log.action_type === 'impersonate_start') {
        sessions[sessionId].start_time = log.created_at;
      } else if (log.action_type === 'impersonate_end') {
        sessions[sessionId].end_time = log.created_at;
      }
    });

    return Object.values(sessions).filter(s => s.start_time).sort((a, b) => 
      new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );
  }

  /**
   * Get actions taken during an impersonation session
   */
  static async getSessionActions(sessionId: string): Promise<AdminAccessLog[]> {
    const { data, error } = await supabase
      .from('admin_access_logs')
      .select('*')
      .eq('impersonation_session_id', sessionId)
      .not('action_type', 'in', '(impersonate_start,impersonate_end)')
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching session actions:', error);
      return [];
    }

    return data || [];
  }
}

