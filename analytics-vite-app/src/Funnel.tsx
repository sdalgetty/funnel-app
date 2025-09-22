import React, { useState, useMemo, useEffect } from "react";
import { TrendingUp, Users, Phone, CheckCircle, DollarSign, Edit } from "lucide-react";

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

interface FunnelProps {
  funnelData: FunnelData[];
  setFunnelData: (data: FunnelData[]) => void;
}

// Helper functions
const toUSD = (cents: number) => (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
const formatNumber = (num: number) => num.toLocaleString();

// Conversion rate calculation
const calculateConversionRate = (from: number, to: number) => {
  if (from === 0) return 0;
  return ((to / from) * 100).toFixed(1);
};

export default function Funnel({ funnelData, setFunnelData }: FunnelProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Filter data by selected year
  const filteredData = useMemo(() => {
    const yearData = funnelData.filter(data => data.year === selectedYear);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Create all 12 months for the selected year, using existing data or default values
    const allMonths = months.map((month, index) => {
      const existingData = yearData.find(data => data.month === index + 1);
      if (existingData) {
        return existingData;
      }
      
      // Create default month data
      return {
        id: `${selectedYear}_${month.toLowerCase()}`,
        month: index + 1,
        year: selectedYear,
        inquiries: 0,
        callsBooked: 0,
        callsTaken: 0,
        closes: 0,
        bookings: 0,
        lastUpdated: new Date().toISOString()
      };
    });
    
    return allMonths;
  }, [funnelData, selectedYear]);

  // Calculate analytics metrics
  const analyticsMetrics = useMemo(() => {
    const currentYearData = filteredData;
    const totalInquiries = currentYearData.reduce((sum, month) => sum + month.inquiries, 0);
    const totalCallsBooked = currentYearData.reduce((sum, month) => sum + month.callsBooked, 0);
    const totalCallsTaken = currentYearData.reduce((sum, month) => sum + month.callsTaken, 0);
    const totalCloses = currentYearData.reduce((sum, month) => sum + month.closes, 0);
    const totalBookings = currentYearData.reduce((sum, month) => sum + month.bookings, 0);

    const monthsWithData = currentYearData.filter(month => 
      month.inquiries > 0 || month.callsBooked > 0 || month.callsTaken > 0 || month.closes > 0 || month.bookings > 0
    ).length;

    return {
      totalInquiries,
      totalCallsBooked,
      totalCallsTaken,
      totalCloses,
      totalBookings,
      avgInquiries: monthsWithData > 0 ? Math.round(totalInquiries / monthsWithData) : 0,
      avgCallsBooked: monthsWithData > 0 ? Math.round(totalCallsBooked / monthsWithData) : 0,
      avgCallsTaken: monthsWithData > 0 ? Math.round(totalCallsTaken / monthsWithData) : 0,
      avgCloses: monthsWithData > 0 ? Math.round(totalCloses / monthsWithData) : 0,
      avgBookings: monthsWithData > 0 ? Math.round(totalBookings / monthsWithData) : 0,
      inquiryToCloseRate: calculateConversionRate(totalInquiries, totalCloses),
      callBookedToCloseRate: calculateConversionRate(totalCallsBooked, totalCloses),
      callTakenToCloseRate: calculateConversionRate(totalCallsTaken, totalCloses),
      inquiryToCallBookedRate: calculateConversionRate(totalInquiries, totalCallsBooked),
      callShowUpRate: calculateConversionRate(totalCallsBooked, totalCallsTaken),
      revenuePerCallTaken: totalCallsTaken > 0 ? Math.round(totalBookings / totalCallsTaken) : 0
    };
  }, [filteredData]);

  const availableYears = [...new Set(funnelData.map(data => data.year))].sort((a, b) => b - a);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: '#1f2937' }}>
          Sales Funnel
        </h1>
        <p style={{ color: '#6b7280', margin: 0, fontSize: '16px' }}>
          Track and analyze your sales funnel performance
        </p>
      </div>

      {/* Year Selector */}
      <div style={{ marginBottom: '32px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '500', 
          marginBottom: '6px' 
        }}>
          Select Year
        </label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          style={{
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            backgroundColor: 'white',
            minWidth: '120px'
          }}
        >
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Analytics Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '32px' 
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Users size={20} color="#3b82f6" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Inquiries</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
            {formatNumber(analyticsMetrics.totalInquiries)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Avg: {formatNumber(analyticsMetrics.avgInquiries)}/month
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Phone size={20} color="#10b981" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Calls Booked</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
            {formatNumber(analyticsMetrics.totalCallsBooked)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Avg: {formatNumber(analyticsMetrics.avgCallsBooked)}/month
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Phone size={20} color="#f59e0b" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Calls Taken</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
            {formatNumber(analyticsMetrics.totalCallsTaken)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Avg: {formatNumber(analyticsMetrics.avgCallsTaken)}/month
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <CheckCircle size={20} color="#ef4444" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Closes</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
            {formatNumber(analyticsMetrics.totalCloses)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Avg: {formatNumber(analyticsMetrics.avgCloses)}/month
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <DollarSign size={20} color="#8b5cf6" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Bookings</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
            {toUSD(analyticsMetrics.totalBookings)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Avg: {toUSD(analyticsMetrics.avgBookings)}/month
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <TrendingUp size={20} color="#06b6d4" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Inquiry to Close %</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
            {analyticsMetrics.inquiryToCloseRate}%
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Overall conversion
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Phone size={20} color="#10b981" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Call Booked to Close %</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
            {analyticsMetrics.callBookedToCloseRate}%
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Call conversion
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Phone size={20} color="#f59e0b" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Call Taken to Close %</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
            {analyticsMetrics.callTakenToCloseRate}%
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Call completion
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Users size={20} color="#3b82f6" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Inquiry to Call Booked %</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
            {analyticsMetrics.inquiryToCallBookedRate}%
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Inquiry conversion
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Phone size={20} color="#10b981" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Call Show Up Rate</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
            {analyticsMetrics.callShowUpRate}%
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Call attendance
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <DollarSign size={20} color="#8b5cf6" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Revenue Per Call Taken</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
            {toUSD(analyticsMetrics.revenuePerCallTaken)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Per call value
          </div>
        </div>
      </div>

      {/* Monthly Data Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#1f2937' }}>
            Monthly Data - {selectedYear}
          </h2>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Month</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Inquiries</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Calls Booked</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Calls Taken</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Closes</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Bookings</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((month, index) => {
                const monthName = new Date(selectedYear, month.month - 1).toLocaleString('default', { month: 'long' });
                return (
                  <tr
                    key={month.id}
                    style={{
                      borderBottom: '1px solid #e5e7eb',
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f5f5f5'
                    }}
                  >
                    <td style={{ padding: '12px', fontWeight: '500', color: '#1f2937' }}>
                      {monthName}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#374151' }}>
                      {formatNumber(month.inquiries)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#374151' }}>
                      {formatNumber(month.callsBooked)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#374151' }}>
                      {formatNumber(month.callsTaken)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#374151' }}>
                      {formatNumber(month.closes)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#374151' }}>
                      {toUSD(month.bookings)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        onClick={() => {/* TODO: Add edit functionality */}}
                        style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {/* Total Row */}
              <tr style={{
                backgroundColor: '#e5e7eb',
                borderTop: '2px solid #9ca3af',
                fontWeight: '600'
              }}>
                <td style={{ padding: '12px', color: '#1f2937' }}>Total</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
                  {formatNumber(analyticsMetrics.totalInquiries)}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
                  {formatNumber(analyticsMetrics.totalCallsBooked)}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
                  {formatNumber(analyticsMetrics.totalCallsTaken)}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
                  {formatNumber(analyticsMetrics.totalCloses)}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
                  {toUSD(analyticsMetrics.totalBookings)}
                </td>
                <td style={{ padding: '12px' }}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}