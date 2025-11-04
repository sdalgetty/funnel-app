import React, { useState, useMemo } from 'react';
import { TrendingUp, Calendar, Target, DollarSign, Users, Phone, CheckCircle, BarChart3 } from 'lucide-react';
import ForecastModeling from './ForecastModeling';
import type { FunnelData, ServiceType, Booking, Payment } from './types';

interface ForecastProps {
  funnelData?: FunnelData[];
  serviceTypes?: ServiceType[];
  setServiceTypes?: (types: ServiceType[]) => void;
  bookings?: Booking[];
  payments?: Payment[];
  showTrendsOnly?: boolean;
  showModelingOnly?: boolean;
}

const Forecast: React.FC<ForecastProps> = ({ 
  funnelData = [], 
  serviceTypes = [], 
  setServiceTypes = () => {}, 
  bookings = [], 
  payments = [],
  showTrendsOnly = false,
  showModelingOnly = false
}) => {
  const [viewMode, setViewMode] = useState<'trends' | 'modeling'>(showModelingOnly ? 'modeling' : (showTrendsOnly ? 'trends' : 'trends'));
  const [lookbackMonths, setLookbackMonths] = useState(12);
  const [forecastMonths, setForecastMonths] = useState(6);

  // Get trackable service type IDs (for calculating closes/revenue from bookings)
  const trackableServiceIds = useMemo(() => {
    return new Set(serviceTypes.filter(st => st.tracksInFunnel).map(st => st.id));
  }, [serviceTypes]);

  // Get historical data for lookback period
  const historicalData = useMemo(() => {
    if (lookbackMonths === -1) {
      // Return all available data
      return funnelData;
    }
    
    const now = new Date();
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - lookbackMonths, 1);
    
    return funnelData.filter(item => {
      const itemDate = new Date(item.year, typeof item.month === 'string' ? parseInt(item.month) - 1 : item.month - 1, 1);
      return itemDate >= cutoffDate;
    });
  }, [funnelData, lookbackMonths]);

  // Calculate closes and revenue from actual bookings data for lookback period
  const bookingsData = useMemo(() => {
    const now = new Date();
    const cutoffDate = lookbackMonths === -1 
      ? null 
      : new Date(now.getFullYear(), now.getMonth() - lookbackMonths, 1);
    
    let totalCloses = 0;
    let totalRevenue = 0;
    const monthMap = new Map<string, { closes: number; revenue: number }>();
    
    bookings.forEach(booking => {
      if (!booking?.dateBooked) return;
      if (!trackableServiceIds.has(booking.serviceTypeId)) return;
      
      // Parse dateBooked (YYYY-MM-DD or YYYY-MM)
      const [year, month] = booking.dateBooked.split('-');
      const bookingDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      
      // Check if within lookback period
      if (cutoffDate && bookingDate < cutoffDate) return;
      
      const monthKey = `${year}-${month.padStart(2, '0')}`;
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { closes: 0, revenue: 0 });
      }
      
      const monthData = monthMap.get(monthKey)!;
      monthData.closes += 1;
      monthData.revenue += booking.bookedRevenue || 0;
      totalCloses += 1;
      totalRevenue += booking.bookedRevenue || 0;
    });
    
    return { totalCloses, totalRevenue, monthMap, monthsCount: monthMap.size };
  }, [bookings, trackableServiceIds, lookbackMonths]);

  // Calculate averages from historical data
  const averages = useMemo(() => {
    if (historicalData.length === 0) {
      return {
        inquiries: 0,
        callsBooked: 0,
        callsTaken: 0,
        closes: 0,
        bookings: 0,
      };
    }

    // Use funnelData for inquiries, calls (these are accurate)
    // Use bookingsData for closes and revenue (more accurate than stored funnelData)
    return historicalData.reduce((acc, month) => ({
      inquiries: acc.inquiries + (month.inquiries || 0),
      callsBooked: acc.callsBooked + (month.callsBooked || 0),
      callsTaken: acc.callsTaken + (month.callsTaken || 0),
      closes: acc.closes + (month.closes || 0), // Will be replaced by bookingsData
      bookings: acc.bookings + (month.bookings || 0), // Will be replaced by bookingsData
    }), { inquiries: 0, callsBooked: 0, callsTaken: 0, closes: 0, bookings: 0 });
  }, [historicalData, bookingsData]);

  // Calculate monthly averages
  const monthlyAverages = useMemo(() => {
    const monthsWithData = historicalData.length;
    if (monthsWithData === 0) {
      return {
        inquiries: 0,
        callsBooked: 0,
        callsTaken: 0,
        closes: 0,
        bookings: 0,
      };
    }

    // Use bookingsData months count for closes/revenue if available
    const closesMonthsCount = bookingsData.monthsCount > 0 ? bookingsData.monthsCount : monthsWithData;
    const revenueMonthsCount = bookingsData.monthsCount > 0 ? bookingsData.monthsCount : monthsWithData;

    return {
      inquiries: Math.round(averages.inquiries / monthsWithData),
      callsBooked: Math.round(averages.callsBooked / monthsWithData),
      callsTaken: Math.round(averages.callsTaken / monthsWithData),
      closes: closesMonthsCount > 0 ? Math.round(bookingsData.totalCloses / closesMonthsCount) : 0,
      bookings: revenueMonthsCount > 0 ? Math.round(bookingsData.totalRevenue / revenueMonthsCount) : 0,
    };
  }, [averages, historicalData.length, bookingsData]);

  // Generate forecast data
  const forecastData = useMemo(() => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const forecast = [];
    
    for (let i = 0; i < forecastMonths; i++) {
      const monthIndex = (new Date().getMonth() + i + 1) % 12;
      const year = new Date().getFullYear() + Math.floor((new Date().getMonth() + i + 1) / 12);
      
      forecast.push({
        month: months[monthIndex],
        year: year,
        inquiries: monthlyAverages.inquiries,
        callsBooked: monthlyAverages.callsBooked,
        callsTaken: monthlyAverages.callsTaken,
        closes: monthlyAverages.closes,
        bookings: monthlyAverages.bookings,
      });
    }
    
    return forecast;
  }, [forecastMonths, monthlyAverages]);

  // Helper functions
  const toUSD = (cents: number) => (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
  const formatNumber = (num: number) => num.toLocaleString();

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* View Mode Toggle */}
      {!showTrendsOnly && !showModelingOnly && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setViewMode('trends')}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: viewMode === 'trends' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                  backgroundColor: viewMode === 'trends' ? '#3b82f6' : 'white',
                  color: viewMode === 'trends' ? 'white' : '#374151',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  boxShadow: viewMode === 'trends' ? '0 1px 3px rgba(59, 130, 246, 0.3)' : '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
              >
                <TrendingUp size={16} />
                Trends
              </button>
              <button
                onClick={() => setViewMode('modeling')}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: viewMode === 'modeling' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                  backgroundColor: viewMode === 'modeling' ? '#3b82f6' : 'white',
                  color: viewMode === 'modeling' ? 'white' : '#374151',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  boxShadow: viewMode === 'modeling' ? '0 1px 3px rgba(59, 130, 246, 0.3)' : '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
              >
                <BarChart3 size={16} />
                Modeling
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conditional Content Based on View Mode */}
      {(showModelingOnly || (!showTrendsOnly && viewMode === 'modeling')) ? (
        <ForecastModeling
          serviceTypes={serviceTypes}
          setServiceTypes={setServiceTypes}
          bookings={bookings}
          payments={payments}
          hideTracker={showModelingOnly}
        />
      ) : (
        <div>
          {/* Trends Header - only show if not in showTrendsOnly mode */}
          {!showTrendsOnly && (
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                margin: '0 0 8px 0', 
                color: '#1f2937' 
              }}>
                Forecast Trends
              </h1>
              <p style={{ 
                color: '#6b7280', 
                margin: 0, 
                fontSize: '16px' 
              }}>
                Track future trends based on past performance
              </p>
            </div>
          )}

      {/* Controls */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '32px' 
      }}>
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500', 
            marginBottom: '6px' 
          }}>
            Lookback Period
          </label>
          <select
            value={lookbackMonths}
            onChange={(e) => setLookbackMonths(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'white',
              boxSizing: 'border-box'
            }}
          >
            <option value={3}>Past 3 months</option>
            <option value={6}>Past 6 months</option>
            <option value={12}>Past 12 months</option>
            <option value={24}>Past 24 months</option>
            <option value={-1}>All available data</option>
          </select>
        </div>

        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500', 
            marginBottom: '6px' 
          }}>
            Forecast Months
          </label>
          <select
            value={forecastMonths}
            onChange={(e) => setForecastMonths(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'white',
              boxSizing: 'border-box'
            }}
          >
            <option value={3}>3 Months</option>
            <option value={6}>6 Months</option>
            <option value={12}>12 Months</option>
            <option value={18}>18 Months</option>
          </select>
        </div>
      </div>

      {/* Summary Cards - 2 rows of 4 cards each */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '20px', 
        marginBottom: '32px' 
      }}>
        {/* Row 1: Average Monthly Metrics */}
        <ForecastCard
          title="Avg Monthly Inquiries"
          value={monthlyAverages.inquiries}
          icon={<Users size={20} />}
          color="#3b82f6"
        />
        <ForecastCard
          title="Avg Monthly Calls"
          value={monthlyAverages.callsTaken}
          icon={<Phone size={20} />}
          color="#10b981"
        />
        <ForecastCard
          title="Avg Monthly Closes"
          value={monthlyAverages.closes}
          icon={<CheckCircle size={20} />}
          color="#f59e0b"
        />
        <ForecastCard
          title="Avg Monthly Revenue"
          value={toUSD(monthlyAverages.bookings)}
          icon={<DollarSign size={20} />}
          color="#8b5cf6"
        />
        
        {/* Row 2: Forecast Summary Totals */}
        <ForecastCard
          title="Total Inquiries"
          value={formatNumber(forecastData.reduce((sum, month) => sum + month.inquiries, 0))}
          icon={<Users size={20} />}
          color="#3b82f6"
        />
        <ForecastCard
          title="Total Calls"
          value={formatNumber(forecastData.reduce((sum, month) => sum + month.callsTaken, 0))}
          icon={<Phone size={20} />}
          color="#10b981"
        />
        <ForecastCard
          title="Total Closes"
          value={formatNumber(forecastData.reduce((sum, month) => sum + month.closes, 0))}
          icon={<CheckCircle size={20} />}
          color="#f59e0b"
        />
        <ForecastCard
          title="Total Revenue"
          value={toUSD(forecastData.reduce((sum, month) => sum + month.bookings, 0))}
          icon={<DollarSign size={20} />}
          color="#8b5cf6"
        />
      </div>

          {/* Footer - only show if not in showTrendsOnly mode */}
          {!showTrendsOnly && (
            <footer style={{ fontSize: '12px', color: '#666', marginTop: '32px' }}>
              <p>Forecast is based on monthly averages from the selected base year. Adjust the base year and forecast period to see different projections.</p>
            </footer>
          )}
        </div>
      )}
    </div>
  );
};

// UI Components
function ForecastCard({ title, value, icon, color }: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: string; 
}) {
  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '12px', 
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
      padding: '20px' 
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '12px' 
      }}>
        <div style={{ 
          fontSize: '12px', 
          textTransform: 'uppercase', 
          letterSpacing: '0.05em', 
          color: '#666' 
        }}>
          {title}
        </div>
        <div style={{ 
          padding: '6px', 
          borderRadius: '8px', 
          backgroundColor: `${color}20`, 
          color: color 
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '24px', fontWeight: '600', color: color }}>
        {value}
      </div>
    </div>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
  return (
    <th style={{ 
      textAlign: align, 
      fontSize: '12px', 
      fontWeight: '600', 
      textTransform: 'uppercase', 
      letterSpacing: '0.05em', 
      color: '#666', 
      padding: '12px 16px' 
    }}>
      {children}
    </th>
  );
}

function Td({ children, style, align = 'left' }: { children: React.ReactNode; style?: React.CSSProperties; align?: 'left' | 'right' | 'center' }) {
  return (
    <td style={{ 
      padding: '12px 16px', 
      verticalAlign: 'top', 
      textAlign: align,
      ...style 
    }}>
      {children}
    </td>
  );
}

export default Forecast;
