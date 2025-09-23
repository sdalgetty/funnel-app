import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, SubscriptionTier } from './types';
import { SUBSCRIPTION_FEATURES } from './types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (email: string, password: string, name: string, tier: SubscriptionTier) => Promise<boolean>;
  upgradeToPro: () => void;
  downgradeToFree: () => void;
  isLoading: boolean;
  features: typeof SUBSCRIPTION_FEATURES.free;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get user features based on subscription tier
  const features = user ? SUBSCRIPTION_FEATURES[user.subscriptionTier] : SUBSCRIPTION_FEATURES.free;

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          // Convert date strings back to Date objects
          userData.createdAt = new Date(userData.createdAt);
          userData.lastLoginAt = new Date(userData.lastLoginAt);
          if (userData.trialEndsAt) {
            userData.trialEndsAt = new Date(userData.trialEndsAt);
          }
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('currentUser');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Save user to localStorage whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Mock authentication - in real app, this would call your API
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user lookup
      const mockUsers = [
        { email: 'demo@example.com', password: 'demo123', tier: 'free' as SubscriptionTier },
        { email: 'pro@example.com', password: 'pro123', tier: 'pro' as SubscriptionTier },
        { email: 'trial@example.com', password: 'trial123', tier: 'pro' as SubscriptionTier },
      ];
      
      const mockUser = mockUsers.find(u => u.email === email && u.password === password);
      
      if (mockUser) {
        const userData: User = {
          id: `user_${Date.now()}`,
          email: mockUser.email,
          name: mockUser.email.split('@')[0],
          subscriptionTier: mockUser.tier,
          subscriptionStatus: mockUser.tier === 'pro' ? 'active' : 'active',
          trialEndsAt: mockUser.tier === 'pro' && email === 'trial@example.com' 
            ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) 
            : undefined,
          createdAt: new Date('2024-01-01'),
          lastLoginAt: new Date(),
        };
        
        setUser(userData);
        setIsLoading(false);
        return true;
      } else {
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const signup = async (email: string, password: string, name: string, tier: SubscriptionTier): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock signup - in real app, this would call your API
      const userData: User = {
        id: `user_${Date.now()}`,
        email,
        name,
        subscriptionTier: tier,
        subscriptionStatus: tier === 'pro' ? 'trial' : 'active',
        trialEndsAt: tier === 'pro' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : undefined,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
      
      setUser(userData);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  const upgradeToPro = () => {
    if (user) {
      setUser({
        ...user,
        subscriptionTier: 'pro',
        subscriptionStatus: 'active',
        trialEndsAt: undefined,
      });
    }
  };

  const downgradeToFree = () => {
    if (user) {
      setUser({
        ...user,
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
        trialEndsAt: undefined,
      });
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    signup,
    upgradeToPro,
    downgradeToFree,
    isLoading,
    features,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
