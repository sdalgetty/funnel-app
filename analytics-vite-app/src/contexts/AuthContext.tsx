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
      // For development without Supabase, create a mock user
      const mockUser = {
        id: 'mock-user-id',
        email: 'hello@anendlesspursuit.com',
        name: 'An Endless Pursuit',
        companyName: 'An Endless Pursuit Photography',
        subscriptionTier: 'pro', // Give demo user pro features
        subscriptionStatus: 'active',
        createdAt: new Date('2025-01-01'), // Current year for new users
        lastLoginAt: new Date(),
        trialEndsAt: null
      }
      setUser(mockUser)
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && 
      import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co'

    if (!isSupabaseConfigured) {
      // Mock sign in for development
      const mockUser = {
        id: 'mock-user-id',
        email: email,
        name: 'Demo User',
        companyName: 'Demo Company',
        subscriptionTier: 'pro',
        subscriptionStatus: 'active',
        createdAt: new Date('2025-01-01'), // Current year for new users
        lastLoginAt: new Date(),
        trialEndsAt: null
      }
      setUser(mockUser)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, fullName?: string, companyName?: string) => {
    const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && 
      import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co'

    if (!isSupabaseConfigured) {
      // Mock sign up for development
      const mockUser = {
        id: 'mock-user-id',
        email: email,
        name: fullName || 'Demo User',
        companyName: companyName || 'Demo Company',
        subscriptionTier: 'pro',
        subscriptionStatus: 'active',
        createdAt: new Date('2025-01-01'), // Current year for new users
        lastLoginAt: new Date(),
        trialEndsAt: null
      }
      setUser(mockUser)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && 
      import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co'

    if (!isSupabaseConfigured) {
      // Mock sign out for development
      setUser(null)
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const upgradeToPro = async () => {
    // Mock upgrade for development
    if (user) {
      setUser({
        ...user,
        subscriptionTier: 'pro'
      })
    }
  }

  const downgradeToFree = async () => {
    // Mock downgrade for development
    if (user) {
      setUser({
        ...user,
        subscriptionTier: 'free'
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
