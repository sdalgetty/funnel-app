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

  // Helper function to load user profile data
  const loadUserProfile = async (authUser: any) => {
    console.log('Loading user profile for:', authUser?.id);
    
    if (!authUser) {
      console.log('No auth user provided');
      return null;
    }

    try {
      console.log('Attempting profile query with 3-second timeout...');
      
      // Try profile query with a short timeout
      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile query timeout')), 10000)
      );

      const result = await Promise.race([profilePromise, timeoutPromise]);
      const { data: profileData, error: profileError } = result as any;

      console.log('Profile query completed:', { profileData, profileError });

      if (profileError) {
        console.error('Profile query error:', profileError);
        throw profileError;
      }

      // Combine auth user with profile data
      const combinedUser = {
        ...authUser,
        name: profileData.full_name || authUser.user_metadata?.full_name || authUser.email,
        companyName: profileData.company_name || '',
        subscriptionTier: profileData.subscription_tier || 'pro',
        subscriptionStatus: profileData.subscription_status || 'active',
        createdAt: new Date(authUser.created_at),
        lastLoginAt: new Date(),
        trialEndsAt: profileData.trial_ends_at ? new Date(profileData.trial_ends_at) : null
      };

      console.log('Successfully loaded profile data:', combinedUser);
      return combinedUser;
    } catch (error) {
      console.error('Profile loading failed, using basic user:', error);
      // Return basic user if profile query fails
      return {
        ...authUser,
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
        return;
      }
      
      setSession(session)
      if (session?.user) {
        console.log('User found, loading profile...');
        try {
          const userWithProfile = await loadUserProfile(session.user)
          console.log('Profile loaded:', userWithProfile);
          setUser(userWithProfile)
        } catch (profileError) {
          console.error('Error loading profile:', profileError);
          setUser(session.user) // Use basic auth user if profile fails
        }
      } else {
        console.log('No user session');
        setUser(null)
      }
    }).catch(error => {
      clearTimeout(timeoutId); // Clear timeout on error
      console.error('Error in session promise:', error);
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
        const userWithProfile = await loadUserProfile(session.user)
        setUser(userWithProfile)
        console.log('User profile loaded:', userWithProfile);
      } else {
        console.log('No user session');
        setUser(null)
      }
      console.log('Setting loading to false');
      setLoading(false)
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
    
    if (user) {
      // Map frontend field names to database field names
      const dbUpdates: any = {}
      if (updates.name) dbUpdates.full_name = updates.name
      if (updates.companyName) dbUpdates.company_name = updates.companyName
      if (updates.email) dbUpdates.email = updates.email

      console.log('Database updates:', dbUpdates);
      console.log('Updating user with ID:', user.id);

      const { data, error } = await supabase
        .from('user_profiles')
        .update(dbUpdates)
        .eq('id', user.id)
        .select()

      console.log('Update result:', { data, error });

      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }

      console.log('Profile updated successfully, updating local state');
      setUser({
        ...user,
        ...updates
      })
    } else {
      console.error('No user found for profile update');
    }
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
