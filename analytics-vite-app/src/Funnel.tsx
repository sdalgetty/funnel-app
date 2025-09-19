import React, { useState, useMemo, useEffect } from "react";
import { TrendingUp, Users, Phone, CheckCircle, DollarSign, Calendar, Edit } from "lucide-react";

// Types
export type FunnelData = {
  id: string;
  month: string;
  year: number;
  inquiries: number;
  callsBooked: number;
  callsTaken: number;
  closes: number;
  bookings: number; // in cents
  cash: number; // in cents
  lastUpdated?: string; // ISO timestamp
};

interface FunnelProps {
  funnelData: FunnelData[];
  setFunnelData: (data: FunnelData[]) => void;
}

// Mock data based on your spreadsheet
const mockFunnelData: FunnelData[] = [
  // 2024 Data (from screenshot)
  { id: "2024_january", month: "January", year: 2024, inquiries: 31, callsBooked: 16, callsTaken: 14, closes: 4, bookings: 2909742, cash: 2121834, lastUpdated: "2024-01-31T15:30:00Z" },
  { id: "2024_february", month: "February", year: 2024, inquiries: 28, callsBooked: 11, callsTaken: 11, closes: 1, bookings: 1287400, cash: 1594206, lastUpdated: "2024-02-29T14:45:00Z" },
  { id: "2024_march", month: "March", year: 2024, inquiries: 19, callsBooked: 9, callsTaken: 9, closes: 8, bookings: 3895900, cash: 3027316, lastUpdated: "2024-03-31T16:20:00Z" },
  { id: "2024_april", month: "April", year: 2024, inquiries: 19, callsBooked: 5, callsTaken: 5, closes: 0, bookings: 1343811, cash: 1884059, lastUpdated: "2024-04-30T13:15:00Z" },
  { id: "2024_may", month: "May", year: 2024, inquiries: 15, callsBooked: 5, callsTaken: 5, closes: 2, bookings: 1674800, cash: 3210617, lastUpdated: "2024-05-31T17:00:00Z" },
  { id: "2024_june", month: "June", year: 2024, inquiries: 11, callsBooked: 7, callsTaken: 5, closes: 0, bookings: 773800, cash: 860005, lastUpdated: "2024-06-30T12:30:00Z" },
  { id: "2024_july", month: "July", year: 2024, inquiries: 10, callsBooked: 6, callsTaken: 6, closes: 2, bookings: 1804421, cash: 1332887, lastUpdated: "2024-07-31T15:45:00Z" },
  { id: "2024_august", month: "August", year: 2024, inquiries: 14, callsBooked: 8, callsTaken: 8, closes: 2, bookings: 1621800, cash: 1626136, lastUpdated: "2024-08-31T14:20:00Z" },
  { id: "2024_september", month: "September", year: 2024, inquiries: 26, callsBooked: 11, callsTaken: 11, closes: 8, bookings: 5423600, cash: 5068416, lastUpdated: "2024-09-30T16:10:00Z" },
  { id: "2024_october", month: "October", year: 2024, inquiries: 13, callsBooked: 6, callsTaken: 6, closes: 1, bookings: 1084260, cash: 2282418, lastUpdated: "2024-10-31T13:45:00Z" },
  { id: "2024_november", month: "November", year: 2024, inquiries: 20, callsBooked: 12, callsTaken: 10, closes: 1, bookings: 678400, cash: 469050, lastUpdated: "2024-11-30T15:30:00Z" },
  { id: "2024_december", month: "December", year: 2024, inquiries: 28, callsBooked: 20, callsTaken: 17, closes: 6, bookings: 4116000, cash: 2796800, lastUpdated: "2024-12-31T12:00:00Z" },
  
  // 2025 Data (transferred from old 2024 data)
  { id: "2025_january", month: "January", year: 2025, inquiries: 20, callsBooked: 12, callsTaken: 12, closes: 9, bookings: 6125600, cash: 3912100, lastUpdated: "2025-01-31T15:30:00Z" },
  { id: "2025_february", month: "February", year: 2025, inquiries: 18, callsBooked: 10, callsTaken: 9, closes: 4, bookings: 2560000, cash: 2510000, lastUpdated: "2025-02-28T14:45:00Z" },
  { id: "2025_march", month: "March", year: 2025, inquiries: 28, callsBooked: 17, callsTaken: 17, closes: 5, bookings: 3200000, cash: 2800000, lastUpdated: "2025-03-31T16:20:00Z" },
  { id: "2025_april", month: "April", year: 2025, inquiries: 22, callsBooked: 11, callsTaken: 10, closes: 3, bookings: 1800000, cash: 1500000, lastUpdated: "2025-04-30T13:15:00Z" },
  { id: "2025_may", month: "May", year: 2025, inquiries: 28, callsBooked: 14, callsTaken: 13, closes: 2, bookings: 1200000, cash: 1000000, lastUpdated: "2025-05-31T17:00:00Z" },
  { id: "2025_june", month: "June", year: 2025, inquiries: 15, callsBooked: 7, callsTaken: 6, closes: 1, bookings: 800000, cash: 600000, lastUpdated: "2025-06-30T12:30:00Z" },
  { id: "2025_july", month: "July", year: 2025, inquiries: 19, callsBooked: 9, callsTaken: 8, closes: 0, bookings: 100000, cash: 1316300, lastUpdated: "2025-07-31T15:45:00Z" },
  { id: "2025_august", month: "August", year: 2025, inquiries: 16, callsBooked: 8, callsTaken: 7, closes: 1, bookings: 500000, cash: 400000, lastUpdated: "2025-08-31T14:20:00Z" },
  { id: "2025_september", month: "September", year: 2025, inquiries: 21, callsBooked: 10, callsTaken: 9, closes: 1, bookings: 300000, cash: 250000, lastUpdated: "2025-09-30T16:10:00Z" },
  { id: "2025_october", month: "October", year: 2025, inquiries: 17, callsBooked: 8, callsTaken: 7, closes: 0, bookings: 0, cash: 800000, lastUpdated: "2025-10-31T13:45:00Z" },
  { id: "2025_november", month: "November", year: 2025, inquiries: 14, callsBooked: 6, callsTaken: 5, closes: 0, bookings: 0, cash: 600000, lastUpdated: "2025-11-30T15:30:00Z" },
  { id: "2025_december", month: "December", year: 2025, inquiries: 16, callsBooked: 7, callsTaken: 6, closes: 0, bookings: 0, cash: 415000, lastUpdated: "2025-12-31T12:00:00Z" },
];

// Helper functions
const toUSD = (cents: number) => (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
const formatNumber = (num: number) => num.toLocaleString();
const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Conversion rate calculation
const calculateConversionRate = (from: number, to: number) => {
  if (from === 0) return 0;
  return ((to / from) * 100).toFixed(1);
};

export default function Funnel({ funnelData, setFunnelData }: FunnelProps) {
  // Initialize with mock data if no data provided
  useEffect(() => {
    if (funnelData.length === 0) {
      setFunnelData(mockFunnelData);
    }
  }, [funnelData.length, setFunnelData]);

  // Get current year and check if we need to create a new year
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [editingMonth, setEditingMonth] = useState<FunnelData | null>(null);

  // Auto-create new year data if current year doesn't exist
  useEffect(() => {
    const hasCurrentYear = funnelData.some(data => data.year === currentYear);
    if (!hasCurrentYear && funnelData.length > 0) {
      // Create 12 months of empty data for the new year
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      
      const newYearData: FunnelData[] = monthNames.map((month, index) => ({
        id: `${currentYear}_${month.toLowerCase()}`,
        month: month,
        year: currentYear,
        inquiries: 0,
        callsBooked: 0,
        callsTaken: 0,
        closes: 0,
        bookings: 0,
        cash: 0,
        lastUpdated: new Date().toISOString()
      }));

      setFunnelData(prev => [...prev, ...newYearData]);
    }
  }, [currentYear, funnelData, setFunnelData]);

  // Filter data by selected year and ensure all 12 months exist
  const filteredData = useMemo(() => {
    const yearData = funnelData.filter(data => data.year === selectedYear);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Create all 12 months for the selected year, using existing data or default values
    const allMonths = months.map(month => {
      const existingData = yearData.find(data => data.month === month);
      if (existingData) {
        return existingData;
      }
      
      // Create default month data
      return {
        id: `${selectedYear}_${month.toLowerCase()}`,
        month,
        year: selectedYear,
        inquiries: 0,
        callsBooked: 0,
        callsTaken: 0,
        closes: 0,
        bookings: 0,
        cash: 0,
        lastUpdated: undefined
      };
    });
    
    return allMonths;
  }, [funnelData, selectedYear]);

  // Calculate totals for the selected year
  const yearlyTotals = useMemo(() => {
    return filteredData.reduce((totals, month) => ({
      inquiries: totals.inquiries + month.inquiries,
      callsBooked: totals.callsBooked + month.callsBooked,
      callsTaken: totals.callsTaken + month.callsTaken,
      closes: totals.closes + month.closes,
      bookings: totals.bookings + month.bookings,
      cash: totals.cash + month.cash,
    }), { inquiries: 0, callsBooked: 0, callsTaken: 0, closes: 0, bookings: 0, cash: 0 });
  }, [filteredData]);

  // Get all available years from the data
  const availableYears = useMemo(() => {
    const years = [...new Set(funnelData.map(data => data.year))].sort((a, b) => b - a);
    return years;
  }, [funnelData]);

  // Calculate current month to exclude future months from averages
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-based (0 = January, 11 = December)
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Calculate analytics metrics
  const analyticsMetrics = useMemo(() => {
    // Filter data to exclude future months for current year
    const monthsToInclude = selectedYear === currentYear 
      ? filteredData.slice(0, currentMonth + 1) // Include months up to current month
      : filteredData; // Include all months for past years

    const totals = monthsToInclude.reduce((acc, month) => ({
      inquiries: acc.inquiries + month.inquiries,
      callsBooked: acc.callsBooked + month.callsBooked,
      callsTaken: acc.callsTaken + month.callsTaken,
      closes: acc.closes + month.closes,
      bookings: acc.bookings + month.bookings,
    }), { inquiries: 0, callsBooked: 0, callsTaken: 0, closes: 0, bookings: 0 });

    const monthsCount = monthsToInclude.length;

    return {
      inquiryToClose: calculateConversionRate(totals.inquiries, totals.closes),
      callTakenToClose: calculateConversionRate(totals.callsTaken, totals.closes),
      inquiryToCallTaken: calculateConversionRate(totals.inquiries, totals.callsTaken),
      avgInquiriesPerMonth: monthsCount > 0 ? Math.round(totals.inquiries / monthsCount) : 0,
      avgCallsTakenPerMonth: monthsCount > 0 ? Math.round(totals.callsTaken / monthsCount) : 0,
      avgClosesPerMonth: monthsCount > 0 ? Math.round(totals.closes / monthsCount) : 0,
      callShowUpRate: calculateConversionRate(totals.callsBooked, totals.callsTaken),
      revenuePerCallTaken: totals.callsTaken > 0 ? Math.round(totals.bookings / totals.callsTaken) : 0,
    };
  }, [filteredData, selectedYear, currentYear, currentMonth]);


  // Update existing month
  const updateMonth = (monthData: Omit<FunnelData, 'id'>) => {
    if (!editingMonth) return;
    
    const updatedMonth: FunnelData = {
      ...monthData,
      id: editingMonth.id,
      lastUpdated: new Date().toISOString(),
    };
    
    setFunnelData(prev => {
      const existingIndex = prev.findIndex(month => month.id === editingMonth.id);
      if (existingIndex >= 0) {
        // Update existing month
        return prev.map(month => month.id === editingMonth.id ? updatedMonth : month);
      } else {
        // Add new month if it doesn't exist
        return [...prev, updatedMonth];
      }
    });
    setEditingMonth(null);
  };


  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', color: '#333', padding: '24px' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Sales Funnel Analytics</h1>
        <p style={{ fontSize: '14px', color: '#666' }}>Track your sales pipeline from inquiries to cash collection</p>
      </header>

      {/* Year Selector */}
      <section style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <label style={{ fontSize: '14px', fontWeight: '500' }}>Year:</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
        >
          {availableYears.map(year => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </section>

      {/* Analytics Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <ConversionCard
          title="Inquiry to Close %"
          rate={`${analyticsMetrics.inquiryToClose}%`}
          icon={<TrendingUp size={20} />}
          color="#3b82f6"
        />
        <ConversionCard
          title="Call Taken to Close %"
          rate={`${analyticsMetrics.callTakenToClose}%`}
          icon={<CheckCircle size={20} />}
          color="#10b981"
        />
        <ConversionCard
          title="Inquiry to Call Taken %"
          rate={`${analyticsMetrics.inquiryToCallTaken}%`}
          icon={<Phone size={20} />}
          color="#f59e0b"
        />
        <ConversionCard
          title="Call Show Up Rate"
          rate={`${analyticsMetrics.callShowUpRate}%`}
          icon={<Users size={20} />}
          color="#8b5cf6"
        />
        <ConversionCard
          title="Avg Inquiries Per Month"
          rate={`${analyticsMetrics.avgInquiriesPerMonth}`}
          icon={<Users size={20} />}
          color="#06b6d4"
        />
        <ConversionCard
          title="Avg Calls Taken Per Month"
          rate={`${analyticsMetrics.avgCallsTakenPerMonth}`}
          icon={<Phone size={20} />}
          color="#84cc16"
        />
        <ConversionCard
          title="Avg Closes Per Month"
          rate={`${analyticsMetrics.avgClosesPerMonth}`}
          icon={<CheckCircle size={20} />}
          color="#f97316"
        />
        <ConversionCard
          title="Revenue Per Call Taken"
          rate={`${toUSD(analyticsMetrics.revenuePerCallTaken)}`}
          icon={<DollarSign size={20} />}
          color="#ef4444"
        />
      </section>


      {/* Monthly Data Table */}
      <section style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <thead style={{ backgroundColor: '#f5f5f5' }}>
              <tr>
                <Th>Month</Th>
                <Th>Inquiries</Th>
                <Th>Calls Booked</Th>
                <Th>Calls Taken</Th>
                <Th>Closes</Th>
                <Th>Bookings</Th>
                <Th>Cash</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((month, index) => (
                <tr 
                  key={month.id} 
                  style={{ 
                    borderBottom: '1px solid #eee',
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f5f5f5'
                  }}
                >
                  <Td style={{ fontWeight: '500' }}>{month.month}</Td>
                  <Td>{formatNumber(month.inquiries)}</Td>
                  <Td>{formatNumber(month.callsBooked)}</Td>
                  <Td>{formatNumber(month.callsTaken)}</Td>
                  <Td>{formatNumber(month.closes)}</Td>
                  <Td>{toUSD(month.bookings)}</Td>
                  <Td>{toUSD(month.cash)}</Td>
                  <Td>
                    <button
                      onClick={() => setEditingMonth(month)}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Edit size={12} />
                      Edit
                    </button>
                  </Td>
                </tr>
              ))}
              
              {/* Totals Row */}
              <tr style={{ 
                backgroundColor: '#e5e7eb',
                borderTop: '2px solid #9ca3af',
                fontWeight: '600'
              }}>
                <Td style={{ fontWeight: '700', fontSize: '14px' }}>TOTAL</Td>
                <Td style={{ fontWeight: '700', fontSize: '14px' }}>{formatNumber(yearlyTotals.inquiries)}</Td>
                <Td style={{ fontWeight: '700', fontSize: '14px' }}>{formatNumber(yearlyTotals.callsBooked)}</Td>
                <Td style={{ fontWeight: '700', fontSize: '14px' }}>{formatNumber(yearlyTotals.callsTaken)}</Td>
                <Td style={{ fontWeight: '700', fontSize: '14px' }}>{formatNumber(yearlyTotals.closes)}</Td>
                <Td style={{ fontWeight: '700', fontSize: '14px' }}>{toUSD(yearlyTotals.bookings)}</Td>
                <Td style={{ fontWeight: '700', fontSize: '14px' }}>{toUSD(yearlyTotals.cash)}</Td>
                <Td style={{ fontWeight: '700', fontSize: '14px' }}>—</Td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>


      {/* Edit Month Modal */}
      {editingMonth && (
        <EditMonthModal
          month={editingMonth}
          onUpdate={updateMonth}
          onClose={() => setEditingMonth(null)}
        />
      )}
    </div>
  );
}

// UI Components
function ConversionCard({ title, rate, icon, color }: { title: string; rate: string; icon: React.ReactNode; color: string }) {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666' }}>{title}</div>
        <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: `${color}20`, color: color }}>{icon}</div>
      </div>
      <div style={{ fontSize: '24px', fontWeight: '600', color: color }}>{rate}</div>
    </div>
  );
}


function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666', padding: '12px 16px' }}>{children}</th>;
}

function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: '12px 16px', verticalAlign: 'top', ...style }}>{children}</td>;
}


// Edit Month Modal
function EditMonthModal({ month, onUpdate, onClose }: { month: FunnelData; onUpdate: (month: Omit<FunnelData, 'id'>) => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    month: month.month,
    year: month.year,
    inquiries: month.inquiries,
    callsBooked: month.callsBooked,
    callsTaken: month.callsTaken,
    closes: month.closes,
    bookings: month.bookings / 100, // Convert from cents
    cash: month.cash / 100, // Convert from cents
  });

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onUpdate({
      month: formData.month,
      year: formData.year,
      inquiries: formData.inquiries,
      callsBooked: formData.callsBooked,
      callsTaken: formData.callsTaken,
      closes: formData.closes,
      bookings: Math.round(formData.bookings * 100), // Convert to cents
      cash: Math.round(formData.cash * 100), // Convert to cents
    });
  };

  return (
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
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Edit Month Data</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Month and Year Display (Read-only) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Month</label>
              <div style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#f9fafb',
                color: '#6b7280',
                boxSizing: 'border-box'
              }}>
                {formData.month}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Year</label>
              <div style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#f9fafb',
                color: '#6b7280',
                boxSizing: 'border-box'
              }}>
                {formData.year}
              </div>
            </div>
          </div>

          {/* Funnel Data Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Inquiries</label>
              <input
                type="number"
                value={formData.inquiries}
                onChange={(e) => setFormData({ ...formData, inquiries: parseInt(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  boxSizing: 'border-box'
                }}
                placeholder="0"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Calls Booked</label>
              <input
                type="number"
                value={formData.callsBooked}
                onChange={(e) => setFormData({ ...formData, callsBooked: parseInt(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  boxSizing: 'border-box'
                }}
                placeholder="0"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Calls Taken</label>
              <input
                type="number"
                value={formData.callsTaken}
                onChange={(e) => setFormData({ ...formData, callsTaken: parseInt(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  boxSizing: 'border-box'
                }}
                placeholder="0"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Closes</label>
              <input
                type="number"
                value={formData.closes}
                onChange={(e) => setFormData({ ...formData, closes: parseInt(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  boxSizing: 'border-box'
                }}
                placeholder="0"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Bookings ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.bookings}
                onChange={(e) => setFormData({ ...formData, bookings: parseFloat(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  boxSizing: 'border-box'
                }}
                placeholder="0.00"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Cash ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.cash}
                onChange={(e) => setFormData({ ...formData, cash: parseFloat(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  boxSizing: 'border-box'
                }}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Last Updated Info */}
          {month.lastUpdated && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#64748b',
              textAlign: 'center'
            }}>
              Last Updated: {formatTimestamp(month.lastUpdated)}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '10px 20px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Update Month
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
