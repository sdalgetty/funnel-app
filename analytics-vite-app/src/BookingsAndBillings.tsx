import React, { useMemo, useState } from "react";
import { Plus, Trash2, CalendarDays, DollarSign, Download, Edit, X } from "lucide-react";

// Types
export type Client = {
  id: string;
  name: string;
  email?: string;
};

export type ServiceType = {
  id: string;
  name: string;
  isCustom: boolean;
};

export type Booking = {
  id: string;
  projectName: string; // Required
  serviceTypeId: string; // Required
  dateInquired?: string; // Optional
  dateBooked?: string; // Optional
  projectDate?: string; // Optional
  bookedRevenue: number; // Required - cents
  createdAt: string;
};

export type Payment = {
  id: string;
  bookingId: string;
  amount: number; // cents
  dueDate: string;
  paidAt?: string | null;
  memo?: string;
};

// Mock Data
const defaultServiceTypes: ServiceType[] = [
  { id: "st_1", name: "Wedding", isCustom: false },
  { id: "st_2", name: "Associate Wedding", isCustom: false },
  { id: "st_3", name: "Event", isCustom: false },
  { id: "st_4", name: "Engagement", isCustom: false },
  { id: "st_5", name: "Family", isCustom: false },
  { id: "st_6", name: "Print Sale", isCustom: false },
  { id: "st_7", name: "Album Upgrade", isCustom: false },
];

const mockBookings: Booking[] = [
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
];

const mockPayments: Payment[] = [
  { id: "p_1", bookingId: "b_1", dueDate: "2025-02-10", amount: 200000, paidAt: "2025-02-10", memo: "Retainer" },
  { id: "p_2", bookingId: "b_1", dueDate: "2025-06-15", amount: 300000, paidAt: "2025-06-15", memo: "Milestone" },
  { id: "p_3", bookingId: "b_1", dueDate: "2025-10-05", amount: 300000, paidAt: null, memo: "Balance" },
  { id: "p_4", bookingId: "b_2", dueDate: "2025-03-05", amount: 60000, paidAt: "2025-03-05", memo: "Retainer" },
  { id: "p_5", bookingId: "b_2", dueDate: "2025-04-20", amount: 60000, paidAt: "2025-04-20", memo: "Final Payment" },
];

// Helpers
const toUSD = (cents: number) => (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

export default function BookingsAndBillingsPOC() {
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>(defaultServiceTypes);
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [showServiceTypes, setShowServiceTypes] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [showServiceTypeDropdown, setShowServiceTypeDropdown] = useState(false);
  
  // Filtering and sorting state
  const [filters, setFilters] = useState({
    serviceTypes: defaultServiceTypes.map(st => st.id), // All selected by default
    search: ''
  });
  const [sortBy, setSortBy] = useState<keyof Booking>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtered and sorted bookings
  const filteredAndSortedBookings = useMemo(() => {
    let filtered = bookings.filter(booking => {
      const serviceType = serviceTypes.find(st => st.id === booking.serviceTypeId);
      const matchesServiceType = filters.serviceTypes.length === 0 || 
        filters.serviceTypes.length === serviceTypes.length || 
        filters.serviceTypes.includes(booking.serviceTypeId);
      const matchesSearch = !filters.search || 
        booking.projectName.toLowerCase().includes(filters.search.toLowerCase()) ||
        (serviceType?.name.toLowerCase().includes(filters.search.toLowerCase()) ?? false);
      
      return matchesServiceType && matchesSearch;
    });

    // Sort bookings
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle date sorting
      if (sortBy === 'dateInquired' || sortBy === 'dateBooked' || sortBy === 'projectDate' || sortBy === 'createdAt') {
        aValue = aValue || '';
        bValue = bValue || '';
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      // Handle numeric sorting
      if (sortBy === 'bookedRevenue') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Handle string sorting
      aValue = String(aValue || '').toLowerCase();
      bValue = String(bValue || '').toLowerCase();
      return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });

    return filtered;
  }, [bookings, serviceTypes, filters, sortBy, sortOrder]);

  // Summary metrics
  const totals = useMemo(() => {
    const booked = sum(bookings.map(b => b.bookedRevenue));
    const collected = sum(payments.filter(p => p.paidAt).map(p => p.amount));
    const outstanding = booked - collected;
    return { booked, collected, outstanding };
  }, [bookings, payments]);

  // Add new booking
  const addBooking = (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
    const newBooking: Booking = {
      ...bookingData,
      id: `b_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBookings(prev => [...prev, newBooking]);
    setShowAddBooking(false);
  };

  // Add new payment
  const addPayment = (paymentData: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...paymentData,
      id: `p_${Math.random().toString(36).slice(2, 9)}`,
    };
    setPayments(prev => [...prev, newPayment]);
    setShowAddPayment(false);
  };

  // Add custom service type
  const addServiceType = (name: string) => {
    const newServiceType: ServiceType = {
      id: `st_${Math.random().toString(36).slice(2, 9)}`,
      name,
      isCustom: true,
    };
    setServiceTypes(prev => [...prev, newServiceType]);
  };

  // Remove custom service type
  const removeServiceType = (id: string) => {
    setServiceTypes(prev => prev.filter(st => st.id !== id));
  };

  // Update existing booking
  const updateBooking = (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
    if (!editingBooking) return;
    
    const updatedBooking: Booking = {
      ...bookingData,
      id: editingBooking.id,
      createdAt: editingBooking.createdAt,
    };
    setBookings(prev => prev.map(b => b.id === editingBooking.id ? updatedBooking : b));
    setEditingBooking(null);
  };

  // Toggle service type filter
  const toggleServiceTypeFilter = (serviceTypeId: string) => {
    setFilters(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(serviceTypeId)
        ? prev.serviceTypes.filter(id => id !== serviceTypeId)
        : [...prev.serviceTypes, serviceTypeId]
    }));
  };

  // Select all service types
  const selectAllServiceTypes = () => {
    setFilters(prev => ({
      ...prev,
      serviceTypes: serviceTypes.map(st => st.id)
    }));
  };

  // Clear all service type filters
  const clearAllServiceTypes = () => {
    setFilters(prev => ({
      ...prev,
      serviceTypes: []
    }));
  };

  // Get display text for service type filter
  const getServiceTypeFilterText = () => {
    if (filters.serviceTypes.length === 0) return "No service types selected";
    if (filters.serviceTypes.length === serviceTypes.length) return "All service types";
    if (filters.serviceTypes.length === 1) {
      const selected = serviceTypes.find(st => st.id === filters.serviceTypes[0]);
      return selected?.name || "1 service type";
    }
    return `${filters.serviceTypes.length} service types`;
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (e: React.MouseEvent) => {
    if (showServiceTypeDropdown && !(e.target as Element).closest('[data-dropdown]')) {
      setShowServiceTypeDropdown(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', color: '#333', padding: '24px' }} onClick={handleClickOutside}>
      <style>
        {`
          input[type="date"]::-webkit-calendar-picker-indicator {
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23374151' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3e%3c/rect%3e%3cline x1='16' y1='2' x2='16' y2='6'%3e%3c/line%3e%3cline x1='8' y1='2' x2='8' y2='6'%3e%3c/line%3e%3cline x1='3' y1='10' x2='21' y2='10'%3e%3c/line%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: center;
            background-size: 16px;
            width: 20px;
            height: 20px;
            cursor: pointer;
            opacity: 0.7;
            transition: all 0.2s;
            margin-right: 4px;
          }
          input[type="date"]::-webkit-calendar-picker-indicator:hover {
            opacity: 1;
            transform: scale(1.1);
          }
          input[type="date"]::-webkit-calendar-picker-indicator:active {
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3e%3c/rect%3e%3cline x1='16' y1='2' x2='16' y2='6'%3e%3c/line%3e%3cline x1='8' y1='2' x2='8' y2='6'%3e%3c/line%3e%3cline x1='3' y1='10' x2='21' y2='10'%3e%3c/line%3e%3c/svg%3e");
          }
          input[type="date"] {
            position: relative;
          }
          input[type="date"]:focus::-webkit-calendar-picker-indicator {
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3e%3c/rect%3e%3cline x1='16' y1='2' x2='16' y2='6'%3e%3c/line%3e%3cline x1='8' y1='2' x2='8' y2='6'%3e%3c/line%3e%3cline x1='3' y1='10' x2='21' y2='10'%3e%3c/line%3e%3c/svg%3e");
          }
        `}
      </style>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Bookings & Billings – Proof of Concept</h1>
        <p style={{ fontSize: '14px', color: '#666' }}>Primary data source for the app. Normalized model with client → booking → payments. Mobile-first UI.</p>
      </header>


      {/* Action buttons */}
      <section style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowAddBooking(true)}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus size={16} />
          Add New Booking
        </button>
        <button
          onClick={() => setShowServiceTypes(true)}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Edit size={16} />
          Manage Service Types
        </button>
      </section>

      {/* Filters and Search */}
      <section style={{ marginBottom: '24px', backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px', 
          alignItems: 'end'
        }}>
          <div style={{ minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Search Projects
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search by project name or service type..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div style={{ position: 'relative', minWidth: '200px' }} data-dropdown>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Filter by Service Type
            </label>
            <button
              onClick={() => setShowServiceTypeDropdown(!showServiceTypeDropdown)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxSizing: 'border-box'
              }}
            >
              <span>{getServiceTypeFilterText()}</span>
              <span style={{ transform: showServiceTypeDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                ▼
              </span>
            </button>
            
            {showServiceTypeDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                zIndex: 20,
                marginTop: '4px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                <div style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                  <button
                    onClick={selectAllServiceTypes}
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      fontSize: '12px',
                      color: '#3b82f6',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearAllServiceTypes}
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      fontSize: '12px',
                      color: '#ef4444',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    Clear All
                  </button>
                </div>
                {serviceTypes.map(st => (
                  <label key={st.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <input
                      type="checkbox"
                      checked={filters.serviceTypes.includes(st.id)}
                      onChange={() => toggleServiceTypeFilter(st.id)}
                      style={{ margin: 0 }}
                    />
                    <span style={{ fontSize: '14px' }}>{st.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Sort by
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as keyof Booking)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="projectName">Project Name</option>
                <option value="dateInquired">Date Inquired</option>
                <option value="dateBooked">Date Booked</option>
                <option value="projectDate">Project Date</option>
                <option value="bookedRevenue">Revenue</option>
                <option value="createdAt">Date Added</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: '#f9fafb',
                  cursor: 'pointer',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Add Booking Modal */}
      {showAddBooking && (
        <AddBookingModal
          serviceTypes={serviceTypes}
          onAdd={addBooking}
          onAddPayments={(payments) => {
            payments.forEach(payment => {
              addPayment(payment);
            });
          }}
          onClose={() => setShowAddBooking(false)}
        />
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          serviceTypes={serviceTypes}
          onUpdate={updateBooking}
          onClose={() => setEditingBooking(null)}
        />
      )}

      {/* Service Types Modal */}
      {showServiceTypes && (
        <ServiceTypesModal
          serviceTypes={serviceTypes}
          onAdd={addServiceType}
          onRemove={removeServiceType}
          onClose={() => setShowServiceTypes(false)}
        />
      )}

      {/* Add Payment Modal */}
      {showAddPayment && selectedBookingId && (
        <AddPaymentModal
          bookingId={selectedBookingId}
          onAdd={addPayment}
          onClose={() => {
            setShowAddPayment(false);
            setSelectedBookingId(null);
          }}
        />
      )}

      {/* Bookings table */}
      <section style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: '70vh' }}>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <thead style={{ 
              backgroundColor: '#f5f5f5',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <tr>
                <Th>Project Name</Th>
                <Th>Service Type</Th>
                <Th>Date Inquired</Th>
                <Th>Date Booked</Th>
                <Th>Project Date</Th>
                <Th>Revenue</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedBookings.map((booking) => {
                const serviceType = serviceTypes.find(st => st.id === booking.serviceTypeId);
                const bookingPayments = payments.filter(p => p.bookingId === booking.id);
                const collected = sum(bookingPayments.filter(p => p.paidAt).map(p => p.amount));
                const outstanding = booking.bookedRevenue - collected;
                
                return (
                  <tr key={booking.id} style={{ borderBottom: '1px solid #eee' }}>
                    <Td>
                      <div style={{ fontWeight: '500' }}>{booking.projectName}</div>
                    </Td>
                    <Td>{serviceType?.name || 'Unknown'}</Td>
                    <Td>{booking.dateInquired ? new Date(booking.dateInquired).toLocaleDateString() : '—'}</Td>
                    <Td>{booking.dateBooked ? new Date(booking.dateBooked).toLocaleDateString() : '—'}</Td>
                    <Td>{booking.projectDate ? new Date(booking.projectDate).toLocaleDateString() : '—'}</Td>
                    <Td>
                      <div style={{ fontWeight: '500' }}>{toUSD(booking.bookedRevenue)}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Collected: {toUSD(collected)} | Outstanding: {toUSD(outstanding)}
                      </div>
                    </Td>
                    <Td>
                      <button
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
                        onClick={() => setEditingBooking(booking)}
                      >
                        <Edit size={12} />
                        Edit
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <footer style={{ fontSize: '12px', color: '#666', marginTop: '32px' }}>
        <p>POC-only. Replace with real data access (Supabase) and integrate auth. All amounts are shown in USD.</p>
      </footer>
    </div>
  );
}

// UI Subcomponents
function SummaryCard({ title, value, icon }: { title: string; value: string; icon?: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666' }}>{title}</div>
          <div style={{ fontSize: '24px', fontWeight: '600', marginTop: '4px' }}>{value}</div>
        </div>
        <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#f5f5f5' }}>{icon}</div>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th style={{ textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666', padding: '12px 16px' }}>{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>{children}</td>;
}

// Add Booking Modal
function AddBookingModal({ serviceTypes, onAdd, onAddPayments, onClose }: {
  serviceTypes: ServiceType[];
  onAdd: (booking: Omit<Booking, 'id' | 'createdAt'>) => void;
  onAddPayments: (payments: Omit<Payment, 'id'>[]) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    projectName: '',
    serviceTypeId: '',
    dateInquired: '',
    dateBooked: '',
    projectDate: '',
    bookedRevenue: '',
  });
  const [payments, setPayments] = useState<Omit<Payment, 'id' | 'bookingId'>[]>([]);

  const addPayment = () => {
    setPayments(prev => [...prev, {
      amount: 0,
      dueDate: '',
      paidAt: null,
      memo: ''
    }]);
  };

  const updatePayment = (index: number, field: keyof Omit<Payment, 'id' | 'bookingId'>, value: any) => {
    setPayments(prev => prev.map((payment, i) => 
      i === index ? { ...payment, [field]: value } : payment
    ));
  };

  const removePayment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectName || !formData.serviceTypeId || !formData.bookedRevenue) {
      alert('Please fill in all required fields');
      return;
    }

    // Create the booking first
    const newBooking = {
      projectName: formData.projectName,
      serviceTypeId: formData.serviceTypeId,
      dateInquired: formData.dateInquired || undefined,
      dateBooked: formData.dateBooked || undefined,
      projectDate: formData.projectDate || undefined,
      bookedRevenue: Math.round(parseFloat(formData.bookedRevenue) * 100),
    };

    onAdd(newBooking);
    
    // Add payments if any
    if (payments.length > 0) {
      onAddPayments(payments);
    }
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
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Add New Booking</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                Project Name *
              </label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                placeholder="e.g., Ashley & Devon"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                Service Type *
              </label>
              <select
                value={formData.serviceTypeId}
                onChange={(e) => setFormData({ ...formData, serviceTypeId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="">Select service type</option>
                {serviceTypes.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                Date Inquired
              </label>
              <input
                type="date"
                value={formData.dateInquired}
                onChange={(e) => setFormData({ ...formData, dateInquired: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                Date Booked
              </label>
              <input
                type="date"
                value={formData.dateBooked}
                onChange={(e) => setFormData({ ...formData, dateBooked: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                Project Date
              </label>
              <input
                type="date"
                value={formData.projectDate}
                onChange={(e) => setFormData({ ...formData, projectDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Booked Revenue *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.bookedRevenue}
              onChange={(e) => setFormData({ ...formData, bookedRevenue: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="0.00"
            />
          </div>

          {/* Payment Schedule Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ fontSize: '16px', fontWeight: '600' }}>
                Payment Schedule
              </label>
              <button
                type="button"
                onClick={addPayment}
                style={{
                  backgroundColor: '#10b981',
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
                <Plus size={12} />
                Add Payment
              </button>
            </div>
            
            {payments.map((payment, index) => (
              <div key={index} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: '#f9fafb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>Payment {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removePayment(index)}
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '2px' }}>
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={payment.amount / 100}
                      onChange={(e) => updatePayment(index, 'amount', Math.round(parseFloat(e.target.value || '0') * 100))}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '2px' }}>
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={payment.dueDate}
                      onChange={(e) => updatePayment(index, 'dueDate', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '2px' }}>
                      Paid Date
                    </label>
                    <input
                      type="date"
                      value={payment.paidAt || ''}
                      onChange={(e) => updatePayment(index, 'paidAt', e.target.value || null)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                </div>
                
                <div style={{ marginTop: '8px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '2px' }}>
                    Memo
                  </label>
                  <input
                    type="text"
                    value={payment.memo || ''}
                    onChange={(e) => updatePayment(index, 'memo', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                    placeholder="e.g., Retainer, Milestone, Final Payment"
                  />
                </div>
              </div>
            ))}
          </div>

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
              Add Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Service Types Modal
function ServiceTypesModal({ serviceTypes, onAdd, onRemove, onClose }: {
  serviceTypes: ServiceType[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const [newServiceType, setNewServiceType] = useState('');

  const handleAdd = () => {
    if (newServiceType.trim()) {
      onAdd(newServiceType.trim());
      setNewServiceType('');
    }
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
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Manage Service Types</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              value={newServiceType}
              onChange={(e) => setNewServiceType(e.target.value)}
              placeholder="Add new service type"
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Add
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {serviceTypes.map(st => (
              <div key={st.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <span style={{ fontSize: '14px' }}>{st.name}</span>
                {st.isCustom && (
                  <button
                    onClick={() => onRemove(st.id)}
                    style={{
                      backgroundColor: '#ef4444',
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
                    <Trash2 size={12} />
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
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
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Payment Modal
function AddPaymentModal({ bookingId, onAdd, onClose }: {
  bookingId: string;
  onAdd: (payment: Omit<Payment, 'id'>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    amount: '',
    dueDate: '',
    paidAt: '',
    memo: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.dueDate) {
      alert('Please fill in amount and due date');
      return;
    }

    onAdd({
      bookingId,
      amount: Math.round(parseFloat(formData.amount) * 100),
      dueDate: formData.dueDate,
      paidAt: formData.paidAt || null,
      memo: formData.memo || undefined,
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
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Add Payment</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                Due Date *
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Paid Date (optional)
            </label>
            <input
              type="date"
              value={formData.paidAt}
              onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Memo (optional)
            </label>
            <input
              type="text"
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="e.g., Retainer, Milestone, Final Payment"
            />
          </div>

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
              Add Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Booking Modal
function EditBookingModal({ booking, serviceTypes, onUpdate, onClose }: {
  booking: Booking;
  serviceTypes: ServiceType[];
  onUpdate: (booking: Omit<Booking, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    projectName: booking.projectName,
    serviceTypeId: booking.serviceTypeId,
    dateInquired: booking.dateInquired || '',
    dateBooked: booking.dateBooked || '',
    projectDate: booking.projectDate || '',
    bookedRevenue: (booking.bookedRevenue / 100).toString(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectName || !formData.serviceTypeId || !formData.bookedRevenue) {
      alert('Please fill in all required fields');
      return;
    }

    onUpdate({
      projectName: formData.projectName,
      serviceTypeId: formData.serviceTypeId,
      dateInquired: formData.dateInquired || undefined,
      dateBooked: formData.dateBooked || undefined,
      projectDate: formData.projectDate || undefined,
      bookedRevenue: Math.round(parseFloat(formData.bookedRevenue) * 100),
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
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Edit Booking</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                Project Name *
              </label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="e.g., Ashley & Devon"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                Service Type *
              </label>
              <select
                value={formData.serviceTypeId}
                onChange={(e) => setFormData({ ...formData, serviceTypeId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Select service type</option>
                {serviceTypes.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                Date Inquired
              </label>
              <input
                type="date"
                value={formData.dateInquired}
                onChange={(e) => setFormData({ ...formData, dateInquired: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                Date Booked
              </label>
              <input
                type="date"
                value={formData.dateBooked}
                onChange={(e) => setFormData({ ...formData, dateBooked: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                Project Date
              </label>
              <input
                type="date"
                value={formData.projectDate}
                onChange={(e) => setFormData({ ...formData, projectDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
              Booked Revenue *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.bookedRevenue}
              onChange={(e) => setFormData({ ...formData, bookedRevenue: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="0.00"
            />
          </div>

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
              Update Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
