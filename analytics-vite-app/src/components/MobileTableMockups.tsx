import React, { useState } from 'react';
import { DollarSign, Calendar, User, Edit, Trash2, ChevronDown, ChevronUp, Eye, X, Plus } from 'lucide-react';

// Sample data for mockups
const sampleBookings = [
  {
    id: '1',
    projectName: 'Website Redesign',
    serviceType: 'Web Development',
    leadSource: 'Google Ads',
    dateInquired: '2025-01-15',
    dateBooked: '2025-01-20',
    projectDate: '2025-02-10',
    revenue: 5000
  },
  {
    id: '2',
    projectName: 'Brand Identity Package',
    serviceType: 'Design',
    leadSource: 'Referral',
    dateInquired: '2025-01-10',
    dateBooked: '2025-01-18',
    projectDate: '2025-02-05',
    revenue: 3500
  },
  {
    id: '3',
    projectName: 'SEO Optimization',
    serviceType: 'Marketing',
    leadSource: 'Organic Search',
    dateInquired: '2025-01-08',
    dateBooked: '2025-01-25',
    projectDate: '2025-03-01',
    revenue: 2800
  }
];

const sampleFunnelData = [
  {
    month: 'January 2025',
    inquiries: 45,
    callsBooked: 32,
    callsTaken: 28,
    closes: 12,
    bookings: 10,
    bookingAmount: 52000,
    cash: 45000
  },
  {
    month: 'December 2024',
    inquiries: 38,
    callsBooked: 28,
    callsTaken: 25,
    closes: 9,
    bookings: 8,
    bookingAmount: 38000,
    cash: 32000
  }
];

// ============================================================================
// OPTION A: Simplified Card View (Key Metrics Only)
// ============================================================================
export function OptionA_SimplifiedCards() {
  return (
    <div style={{ padding: '16px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
        Option A: Simplified Cards (Key Metrics Only)
      </h2>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
        Shows only the most important information in compact cards. Tap to view/edit.
      </p>

      {/* Bookings Example */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
          Sales View
        </h3>
        {sampleBookings.map((booking) => (
          <div
            key={booking.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0', color: '#1f2937' }}>
                  {booking.projectName}
                </h4>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>
                  {booking.serviceType}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981', marginBottom: '4px' }}>
                  ${booking.revenue.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {new Date(booking.dateBooked).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <Edit size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Funnel Example */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
          Funnel View
        </h3>
        {sampleFunnelData.map((month, index) => (
          <div
            key={index}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}
          >
            <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0', color: '#1f2937' }}>
              {month.month}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Inquiries</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{month.inquiries}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Bookings</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{month.bookings}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Cash</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#10b981' }}>
                  ${(month.cash / 1000).toFixed(0)}k
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Conversion</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                  {((month.bookings / month.inquiries) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            <button
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '8px 12px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              View Full Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// OPTION B: Full Data Cards (Scrollable List)
// ============================================================================
export function OptionB_FullDataCards() {
  const [showEditBookingModal, setShowEditBookingModal] = useState(false);
  const [showEditFunnelModal, setShowEditFunnelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<typeof sampleBookings[0] | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<typeof sampleFunnelData[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(2025);

  // Get back to main menu function
  const goBack = () => {
    window.location.hash = '';
    window.location.reload(); // Simple way to reset to main menu
  };

  const filteredBookings = sampleBookings.filter(booking => {
    const matchesSearch = booking.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         booking.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         booking.leadSource.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesServiceType = selectedServiceType === 'all' || booking.serviceType === selectedServiceType;
    return matchesSearch && matchesServiceType;
  });

  const filteredFunnelData = sampleFunnelData.filter(month => {
    const monthYear = parseInt(month.month.split(' ')[1]);
    return monthYear === selectedYear;
  });

  return (
    <div style={{ padding: '16px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <button
          onClick={goBack}
          style={{
            padding: '8px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ←
        </button>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 4px 0', color: '#1f2937' }}>
            Option B: Full Data Cards
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            All data displayed in expandable cards. Scroll to see more.
          </p>
        </div>
      </div>

      {/* Sales View with Filters */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
          Sales View
        </h3>
        
        {/* Search and Filter Bar */}
        <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Search by project, service type, or lead source..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          />
          <select
            value={selectedServiceType}
            onChange={(e) => setSelectedServiceType(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="all">All Service Types</option>
            <option value="Web Development">Web Development</option>
            <option value="Design">Design</option>
            <option value="Marketing">Marketing</option>
          </select>
        </div>

        {filteredBookings.length === 0 ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: '#9ca3af',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            No bookings found matching your filters.
          </div>
        ) : (
          filteredBookings.map((booking) => (
          <div
            key={booking.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0', color: '#1f2937' }}>
                  {booking.projectName}
                </h4>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981', marginBottom: '12px' }}>
                  ${booking.revenue.toLocaleString()}
                </div>
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Service Type:</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{booking.serviceType}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Lead Source:</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{booking.leadSource}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Date Inquired:</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                    {new Date(booking.dateInquired).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Date Booked:</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                    {new Date(booking.dateBooked).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Project Date:</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                    {new Date(booking.projectDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={() => {
                  setSelectedBooking(booking);
                  setShowEditBookingModal(true);
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <Edit size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Edit
              </button>
              <button
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </button>
            </div>
          </div>
        ))
        )}
      </div>

      {/* Funnel View with Year Filter */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>
            Funnel View
          </h3>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value={2025}>2025</option>
            <option value={2024}>2024</option>
            <option value={2023}>2023</option>
          </select>
        </div>
        {filteredFunnelData.map((month, index) => (
          <div
            key={index}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}
          >
            <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0', color: '#1f2937' }}>
              {month.month}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Inquiries</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{month.inquiries}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Calls Booked</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{month.callsBooked}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Calls Taken</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{month.callsTaken}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Bookings (Qty)</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{month.closes}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Bookings ($)</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{month.bookings}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Booking Amount</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>
                  ${month.bookingAmount.toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Cash</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>
                  ${month.cash.toLocaleString()}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedMonth(month);
                setShowEditFunnelModal(true);
              }}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '8px 12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <Edit size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Edit Month
            </button>
          </div>
        ))}
      </div>

      {/* Edit Booking Modal (Mobile) */}
      {showEditBookingModal && selectedBooking && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '0'
          }}
          onClick={() => {
            setShowEditBookingModal(false);
            setSelectedBooking(null);
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '24px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 -4px 6px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: '#1f2937' }}>
                Edit Booking
              </h3>
              <button
                onClick={() => {
                  setShowEditBookingModal(false);
                  setSelectedBooking(null);
                }}
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Project Name
                </label>
                <input
                  type="text"
                  defaultValue={selectedBooking.projectName}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Revenue
                </label>
                <input
                  type="number"
                  defaultValue={selectedBooking.revenue}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Service Type
                </label>
                <select
                  defaultValue={selectedBooking.serviceType}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option>Web Development</option>
                  <option>Design</option>
                  <option>Marketing</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Lead Source
                </label>
                <select
                  defaultValue={selectedBooking.leadSource}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option>Google Ads</option>
                  <option>Referral</option>
                  <option>Organic Search</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Date Booked
                </label>
                <input
                  type="date"
                  defaultValue={selectedBooking.dateBooked}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                />
              </div>
            </div>

            {/* Payment Schedule Section */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', margin: 0 }}>
                  Payment Schedule (for Forecast)
                </label>
                <button
                  type="button"
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={14} />
                  Add Payment
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px', marginTop: 0 }}>
                Add expected payments for forecasting future cash. Dates are Month/Year only.
              </p>

              {/* Sample Payment Schedule Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {/* Sample Payment 1 */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Payment 1</span>
                    <button
                      type="button"
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount ($)"
                    defaultValue="15000"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      defaultValue="03"
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="01">January</option>
                      <option value="02">February</option>
                      <option value="03">March</option>
                      <option value="04">April</option>
                      <option value="05">May</option>
                      <option value="06">June</option>
                      <option value="07">July</option>
                      <option value="08">August</option>
                      <option value="09">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                    <select
                      defaultValue="2025"
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="2023">2023</option>
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                    </select>
                  </div>
                </div>

                {/* Sample Payment 2 */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Payment 2</span>
                    <button
                      type="button"
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount ($)"
                    defaultValue="20000"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      defaultValue="06"
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="01">January</option>
                      <option value="02">February</option>
                      <option value="03">March</option>
                      <option value="04">April</option>
                      <option value="05">May</option>
                      <option value="06">June</option>
                      <option value="07">July</option>
                      <option value="08">August</option>
                      <option value="09">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                    <select
                      defaultValue="2025"
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="2023">2023</option>
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                    </select>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', padding: '12px', fontStyle: 'italic' }}>
                Tap "Add Payment" to add more scheduled payments
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setShowEditBookingModal(false);
                  setSelectedBooking(null);
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Funnel Modal (Mobile) */}
      {showEditFunnelModal && selectedMonth && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '0'
          }}
          onClick={() => {
            setShowEditFunnelModal(false);
            setSelectedMonth(null);
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '24px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 -4px 6px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: '#1f2937' }}>
                Edit {selectedMonth.month}
              </h3>
              <button
                onClick={() => {
                  setShowEditFunnelModal(false);
                  setSelectedMonth(null);
                }}
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Inquiries
                </label>
                <input
                  type="number"
                  defaultValue={selectedMonth.inquiries}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Calls Booked
                </label>
                <input
                  type="number"
                  defaultValue={selectedMonth.callsBooked}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Calls Taken
                </label>
                <input
                  type="number"
                  defaultValue={selectedMonth.callsTaken}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Bookings (Qty)
                </label>
                <input
                  type="number"
                  defaultValue={selectedMonth.closes}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Bookings
                </label>
                <input
                  type="number"
                  defaultValue={selectedMonth.bookings}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Booking Amount ($)
                </label>
                <input
                  type="number"
                  defaultValue={selectedMonth.bookingAmount}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Cash ($)
                </label>
                <input
                  type="number"
                  defaultValue={selectedMonth.cash}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setShowEditFunnelModal(false);
                  setSelectedMonth(null);
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// OPTION C: Summary with Details Modal
// ============================================================================
export function OptionC_SummaryWithModal() {
  const [selectedBooking, setSelectedBooking] = useState<typeof sampleBookings[0] | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<typeof sampleFunnelData[0] | null>(null);

  return (
    <div style={{ padding: '16px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
        Option C: Summary Cards with Details Modal
      </h2>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
        Compact summary cards. Tap "View Details" to see full information in a modal.
      </p>

      {/* Bookings Example */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
          Sales View
        </h3>
        {sampleBookings.map((booking) => (
          <div
            key={booking.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0', color: '#1f2937' }}>
                  {booking.projectName}
                </h4>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  {booking.serviceType} • {booking.leadSource}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>
                  ${booking.revenue.toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedBooking(booking)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Eye size={14} />
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Funnel Example */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
          Funnel View
        </h3>
        {sampleFunnelData.map((month, index) => (
          <div
            key={index}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#1f2937' }}>
                {month.month}
              </h4>
              <button
                onClick={() => setSelectedMonth(month)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                View Details
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Inquiries</div>
                <div style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>{month.inquiries}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Bookings</div>
                <div style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>{month.bookings}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Cash</div>
                <div style={{ fontSize: '20px', fontWeight: '600', color: '#10b981' }}>
                  ${(month.cash / 1000).toFixed(0)}k
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Conversion</div>
                <div style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
                  {((month.bookings / month.inquiries) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
          onClick={() => setSelectedBooking(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              width: '100%',
              maxWidth: '400px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: '#1f2937' }}>
                {selectedBooking.projectName}
              </h3>
              <button
                onClick={() => setSelectedBooking(null)}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Revenue</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                  ${selectedBooking.revenue.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Service Type</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>{selectedBooking.serviceType}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Lead Source</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>{selectedBooking.leadSource}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Date Inquired</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
                  {new Date(selectedBooking.dateInquired).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Date Booked</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
                  {new Date(selectedBooking.dateBooked).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Project Date</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
                  {new Date(selectedBooking.projectDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <Edit size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Edit
              </button>
              <button
                onClick={() => setSelectedBooking(null)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Funnel Details Modal */}
      {selectedMonth && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
          onClick={() => setSelectedMonth(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              width: '100%',
              maxWidth: '400px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: '#1f2937' }}>
                {selectedMonth.month}
              </h3>
              <button
                onClick={() => setSelectedMonth(null)}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Inquiries</span>
                <span style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{selectedMonth.inquiries}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Calls Booked</span>
                <span style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{selectedMonth.callsBooked}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Calls Taken</span>
                <span style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{selectedMonth.callsTaken}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Bookings (Qty)</span>
                <span style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{selectedMonth.closes}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Bookings ($)</span>
                <span style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{selectedMonth.bookings}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Cash</span>
                <span style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                  ${selectedMonth.cash.toLocaleString()}
                </span>
              </div>
            </div>
            <button
              style={{
                width: '100%',
                padding: '10px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <Edit size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Edit Month
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Mockup Viewer Component
// ============================================================================
export default function MobileTableMockups() {
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | null>(() => {
    // Check URL hash for direct navigation
    const hash = window.location.hash.replace('#', '');
    if (hash === 'option-a') return 'A';
    if (hash === 'option-b') return 'B';
    if (hash === 'option-c') return 'C';
    return null;
  });

  if (selectedOption === 'A') return <OptionA_SimplifiedCards />;
  if (selectedOption === 'B') return <OptionB_FullDataCards />;
  if (selectedOption === 'C') return <OptionC_SummaryWithModal />;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#1f2937' }}>
        Mobile Table View Mockups
      </h1>
      <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px' }}>
        Choose an option to view the mobile-friendly table-to-card conversion mockup:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
        <button
          onClick={() => {
            setSelectedOption('A');
            window.location.hash = 'option-a';
          }}
          style={{
            padding: '20px',
            backgroundColor: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0', color: '#1f2937' }}>
            Option A: Simplified Cards
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            Key metrics only in compact cards. Tap to view/edit. Best for quick scanning.
          </p>
        </button>

        <button
          onClick={() => {
            setSelectedOption('B');
            window.location.hash = 'option-b';
          }}
          style={{
            padding: '20px',
            backgroundColor: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0', color: '#1f2937' }}>
            Option B: Full Data Cards
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            All data displayed in expandable cards. Scroll to see more. Best for complete information.
          </p>
        </button>

        <button
          onClick={() => {
            setSelectedOption('C');
            window.location.hash = 'option-c';
          }}
          style={{
            padding: '20px',
            backgroundColor: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0', color: '#1f2937' }}>
            Option C: Summary with Details Modal
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            Compact summary cards with "View Details" button. Full info in modal. Best for balance.
          </p>
        </button>
      </div>

      <div style={{ marginTop: '32px', padding: '16px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
          How to View
        </h3>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, lineHeight: '1.6' }}>
          Click on any option above to view the mockup. Use your browser's developer tools to simulate a mobile device 
          (Chrome DevTools: Cmd+Shift+M / Ctrl+Shift+M) to see how it looks on a phone screen. Each mockup shows examples 
          for both Sales View and Funnel View.
        </p>
      </div>
    </div>
  );
}

