import { useState, useEffect } from 'react'
import BookingsAndBillingsPOC from './BookingsAndBillings'
import Funnel from './Funnel'
import Calculator from './Calculator'
import './App.css'

type Page = 'bookings' | 'funnel' | 'calculator';

interface FunnelData {
  id: string;
  year: number;
  month: number;
  inquiries: number;
  callsBooked: number;
  callsTaken: number;
  closes: number;
  bookings: number;
  lastUpdated?: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('funnel')
  const [funnelData, setFunnelData] = useState<FunnelData[]>([])
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
      </nav>

      {/* Page Content */}
      <div style={{ padding: '0' }}>
        {currentPage === 'bookings' && <BookingsAndBillingsPOC />}
        {currentPage === 'funnel' && <Funnel funnelData={funnelData} setFunnelData={setFunnelData} />}
        {currentPage === 'calculator' && <Calculator funnelData={funnelData} />}
      </div>
    </div>
  )
}

export default App
