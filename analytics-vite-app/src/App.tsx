import { useState, useEffect } from 'react'
import BookingsAndBillingsPOC from './BookingsAndBillings'
import Funnel from './Funnel'
import Calculator from './Calculator'
import Forecast from './Forecast'
import UserProfile from './UserProfile'
import Advertising from './Advertising'
import AuthModal from './AuthModal'
import FeatureGate from './FeatureGate'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useDataManager } from './hooks/useDataManager'
import LoginForm from './components/LoginForm'
import TestConnection from './components/TestConnection'
import { UpgradePrompt } from './FeatureGate'
import { User, Crown, LogOut, Settings } from 'lucide-react'
import type { Page } from './types'
import './App.css'

function AppContent() {
  console.log('AppContent component loaded!');
  
  const { user, signOut, loading, features } = useAuth()
  const dataManager = useDataManager()
  
  console.log('App auth state:', { 
    user: user ? { id: user.id, email: user.email, subscriptionTier: user.subscriptionTier } : null, 
    loading, 
    features 
  });
  
  const [currentPage, setCurrentPage] = useState<Page>('funnel')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Device detection
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

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
    return (
      <div>
        <LoginForm />
        <TestConnection />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
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

      {/* Navigation */}
      <nav style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        marginTop: isMobile ? '48px' : '0'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: '#1f2937' }}>
          Analytics Dashboard
        </h1>
        
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
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
        </div>

        {/* User Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '16px' }}>
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: user.subscriptionTier === 'pro' ? '#fef3c7' : '#f3f4f6',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: user.subscriptionTier === 'pro' ? '#92400e' : '#6b7280'
                }}>
                  <Crown size={12} />
                  {user.subscriptionTier === 'pro' ? 'Pro' : 'Free'}
                </div>
                <span style={{ fontSize: '14px', color: '#374151' }}>
                  {user.name}
                </span>
              </div>
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
            </>
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
        {currentPage === 'funnel' && <Funnel 
          funnelData={dataManager.funnelData} 
          setFunnelData={(data) => {
            // Update local state immediately for UI responsiveness
            dataManager.funnelData.forEach(item => {
              if (item.year === data.year && item.month === data.month) {
                // This will be handled by the data manager's saveFunnelData
              }
            });
          }}
          salesData={dataManager.bookings.filter(booking => {
            const serviceType = dataManager.serviceTypes.find(st => st.id === booking.serviceTypeId);
            return serviceType?.tracksInFunnel === true;
          })} 
          paymentsData={dataManager.payments} 
        />}
        {currentPage === 'advertising' && (
          <FeatureGate feature="advertising">
            <Advertising 
              bookings={dataManager.bookings} 
              leadSources={dataManager.leadSources} 
              funnelData={dataManager.funnelData} 
            />
          </FeatureGate>
        )}
        {currentPage === 'forecast' && (
          <FeatureGate feature="forecast">
            <Forecast 
              funnelData={dataManager.funnelData} 
              serviceTypes={dataManager.serviceTypes} 
              setServiceTypes={() => {}} // Handled by data manager
              bookings={dataManager.bookings} 
              payments={dataManager.payments} 
            />
          </FeatureGate>
        )}
        {currentPage === 'bookings' && (
          <FeatureGate feature="sales">
            <BookingsAndBillingsPOC 
              dataManager={dataManager}
            />
          </FeatureGate>
        )}
        {currentPage === 'profile' && <UserProfile />}
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
