import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { UnifiedDataService } from '../services/unifiedDataService'
import { ShareService } from '../services/shareService'
import { AdminService, type UserProfile } from '../services/adminService'
import type { AuthUser, CRMType, SubscriptionFeatures, SubscriptionTier, SubscriptionStatus } from '../types/auth'
import type { Session as SupabaseSession, User as SupabaseUser } from '@supabase/supabase-js'
import { logger } from '../utils/logger'
import { TIMEOUTS } from '../constants/app'
import { identifyUser, trackEvent, resetPostHog } from '../lib/posthog'

// Demo account email for onboarding demonstrations
// This account will auto-reset all data (except profile) on each login
// Set via VITE_DEMO_ONBOARDING_EMAIL environment variable, defaults to 'demo-onboarding@test.com'
const DEMO_ONBOARDING_EMAIL = import.meta.env.VITE_DEMO_ONBOARDING_EMAIL || 'demo-onboarding@test.com'

/**
 * Check if we're in a test environment (NOT production)
 * Multiple checks to ensure safety:
 * 1. Hostname must contain 'netlify.app' (test Netlify sites)
 * 2. Hostname must NOT contain 'app.fnnlapp.com' (production domain)
 * 3. Environment variable flag must be enabled (if set)
 */
const isTestEnvironment = (): boolean => {
  // Check hostname
  const hostname = window.location.hostname
  
  // Must be a Netlify test site (not production)
  const isNetlifyTest = hostname.includes('netlify.app') && !hostname.includes('app.fnnlapp.com')
  
  // Additional check: environment variable flag (if set, must be explicitly enabled)
  const envFlag = import.meta.env.VITE_ENABLE_DEMO_RESET
  const envFlagEnabled = envFlag === 'true' || envFlag === '1'
  
  // If env flag is set, it must be enabled. If not set, we allow it in test environment.
  const envCheck = envFlag ? envFlagEnabled : true
  
  const isTest = isNetlifyTest && envCheck
  
  if (!isTest && hostname.includes('app.fnnlapp.com')) {
    logger.warn('⚠️ DEMO RESET: Production environment detected - reset feature is DISABLED')
  }
  
  return isTest
}

interface AuthContextType {
  user: AuthUser | null
  effectiveUser: AuthUser | null
  session: SupabaseSession | null
  loading: boolean
  features: SubscriptionFeatures
  isTrialUser: boolean
  // Guest viewing functionality
  viewingAsGuest: boolean
  sharedAccountOwnerId: string | null
  isViewOnly: boolean
  effectiveUserId: string | null
  switchToSharedAccount: (ownerId: string) => Promise<void>
  switchToOwnAccount: () => Promise<void>
  // Admin functionality
  isAdmin: boolean
  impersonatingUserId: string | null
  impersonatingUser: UserProfile | null
  impersonationSessionId: string | null
  startImpersonation: (userId: string) => Promise<void>
  stopImpersonation: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName?: string, companyName?: string, crm?: string, crmOther?: string) => Promise<void>
  signOut: () => Promise<void>
  upgradeToPro: () => Promise<void>
  downgradeToFree: () => Promise<void>
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<SupabaseSession | null>(null)
  const [loading, setLoading] = useState(true)
  // Guest viewing state
  const [viewingAsGuest, setViewingAsGuest] = useState(false)
  const [sharedAccountOwnerId, setSharedAccountOwnerId] = useState<string | null>(null)
  // Admin state
  const [isAdmin, setIsAdmin] = useState(false)
  const [impersonatingUserId, setImpersonatingUserId] = useState<string | null>(null)
  const [impersonatingUser, setImpersonatingUser] = useState<UserProfile | null>(null)
  const impersonationSessionId = useRef<string | null>(null)
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityTime = useRef<number>(Date.now())

  // Helper function to build combined user from auth user and profile data
  const buildCombinedUser = async (authUser: SupabaseUser, profileData: { first_name: string | null; last_name: string | null; full_name: string | null; company_name: string | null; phone: string | null; website: string | null; crm: string | null; crm_other: string | null; ads_tracking_enabled: boolean | null; ads_setup_completed?: boolean | null; welcome_video_watched_at?: string | null; onboarding_completed?: boolean | null; onboarding_step?: number | null; onboarding_completed_at?: string | null; subscription_tier: string; subscription_status: string; trial_ends_at: string | null }): Promise<AuthUser> => {
    // Explicitly check for null/undefined to avoid falling back to email when name is intentionally empty
    const firstName = profileData.first_name !== null && profileData.first_name !== undefined 
      ? profileData.first_name 
      : '';
    const lastName = profileData.last_name !== null && profileData.last_name !== undefined 
      ? profileData.last_name 
      : '';
    
    // Use full_name if available, otherwise construct from first_name + last_name
    const fullName = profileData.full_name !== null && profileData.full_name !== undefined 
      ? profileData.full_name 
      : (firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || authUser.user_metadata?.full_name || authUser.email));
    
    const combinedUser = {
      ...authUser,
      email: authUser.email || '',
      firstName,
      lastName,
      name: fullName,
      companyName: profileData.company_name !== null && profileData.company_name !== undefined 
        ? profileData.company_name 
        : '',
      phone: profileData.phone !== null && profileData.phone !== undefined 
        ? profileData.phone 
        : '',
      website: profileData.website !== null && profileData.website !== undefined 
        ? profileData.website 
        : '',
      crm: (profileData.crm as CRMType | undefined) || undefined,
      crmOther: profileData.crm_other || undefined,
      adsTrackingEnabled: profileData.ads_tracking_enabled === true,
      adsSetupCompleted: profileData.ads_setup_completed === true,
      welcomeVideoWatchedAt: profileData.welcome_video_watched_at ? new Date(profileData.welcome_video_watched_at) : null,
      // Treat undefined/null as completed for backward compatibility (existing users before migration)
      onboardingCompleted: profileData.onboarding_completed !== false,
      onboardingStep: profileData.onboarding_step ?? 0,
      onboardingCompletedAt: profileData.onboarding_completed_at ? new Date(profileData.onboarding_completed_at) : null,
      subscriptionTier: (profileData.subscription_tier as SubscriptionTier) || 'pro',
      subscriptionStatus: (profileData.subscription_status as SubscriptionStatus) || 'active',
      createdAt: new Date(authUser.created_at),
      lastLoginAt: new Date(),
      trialEndsAt: profileData.trial_ends_at ? new Date(profileData.trial_ends_at) : null
    };
    
    logger.debug('Combined user created:', {
      profileFirstName: profileData.first_name,
      profileLastName: profileData.last_name,
      profileFullName: profileData.full_name,
      profileCompanyName: profileData.company_name,
      finalFirstName: combinedUser.firstName,
      finalLastName: combinedUser.lastName,
      finalName: combinedUser.name,
      finalCompanyName: combinedUser.companyName
    });

    logger.debug('Successfully built combined user');
    return combinedUser;
  };

  // Helper function to load user profile data
  const loadUserProfile = async (authUser: SupabaseUser | null): Promise<AuthUser | null> => {
    logger.debug('Loading user profile for:', authUser?.id);
    
    if (!authUser) {
      logger.debug('No auth user provided');
      return null;
    }

    try {
      logger.debug('Attempting profile query...');
      
      // Query for profile - use maybeSingle to handle missing profiles gracefully
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      logger.debug('Profile query completed:', { 
        errorCode: profileError?.code,
        firstName: profileData?.first_name,
        lastName: profileData?.last_name,
        companyName: profileData?.company_name,
        fullName: profileData?.full_name
      });

      // If profile doesn't exist, create one
      if (profileError?.code === 'PGRST116' || !profileData) {
        logger.debug('Profile does not exist, creating one...');
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || null,
            first_name: null,
            last_name: null,
            company_name: null,
            subscription_tier: 'pro',
            subscription_status: 'active',
            onboarding_completed: false,
            onboarding_step: 0
          })
          .select()
        .single();

        if (createError) {
          logger.error('Error creating profile:', createError);
          // If insert fails (maybe profile was created between check and insert), try query again
          const { data: retryProfile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();
          
          if (retryProfile) {
            return await buildCombinedUser(authUser, retryProfile);
          }
          throw createError;
        }

        logger.debug('Profile created successfully');
        
        // Check if user has any service types or lead sources, if not, create defaults
        // This handles the case where an existing auth user gets a profile created
        const serviceTypes = await UnifiedDataService.getServiceTypes(authUser.id);
        const leadSources = await UnifiedDataService.getLeadSources(authUser.id);
        if (serviceTypes.length === 0 && leadSources.length === 0) {
          await UnifiedDataService.createDefaultDataForNewUser(authUser.id);
        }
        
        return await buildCombinedUser(authUser, newProfile);
      }

      if (profileError) {
        logger.error('Profile query error:', profileError);
        throw profileError;
      }

      if (!profileData) {
        logger.debug('No profile data found in database after query');
        return null;
      }

      // Build combined user from profile data
      return await buildCombinedUser(authUser, profileData);
    } catch (error) {
      logger.error('Profile loading failed, using basic user:', error);
      // Return basic user if profile query fails
      return {
        ...authUser,
        email: authUser.email || '',
        firstName: '',
        lastName: '',
        name: authUser.user_metadata?.full_name || authUser.email || '',
        companyName: '',
        adsTrackingEnabled: false,
        adsSetupCompleted: false,
        welcomeVideoWatchedAt: null,
        onboardingCompleted: false,
        onboardingStep: 1,
        onboardingCompletedAt: null,
        subscriptionTier: 'pro',
        subscriptionStatus: 'active',
        createdAt: new Date(authUser.created_at),
        lastLoginAt: new Date(),
        trialEndsAt: null
      };
    }
  }

  // All users now have Pro features (simplified permission system)
  const features = {
    canAccessSales: true,
    canAccessForecast: true,
    canUseDataIntegration: true,
    canSyncFunnelWithSales: true,
    advertising: true
  }

  // Helper function to check if user is on trial (deprecated - kept for compatibility)
  const isTrialUser = false

  // Compute effective user ID (impersonated user > owner's ID when viewing as guest > current user's ID)
  const effectiveUserId = impersonatingUserId 
    ? impersonatingUserId 
    : (viewingAsGuest && sharedAccountOwnerId 
      ? sharedAccountOwnerId 
      : (user?.id || null))

  const effectiveUser = React.useMemo(() => {
    if (!impersonatingUser) return user
    const firstName = impersonatingUser.first_name || ''
    const lastName = impersonatingUser.last_name || ''
    const fullName = impersonatingUser.full_name || `${firstName} ${lastName}`.trim() || impersonatingUser.email
    return {
      id: impersonatingUser.id,
      email: impersonatingUser.email,
      name: fullName,
      firstName,
      lastName,
      companyName: impersonatingUser.company_name || '',
      phone: impersonatingUser.phone || '',
      website: impersonatingUser.website || '',
      crm: (impersonatingUser.crm as CRMType | undefined) || undefined,
      crmOther: impersonatingUser.crm_other || undefined,
      adsTrackingEnabled: impersonatingUser.ads_tracking_enabled === true,
      adsSetupCompleted: impersonatingUser.ads_setup_completed === true,
      welcomeVideoWatchedAt: impersonatingUser.welcome_video_watched_at
        ? new Date(impersonatingUser.welcome_video_watched_at)
        : null,
      onboardingCompleted: impersonatingUser.onboarding_completed !== false,
      onboardingStep: impersonatingUser.onboarding_step ?? 0,
      onboardingCompletedAt: impersonatingUser.onboarding_completed_at ? new Date(impersonatingUser.onboarding_completed_at) : null,
      subscriptionTier: (impersonatingUser.subscription_tier as SubscriptionTier) || 'pro',
      subscriptionStatus: (impersonatingUser.subscription_status as SubscriptionStatus) || 'active',
      createdAt: impersonatingUser.created_at ? new Date(impersonatingUser.created_at) : new Date(),
      lastLoginAt: new Date(),
      trialEndsAt: impersonatingUser.trial_ends_at ? new Date(impersonatingUser.trial_ends_at) : null,
    }
  }, [impersonatingUser, user])

  // Check if user is in view-only mode (not when impersonating - admins have full access)
  const isViewOnly = viewingAsGuest && !impersonatingUserId

  // Switch to viewing a shared account
  const switchToSharedAccount = async (ownerId: string, authUserId?: string) => {
    // Use provided authUserId or fall back to current user
    const userId = authUserId || user?.id
    if (!userId) {
      throw new Error('Must be logged in to view shared accounts')
    }

    // Verify the share exists and is accepted
    const isValid = await ShareService.isViewingAsGuest(userId, ownerId)
    if (!isValid) {
      throw new Error('You do not have access to this account')
    }

    setSharedAccountOwnerId(ownerId)
    setViewingAsGuest(true)
    
    // Store in localStorage for persistence
    localStorage.setItem('viewingAsGuest', 'true')
    localStorage.setItem('sharedAccountOwnerId', ownerId)
    
    logger.debug('Successfully switched to shared account view', { ownerId, userId })
  }

  // Switch back to own account
  const switchToOwnAccount = async () => {
    setViewingAsGuest(false)
    setSharedAccountOwnerId(null)
    
    // Clear from localStorage
    localStorage.removeItem('viewingAsGuest')
    localStorage.removeItem('sharedAccountOwnerId')
  }

  // Start impersonating a user (admin only)
  const startImpersonation = async (userId: string) => {
    if (!isAdmin) {
      throw new Error('Only admins can impersonate users')
    }

    // Load the target user's profile
    const targetUser = await AdminService.getUserById(userId)
    if (!targetUser) {
      throw new Error('User not found')
    }

    // Generate session ID
    const sessionId = crypto.randomUUID()
    impersonationSessionId.current = sessionId

    // Set impersonation state
    setImpersonatingUserId(userId)
    setImpersonatingUser(targetUser)

    // Store in localStorage
    localStorage.setItem('impersonatingUserId', userId)
    localStorage.setItem('impersonationSessionId', sessionId)

    // Log the impersonation start
    await AdminService.logAction('impersonate_start', userId, {
      target_email: targetUser.email,
      target_name: targetUser.full_name || targetUser.email,
    }, sessionId)

    // Reset inactivity timer
    resetInactivityTimer()

    logger.debug('Started impersonating user', { userId })
  }

  // Stop impersonating
  const stopImpersonation = React.useCallback(async () => {
    if (!impersonatingUserId || !impersonationSessionId.current) {
      return
    }

    const sessionId = impersonationSessionId.current
    const targetUserId = impersonatingUserId

    // Log the impersonation end
    await AdminService.logAction('impersonate_end', targetUserId, {
      session_duration: Date.now() - lastActivityTime.current,
    }, sessionId)

    // Clear impersonation state
    setImpersonatingUserId(null)
    setImpersonatingUser(null)
    impersonationSessionId.current = null

    // Clear from localStorage
    localStorage.removeItem('impersonatingUserId')
    localStorage.removeItem('impersonationSessionId')

    // Clear inactivity timer
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current)
      inactivityTimer.current = null
    }

    logger.debug('Stopped impersonating user')
  }, [impersonatingUserId])

  // Reset inactivity timer (30 minutes)
  const resetInactivityTimer = React.useCallback(() => {
    lastActivityTime.current = Date.now()

    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current)
    }

    if (impersonatingUserId) {
      inactivityTimer.current = setTimeout(() => {
        logger.debug('Inactivity timeout - ending impersonation')
        stopImpersonation()
        // Optionally show a notification
      }, TIMEOUTS.IMPERSONATION_INACTIVITY)
    }
  }, [impersonatingUserId, stopImpersonation])

  // Track user activity to reset inactivity timer
  useEffect(() => {
    if (!impersonatingUserId) return

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    const handleActivity = () => {
      resetInactivityTimer()
    }

    events.forEach(event => {
      window.addEventListener(event, handleActivity)
    })

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [impersonatingUserId, resetInactivityTimer])

  // Check admin status when user loads
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user?.id) {
        logger.debug('Checking admin status for user', { userId: user.id, email: user.email })
        const adminStatus = await AdminService.isAdmin()
        logger.debug('Admin status result', { isAdmin: adminStatus })
        setIsAdmin(adminStatus)
      } else {
        setIsAdmin(false)
      }
    }
    checkAdminStatus()
  }, [user])

  // Restore impersonation state from localStorage on mount
  useEffect(() => {
    const restoreImpersonation = async () => {
      if (!isAdmin || !user?.id) return

      const storedUserId = localStorage.getItem('impersonatingUserId')
      const storedSessionId = localStorage.getItem('impersonationSessionId')

      if (storedUserId && storedSessionId) {
        impersonationSessionId.current = storedSessionId
        const targetUser = await AdminService.getUserById(storedUserId)
        if (targetUser) {
          setImpersonatingUserId(storedUserId)
          setImpersonatingUser(targetUser)
          resetInactivityTimer()
        } else {
          // Clear invalid state
          localStorage.removeItem('impersonatingUserId')
          localStorage.removeItem('impersonationSessionId')
        }
      }
    }
    restoreImpersonation()
  }, [isAdmin, user])


  // Check for pending invitation token in URL or localStorage and auto-accept
  const checkPendingInvitation = async (authUser: SupabaseUser) => {
    logger.debug('checkPendingInvitation called for user', { email: authUser.email })
    // Check URL first
    const urlParams = new URLSearchParams(window.location.search)
    let invitationToken = urlParams.get('token')
    
    // If no token in URL, check localStorage (from AcceptInvitation component)
    if (!invitationToken) {
      invitationToken = localStorage.getItem('pendingInvitationToken')
    }
    
    logger.debug('Invitation token found', { hasToken: !!invitationToken })
    
    if (invitationToken && authUser) {
      try {
        logger.debug('Looking up invitation with token')
        const invitation = await ShareService.findInvitationByToken(invitationToken)
        logger.debug('Invitation lookup result', { found: !!invitation })
        
        if (invitation && invitation.guestEmail.toLowerCase() === authUser.email?.toLowerCase()) {
          console.log('Email matches, accepting invitation...')
          // Auto-accept the invitation
          await ShareService.acceptInvitation(invitationToken, authUser.id)
          console.log('Invitation accepted, switching to shared account:', invitation.ownerUserId)
          
          // Auto-switch to viewing the shared account
          await switchToSharedAccount(invitation.ownerUserId, authUser.id)
          console.log('Switched to shared account view')
          
          // Clean up URL and localStorage
          localStorage.removeItem('pendingInvitationToken')
          // Only redirect if we're on the accept-invite page, and use a small delay to ensure state is set
          if (window.location.pathname === '/accept-invite') {
            setTimeout(() => {
              window.location.replace('/')
            }, 100)
          } else {
            // Just clean up the URL without redirecting
            const url = new URL(window.location.href)
            url.searchParams.delete('token')
            window.history.replaceState({}, '', url.pathname + url.search)
          }
        } else if (invitation) {
          logger.warn('Email mismatch', { invitationEmail: invitation.guestEmail, userEmail: authUser.email })
          // Email mismatch - clear the token
          localStorage.removeItem('pendingInvitationToken')
        } else {
          logger.debug('No invitation found for token')
        }
      } catch (error) {
        logger.error('Error accepting invitation:', error)
        localStorage.removeItem('pendingInvitationToken')
      }
    } else {
      logger.debug('No invitation token or user', { hasToken: !!invitationToken, hasUser: !!authUser })
    }
  }

  // Restore guest viewing state from localStorage or auto-detect accepted shares
  const restoreGuestViewingState = async (authUser: SupabaseUser) => {
    const wasViewingAsGuest = localStorage.getItem('viewingAsGuest') === 'true'
    const storedOwnerId = localStorage.getItem('sharedAccountOwnerId')
    
    if (wasViewingAsGuest && storedOwnerId && authUser) {
      // Verify the share still exists
      const isValid = await ShareService.isViewingAsGuest(authUser.id, storedOwnerId)
      if (isValid) {
        logger.debug('Restoring guest viewing state from localStorage')
        setSharedAccountOwnerId(storedOwnerId)
        setViewingAsGuest(true)
        return
      } else {
        // Share was revoked, clear state
        logger.debug('Stored share no longer valid, clearing state')
        localStorage.removeItem('viewingAsGuest')
        localStorage.removeItem('sharedAccountOwnerId')
      }
    }
    
    // If no stored state, check if user has any accepted shares and auto-switch to the first one
    if (authUser) {
      logger.debug('Checking for accepted shares for user:', authUser.id)
      const acceptedShares = await ShareService.getAcceptedSharesForGuest(authUser.id)
      if (acceptedShares.length > 0) {
        // Auto-switch to the first (most recently accepted) shared account
        const firstShare = acceptedShares[0]
        logger.debug('Found accepted share, auto-switching to owner:', firstShare.ownerUserId)
        await switchToSharedAccount(firstShare.ownerUserId, authUser.id)
      } else {
        logger.debug('No accepted shares found for user')
      }
    }
  }

  useEffect(() => {
    logger.debug('AuthContext useEffect starting');
    
    // Check if Supabase is properly configured
    const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && 
      import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co'

    if (!isSupabaseConfigured) {
      logger.error('❌ Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
      setLoading(false)
      return
    }

    logger.debug('Supabase configured, getting session...');

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      logger.warn('Auth timeout - setting loading to false');
      setLoading(false);
    }, 10000); // 10 second timeout

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      clearTimeout(timeoutId); // Clear timeout since we got a response
      logger.debug('Session result', { hasSession: !!session, hasError: !!error });
      
      if (error) {
        logger.error('Error getting session:', error);
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      
      setSession(session)
      if (session?.user) {
        logger.debug('User found, loading profile...');
        // Set basic user first so UI can render, then load profile in background
        const basicUser: AuthUser = {
          ...session.user,
          email: session.user.email || '',
          firstName: '',
          lastName: '',
          name: session.user.user_metadata?.full_name || session.user.email || '',
          companyName: '',
          subscriptionTier: 'pro',
          subscriptionStatus: 'active',
          createdAt: new Date(session.user.created_at),
          lastLoginAt: new Date(),
          trialEndsAt: null
        };
        setUser(basicUser);
        setLoading(false); // Allow UI to render immediately
        
        // Load profile in background (non-blocking)
        loadUserProfile(session.user).then(async userWithProfile => {
          if (userWithProfile) {
            logger.debug('Profile loaded in background:', userWithProfile);
            
            // Check if this is the demo onboarding account and reset data if needed
            // This handles the case where user refreshes page or has existing session
            const userEmail = userWithProfile.email?.toLowerCase() || ''
            const demoEmail = DEMO_ONBOARDING_EMAIL.toLowerCase()
            const isDemoAccount = userEmail === demoEmail
            const isTestEnv = isTestEnvironment()
            
            // Check if we should reset (only once per session to avoid loops)
            const resetKey = `demo_reset_${userWithProfile.id}`
            const hasResetThisSession = sessionStorage.getItem(resetKey) === 'true'
            
            if (isDemoAccount && isTestEnv && !hasResetThisSession) {
              logger.log('🔄 DEMO RESET: Demo account detected on initial session load, resetting data...');
              try {
                // Clear localStorage BEFORE resetting database
                if (typeof window !== 'undefined') {
                  try {
                    localStorage.removeItem('completedTasks');
                    sessionStorage.removeItem('onboarding_skipped');
                  } catch (storageError) {
                    logger.warn('Could not clear localStorage:', storageError);
                  }
                }
                
                await UnifiedDataService.resetDemoAccountData(userWithProfile.id);
                logger.log('✅ DEMO RESET: Demo account data reset complete');
                
                // Mark that we've reset in this session
                sessionStorage.setItem(resetKey, 'true')
                
                // Force a page reload to ensure fresh data is loaded
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
                return; // Don't continue with profile loading, reload will handle it
              } catch (resetError) {
                logger.error('❌ DEMO RESET: Error resetting demo account data:', resetError);
                // Continue with login even if reset fails
              }
            }
            
            setUser(userWithProfile);
            
            // Identify user in PostHog
            identifyUser(userWithProfile.id, {
              email: userWithProfile.email,
              full_name: userWithProfile.name,
              company_name: userWithProfile.companyName,
              subscription_tier: userWithProfile.subscriptionTier,
              subscription_status: userWithProfile.subscriptionStatus,
            });
            
            // Check for pending invitation and restore guest viewing state
            await checkPendingInvitation(session.user)
            await restoreGuestViewingState(session.user)
          }
        }).catch(profileError => {
          console.error('Error loading profile in background:', profileError);
          // Keep using basic user - already set
        });
      } else {
        logger.debug('No user session');
        setUser(null);
        setViewingAsGuest(false)
        setSharedAccountOwnerId(null)
        setLoading(false);
      }
    }).catch(error => {
      clearTimeout(timeoutId); // Clear timeout on error
      logger.error('Error in session promise:', error);
      setSession(null);
      setUser(null);
      setLoading(false);
    })

    // Monitor session validity - Supabase's autoRefreshToken handles actual refresh
    // We just need to ensure the session state is kept in sync
    const setupSessionMonitor = () => {
      const monitorInterval = setInterval(async () => {
        try {
          // Just check if session is still valid - don't manually refresh
          // Supabase's autoRefreshToken will handle the refresh automatically
          const { data: { session: currentSession }, error } = await supabase.auth.getSession()
          if (error) {
            logger.error('Error getting session in monitor:', error)
            return
          }
          
          if (currentSession) {
            // Update session state if it changed (e.g., from auto-refresh)
            setSession(currentSession)
            
            // Check if token is expired or about to expire
            const expiresAt = currentSession.expires_at
            if (expiresAt) {
              const now = Math.floor(Date.now() / 1000)
              const expiresIn = expiresAt - now
              
              // Log warning if token is expiring soon (but don't manually refresh)
              if (expiresIn < 300 && expiresIn > 0) {
                logger.debug('Token expiring soon, auto-refresh should handle it', { expiresIn })
              } else if (expiresIn <= 0) {
                logger.warn('Token has expired, checking for refresh...')
                // Token expired - check if auto-refresh happened
                // If not, the onAuthStateChange handler will catch the SIGNED_OUT event
              }
            }
          } else {
            // No session - user is signed out
            logger.debug('No session found in monitor')
          }
        } catch (error) {
          logger.error('Error in session monitor interval:', error)
        }
      }, 60000) // Check every minute
      
      return monitorInterval
    }

    const sessionMonitorInterval = setupSessionMonitor()

    // Handle tab visibility changes - refresh session when tab becomes active
    // This helps when auto-refresh didn't run because the tab was inactive
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        logger.debug('Tab became visible, checking session...')
        try {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession()
          if (error) {
            logger.error('Error getting session on visibility change:', error)
            return
          }
          
          if (currentSession) {
            // Check if token is expired or about to expire
            const expiresAt = currentSession.expires_at
            if (expiresAt) {
              const now = Math.floor(Date.now() / 1000)
              const expiresIn = expiresAt - now
              
              // If token is expired or expiring very soon, try to get a fresh session
              // The autoRefreshToken should handle this, but we're ensuring it happens
              if (expiresIn < 60) {
                logger.debug('Token expired or expiring soon on visibility change, refreshing...', { expiresIn })
                // Just get the session again - Supabase will auto-refresh if needed
                const { data: { session: refreshedSession } } = await supabase.auth.getSession()
                if (refreshedSession) {
                  setSession(refreshedSession)
                }
              } else {
                // Just update the session state to ensure it's in sync
                setSession(currentSession)
              }
            } else {
              // No expires_at, just update session state
              setSession(currentSession)
            }
          }
        } catch (error) {
          logger.error('Error handling visibility change:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.debug('Auth state change', { event, hasSession: !!session });
      
      // Handle token refresh event
      if (event === 'TOKEN_REFRESHED' && session) {
        logger.debug('Token refreshed, updating session')
        setSession(session)
        return // Don't reload profile on token refresh
      }
      
      // Handle sign out
      if (event === 'SIGNED_OUT') {
        logger.debug('User signed out')
        // Clear demo reset flag on logout so it resets on next login
        if (typeof window !== 'undefined' && session?.user?.email?.toLowerCase() === DEMO_ONBOARDING_EMAIL.toLowerCase()) {
          const resetKey = `demo_reset_${session.user.id}`
          sessionStorage.removeItem(resetKey)
        }
        setSession(null)
        setUser(null)
        setViewingAsGuest(false)
        setSharedAccountOwnerId(null)
        setLoading(false)
        return
      }
      
      setSession(session)
      
      if (session?.user) {
        logger.debug('User authenticated, loading profile...');
        // Set basic user first so UI can render immediately
        const basicUser: AuthUser = {
          ...session.user,
          email: session.user.email || '',
          firstName: '',
          lastName: '',
          name: session.user.user_metadata?.full_name || session.user.email || '',
          companyName: '',
          subscriptionTier: 'pro',
          subscriptionStatus: 'active',
          createdAt: new Date(session.user.created_at),
          lastLoginAt: new Date(),
          trialEndsAt: null
        };
        setUser(basicUser);
        setLoading(false); // Allow UI to render immediately
        
        // Load profile in background (non-blocking)
        loadUserProfile(session.user).then(async userWithProfile => {
          if (userWithProfile) {
            logger.debug('Profile loaded in background:', userWithProfile);
            
            // Check if this is the demo onboarding account and reset data if needed
            // MULTIPLE SAFEGUARDS to ensure this ONLY happens in test environment:
            // 1. Must be SIGNED_IN event (not token refresh or other events)
            // 2. Must be test environment (not production)
            // 3. Email must match exactly (case-insensitive)
            const userEmail = userWithProfile.email?.toLowerCase() || ''
            const demoEmail = DEMO_ONBOARDING_EMAIL.toLowerCase()
            const isDemoAccount = userEmail === demoEmail
            const isTestEnv = isTestEnvironment()
            
            // Check if we should reset on SIGNED_IN event
            // Use sessionStorage to prevent multiple resets in same session
            const resetKey = `demo_reset_${userWithProfile.id}`
            const hasResetThisSession = sessionStorage.getItem(resetKey) === 'true'
            
            if (event === 'SIGNED_IN' && isDemoAccount && isTestEnv && !hasResetThisSession) {
              logger.log('🔄 DEMO RESET: Demo onboarding account detected in TEST environment, resetting data...');
              try {
                // Clear localStorage BEFORE resetting database (for immediate UI effect)
                if (typeof window !== 'undefined') {
                  try {
                    localStorage.removeItem('completedTasks');
                    sessionStorage.removeItem('onboarding_skipped');
                  } catch (storageError) {
                    logger.warn('Could not clear localStorage:', storageError);
                  }
                }
                
                await UnifiedDataService.resetDemoAccountData(userWithProfile.id);
                logger.log('✅ DEMO RESET: Demo account data reset complete');
                
                // Mark that we've reset in this session
                sessionStorage.setItem(resetKey, 'true')
                
                // Force a page reload to ensure fresh data is loaded
                // This ensures the UI reflects the reset state and prevents stale data
                // Small delay to ensure database operations complete
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
                return; // Don't continue with profile loading, reload will handle it
              } catch (resetError) {
                logger.error('❌ DEMO RESET: Error resetting demo account data:', resetError);
                // Continue with login even if reset fails
              }
            } else if (event === 'SIGNED_IN' && isDemoAccount && !isTestEnv) {
              // Safety check: If demo account tries to log in to production, log a warning
              logger.warn('⚠️ DEMO RESET: Demo account login detected in PRODUCTION - reset is DISABLED for safety');
              logger.warn('⚠️ DEMO RESET: This account should only be used in test environment');
            }
            
            setUser(userWithProfile);
            
            // Identify user in PostHog
            identifyUser(userWithProfile.id, {
              email: userWithProfile.email,
              full_name: userWithProfile.name,
              company_name: userWithProfile.companyName,
              subscription_tier: userWithProfile.subscriptionTier,
              subscription_status: userWithProfile.subscriptionStatus,
            });
            
            // Check for pending invitation first (before restoring state)
            // This handles new signups with invitations
            await checkPendingInvitation(session.user)
            
            // Only restore guest viewing state if we're not already viewing as guest
            // (checkPendingInvitation might have just set it)
            const currentViewingAsGuest = localStorage.getItem('viewingAsGuest') === 'true'
            if (!currentViewingAsGuest) {
              await restoreGuestViewingState(session.user)
            }
          }
        }).catch(profileError => {
          console.error('Error loading profile in background:', profileError);
          // Keep using basic user - already set
          // Still check for pending invitation even if profile load fails
          checkPendingInvitation(session.user).catch(err => {
            logger.error('Error checking pending invitation:', err)
          })
        });
      } else {
        logger.debug('No user session');
        setUser(null);
        setViewingAsGuest(false)
        setSharedAccountOwnerId(null)
        setLoading(false);
      }
    })

    return () => {
      subscription.unsubscribe()
      if (sessionMonitorInterval) {
        clearInterval(sessionMonitorInterval)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    logger.debug('SignIn called', { email });
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        logger.error('SignIn error:', error);
        setLoading(false);
        trackEvent('sign_in_failed', { email, error: error.message });
        throw error;
      }
      logger.debug('SignIn successful');
      trackEvent('sign_in', { email });
      // Don't set loading to false here - let the auth state change handler do it
      // This prevents the form from clearing before the redirect happens
    } catch (error) {
      logger.error('SignIn failed:', error);
      setLoading(false);
      throw error;
    }
  }

  const signUp = async (email: string, password: string, fullName?: string, companyName?: string, crm?: string, crmOther?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    if (error) {
      trackEvent('sign_up_failed', { email, error: error.message });
      throw error;
    }

    // Track successful signup
    trackEvent('sign_up', { email, hasFullName: !!fullName, hasCompanyName: !!companyName });

    // Create user profile after successful signup
    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email: email,
          full_name: fullName || null,
          company_name: companyName || null,
          crm: crm || null,
          crm_other: crm === 'other' ? (crmOther || null) : null,
          subscription_tier: 'pro',
          subscription_status: 'active',
          onboarding_completed: false,
          onboarding_step: 0
        })

      if (profileError) {
        logger.error('Error creating user profile:', profileError)
        // Don't throw here as the user was created successfully
      } else {
        // Create default service types and lead sources for new user
        await UnifiedDataService.createDefaultDataForNewUser(data.user.id)
        
        // Immediately update the user object with profile data
        const userWithProfile = await loadUserProfile(data.user)
        setUser(userWithProfile)
        
        // Identify user in PostHog
        identifyUser(data.user.id, {
          email: email,
          full_name: fullName,
          company_name: companyName,
          subscription_tier: 'pro',
        });
        
        // Check for pending invitation (user might have signed up via invitation link)
        // Call immediately - the invitation check will handle the async operations
        logger.debug('SignUp completed, checking for pending invitation...')
        await checkPendingInvitation(data.user)
        logger.debug('Pending invitation check completed')
      }
    }
  }

  const signOut = async () => {
    // Clear demo reset flag on logout so it resets on next login
    if (typeof window !== 'undefined' && user?.email?.toLowerCase() === DEMO_ONBOARDING_EMAIL.toLowerCase()) {
      const resetKey = `demo_reset_${user.id}`
      sessionStorage.removeItem(resetKey)
    }
    
    // Track sign out
    trackEvent('sign_out');
    
    // End impersonation if active
    if (impersonatingUserId) {
      await stopImpersonation()
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    // Reset PostHog (clear user identification)
    resetPostHog();
    
    // Clear guest viewing state
    setViewingAsGuest(false)
    setSharedAccountOwnerId(null)
    localStorage.removeItem('viewingAsGuest')
    localStorage.removeItem('sharedAccountOwnerId')
    
    // Clear admin state
    setIsAdmin(false)
    setImpersonatingUserId(null)
    setImpersonatingUser(null)
  }

  const upgradeToPro = async () => {
    if (user) {
      const { error } = await supabase
        .from('user_profiles')
        .update({ subscription_tier: 'pro' })
        .eq('id', user.id)

      if (error) throw error

      setUser({
        ...user,
        subscriptionTier: 'pro'
      })
    }
  }

  const downgradeToFree = async () => {
    if (user) {
      const { error } = await supabase
        .from('user_profiles')
        .update({ subscription_tier: 'free' })
        .eq('id', user.id)

      if (error) throw error

      setUser({
        ...user,
        subscriptionTier: 'free'
      })
    }
  }

  const updateProfile = async (updates: Partial<AuthUser>) => {
    logger.debug('updateProfile called', { updates, userId: user?.id });
    
    if (!user) {
      logger.error('No user found for profile update');
      throw new Error('No user found for profile update');
    }

    if (isViewOnly && !impersonatingUserId) {
      throw new Error('You are viewing this account in read-only mode. Editing is not allowed.');
    }

    const targetUserId = impersonatingUserId || user.id
    const profileSource = effectiveUser || user

      // Map frontend field names to database field names
    // Include empty strings explicitly to allow clearing values
      const dbUpdates: Record<string, unknown> = {}
    if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName || null
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName || null
    if (updates.name !== undefined) dbUpdates.full_name = updates.name || null
    if (updates.companyName !== undefined) dbUpdates.company_name = updates.companyName || null
    if (updates.email !== undefined) dbUpdates.email = updates.email
    dbUpdates.updated_at = new Date().toISOString()
    
    // If firstName and lastName are provided but full_name is not, construct full_name
    if ((updates.firstName !== undefined || updates.lastName !== undefined) && updates.name === undefined) {
      const firstName = updates.firstName !== undefined ? updates.firstName : user.firstName || ''
      const lastName = updates.lastName !== undefined ? updates.lastName : user.lastName || ''
      dbUpdates.full_name = (firstName && lastName) ? `${firstName} ${lastName}` : (firstName || lastName || null)
    }

    // Include phone/website in updates if provided
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone || null
    if (updates.website !== undefined) dbUpdates.website = updates.website || null
    // Include CRM fields in updates if provided
    if (updates.crm !== undefined) dbUpdates.crm = updates.crm || null
    if (updates.crmOther !== undefined) dbUpdates.crm_other = updates.crmOther || null
    // Include ads tracking enabled in updates if provided
    if (updates.adsTrackingEnabled !== undefined) dbUpdates.ads_tracking_enabled = updates.adsTrackingEnabled || false
    if (updates.adsSetupCompleted !== undefined) dbUpdates.ads_setup_completed = updates.adsSetupCompleted || false
    if (updates.welcomeVideoWatchedAt !== undefined) {
      dbUpdates.welcome_video_watched_at = updates.welcomeVideoWatchedAt
        ? (updates.welcomeVideoWatchedAt instanceof Date
          ? updates.welcomeVideoWatchedAt.toISOString()
          : updates.welcomeVideoWatchedAt)
        : null
    }
    if (updates.onboardingCompleted !== undefined) dbUpdates.onboarding_completed = updates.onboardingCompleted || false
    if (updates.onboardingStep !== undefined) dbUpdates.onboarding_step = updates.onboardingStep
    if (updates.onboardingCompletedAt !== undefined) {
      dbUpdates.onboarding_completed_at = updates.onboardingCompletedAt
        ? (updates.onboardingCompletedAt instanceof Date
          ? updates.onboardingCompletedAt.toISOString()
          : updates.onboardingCompletedAt)
        : null
    }

      logger.debug('Updating user profile', { userId: targetUserId, updates: dbUpdates });

      type UserProfileRow = {
        id: string | null;
        email: string | null;
        first_name: string | null;
        last_name: string | null;
        full_name: string | null;
        company_name: string | null;
        phone?: string | null;
        website?: string | null;
        crm: string | null;
        crm_other: string | null;
        ads_tracking_enabled: boolean | null;
        ads_setup_completed?: boolean | null;
        welcome_video_watched_at?: string | null;
        onboarding_completed?: boolean | null;
        onboarding_step?: number | null;
        onboarding_completed_at?: string | null;
        subscription_tier: string | null;
        subscription_status: string | null;
        created_at: string | null;
        updated_at: string | null;
      };

      // Select all columns including phone/website (migration should have run)
      const selectColumns = 'id, email, first_name, last_name, full_name, company_name, phone, website, crm, crm_other, ads_tracking_enabled, ads_setup_completed, welcome_video_watched_at, onboarding_completed, onboarding_step, onboarding_completed_at, subscription_tier, subscription_status, created_at, updated_at'
      
      const updateResult = await supabase
        .from('user_profiles')
        .update(dbUpdates)
        .eq('id', targetUserId)
        .select(selectColumns)
        .single()

      let data = updateResult.data as UserProfileRow | null
      let error = updateResult.error

      // If update fails with column error for new fields, retry without them
      if (error && (updates.phone !== undefined || updates.website !== undefined || updates.welcomeVideoWatchedAt !== undefined || updates.onboardingCompleted !== undefined || updates.onboardingStep !== undefined || updates.onboardingCompletedAt !== undefined) && (error.message?.includes('column') || error.message?.includes('phone') || error.message?.includes('website') || error.message?.includes('welcome_video_watched_at') || error.message?.includes('onboarding') || error.code === '42703' || error.code === 'PGRST116')) {
        logger.debug('Update failed with phone/website, retrying without them', { error });
        
        const dbUpdatesWithoutNewFields: Record<string, unknown> = {}
        if (updates.firstName !== undefined) dbUpdatesWithoutNewFields.first_name = updates.firstName || null
        if (updates.lastName !== undefined) dbUpdatesWithoutNewFields.last_name = updates.lastName || null
        if (updates.name !== undefined) dbUpdatesWithoutNewFields.full_name = updates.name || null
        if (updates.companyName !== undefined) dbUpdatesWithoutNewFields.company_name = updates.companyName || null
        if (updates.email !== undefined) dbUpdatesWithoutNewFields.email = updates.email
        dbUpdatesWithoutNewFields.updated_at = new Date().toISOString()
        
        // Reconstruct full_name if needed
        if ((updates.firstName !== undefined || updates.lastName !== undefined) && updates.name === undefined) {
          const firstName = updates.firstName !== undefined ? updates.firstName : profileSource.firstName || ''
          const lastName = updates.lastName !== undefined ? updates.lastName : profileSource.lastName || ''
          dbUpdatesWithoutNewFields.full_name = (firstName && lastName) ? `${firstName} ${lastName}` : (firstName || lastName || null)
        }
        
        // Include CRM fields in retry if they were in the original update
        if (updates.crm !== undefined) dbUpdatesWithoutNewFields.crm = updates.crm || null
        if (updates.crmOther !== undefined) dbUpdatesWithoutNewFields.crm_other = updates.crmOther || null
        
        const retryResult = await supabase
          .from('user_profiles')
          .update(dbUpdatesWithoutNewFields)
          .eq('id', targetUserId)
          .select('id, email, first_name, last_name, full_name, company_name, crm, crm_other, ads_tracking_enabled, ads_setup_completed, subscription_tier, subscription_status, created_at, updated_at')
        .single()

        data = retryResult.data as UserProfileRow | null
        error = retryResult.error
      }

      logger.debug('Update result', { hasData: !!data, hasError: !!error });

      if (error) {
        logger.error('Profile update error:', error);
        throw error;
      }

    if (!data) {
      logger.error('No data returned from update');
      throw new Error('Update succeeded but no data returned');
    }

      logger.debug('Profile updated successfully, updating local state');
    logger.debug('Updated profile data from database');
    
    // Use the returned data directly from the update query (most reliable)
    // Parse the updated profile data
    const updatedFirstName = data.first_name !== null && data.first_name !== undefined ? data.first_name : '';
    const updatedLastName = data.last_name !== null && data.last_name !== undefined ? data.last_name : '';
    const updatedFullName = data.full_name !== null && data.full_name !== undefined 
      ? data.full_name 
      : (updatedFirstName && updatedLastName ? `${updatedFirstName} ${updatedLastName}` : (updatedFirstName || updatedLastName || profileSource.name));
    const updatedCompanyName = data.company_name !== null && data.company_name !== undefined ? data.company_name : '';
    const updatedPhone = data.phone !== null && data.phone !== undefined ? data.phone : '';
    const updatedWebsite = data.website !== null && data.website !== undefined ? data.website : '';
    const updatedCrm = (data.crm as CRMType | undefined) || undefined;
    const updatedCrmOther = data.crm_other !== null && data.crm_other !== undefined ? data.crm_other : undefined;
    const updatedAdsTrackingEnabled = data.ads_tracking_enabled === true;
    const updatedAdsSetupCompleted = data.ads_setup_completed === true;
    const updatedWelcomeVideoWatchedAt = data.welcome_video_watched_at ? new Date(data.welcome_video_watched_at) : null;
    const updatedOnboardingCompleted = data.onboarding_completed === true;
    const updatedOnboardingStep = data.onboarding_step ?? profileSource.onboardingStep ?? 0;
    const updatedOnboardingCompletedAt = data.onboarding_completed_at ? new Date(data.onboarding_completed_at) : null;
    
    // Update local state immediately with the data returned from the update
    const updatedUser = {
      ...profileSource,
      firstName: updatedFirstName,
      lastName: updatedLastName,
      name: updatedFullName,
      companyName: updatedCompanyName,
      email: data.email !== undefined ? data.email : profileSource.email,
      phone: updatedPhone,
      website: updatedWebsite,
      crm: updatedCrm,
      crmOther: updatedCrmOther,
      adsTrackingEnabled: updatedAdsTrackingEnabled,
      adsSetupCompleted: updatedAdsSetupCompleted,
      welcomeVideoWatchedAt: updatedWelcomeVideoWatchedAt,
      onboardingCompleted: updatedOnboardingCompleted,
      onboardingStep: updatedOnboardingStep,
      onboardingCompletedAt: updatedOnboardingCompletedAt
    };
    
    logger.debug('Updating user state', {
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      name: updatedUser.name,
      companyName: updatedUser.companyName
    });
    
    if (impersonatingUserId) {
      setImpersonatingUser({
        id: targetUserId,
        email: updatedUser.email,
        first_name: updatedUser.firstName || null,
        last_name: updatedUser.lastName || null,
        full_name: updatedUser.name || null,
        company_name: updatedUser.companyName || null,
        phone: updatedUser.phone || null,
        website: updatedUser.website || null,
        crm: updatedUser.crm || null,
        crm_other: updatedUser.crmOther || null,
        ads_tracking_enabled: updatedUser.adsTrackingEnabled || false,
        ads_setup_completed: updatedUser.adsSetupCompleted || false,
        welcome_video_watched_at: updatedWelcomeVideoWatchedAt ? updatedWelcomeVideoWatchedAt.toISOString() : null,
        trial_ends_at: updatedUser.trialEndsAt ? updatedUser.trialEndsAt.toISOString() : null,
        subscription_tier: updatedUser.subscriptionTier,
        subscription_status: updatedUser.subscriptionStatus,
        is_admin: false,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      })
    } else {
      setUser(updatedUser);
    }
    
    // Also verify by reloading after a short delay to ensure consistency
    // This helps catch any edge cases where the update didn't fully commit
    setTimeout(async () => {
      try {
        if (!impersonatingUserId) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            const reloadedProfile = await loadUserProfile(authUser);
            if (reloadedProfile) {
              logger.debug('Profile verification reload');
              // Only update if there's a discrepancy
              if (
                reloadedProfile.firstName !== updatedUser.firstName ||
                reloadedProfile.lastName !== updatedUser.lastName ||
                reloadedProfile.companyName !== updatedUser.companyName
              ) {
                logger.warn('Profile data discrepancy detected, updating from reload', {
                  saved: { firstName: updatedUser.firstName, lastName: updatedUser.lastName, companyName: updatedUser.companyName },
                  reloaded: { firstName: reloadedProfile.firstName, lastName: reloadedProfile.lastName, companyName: reloadedProfile.companyName }
                });
                setUser(reloadedProfile);
              }
            }
          }
        }
      } catch (verifyError) {
        logger.error('Error during profile verification reload:', verifyError);
        // Don't throw - we already updated from the direct response
      }
    }, 500);
  }

  const value = {
    user,
    effectiveUser,
    session,
    loading,
    features,
    isTrialUser,
    viewingAsGuest,
    sharedAccountOwnerId,
    isViewOnly,
    effectiveUserId,
    switchToSharedAccount,
    switchToOwnAccount,
    isAdmin,
    impersonatingUserId,
    impersonatingUser,
    impersonationSessionId: impersonationSessionId.current,
    startImpersonation,
    stopImpersonation,
    signIn,
    signUp,
    signOut,
    upgradeToPro,
    downgradeToFree,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
