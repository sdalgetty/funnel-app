import { useState, useEffect } from 'react'
import BookingsAndBillingsPOC from './BookingsAndBillings'
import Funnel from './Funnel'
import Calculator from './Calculator'
import Forecast from './Forecast'
import AuthModal from './AuthModal'
import FeatureGate from './FeatureGate'
import { AuthProvider, useAuth } from './AuthContext'
import { UpgradePrompt } from './FeatureGate'
import { User, Crown, LogOut } from 'lucide-react'
// import { FunnelData, mockFunnelData } from './mockData'
import './App.css'

type Page = 'bookings' | 'funnel' | 'calculator' | 'forecast';

interface FunnelData {
  id: string;
  year: number;
  month: string | number;
  inquiries: number;
  callsBooked: number;
  callsTaken: number;
  closes: number;
  bookings: number;
  lastUpdated?: string;
}

function AppContent() {
  const { user, logout, features } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('funnel')
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  // Mock data directly in App component
  const mockFunnelData: FunnelData[] = [
    // 2024 Data
    { id: "2024_january", year: 2024, month: 1, inquiries: 31, callsBooked: 16, callsTaken: 14, closes: 4, bookings: 2909742 },
    { id: "2024_february", year: 2024, month: 2, inquiries: 28, callsBooked: 11, callsTaken: 11, closes: 1, bookings: 1287400 },
    { id: "2024_march", year: 2024, month: 3, inquiries: 19, callsBooked: 9, callsTaken: 9, closes: 8, bookings: 3895900 },
    { id: "2024_april", year: 2024, month: 4, inquiries: 19, callsBooked: 5, callsTaken: 5, closes: 0, bookings: 1343811 },
    { id: "2024_may", year: 2024, month: 5, inquiries: 15, callsBooked: 5, callsTaken: 5, closes: 2, bookings: 1674800 },
    { id: "2024_june", year: 2024, month: 6, inquiries: 11, callsBooked: 7, callsTaken: 5, closes: 0, bookings: 773800 },
    { id: "2024_july", year: 2024, month: 7, inquiries: 10, callsBooked: 6, callsTaken: 6, closes: 2, bookings: 1804421 },
    { id: "2024_august", year: 2024, month: 8, inquiries: 14, callsBooked: 8, callsTaken: 8, closes: 2, bookings: 1621800 },
    { id: "2024_september", year: 2024, month: 9, inquiries: 26, callsBooked: 11, callsTaken: 11, closes: 8, bookings: 5423600 },
    { id: "2024_october", year: 2024, month: 10, inquiries: 13, callsBooked: 6, callsTaken: 6, closes: 1, bookings: 1084260 },
    { id: "2024_november", year: 2024, month: 11, inquiries: 20, callsBooked: 12, callsTaken: 10, closes: 1, bookings: 678400 },
    { id: "2024_december", year: 2024, month: 12, inquiries: 28, callsBooked: 20, callsTaken: 17, closes: 6, bookings: 4116000 },
    
    // 2025 Data
    { id: "2025_january", year: 2025, month: 1, inquiries: 20, callsBooked: 12, callsTaken: 12, closes: 9, bookings: 6125600 },
    { id: "2025_february", year: 2025, month: 2, inquiries: 18, callsBooked: 10, callsTaken: 9, closes: 4, bookings: 2560000 },
    { id: "2025_march", year: 2025, month: 3, inquiries: 28, callsBooked: 17, callsTaken: 17, closes: 5, bookings: 3200000 },
    { id: "2025_april", year: 2025, month: 4, inquiries: 22, callsBooked: 11, callsTaken: 10, closes: 3, bookings: 1800000 },
    { id: "2025_may", year: 2025, month: 5, inquiries: 28, callsBooked: 14, callsTaken: 13, closes: 2, bookings: 1200000 },
    { id: "2025_june", year: 2025, month: 6, inquiries: 15, callsBooked: 7, callsTaken: 6, closes: 1, bookings: 800000 },
    { id: "2025_july", year: 2025, month: 7, inquiries: 19, callsBooked: 9, callsTaken: 8, closes: 0, bookings: 100000 },
    { id: "2025_august", year: 2025, month: 8, inquiries: 16, callsBooked: 8, callsTaken: 7, closes: 1, bookings: 500000 },
    { id: "2025_september", year: 2025, month: 9, inquiries: 21, callsBooked: 10, callsTaken: 9, closes: 1, bookings: 300000 },
    { id: "2025_october", year: 2025, month: 10, inquiries: 17, callsBooked: 8, callsTaken: 7, closes: 0, bookings: 0 },
    { id: "2025_november", year: 2025, month: 11, inquiries: 14, callsBooked: 6, callsTaken: 5, closes: 0, bookings: 0 },
    { id: "2025_december", year: 2025, month: 12, inquiries: 12, callsBooked: 5, callsTaken: 4, closes: 0, bookings: 0 },
  ];
  
  const [funnelData, setFunnelData] = useState<FunnelData[]>(mockFunnelData)
  const [isMobile, setIsMobile] = useState(false)
  const [serviceTypes, setServiceTypes] = useState<any[]>([
    { id: "st_1", name: "Wedding", isCustom: false },
    { id: "st_2", name: "Associate Wedding", isCustom: false },
    { id: "st_3", name: "Event", isCustom: false },
    { id: "st_4", name: "Engagement", isCustom: false },
    { id: "st_5", name: "Family", isCustom: false },
    { id: "st_6", name: "Print Sale", isCustom: false },
    { id: "st_7", name: "Album Upgrade", isCustom: false },
  ])
  const [bookings, setBookings] = useState<any[]>([
    {
      id: "b_1",
      projectName: "Kelly & Shig Wedding",
      serviceTypeId: "st_1",
      dateInquired: "2025-01-15",
      dateBooked: "2025-02-03",
      projectDate: "2025-10-18",
      bookedRevenue: 800000, // $8,000
      createdAt: "2025-02-03",
    },
    {
      id: "b_2",
      projectName: "Ashley & Devon Engagement",
      serviceTypeId: "st_4",
      dateInquired: "2025-02-20",
      dateBooked: "2025-03-01",
      projectDate: "2025-05-12",
      bookedRevenue: 120000, // $1,200
      createdAt: "2025-03-01",
    },
    {
      id: "b_3",
      projectName: "Wilson Family Session",
      serviceTypeId: "st_5",
      dateInquired: "2025-02-10",
      dateBooked: "2025-02-12",
      projectDate: "2025-04-20",
      bookedRevenue: 80000, // $800
      createdAt: "2025-02-12",
    },
    {
      id: "b_4",
      projectName: "Corporate Event",
      serviceTypeId: "st_3",
      dateInquired: "2025-01-25",
      dateBooked: "2025-01-28",
      projectDate: "2025-03-10",
      bookedRevenue: 250000, // $2,500
      createdAt: "2025-01-28",
    },
    {
      id: "b_5",
      projectName: "Print Sale Package",
      serviceTypeId: "st_6",
      dateInquired: "2025-02-15",
      dateBooked: "2025-02-18",
      projectDate: "2025-03-01",
      bookedRevenue: 50000, // $500
      createdAt: "2025-02-18",
    }
  ])
  const [payments, setPayments] = useState<any[]>([
    { id: "p_1", bookingId: "b_1", dueDate: "2025-02-10", amount: 200000, paidAt: "2025-02-10", memo: "Retainer" },
    { id: "p_2", bookingId: "b_1", dueDate: "2025-06-15", amount: 300000, paidAt: "2025-06-15", memo: "Milestone" },
    { id: "p_3", bookingId: "b_1", dueDate: "2025-10-05", amount: 300000, paidAt: null, memo: "Balance" },
    { id: "p_4", bookingId: "b_2", dueDate: "2025-03-05", amount: 60000, paidAt: "2025-03-05", memo: "Retainer" },
    { id: "p_5", bookingId: "b_2", dueDate: "2025-04-20", amount: 60000, paidAt: "2025-04-20", memo: "Final Payment" },
    { id: "p_6", bookingId: "b_3", dueDate: "2025-02-12", amount: 80000, paidAt: null, memo: "Full Payment" },
    { id: "p_7", bookingId: "b_4", dueDate: "2025-01-28", amount: 250000, paidAt: "2025-01-28", memo: "Full Payment" },
    { id: "p_8", bookingId: "b_5", dueDate: "2025-02-18", amount: 50000, paidAt: "2025-02-18", memo: "Full Payment" },
  ])

  // Device detection
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

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
          <button
            onClick={() => setCurrentPage('calculator')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: currentPage === 'calculator' ? '#3b82f6' : '#f3f4f6',
              color: currentPage === 'calculator' ? 'white' : '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Calculator
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
                onClick={logout}
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
        {currentPage === 'bookings' && (
          <FeatureGate feature="sales">
            <BookingsAndBillingsPOC />
          </FeatureGate>
        )}
        {currentPage === 'funnel' && <Funnel funnelData={funnelData} setFunnelData={setFunnelData} salesData={bookings} paymentsData={payments} />}
        {currentPage === 'calculator' && <Calculator funnelData={funnelData} />}
        {currentPage === 'forecast' && (
          <FeatureGate feature="forecast">
            <Forecast funnelData={funnelData} serviceTypes={serviceTypes} setServiceTypes={setServiceTypes} bookings={bookings} payments={payments} />
          </FeatureGate>
        )}
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
