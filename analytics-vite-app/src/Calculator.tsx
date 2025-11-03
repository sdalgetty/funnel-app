import React, { useState, useEffect, useMemo } from 'react';
import { Target, TrendingUp, Users, Phone, CheckCircle, DollarSign } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { UnifiedDataService } from './services/unifiedDataService';

interface CalculatorData {
  bookingsGoal: number;
  inquiryToCall: number;
  callToBooking: number;
  inqYtd: number;
  callsYtd: number;
  bookingsYtd: number;
}

interface CalculatorProps {
  dataManager?: any;
}

const Calculator: React.FC<CalculatorProps> = ({ dataManager }) => {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  // Calculate YTD totals from actual funnel data
  const ytdTotals = useMemo(() => {
    const funnelData = dataManager?.funnelData || [];
    const bookings = dataManager?.bookings || [];
    const serviceTypes = dataManager?.serviceTypes || [];
    
    // Get trackable service type IDs (for closes calculation)
    const trackableServiceIds = new Set(
      serviceTypes.filter((st: any) => st.tracksInFunnel).map((st: any) => st.id)
    );
    
    // Get all data for the current year
    const yearData = funnelData.filter((item: any) => item.year === currentYear);
    
    // Calculate inquiries and calls from funnel data
    const totalInquiries = yearData.reduce((acc: number, month: any) => acc + (month.inquiries || 0), 0);
    const totalCallsTaken = yearData.reduce((acc: number, month: any) => acc + (month.callsTaken || 0), 0);
    
    // Calculate closes from bookings (only trackable service types)
    const totalCloses = bookings.filter((b: any) => {
      if (!b?.dateBooked) return false;
      const [y] = b.dateBooked.split('-');
      return parseInt(y, 10) === currentYear && trackableServiceIds.has(b.serviceTypeId);
    }).length;
    
    return {
      inquiries: totalInquiries,
      callsTaken: totalCallsTaken,
      bookings: totalCloses, // Use closes count as bookings
    };
  }, [dataManager?.funnelData, dataManager?.bookings, dataManager?.serviceTypes, currentYear]);

  const [data, setData] = useState<CalculatorData>({
    bookingsGoal: 50,
    inquiryToCall: 25,
    callToBooking: 35,
    inqYtd: 0,
    callsYtd: 0,
    bookingsYtd: 0,
  });

  // Load goals from database on mount
  useEffect(() => {
    if (!user?.id) return;

    const loadGoals = async () => {
      const goals = await UnifiedDataService.getCalculatorGoals(user.id);
      if (goals) {
        setData(prev => ({
          ...prev,
          bookingsGoal: goals.bookingsGoal,
          inquiryToCall: goals.inquiryToCall,
          callToBooking: goals.callToBooking,
        }));
      }
    };

    loadGoals();
  }, [user?.id]);

  // Update YTD data when funnel data changes
  useEffect(() => {
    setData(prev => ({
      ...prev,
      inqYtd: ytdTotals.inquiries,
      callsYtd: ytdTotals.callsTaken,
      bookingsYtd: ytdTotals.bookings,
    }));
  }, [ytdTotals]);

  const [calculations, setCalculations] = useState({
    requiredCalls: 0,
    requiredInquiries: 0,
    paceInq: 0,
    paceCalls: 0,
    paceBookings: 0,
  });

  // Calculate months elapsed in current year
  const getMonthsElapsed = () => {
    const d = new Date();
    const monthIndex0to11 = d.getMonth();
    const day = d.getDate();
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const fractional = day / daysInMonth;
    return monthIndex0to11 + fractional;
  };

  // Format number with commas
  const formatNumber = (value: number) => {
    return isNaN(value) ? "—" : Math.round(value).toLocaleString();
  };

  // Recalculate all metrics
  const recalculate = () => {
    const bookingsGoal = data.bookingsGoal;
    const pctInquiryToCall = data.inquiryToCall / 100;
    const pctCallToBooking = data.callToBooking / 100;

    // Requirements from goals
    const requiredCalls = pctCallToBooking > 0 ? bookingsGoal / pctCallToBooking : 0;
    const requiredInquiries = (pctInquiryToCall > 0 && requiredCalls > 0)
      ? requiredCalls / pctInquiryToCall : 0;

    // Progress / Pace
    const months = Math.min(12, Math.max(0.01, getMonthsElapsed()));
    const paceInq = (data.inqYtd / months) * 12;
    const paceCalls = (data.callsYtd / months) * 12;
    const paceBookings = (data.bookingsYtd / months) * 12;

    setCalculations({
      requiredCalls,
      requiredInquiries,
      paceInq,
      paceCalls,
      paceBookings,
    });
  };

  // Update YTD data when funnel data changes
  useEffect(() => {
    const newYtdTotals = getYtdTotals();
    setData(prev => ({
      ...prev,
      inqYtd: newYtdTotals.inquiries,
      callsYtd: newYtdTotals.callsTaken,
      bookingsYtd: newYtdTotals.bookings,
    }));
  }, [funnelData]);

  // Recalculate when data changes
  useEffect(() => {
    recalculate();
  }, [data]);

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
      if (field === 'bookingsGoal' || field === 'inquiryToCall' || field === 'callToBooking') {
        if (saveGoalsTimeoutRef.current) {
          clearTimeout(saveGoalsTimeoutRef.current);
        }
        
        saveGoalsTimeoutRef.current = setTimeout(async () => {
          if (user?.id) {
            // Use ref to get latest value
            const currentData = dataRef.current;
            await UnifiedDataService.saveCalculatorGoals(user.id, {
              bookingsGoal: currentData.bookingsGoal,
              inquiryToCall: currentData.inquiryToCall,
              callToBooking: currentData.callToBooking,
            });
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

  // Determine if pace is on track
  const isOnTrack = calculations.paceBookings >= data.bookingsGoal;

  // Show loading state if dataManager is not ready
  if (!dataManager || dataManager.loading) {
    return (
      <div style={{ 
        padding: '24px', 
        maxWidth: '1200px', 
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>Loading calculator data...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          margin: '0 0 8px 0', 
          color: '#1f2937' 
        }}>
          Sales Funnel Calculator
        </h1>
        <p style={{ 
          color: '#6b7280', 
          margin: 0, 
          fontSize: '16px' 
        }}>
          Set your goals and track your progress to optimize your sales funnel
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gap: '24px',
        gridTemplateColumns: '1fr 1fr',
        maxWidth: '100%',
        overflow: 'hidden'
      }}>
        {/* Left Column: Goals & Requirements */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '24px',
          minWidth: 0,
          overflow: 'hidden'
        }}>
          {/* Goals Section */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            minWidth: 0,
            overflow: 'hidden'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '20px' 
            }}>
              <Target size={20} color="#3b82f6" />
              <h2 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                margin: 0, 
                color: '#1f2937' 
              }}>
                Annual Goals
              </h2>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '6px' 
              }}>
                Bookings Goal
              </label>
              <input
                type="number"
                value={data.bookingsGoal}
                onChange={(e) => updateData('bookingsGoal', parseInt(e.target.value) || 0)}
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
                type="number"
                value={data.inquiryToCall}
                onChange={(e) => updateData('inquiryToCall', parseInt(e.target.value) || 0)}
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
                Call to Booking Rate (%)
              </label>
              <input
                type="number"
                value={data.callToBooking}
                onChange={(e) => updateData('callToBooking', parseInt(e.target.value) || 0)}
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
          </div>

          {/* Requirements Section */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            minWidth: 0,
            overflow: 'hidden'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '20px' 
            }}>
              <TrendingUp size={20} color="#10b981" />
              <h2 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                margin: 0, 
                color: '#1f2937' 
              }}>
                Required Activity
              </h2>
            </div>

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
          </div>
        </div>

        {/* Right Column: Progress & Pace */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '24px',
          minWidth: 0,
          overflow: 'hidden'
        }}>
          {/* Progress Section */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            minWidth: 0,
            overflow: 'hidden'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '20px' 
            }}>
              <CheckCircle size={20} color="#f59e0b" />
              <h2 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                margin: 0, 
                color: '#1f2937' 
              }}>
                Progress — Actual YTD
              </h2>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '6px' 
              }}>
                Inquiries YTD
              </label>
              <input
                type="number"
                value={data.inqYtd}
                readOnly
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '16px',
                  backgroundColor: '#f9fafb',
                  color: '#6b7280',
                  boxSizing: 'border-box',
                  cursor: 'not-allowed'
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
                Calls YTD
              </label>
              <input
                type="number"
                value={data.callsYtd}
                readOnly
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '16px',
                  backgroundColor: '#f9fafb',
                  color: '#6b7280',
                  boxSizing: 'border-box',
                  cursor: 'not-allowed'
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
                Bookings YTD
              </label>
              <input
                type="number"
                value={data.bookingsYtd}
                readOnly
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '16px',
                  backgroundColor: '#f9fafb',
                  color: '#6b7280',
                  boxSizing: 'border-box',
                  cursor: 'not-allowed'
                }}
              />
            </div>
          </div>

          {/* Annualized Pace Section */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            minWidth: 0,
            overflow: 'hidden'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '20px' 
            }}>
              <DollarSign size={20} color="#8b5cf6" />
              <h2 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                margin: 0, 
                color: '#1f2937' 
              }}>
                Annualized Pace
              </h2>
            </div>

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
                    Inquiries Pace
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                    {formatNumber(calculations.paceInq)}
                  </div>
                </div>
                <Users size={24} color="#6b7280" />
              </div>
            </div>

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
                    Calls Pace
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                    {formatNumber(calculations.paceCalls)}
                  </div>
                </div>
                <Phone size={24} color="#6b7280" />
              </div>
            </div>

            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                backgroundColor: isOnTrack ? '#d1fae5' : '#fef2f2'
              }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                    Bookings Pace
                  </div>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: '700', 
                    color: isOnTrack ? '#065f46' : '#991b1b'
                  }}>
                    {formatNumber(calculations.paceBookings)}
                  </div>
                  {isOnTrack ? (
                    <div style={{ fontSize: '12px', color: '#065f46', marginTop: '4px' }}>
                      ✓ On track for goal
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '4px' }}>
                      ⚠ Behind goal
                    </div>
                  )}
                </div>
                <CheckCircle size={24} color={isOnTrack ? '#10b981' : '#ef4444'} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
