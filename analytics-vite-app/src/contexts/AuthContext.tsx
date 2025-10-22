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
    if (!authUser) return null

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (error) {
      console.error('Error loading user profile:', error)
      return authUser // Return basic auth user if profile not found
    }

    // Combine auth user with profile data
    return {
      ...authUser,
      name: profile.full_name,
      companyName: profile.company_name,
      subscriptionTier: profile.subscription_tier,
      subscriptionStatus: profile.subscription_status,
      createdAt: new Date(profile.created_at),
      lastLoginAt: new Date(),
      trialEndsAt: null // Add trial logic if needed
    }
  }

  // Calculate features based on user subscription
  const features = {
    canAccessSales: user?.subscriptionTier === 'pro',
    canAccessForecast: user?.subscriptionTier === 'pro',
    canUseDataIntegration: user?.subscriptionTier === 'pro',
    canSyncFunnelWithSales: user?.subscriptionTier === 'pro',
    advertising: user?.subscriptionTier === 'pro'
  }

  useEffect(() => {
    // Check if Supabase is properly configured
    const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && 
      import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co'

    if (!isSupabaseConfigured) {
      console.error('❌ Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        const userWithProfile = await loadUserProfile(session.user)
        setUser(userWithProfile)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session?.user) {
        const userWithProfile = await loadUserProfile(session.user)
        setUser(userWithProfile)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
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
    if (user) {
      // Map frontend field names to database field names
      const dbUpdates: any = {}
      if (updates.name) dbUpdates.full_name = updates.name
      if (updates.companyName) dbUpdates.company_name = updates.companyName
      if (updates.email) dbUpdates.email = updates.email

      const { error } = await supabase
        .from('user_profiles')
        .update(dbUpdates)
        .eq('id', user.id)

      if (error) throw error

      setUser({
        ...user,
        ...updates
      })
    }
  }

  const value = {
    user,
    session,
    loading,
    features,
    signIn,
    signUp,
    signOut,
    upgradeToPro,
    downgradeToFree,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
