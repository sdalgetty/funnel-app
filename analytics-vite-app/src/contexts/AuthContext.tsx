import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: any | null
  session: any | null
  loading: boolean
  features: {
    canAccessSales: boolean
    canAccessForecast: boolean
    canUseDataIntegration: boolean
    canSyncFunnelWithSales: boolean
    advertising: boolean
  }
  isTrialUser: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName?: string, companyName?: string) => Promise<void>
  signOut: () => Promise<void>
  upgradeToPro: () => Promise<void>
  downgradeToFree: () => Promise<void>
  updateProfile: (updates: Partial<any>) => Promise<void>
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
  const [user, setUser] = useState<any | null>(null)
  const [session, setSession] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  // Helper function to build combined user from auth user and profile data
  const buildCombinedUser = async (authUser: any, profileData: any) => {
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
      firstName,
      lastName,
      name: fullName,
      companyName: profileData.company_name !== null && profileData.company_name !== undefined 
        ? profileData.company_name 
        : '',
      subscriptionTier: profileData.subscription_tier || 'pro',
      subscriptionStatus: profileData.subscription_status || 'active',
      createdAt: new Date(authUser.created_at),
      lastLoginAt: new Date(),
      trialEndsAt: profileData.trial_ends_at ? new Date(profileData.trial_ends_at) : null
    };
    
    console.log('Combined user created:', {
      profileFirstName: profileData.first_name,
      profileLastName: profileData.last_name,
      profileFullName: profileData.full_name,
      profileCompanyName: profileData.company_name,
      finalFirstName: combinedUser.firstName,
      finalLastName: combinedUser.lastName,
      finalName: combinedUser.name,
      finalCompanyName: combinedUser.companyName
    });

    console.log('Successfully built combined user:', combinedUser);
    return combinedUser;
  };

  // Helper function to load user profile data
  const loadUserProfile = async (authUser: any) => {
    console.log('Loading user profile for:', authUser?.id);
    
    if (!authUser) {
      console.log('No auth user provided');
      return null;
    }

    try {
      console.log('Attempting profile query...');
      
      // Query for profile - use maybeSingle to handle missing profiles gracefully
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      console.log('Profile query completed:', { 
        profileData, 
        profileError,
        errorCode: profileError?.code,
        firstName: profileData?.first_name,
        lastName: profileData?.last_name,
        companyName: profileData?.company_name,
        fullName: profileData?.full_name
      });

      // If profile doesn't exist, create one
      if (profileError?.code === 'PGRST116' || !profileData) {
        console.log('Profile does not exist, creating one...');
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
            subscription_status: 'active'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
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

        console.log('Profile created successfully:', newProfile);
        return await buildCombinedUser(authUser, newProfile);
      }

      if (profileError) {
        console.error('Profile query error:', profileError);
        throw profileError;
      }

      if (!profileData) {
        console.log('No profile data found in database after query');
        return null;
      }

      // Build combined user from profile data
      return await buildCombinedUser(authUser, profileData);
    } catch (error) {
      console.error('Profile loading failed, using basic user:', error);
      // Return basic user if profile query fails
      return {
        ...authUser,
        firstName: '',
        lastName: '',
        name: authUser.user_metadata?.full_name || authUser.email,
        companyName: '',
        subscriptionTier: 'pro', // Set to pro for testing
        subscriptionStatus: 'active',
        createdAt: new Date(authUser.created_at),
        lastLoginAt: new Date(),
        trialEndsAt: null
      };
    }
  }

  // Calculate features based on user subscription
  const features = {
    canAccessSales: user?.subscriptionTier === 'pro' || user?.subscriptionTier === 'trial',
    canAccessForecast: user?.subscriptionTier === 'pro' || user?.subscriptionTier === 'trial',
    canUseDataIntegration: user?.subscriptionTier === 'pro' || user?.subscriptionTier === 'trial',
    canSyncFunnelWithSales: user?.subscriptionTier === 'pro' || user?.subscriptionTier === 'trial',
    advertising: user?.subscriptionTier === 'pro' || user?.subscriptionTier === 'trial'
  }

  // Helper function to check if user is on trial
  const isTrialUser = user?.subscriptionTier === 'trial'

  useEffect(() => {
    console.log('AuthContext useEffect starting...');
    
    // Check if Supabase is properly configured
    const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && 
      import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co'

    if (!isSupabaseConfigured) {
      console.error('❌ Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
      setLoading(false)
      return
    }

    console.log('Supabase configured, getting session...');

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Auth timeout - setting loading to false');
      setLoading(false);
    }, 10000); // 10 second timeout

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      clearTimeout(timeoutId); // Clear timeout since we got a response
      console.log('Session result:', { session: !!session, error });
      
      if (error) {
        console.error('Error getting session:', error);
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      
      setSession(session)
      if (session?.user) {
        console.log('User found, loading profile...');
        // Set basic user first so UI can render, then load profile in background
        const basicUser = {
          ...session.user,
          firstName: '',
          lastName: '',
          name: session.user.user_metadata?.full_name || session.user.email,
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
        loadUserProfile(session.user).then(userWithProfile => {
          if (userWithProfile) {
            console.log('Profile loaded in background:', userWithProfile);
            setUser(userWithProfile);
          }
        }).catch(profileError => {
          console.error('Error loading profile in background:', profileError);
          // Keep using basic user - already set
        });
      } else {
        console.log('No user session');
        setUser(null);
        setLoading(false);
      }
    }).catch(error => {
      clearTimeout(timeoutId); // Clear timeout on error
      console.error('Error in session promise:', error);
      setSession(null);
      setUser(null);
      setLoading(false);
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session ? 'session exists' : 'no session');
      setSession(session)
      
      if (session?.user) {
        console.log('User authenticated, loading profile...');
        // Set basic user first so UI can render immediately
        const basicUser = {
          ...session.user,
          firstName: '',
          lastName: '',
          name: session.user.user_metadata?.full_name || session.user.email,
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
        loadUserProfile(session.user).then(userWithProfile => {
          if (userWithProfile) {
            console.log('Profile loaded in background:', userWithProfile);
            setUser(userWithProfile);
          }
        }).catch(profileError => {
          console.error('Error loading profile in background:', profileError);
          // Keep using basic user - already set
        });
      } else {
        console.log('No user session');
        setUser(null);
        setLoading(false);
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log('SignIn called with:', email);
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        console.error('SignIn error:', error);
        throw error;
      }
      console.log('SignIn successful');
    } catch (error) {
      console.error('SignIn failed:', error);
      setLoading(false);
      throw error;
    }
  }

  const signUp = async (email: string, password: string, fullName?: string, companyName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    if (error) throw error

    // Create user profile after successful signup
    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email: email,
          full_name: fullName,
          company_name: companyName,
          subscription_tier: 'free',
          subscription_status: 'active'
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
        // Don't throw here as the user was created successfully
      } else {
        // Immediately update the user object with profile data
        const userWithProfile = await loadUserProfile(data.user)
        setUser(userWithProfile)
      }
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
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

  const updateProfile = async (updates: Partial<any>) => {
    console.log('updateProfile called with:', updates);
    console.log('Current user:', user);
    
    if (!user) {
      console.error('No user found for profile update');
      throw new Error('No user found for profile update');
    }

    // Map frontend field names to database field names
    // Include empty strings explicitly to allow clearing values
    const dbUpdates: any = {}
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

    console.log('Database updates:', dbUpdates);
    console.log('Updating user with ID:', user.id);

    const { data, error } = await supabase
      .from('user_profiles')
      .update(dbUpdates)
      .eq('id', user.id)
      .select()
      .single()

    console.log('Update result:', { data, error });

    if (error) {
      console.error('Profile update error:', error);
      throw error;
    }

    if (!data) {
      console.error('No data returned from update');
      throw new Error('Update succeeded but no data returned');
    }

    console.log('Profile updated successfully, updating local state');
    console.log('Updated profile data from database:', data);
    
    // Use the returned data directly from the update query (most reliable)
    // Parse the updated profile data
    const updatedFirstName = data.first_name !== null && data.first_name !== undefined ? data.first_name : '';
    const updatedLastName = data.last_name !== null && data.last_name !== undefined ? data.last_name : '';
    const updatedFullName = data.full_name !== null && data.full_name !== undefined 
      ? data.full_name 
      : (updatedFirstName && updatedLastName ? `${updatedFirstName} ${updatedLastName}` : (updatedFirstName || updatedLastName || user.name));
    const updatedCompanyName = data.company_name !== null && data.company_name !== undefined ? data.company_name : '';
    
    // Update local state immediately with the data returned from the update
    const updatedUser = {
      ...user,
      firstName: updatedFirstName,
      lastName: updatedLastName,
      name: updatedFullName,
      companyName: updatedCompanyName,
      email: data.email !== undefined ? data.email : user.email
    };
    
    console.log('Updating user state with:', {
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      name: updatedUser.name,
      companyName: updatedUser.companyName
    });
    
    setUser(updatedUser);
    
    // Also verify by reloading after a short delay to ensure consistency
    // This helps catch any edge cases where the update didn't fully commit
    setTimeout(async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const reloadedProfile = await loadUserProfile(authUser);
          if (reloadedProfile) {
            console.log('Profile verification reload:', reloadedProfile);
            // Only update if there's a discrepancy
            if (
              reloadedProfile.firstName !== updatedUser.firstName ||
              reloadedProfile.lastName !== updatedUser.lastName ||
              reloadedProfile.companyName !== updatedUser.companyName
            ) {
              console.warn('Profile data discrepancy detected, updating from reload:', {
                saved: { firstName: updatedUser.firstName, lastName: updatedUser.lastName, companyName: updatedUser.companyName },
                reloaded: { firstName: reloadedProfile.firstName, lastName: reloadedProfile.lastName, companyName: reloadedProfile.companyName }
              });
              setUser(reloadedProfile);
            }
          }
        }
      } catch (verifyError) {
        console.error('Error during profile verification reload:', verifyError);
        // Don't throw - we already updated from the direct response
      }
    }, 500);
  }

  const value = {
    user,
    session,
    loading,
    features,
    isTrialUser,
    signIn,
    signUp,
    signOut,
    upgradeToPro,
    downgradeToFree,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
