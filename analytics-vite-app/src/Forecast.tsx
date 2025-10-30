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

    return historicalData.reduce((acc, month) => ({
      inquiries: acc.inquiries + month.inquiries,
      callsBooked: acc.callsBooked + month.callsBooked,
      callsTaken: acc.callsTaken + month.callsTaken,
      closes: acc.closes + month.closes,
      bookings: acc.bookings + month.bookings,
    }), { inquiries: 0, callsBooked: 0, callsTaken: 0, closes: 0, bookings: 0 });
  }, [historicalData]);

  // Calculate monthly averages
  const monthlyAverages = useMemo(() => {
    const monthsWithData = historicalData.length;
    if (monthsWithData === 0) return averages;

    return {
      inquiries: Math.round(averages.inquiries / monthsWithData),
      callsBooked: Math.round(averages.callsBooked / monthsWithData),
      callsTaken: Math.round(averages.callsTaken / monthsWithData),
      closes: Math.round(averages.closes / monthsWithData),
      bookings: Math.round(averages.bookings / monthsWithData),
    };
  }, [averages, historicalData.length]);

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
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
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
          {/* Trends Header */}
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

      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '32px' 
      }}>
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
      </div>

      {/* Forecast Table */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
        overflow: 'hidden' 
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            margin: 0, 
            color: '#1f2937' 
          }}>
            {forecastMonths}-Month Forecast
          </h2>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            margin: '4px 0 0 0' 
          }}>
            Based on {lookbackMonths === -1 ? 'all available' : `past ${lookbackMonths} months`} data
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <thead style={{ backgroundColor: '#f5f5f5' }}>
              <tr>
                <Th>Month</Th>
                <Th align="right">Year</Th>
                <Th align="right">Inquiries</Th>
                <Th align="right">Calls Booked</Th>
                <Th align="right">Calls Taken</Th>
                <Th align="right">Closes</Th>
                <Th align="right">Revenue</Th>
              </tr>
            </thead>
            <tbody>
              {forecastData.map((month, index) => (
                <tr 
                  key={`${month.year}-${month.month}`}
                  style={{ 
                    borderBottom: '1px solid #eee',
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f5f5f5'
                  }}
                >
                  <Td style={{ fontWeight: '500' }}>{month.month}</Td>
                  <Td align="right">{month.year}</Td>
                  <Td align="right">{formatNumber(month.inquiries)}</Td>
                  <Td align="right">{formatNumber(month.callsBooked)}</Td>
                  <Td align="right">{formatNumber(month.callsTaken)}</Td>
                  <Td align="right">{formatNumber(month.closes)}</Td>
                  <Td align="right">{toUSD(month.bookings)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forecast Summary */}
      <div style={{ 
        marginTop: '24px', 
        padding: '20px', 
        backgroundColor: '#f8fafc', 
        borderRadius: '8px', 
        border: '1px solid #e2e8f0' 
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          margin: '0 0 12px 0', 
          color: '#1f2937' 
        }}>
          Forecast Summary
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '16px' 
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Total Inquiries
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
              {formatNumber(forecastData.reduce((sum, month) => sum + month.inquiries, 0))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Total Calls
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
              {formatNumber(forecastData.reduce((sum, month) => sum + month.callsTaken, 0))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Total Closes
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
              {formatNumber(forecastData.reduce((sum, month) => sum + month.closes, 0))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Total Revenue
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
              {toUSD(forecastData.reduce((sum, month) => sum + month.bookings, 0))}
            </div>
          </div>
        </div>
      </div>

          <footer style={{ fontSize: '12px', color: '#666', marginTop: '32px' }}>
            <p>Forecast is based on monthly averages from the selected base year. Adjust the base year and forecast period to see different projections.</p>
          </footer>
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
