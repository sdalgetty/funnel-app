import { useState, useEffect, lazy, Suspense } from 'react'
import FeatureGate from './FeatureGate'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useDataManager } from './hooks/useDataManager'
import LoginForm from './components/LoginForm'
import TestConnection from './components/TestConnection'
import AcceptInvitation from './components/AcceptInvitation'
import { UpgradePrompt } from './FeatureGate'
import { User, Crown, LogOut, Settings, Shield, Plus, X } from 'lucide-react'
import type { Page } from './types'
import AdminDashboard from './components/AdminDashboard'
import { usePageView } from './hooks/usePostHog'
import './App.css'

// Lazy load heavy components for code splitting
const BookingsAndBillingsPOC = lazy(() => import('./BookingsAndBillings'))
const Insights = lazy(() => import('./Insights'))
const Funnel = lazy(() => import('./Funnel'))
const Calculator = lazy(() => import('./Calculator'))
const Forecast = lazy(() => import('./Forecast'))
const UserProfile = lazy(() => import('./UserProfile'))
const Advertising = lazy(() => import('./Advertising'))
const AuthModal = lazy(() => import('./AuthModal'))

function AppContent() {
  const { user, signOut, loading, features, viewingAsGuest, sharedAccountOwnerId, switchToOwnAccount, isViewOnly, effectiveUserId, isAdmin, impersonatingUserId, impersonatingUser, stopImpersonation } = useAuth()
  const dataManager = useDataManager()
  const [ownerCompanyName, setOwnerCompanyName] = useState<string | null>(null)
  
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
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  // Navigation state for opening modals/actions in other tabs
  const [navigationAction, setNavigationAction] = useState<{
    page: Page
    action?: string
    month?: { year: number; month: number }
  } | null>(null)

  // Device detection
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768)
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
        case 'view-forecast':
          setCurrentPage('forecast')
          break
      }
    }

    window.addEventListener('navigateToPage', handleNavigate as EventListener)
    return () => window.removeEventListener('navigateToPage', handleNavigate as EventListener)
  }, [])

  // Handle create modal actions
  const handleCreateAction = (action: string) => {
    setShowCreateModal(false)
    const now = new Date()
    const month = { year: now.getFullYear(), month: now.getMonth() + 1 }
    
    switch (action) {
      case 'add-booking':
        setCurrentPage('bookings')
        setNavigationAction({ page: 'bookings', action: 'add-booking' })
        setTimeout(() => setNavigationAction(null), 500)
        break
      case 'add-inquiry':
      case 'add-call-booked':
      case 'add-call-taken':
        setCurrentPage('funnel')
        setNavigationAction({ page: 'funnel', action: 'edit-month', month })
        setTimeout(() => setNavigationAction(null), 1000)
        break
    }
  }

  // Show invitation acceptance page if on /accept-invite route
  const isOnAcceptInvitePath = window.location.pathname === '/accept-invite'
  if (isOnAcceptInvitePath) {
    return <AcceptInvitation />
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
        {/* Only show database test in development */}
        {import.meta.env.DEV && <TestConnection />}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', width: '100%', overflowX: 'hidden' }}>
      {/* Mobile Device Warning */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fef3c7',
          borderBottom: '1px solid #f59e0b',
          padding: '12px 16px',
          textAlign: 'center',
          zIndex: 1000,
          fontSize: '14px',
          color: '#92400e',
          fontWeight: '500'
        }}>
          📱💻 This dashboard is optimized for desktop and tablet. 
          Please switch to a larger screen for the best experience.
        </div>
      )}

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
        padding: '16px 24px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        marginTop: (viewingAsGuest || impersonatingUserId) ? '0' : (isMobile ? '48px' : '0'),
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box'
      }}>
        <h1 
          onClick={() => setCurrentPage('insights')}
          style={{ 
            fontSize: '20px', 
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
        
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
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
            onClick={() => setCurrentPage('forecast')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: currentPage === 'forecast' ? '#3b82f6' : '#f3f4f6',
              color: currentPage === 'forecast' ? 'white' : '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Forecast
          </button>
          {features.advertising && (
            <button
              onClick={() => setCurrentPage('advertising')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: currentPage === 'advertising' ? '#3b82f6' : '#f3f4f6',
                color: currentPage === 'advertising' ? 'white' : '#374151',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Advertising
            </button>
          )}
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
              onClick={() => setShowCreateModal(true)}
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
              New
            </button>
          )}
        </div>

        {/* User Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '16px' }}>
          {user ? (
            <button
              onClick={signOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                color: '#6b7280',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <LogOut size={12} />
              Logout
            </button>
          ) : (
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

      {/* Page Content */}
      <div style={{ padding: '0' }}>
        <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Loading...</div>}>
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
          {currentPage === 'forecast' && (
            <FeatureGate feature="forecast">
              <Forecast 
                funnelData={dataManager.funnelData} 
                serviceTypes={dataManager.serviceTypes} 
                setServiceTypes={() => {}} // Handled by data manager
                bookings={dataManager.bookings} 
                payments={dataManager.payments}
                showModelingOnly
              />
            </FeatureGate>
          )}
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

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Add New</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => handleCreateAction('add-booking')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                }}
              >
                Add New Sale
              </button>
              <button
                onClick={() => handleCreateAction('add-inquiry')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                }}
              >
                Add New Inquiry
              </button>
              <button
                onClick={() => handleCreateAction('add-call-booked')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                }}
              >
                Add New Call Booked
              </button>
              <button
                onClick={() => handleCreateAction('add-call-taken')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                }}
              >
                Add New Call Taken
              </button>
            </div>
          </div>
        </div>
      )}
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
