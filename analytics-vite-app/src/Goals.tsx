import React, { useState, useEffect, useMemo } from 'react';
import { Target, TrendingUp, Users, Phone } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { UnifiedDataService } from './services/unifiedDataService';

interface CalculatorData {
  bookingsGoal: number;
  inquiryToCall: number;
  callToBooking: number;
  bookingsRevenueGoal: number; // in cents
  cashGoal: number; // in cents
  inqYtd: number;
  callsYtd: number;
  bookingsYtd: number;
  bookingsRevenueYtd: number; // in cents
  cashYtd: number; // in cents
}

interface GoalsProps {
  dataManager?: any;
}

const Goals: React.FC<GoalsProps> = ({ dataManager }) => {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const currentYear = new Date().getFullYear();

  // Calculate YTD totals from actual funnel data
  const ytdTotals = useMemo(() => {
    if (!dataManager || dataManager.loading) {
      return {
        inquiries: 0,
        callsTaken: 0,
        bookings: 0,
        bookingsRevenue: 0,
        cash: 0,
      };
    }

    try {
      const bookings = dataManager.bookings || [];
      const payments = dataManager.payments || [];
      
      const inquiriesYtd = (dataManager.funnelData || []).reduce((sum: number, month: any) => {
        if (month.year === currentYear) {
          return sum + (month.inquiries || 0);
        }
        return sum;
      }, 0);

      const callsYtd = (dataManager.funnelData || []).reduce((sum: number, month: any) => {
        if (month.year === currentYear) {
          return sum + (month.callsTaken || 0);
        }
        return sum;
      }, 0);

      const bookingsYtd = bookings.filter((b: any) => {
        if (!b?.dateBooked) return false;
        const year = parseInt(b.dateBooked.split('-')[0], 10);
        return year === currentYear;
      }).length;

      const bookingsRevenueYtd = bookings
        .filter((b: any) => {
          if (!b?.dateBooked) return false;
          const year = parseInt(b.dateBooked.split('-')[0], 10);
          return year === currentYear;
        })
        .reduce((sum: number, b: any) => sum + (b.bookedRevenue || 0), 0);

      const cashYtd = payments.reduce((sum: number, p: any) => {
        const dateStr = p.expectedDate || p.dueDate || p.paymentDate;
        if (!dateStr) return sum;
        const year = parseInt(dateStr.split('-')[0], 10);
        if (year === currentYear) {
          return sum + (p.amount || p.amountCents || 0);
        }
        return sum;
      }, 0);

      return {
        inquiries: inquiriesYtd,
        callsTaken: callsYtd,
        bookings: bookingsYtd,
        bookingsRevenue: bookingsRevenueYtd,
        cash: cashYtd,
      };
    } catch (error) {
      console.error('Error calculating YTD totals:', error);
      return {
        inquiries: 0,
        callsTaken: 0,
        bookings: 0,
        bookingsRevenue: 0,
        cash: 0,
      };
    }
  }, [dataManager, currentYear]);

  const [data, setData] = useState<CalculatorData>({
    bookingsGoal: 0,
    inquiryToCall: 0,
    callToBooking: 0,
    bookingsRevenueGoal: 0,
    cashGoal: 0,
    inqYtd: 0,
    callsYtd: 0,
    bookingsYtd: 0,
    bookingsRevenueYtd: 0,
    cashYtd: 0,
  });

  // Load goals from database
  useEffect(() => {
    const loadGoals = async () => {
      if (!user?.id) return;
      try {
        const goals = await UnifiedDataService.getCalculatorGoals(user.id);
        if (goals) {
          setData(prev => ({
            ...prev,
            bookingsGoal: goals.bookingsGoal || 0,
            inquiryToCall: goals.inquiryToCall || 0,
            callToBooking: goals.callToBooking || 0,
            bookingsRevenueGoal: goals.bookingsRevenueGoal || 0,
            cashGoal: goals.cashGoal || 0,
          }));
        }
      } catch (error) {
        console.error('Error loading goals:', error);
      }
    };
    loadGoals();
  }, [user?.id]);

  // Update YTD data when totals change
  useEffect(() => {
    setData(prev => ({
      ...prev,
      inqYtd: ytdTotals.inquiries,
      callsYtd: ytdTotals.callsTaken,
      bookingsYtd: ytdTotals.bookings,
      bookingsRevenueYtd: ytdTotals.bookingsRevenue,
      cashYtd: ytdTotals.cash,
    }));
  }, [ytdTotals]);

  // Helper to get months elapsed
  const getMonthsElapsed = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const months = (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    return Math.max(0.01, Math.min(12, months));
  };

  // Calculate all metrics
  const calculations = useMemo(() => {
    const bookingsGoal = data.bookingsGoal;
    const pctInquiryToCall = data.inquiryToCall / 100;
    const pctCallToBooking = data.callToBooking / 100;

    // Requirements from goals
    const requiredCalls = pctCallToBooking > 0 ? bookingsGoal / pctCallToBooking : 0;
    const requiredInquiries = (pctInquiryToCall > 0 && requiredCalls > 0)
      ? requiredCalls / pctInquiryToCall : 0;

    return {
      requiredCalls,
      requiredInquiries,
    };
  }, [data.bookingsGoal, data.inquiryToCall, data.callToBooking]);

  // Debounced save function for goals
  const saveGoalsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const dataRef = React.useRef(data);
  
  // Keep ref in sync with state
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const updateData = (field: keyof CalculatorData, value: number) => {
    setData(prev => {
      const updated = { ...prev, [field]: value };
      dataRef.current = updated;
      
      // Save goals to database (debounced)
      if (field === 'bookingsGoal' || field === 'inquiryToCall' || field === 'callToBooking' || field === 'bookingsRevenueGoal' || field === 'cashGoal') {
        if (saveGoalsTimeoutRef.current) {
          clearTimeout(saveGoalsTimeoutRef.current);
        }
        
        saveGoalsTimeoutRef.current = setTimeout(async () => {
          if (user?.id) {
            const currentData = dataRef.current;
            const success = await UnifiedDataService.saveCalculatorGoals(user.id, {
              bookingsGoal: currentData.bookingsGoal,
              inquiryToCall: currentData.inquiryToCall,
              callToBooking: currentData.callToBooking,
              bookingsRevenueGoal: currentData.bookingsRevenueGoal,
              cashGoal: currentData.cashGoal,
            });
            
            // Dispatch event to notify other components that goals were updated
            if (success) {
              window.dispatchEvent(new CustomEvent('calculatorGoalsUpdated'));
            }
          }
        }, 500);
      }
      
      return updated;
    });
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveGoalsTimeoutRef.current) {
        clearTimeout(saveGoalsTimeoutRef.current);
      }
    };
  }, []);

  // Format number helper
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  };

  // Render a section card
  const renderSection = (title: string, icon: React.ReactNode, children: React.ReactNode) => (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      minWidth: 0,
      overflow: 'visible',
      height: '100%'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '20px' 
      }}>
        {icon}
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          margin: 0, 
          color: '#1f2937' 
        }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );

  // Annual Goals Section Content
  const annualGoalsContent = (
    <>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '500', 
          color: '#374151', 
          marginBottom: '6px' 
        }}>
          Bookings Number Goal (Number of Weddings)
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={data.bookingsGoal}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '' || /^\d+$/.test(value)) {
              const numValue = value === '' ? 0 : parseInt(value, 10);
              updateData('bookingsGoal', numValue);
            }
          }}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '16px',
            backgroundColor: 'white',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '500', 
          color: '#374151', 
          marginBottom: '6px' 
        }}>
          Inquiry to Call Rate (%)
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={data.inquiryToCall}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '' || /^\d+$/.test(value)) {
              const numValue = value === '' ? 0 : parseInt(value, 10);
              updateData('inquiryToCall', numValue);
            }
          }}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '16px',
            backgroundColor: 'white',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '500', 
          color: '#374151', 
          marginBottom: '6px' 
        }}>
          Call to Booking Rate (%)
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={data.callToBooking}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '' || /^\d+$/.test(value)) {
              const numValue = value === '' ? 0 : parseInt(value, 10);
              updateData('callToBooking', numValue);
            }
          }}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '16px',
            backgroundColor: 'white',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '500', 
          color: '#374151', 
          marginBottom: '6px' 
        }}>
          Bookings Revenue Goal (Total Booked Revenue $)
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9.]*"
          value={data.bookingsRevenueGoal === 0 ? '' : (data.bookingsRevenueGoal / 100).toFixed(2).replace(/\.?0+$/, '')}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '' || /^\d*\.?\d*$/.test(value)) {
              const dollarValue = value === '' ? 0 : parseFloat(value) || 0;
              const centsValue = Math.round(dollarValue * 100);
              updateData('bookingsRevenueGoal', centsValue);
            }
          }}
          placeholder="0"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '16px',
            backgroundColor: 'white',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '500', 
          color: '#374151', 
          marginBottom: '6px' 
        }}>
          Cash Goal (Total Cash Projected $)
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9.]*"
          value={data.cashGoal === 0 ? '' : (data.cashGoal / 100).toFixed(2).replace(/\.?0+$/, '')}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '' || /^\d*\.?\d*$/.test(value)) {
              const dollarValue = value === '' ? 0 : parseFloat(value) || 0;
              const centsValue = Math.round(dollarValue * 100);
              updateData('cashGoal', centsValue);
            }
          }}
          placeholder="0"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '16px',
            backgroundColor: 'white',
            boxSizing: 'border-box'
          }}
        />
      </div>
    </>
  );

  // Required Activity Section Content (Read-only)
  const requiredActivityContent = (
    <>
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
              Required Inquiries
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
              {formatNumber(calculations.requiredInquiries)}
            </div>
          </div>
          <Users size={24} color="#6b7280" />
        </div>
      </div>

      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
              Required Calls
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
              {formatNumber(calculations.requiredCalls)}
            </div>
          </div>
          <Phone size={24} color="#6b7280" />
        </div>
      </div>
    </>
  );

  return (
    <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          margin: '0 0 8px 0', 
          color: '#1f2937' 
        }}>
          Goals
        </h1>
        <p style={{ 
          color: '#6b7280', 
          margin: '0 0 16px 0', 
          fontSize: '16px',
          lineHeight: '1.6'
        }}>
          Fill out your goals for the current year. You can track real time progress on the Insights page. You can come back and make adjustments at any time.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '64px' : '80px' }}>
        {/* Two Column Layout */}
        <div style={{ 
          display: 'grid', 
          gap: isMobile ? '16px' : '24px',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          maxWidth: '100%'
        }}>
          {renderSection('Annual Goals', <Target size={20} color="#3b82f6" />, annualGoalsContent)}
          {renderSection('Required Activity', <TrendingUp size={20} color="#10b981" />, requiredActivityContent)}
        </div>

        {/* Benchmarks */}
        <div>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            margin: '0 0 16px 0', 
            color: '#1f2937' 
          }}>
            Benchmarks
          </h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {[
              {
                stat: 'Inquiry to Call Taken %',
                benchmark: '30-50%',
                description: 'This should trend towards the lower end of the range if more pricing info is shared up front, and higher if pricing hasn’t been shared pre-call.'
              },
              {
                stat: 'Call Taken to Close %',
                benchmark: '30-50%\n\n50-70%',
                description: 'This assumes either no pricing or only a starting price was seen prior to the call.\n\nThis assumes either full pricing or pricing ranges were seen prior to the call.'
              }
            ].map((item, index) => (
              <div key={index} style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 2fr',
                  gap: isMobile ? '12px' : '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Stat</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>{item.stat}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Benchmark</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', whiteSpace: 'pre-line' }}>{item.benchmark}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Description</div>
                    <div style={{ fontSize: '14px', color: '#374151', whiteSpace: 'pre-line' }}>
                      {item.description || ' '}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              margin: '0 0 8px 0', 
              color: '#1f2937' 
            }}>
              Other Factors
            </h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#374151' }}>
              You might not fit perfectly into these benchmarks as many things can influence your numbers. Some examples that can have a big impact:
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '14px' }}>
              <li>Leads coming from personal referrals and organic sources vs leads coming from colder sources such as Advertising or SEO.</li>
              <li>Clarity and quality of your brand message across social media, website, calls and pricing guides all contribute to your numbers.</li>
              <li>Follow-up and communication quality</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Goals;
