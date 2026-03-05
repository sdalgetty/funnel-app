import { useState, useEffect, lazy, Suspense, useRef } from 'react'
import FeatureGate from './FeatureGate'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useDataManager } from './hooks/useDataManager'
import LoginForm from './components/LoginForm'
import AcceptInvitation from './components/AcceptInvitation'
import { UpgradePrompt } from './FeatureGate'
import { User, Crown, Settings, Shield, Plus, X, Menu } from 'lucide-react'
import type { Page } from './types'
import AdminDashboard from './components/AdminDashboard'
import { usePageView } from './hooks/usePostHog'
import { UnifiedDataService } from './services/unifiedDataService'
import './App.css'

// Lazy load heavy components for code splitting
const OnboardingWizard = lazy(() => import('./onboarding/OnboardingWizard'))
const BookingsAndBillingsPOC = lazy(() => import('./BookingsAndBillings'))
const Insights = lazy(() => import('./Insights'))
const Funnel = lazy(() => import('./Funnel'))
const Calculator = lazy(() => import('./Calculator'))
const Forecast = lazy(() => import('./Forecast'))
const UserProfile = lazy(() => import('./UserProfile'))
const Advertising = lazy(() => import('./Advertising'))
const AuthModal = lazy(() => import('./AuthModal'))
const Goals = lazy(() => import('./Goals'))

function AppContent() {
  const { user, signOut, loading, features, viewingAsGuest, sharedAccountOwnerId, switchToOwnAccount, isViewOnly, effectiveUserId, isAdmin, impersonatingUserId, impersonatingUser, stopImpersonation } = useAuth()
  const dataManager = useDataManager()
  const [ownerCompanyName, setOwnerCompanyName] = useState<string | null>(null)
  
  // Set page title based on environment
  useEffect(() => {
    const hostname = window.location.hostname
    // Check for test environment - Netlify test sites typically have 'netlify.app' in the domain
    // and are not the production domain 'app.fnnlapp.com'
    const isTestEnv = hostname.includes('netlify.app') && !hostname.includes('app.fnnlapp.com')
    document.title = isTestEnv ? 'FNNL TEST' : 'FNNL'
  }, [])
  
  // Load owner's company name when viewing as guest
  useEffect(() => {
    const loadOwnerInfo = async () => {
      if (viewingAsGuest && sharedAccountOwnerId) {
        try {
          const { supabase } = await import('./lib/supabase')
          const { data, error } = await supabase
            .from('user_profiles')
            .select('company_name, full_name, email')
            .eq('id', sharedAccountOwnerId)
            .maybeSingle()
          
          if (!error && data) {
            setOwnerCompanyName(data.company_name || data.full_name || data.email || 'Unknown Account')
          }
        } catch (error) {
          console.error('Error loading owner info:', error)
        }
      } else {
        setOwnerCompanyName(null)
      }
    }
    loadOwnerInfo()
  }, [viewingAsGuest, sharedAccountOwnerId])
  
  // Check if we're on the invitation acceptance page
  const urlParams = new URLSearchParams(window.location.search)
  const isAcceptInvitationPage = urlParams.has('token') && window.location.pathname === '/accept-invite'
  
  // Note: Removed global window.dataManager assignment - use React Context or props instead
  // Components should access dataManager via props or a DataManagerContext if needed
  
  const [currentPage, setCurrentPage] = useState<Page>('insights')
  const hasSetInitialPageRef = useRef(false)
  
  // Track page views with PostHog
  usePageView(currentPage, {
    user_id: user?.id,
    is_admin: isAdmin,
    viewing_as_guest: viewingAsGuest,
  })
  
  // Check if we're on admin route
  useEffect(() => {
    if (window.location.pathname === '/admin' && isAdmin) {
      setCurrentPage('admin')
    }
  }, [isAdmin])

  // Redirect to onboarding when user hasn't completed it (unless they skipped)
  // Only redirect when onboardingCompleted is explicitly false - not when undefined (profile still loading)
  useEffect(() => {
    if (loading || !user?.id) return
    if (window.location.pathname === '/accept-invite' || window.location.pathname === '/onboarding') return
    const skipped = sessionStorage.getItem('onboarding_skipped') === 'true'
    if (user.onboardingCompleted === false && !skipped) {
      window.location.replace('/onboarding')
    }
  }, [user?.id, user?.onboardingCompleted, loading])

  // Default landing page: Goals until goals exist, then Insights
  useEffect(() => {
    if (loading || !user?.id) return
    if (hasSetInitialPageRef.current) return
    if (currentPage !== 'insights') {
      hasSetInitialPageRef.current = true
      return
    }

    let cancelled = false
    const resolveLandingPage = async () => {
      try {
        const goals = await UnifiedDataService.getCalculatorGoals(user.id)
        if (cancelled) return
        setCurrentPage(goals ? 'insights' : 'goals')
      } catch (error) {
        console.error('Error checking goals for landing page:', error)
      } finally {
        if (!cancelled) {
          hasSetInitialPageRef.current = true
        }
      }
    }
    resolveLandingPage()

    return () => {
      cancelled = true
    }
  }, [user?.id, loading, currentPage])
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  // Navigation state for opening modals/actions in other tabs
  const [navigationAction, setNavigationAction] = useState<{
    page: Page
    action?: string
    month?: { year: number; month: number }
  } | null>(null)

  // Device detection
  useEffect(() => {
    const checkDevice = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // Debug logging (can be removed later)
      if (process.env.NODE_ENV === 'development') {
        console.log('Mobile detection:', { width: window.innerWidth, isMobile: mobile })
      }
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  // Handle navigation events from WelcomeAndTasks component
  useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      const { action, month } = event.detail
      
      switch (action) {
        case 'add-booking':
          setCurrentPage('bookings')
          // Store action to open modal
          setNavigationAction({ page: 'bookings', action: 'add-booking' })
          // Clear after a delay to allow component to mount and process
          setTimeout(() => setNavigationAction(null), 500)
          break
        case 'edit-funnel':
          setCurrentPage('funnel')
          setNavigationAction({ page: 'funnel', action: 'edit-month', month })
          // Give more time for Funnel component to mount and open modal
          setTimeout(() => setNavigationAction(null), 1000)
          break
        case 'view-sales':
          setCurrentPage('bookings')
          setNavigationAction({ page: 'bookings', action: 'filter-month', month })
          setTimeout(() => setNavigationAction(null), 100)
          break
        case 'edit-advertising':
          setCurrentPage('advertising')
          setNavigationAction({ page: 'advertising', action: 'edit-month', month })
          setTimeout(() => setNavigationAction(null), 100)
          break
        case 'view-goals':
          setCurrentPage('goals')
          setTimeout(() => setNavigationAction(null), 100)
          break
        case 'view-forecast':
          // Forecast page removed - keeping for potential future Tools page
          break
      }
    }

    window.addEventListener('navigateToPage', handleNavigate as EventListener)
    return () => window.removeEventListener('navigateToPage', handleNavigate as EventListener)
  }, [])

  const openCurrentMonthFunnel = () => {
    const now = new Date()
    const month = { year: now.getFullYear(), month: now.getMonth() + 1 }
    setCurrentPage('funnel')
    setNavigationAction({ page: 'funnel', action: 'edit-month', month })
    setTimeout(() => setNavigationAction(null), 1000)
  }

  // Show invitation acceptance page if on /accept-invite route
  const isOnAcceptInvitePath = window.location.pathname === '/accept-invite'
  if (isOnAcceptInvitePath) {
    return <AcceptInvitation />
  }

  // Show onboarding wizard if on /onboarding route and user is logged in
  const isOnOnboardingPath = window.location.pathname === '/onboarding'
  if (isOnOnboardingPath && user) {
    return (
      <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Loading...</div>}>
        <OnboardingWizard />
      </Suspense>
    )
  }

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    )
  }

  // Show login form if not authenticated
  if (!user) {
    // Show login form (token will be handled by LoginForm and AuthContext)
    return (
      <div>
        <LoginForm />
      </div>
    )
  }


  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5', 
      width: '100%', 
      maxWidth: '100vw',
      overflowX: 'hidden', 
      position: 'relative',
      WebkitOverflowScrolling: 'touch'
    }}>

      {/* Impersonation Banner (Admin Mode) */}
      {impersonatingUserId && (
        <div style={{
          backgroundColor: '#dbeafe',
          borderBottom: '1px solid #3b82f6',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: isMobile ? '48px' : '0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} style={{ color: '#1e40af' }} />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e40af' }}>
              🔧 <strong>Admin Mode:</strong> Impersonating <strong>{impersonatingUser?.full_name || impersonatingUser?.email || 'User'}</strong>
            </span>
          </div>
          <button
            onClick={stopImpersonation}
            style={{
              padding: '6px 12px',
              backgroundColor: 'white',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              color: '#1e40af',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Return to Admin
          </button>
        </div>
      )}

      {/* View-Only Mode Banner */}
      {viewingAsGuest && !impersonatingUserId && (
        <div style={{
          backgroundColor: '#fef3c7',
          borderBottom: '1px solid #f59e0b',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: isMobile ? '48px' : '0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#92400e' }}>
              👁️ You're viewing <strong>{ownerCompanyName || 'this account'}</strong> in read-only mode
            </span>
          </div>
          <button
            onClick={switchToOwnAccount}
            style={{
              padding: '6px 12px',
              backgroundColor: 'white',
              border: '1px solid #f59e0b',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              color: '#92400e',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Switch to My Account
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e5e7eb',
        padding: isMobile ? '12px 16px' : '16px 24px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        marginTop: '0',
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box',
        position: isMobile ? 'fixed' : 'relative',
        top: isMobile ? '0' : 'auto',
        left: isMobile ? '0' : 'auto',
        right: isMobile ? '0' : 'auto',
        zIndex: 100
      }}>
        <h1 
          onClick={() => {
            setCurrentPage('insights')
            setIsMobileMenuOpen(false)
          }}
          style={{ 
            fontSize: isMobile ? '18px' : '20px', 
            fontWeight: '800', 
            letterSpacing: '0.04em', 
            margin: 0, 
            color: '#1f2937',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.7'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          FNNL
        </h1>
        
        {/* Desktop Navigation */}
        <div style={{ display: isMobile ? 'none' : 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button
            onClick={() => setCurrentPage('insights')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: currentPage === 'insights' ? '#3b82f6' : '#f3f4f6',
              color: currentPage === 'insights' ? 'white' : '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Insights
          </button>
          <button
            onClick={() => setCurrentPage('goals')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: currentPage === 'goals' ? '#3b82f6' : '#f3f4f6',
              color: currentPage === 'goals' ? 'white' : '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Goals
          </button>
          <button
            onClick={() => setCurrentPage('funnel')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: currentPage === 'funnel' ? '#3b82f6' : '#f3f4f6',
              color: currentPage === 'funnel' ? 'white' : '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Funnel
          </button>
          <button
            onClick={() => setCurrentPage('bookings')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: currentPage === 'bookings' ? '#3b82f6' : '#f3f4f6',
              color: currentPage === 'bookings' ? 'white' : '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Sales
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                setCurrentPage('admin')
                window.history.pushState({}, '', '/admin')
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: currentPage === 'admin' ? '#3b82f6' : '#f3f4f6',
                color: currentPage === 'admin' ? 'white' : '#374151',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Shield size={16} />
              Admin
            </button>
          )}
          <button
            onClick={() => setCurrentPage('profile')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: currentPage === 'profile' ? '#3b82f6' : '#f3f4f6',
              color: currentPage === 'profile' ? 'white' : '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Settings size={16} />
            Profile
          </button>
          {user && !isViewOnly && (
            <button
              onClick={openCurrentMonthFunnel}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                marginLeft: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(16, 185, 129, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Plus size={16} />
              New Data
            </button>
          )}
        </div>

        {/* Mobile Hamburger Menu Button */}
        {isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              marginLeft: 'auto',
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1f2937'
            }}
          >
            <Menu size={24} />
          </button>
        )}

        {/* User Menu - Desktop */}
        <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: '12px', marginLeft: '16px' }}>
          {!user && (
            <button
              onClick={() => setShowAuthModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#3b82f6',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <User size={16} />
              Sign In
            </button>
          )}
        </div>

      </nav>

      {/* Mobile Menu Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            paddingTop: '0',
            overflow: 'hidden'
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              width: '300px',
              maxWidth: '90vw',
              height: '100vh',
              overflowY: 'auto',
              boxShadow: '-4px 0 6px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              padding: '0',
              marginRight: '0'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                margin: 0,
                color: '#1f2937'
              }}>
                Menu
              </h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Mobile Menu Items */}
            <button
              onClick={() => {
                setCurrentPage('insights')
                setIsMobileMenuOpen(false)
              }}
              style={{
                padding: '16px 24px',
                border: 'none',
                backgroundColor: currentPage === 'insights' ? '#eff6ff' : 'transparent',
                color: currentPage === 'insights' ? '#3b82f6' : '#374151',
                fontSize: '16px',
                fontWeight: currentPage === 'insights' ? '600' : '500',
                textAlign: 'left',
                cursor: 'pointer',
                borderLeft: currentPage === 'insights' ? '4px solid #3b82f6' : '4px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              Insights
            </button>
            <button
              onClick={() => {
                setCurrentPage('goals')
                setIsMobileMenuOpen(false)
              }}
              style={{
                padding: '16px 24px',
                border: 'none',
                backgroundColor: currentPage === 'goals' ? '#eff6ff' : 'transparent',
                color: currentPage === 'goals' ? '#3b82f6' : '#374151',
                fontSize: '16px',
                fontWeight: currentPage === 'goals' ? '600' : '500',
                textAlign: 'left',
                cursor: 'pointer',
                borderLeft: currentPage === 'goals' ? '4px solid #3b82f6' : '4px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              Goals
            </button>
            <button
              onClick={() => {
                setCurrentPage('funnel')
                setIsMobileMenuOpen(false)
              }}
              style={{
                padding: '16px 24px',
                border: 'none',
                backgroundColor: currentPage === 'funnel' ? '#eff6ff' : 'transparent',
                color: currentPage === 'funnel' ? '#3b82f6' : '#374151',
                fontSize: '16px',
                fontWeight: currentPage === 'funnel' ? '600' : '500',
                textAlign: 'left',
                cursor: 'pointer',
                borderLeft: currentPage === 'funnel' ? '4px solid #3b82f6' : '4px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              Funnel
            </button>
            <button
              onClick={() => {
                setCurrentPage('bookings')
                setIsMobileMenuOpen(false)
              }}
              style={{
                padding: '16px 24px',
                border: 'none',
                backgroundColor: currentPage === 'bookings' ? '#eff6ff' : 'transparent',
                color: currentPage === 'bookings' ? '#3b82f6' : '#374151',
                fontSize: '16px',
                fontWeight: currentPage === 'bookings' ? '600' : '500',
                textAlign: 'left',
                cursor: 'pointer',
                borderLeft: currentPage === 'bookings' ? '4px solid #3b82f6' : '4px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              Sales
            </button>
            <button
              onClick={() => {
                setCurrentPage('profile')
                setIsMobileMenuOpen(false)
              }}
              style={{
                padding: '16px 24px',
                border: 'none',
                backgroundColor: currentPage === 'profile' ? '#eff6ff' : 'transparent',
                color: currentPage === 'profile' ? '#3b82f6' : '#374151',
                fontSize: '16px',
                fontWeight: currentPage === 'profile' ? '600' : '500',
                textAlign: 'left',
                cursor: 'pointer',
                borderLeft: currentPage === 'profile' ? '4px solid #3b82f6' : '4px solid transparent',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Settings size={18} />
              Profile
            </button>
            {isAdmin && (
              <button
                onClick={() => {
                  setCurrentPage('admin')
                  setIsMobileMenuOpen(false)
                  window.history.pushState({}, '', '/admin')
                }}
                style={{
                  padding: '16px 24px',
                  border: 'none',
                  backgroundColor: currentPage === 'admin' ? '#eff6ff' : 'transparent',
                  color: currentPage === 'admin' ? '#3b82f6' : '#374151',
                  fontSize: '16px',
                  fontWeight: currentPage === 'admin' ? '600' : '500',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderLeft: currentPage === 'admin' ? '4px solid #3b82f6' : '4px solid transparent',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Shield size={18} />
                Admin
              </button>
            )}
            {user && !isViewOnly && (
              <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '8px', paddingTop: '8px', paddingLeft: '0', paddingRight: '0' }}>
                <button
                  onClick={() => {
                    openCurrentMonthFunnel()
                    setIsMobileMenuOpen(false)
                  }}
                  style={{
                    width: 'calc(100% - 32px)',
                    margin: '8px 16px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                    boxSizing: 'border-box'
                  }}
                >
                  <Plus size={20} />
                  New Data
                </button>
              </div>
            )}
            {!user && (
              <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '8px', paddingTop: '8px' }}>
                <button
                  onClick={() => {
                    setShowAuthModal(true)
                    setIsMobileMenuOpen(false)
                  }}
                  style={{
                    width: '100%',
                    margin: '8px 16px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <User size={20} />
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Page Content */}
      <div style={{ padding: '0', marginTop: isMobile ? '56px' : '0' }}>
        <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Loading...</div>}>
          {currentPage === 'goals' && (
            <Goals 
              dataManager={dataManager}
            />
          )}
          {currentPage === 'insights' && (
            <Insights 
              dataManager={dataManager}
            />
          )}
          {currentPage === 'funnel' && <Funnel 
            funnelData={dataManager.funnelData} 
            dataManager={dataManager}
            salesData={dataManager.bookings}
            paymentsData={dataManager.payments} 
            serviceTypes={dataManager.serviceTypes}
            navigationAction={navigationAction}
            isViewOnly={isViewOnly}
          />}
          {/* Forecast page removed - keeping code for potential future Tools page */}
          {/* {currentPage === 'forecast' && (
            <FeatureGate feature="forecast">
              <Forecast 
                funnelData={dataManager.funnelData} 
                serviceTypes={dataManager.serviceTypes} 
                setServiceTypes={() => {}}
                bookings={dataManager.bookings} 
                payments={dataManager.payments}
                showModelingOnly
                dataManager={dataManager}
              />
            </FeatureGate>
          )} */}
          {currentPage === 'advertising' && (
            <FeatureGate feature="advertising">
              <Advertising 
                bookings={dataManager.bookings} 
                leadSources={dataManager.leadSources} 
                funnelData={dataManager.funnelData}
                dataManager={dataManager}
                navigationAction={navigationAction}
                isViewOnly={isViewOnly}
              />
            </FeatureGate>
          )}
          {currentPage === 'bookings' && (
            <FeatureGate feature="sales">
              <BookingsAndBillingsPOC 
                dataManager={dataManager}
                navigationAction={navigationAction}
                isViewOnly={isViewOnly}
              />
            </FeatureGate>
          )}
          {currentPage === 'admin' && <AdminDashboard />}
          {currentPage === 'profile' && <UserProfile />}
        </Suspense>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
