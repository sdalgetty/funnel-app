import React, { useMemo, useState, useEffect } from "react";
import { Plus, Trash2, CalendarDays, DollarSign, Download, Edit, X, Edit3, Check } from "lucide-react";
import type { ServiceType, LeadSource, Booking, Payment } from './types';
import { UnifiedDataService } from './services/unifiedDataService';
import { useAuth } from './contexts/AuthContext';

// Empty data for new users - they should start fresh
const defaultServiceTypes: ServiceType[] = [];

// Empty data for new users - they should start fresh
const defaultLeadSources: LeadSource[] = [];

// Empty data for new users - they should start fresh
const mockBookings: Booking[] = [];

// Empty data for new users - they should start fresh
const mockPayments: Payment[] = [];

// Helpers
const toUSD = (cents: number) => (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

// Helper to format dates without timezone issues
const formatDate = (dateString: string) => {
  if (!dateString) return '—';
  // Parse the date string as local date to avoid timezone conversion issues
  const [year, month, day] = dateString.split('-');
  const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return localDate.toLocaleDateString();
};

interface BookingsAndBillingsProps {
  dataManager?: any;
}

export default function BookingsAndBillingsPOC({ dataManager }: BookingsAndBillingsProps) {
  const { user } = useAuth();
  
  // Use data manager if available, otherwise fallback to local state
  const bookings = dataManager?.bookings || mockBookings;
  const payments = dataManager?.payments || mockPayments;
  const serviceTypes = dataManager?.serviceTypes || defaultServiceTypes;
  const leadSources = dataManager?.leadSources || defaultLeadSources;
  const loading = dataManager?.loading || false;
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [showServiceTypes, setShowServiceTypes] = useState(false);
  const [showLeadSources, setShowLeadSources] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [showServiceTypeDropdown, setShowServiceTypeDropdown] = useState(false);
  const [deleteServiceTypeConfirmation, setDeleteServiceTypeConfirmation] = useState<{ id: string; name: string; bookingCount: number } | null>(null);
  const [deleteLeadSourceConfirmation, setDeleteLeadSourceConfirmation] = useState<{ id: string; name: string; bookingCount: number } | null>(null);
  const [deleteBookingConfirmation, setDeleteBookingConfirmation] = useState<{ id: string; name: string } | null>(null);
  
  // Filtering and sorting state
  const [filters, setFilters] = useState({
    serviceTypes: [], // Start with no filters when no service types exist
    search: ''
  });
  const [sortBy, setSortBy] = useState<keyof Booking>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Data is now managed by the parent component's data manager

  // Filtered and sorted bookings
  const filteredAndSortedBookings = useMemo(() => {
    let filtered = bookings.filter(booking => {
      const serviceType = serviceTypes.find(st => st.id === booking.serviceTypeId);
      const matchesServiceType = filters.serviceTypes.length === 0 || 
        (serviceTypes.length > 0 && filters.serviceTypes.length === serviceTypes.length) || 
        filters.serviceTypes.includes(booking.serviceTypeId) ||
        (!booking.serviceTypeId && filters.serviceTypes.includes('')); // Handle deleted service types
      const matchesSearch = !filters.search || 
        booking.projectName.toLowerCase().includes(filters.search.toLowerCase()) ||
        (serviceType?.name.toLowerCase().includes(filters.search.toLowerCase()) ?? false) ||
        (!serviceType && 'deleted service type'.includes(filters.search.toLowerCase()));
      
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
  const addBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking | null> => {
    if (dataManager) {
      const newBooking = await dataManager.createBooking(bookingData);
      if (newBooking) {
        setShowAddBooking(false);
        return newBooking;
      }
      return null;
    } else if (user?.id) {
      try {
        console.log('Creating booking:', bookingData);
        const newBooking = await UnifiedDataService.createBooking(user.id, bookingData);
        
        if (newBooking) {
          console.log('Booking created successfully:', newBooking);
          setShowAddBooking(false);
          return newBooking;
        } else {
          console.error('Failed to create booking');
          return null;
        }
      } catch (error) {
        console.error('Error creating booking:', error);
        return null;
      }
    }
    return null;
  };

  // Add new payment
  const addPayment = async (paymentData: Omit<Payment, 'id'>) => {
    if (dataManager) {
      const newPayment = await dataManager.createPayment(paymentData);
      if (newPayment) {
        setShowAddPayment(false);
      }
    } else if (user?.id) {
      try {
        console.log('Creating payment:', paymentData);
        const newPayment = await UnifiedDataService.createPayment(user.id, paymentData);
        
        if (newPayment) {
          console.log('Payment created successfully:', newPayment);
          setShowAddPayment(false);
        } else {
          console.error('Failed to create payment');
        }
      } catch (error) {
        console.error('Error creating payment:', error);
      }
    }
  };

  // Add custom service type
  const addServiceType = async (name: string) => {
    if (dataManager) {
      await dataManager.createServiceType(name);
    } else if (user?.id) {
      try {
        console.log('Creating service type:', name);
        const newServiceType = await UnifiedDataService.createServiceType(user.id, name);
        
        if (newServiceType) {
          console.log('Service type created successfully:', newServiceType);
          // Note: This won't update the UI without data manager
        } else {
          console.error('Failed to create service type');
        }
      } catch (error) {
        console.error('Error creating service type:', error);
      }
    }
  };

  // Remove custom service type
  const removeServiceType = (id: string) => {
    // Check if any bookings are using this service type
    const bookingsUsingServiceType = bookings.filter(b => b.serviceTypeId === id);
    const serviceType = serviceTypes.find(st => st.id === id);
    
    if (!serviceType) return;
    
    // Show confirmation modal
    setDeleteServiceTypeConfirmation({
      id,
      name: serviceType.name,
      bookingCount: bookingsUsingServiceType.length
    });
  };

  const confirmDeleteServiceType = async () => {
    if (!deleteServiceTypeConfirmation) return;
    
    const { id, bookingCount } = deleteServiceTypeConfirmation;
    
    if (dataManager) {
      await dataManager.deleteServiceType(id);
    } else if (user?.id) {
      try {
        console.log('Deleting service type:', id);
        const success = await UnifiedDataService.deleteServiceType(user.id, id);
        
        if (success) {
          console.log('Service type deleted successfully');
          // Note: This won't update the UI without data manager
        } else {
          console.error('Failed to delete service type');
        }
      } catch (error) {
        console.error('Error deleting service type:', error);
      }
    }
    
    setDeleteServiceTypeConfirmation(null);
  };

  // Update service type
  const updateServiceType = async (id: string, newName: string) => {
    if (dataManager) {
      await dataManager.updateServiceType(id, newName);
    } else if (user?.id) {
      try {
        console.log('Updating service type:', id, 'to:', newName);
        const success = await UnifiedDataService.updateServiceType(user.id, id, newName);
        
        if (success) {
          console.log('Service type updated successfully');
          // Note: This won't update the UI without data manager
        } else {
          console.error('Failed to update service type');
        }
      } catch (error) {
        console.error('Error updating service type:', error);
      }
    }
  };

  // Toggle funnel tracking for service type
  const toggleFunnelTracking = (id: string) => {
    setServiceTypes(prev => prev.map(st => 
      st.id === id ? { ...st, tracksInFunnel: !st.tracksInFunnel } : st
    ));
  };

  // Add lead source
  const addLeadSource = async (name: string) => {
    if (dataManager) {
      await dataManager.createLeadSource(name);
    } else if (user?.id) {
      try {
        console.log('Creating lead source:', name);
        const newLeadSource = await UnifiedDataService.createLeadSource(user.id, name);
        
        if (newLeadSource) {
          console.log('Lead source created successfully:', newLeadSource);
          // Note: This won't update the UI without data manager
        } else {
          console.error('Failed to create lead source');
        }
      } catch (error) {
        console.error('Error creating lead source:', error);
      }
    }
  };

  // Remove lead source
  const removeLeadSource = (id: string) => {
    // Check if any bookings are using this lead source
    const bookingsUsingLeadSource = bookings.filter(b => b.leadSourceId === id);
    const leadSource = leadSources.find(ls => ls.id === id);
    
    if (!leadSource) return;
    
    // Show confirmation modal
    setDeleteLeadSourceConfirmation({
      id,
      name: leadSource.name,
      bookingCount: bookingsUsingLeadSource.length
    });
  };

  const confirmDeleteLeadSource = async () => {
    if (!deleteLeadSourceConfirmation) return;
    
    const { id, bookingCount } = deleteLeadSourceConfirmation;
    
    if (dataManager) {
      await dataManager.deleteLeadSource(id);
    } else if (user?.id) {
      try {
        console.log('Deleting lead source:', id);
        const success = await UnifiedDataService.deleteLeadSource(user.id, id);
        
        if (success) {
          console.log('Lead source deleted successfully');
          // Note: This won't update the UI without data manager
        } else {
          console.error('Failed to delete lead source');
        }
      } catch (error) {
        console.error('Error deleting lead source:', error);
      }
    }
    
    setDeleteLeadSourceConfirmation(null);
  };

  // Update lead source
  const updateLeadSource = async (id: string, newName: string) => {
    if (dataManager) {
      await dataManager.updateLeadSource(id, newName);
    } else if (user?.id) {
      try {
        console.log('Updating lead source:', id, 'to:', newName);
        const success = await UnifiedDataService.updateLeadSource(user.id, id, newName);
        
        if (success) {
          console.log('Lead source updated successfully');
          // Note: This won't update the UI without data manager
        } else {
          console.error('Failed to update lead source');
        }
      } catch (error) {
        console.error('Error updating lead source:', error);
      }
    }
  };

  // Update existing booking
  const updateBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
    if (!editingBooking) return;
    
    if (dataManager) {
      const success = await dataManager.updateBooking(editingBooking.id, bookingData);
      if (success) {
        setEditingBooking(null);
      }
    } else if (user?.id) {
      try {
        console.log('Updating booking:', editingBooking.id, bookingData);
        const success = await UnifiedDataService.updateBooking(user.id, editingBooking.id, bookingData);
        
        if (success) {
          console.log('Booking updated successfully');
          setEditingBooking(null);
        } else {
          console.error('Failed to update booking');
        }
      } catch (error) {
        console.error('Error updating booking:', error);
      }
    }
  };

  // Delete booking
  const deleteBooking = (id: string) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;
    
    setDeleteBookingConfirmation({
      id,
      name: booking.projectName
    });
  };

  const confirmDeleteBooking = async () => {
    if (!deleteBookingConfirmation) return;
    
    const { id } = deleteBookingConfirmation;
    
    if (dataManager) {
      await dataManager.deleteBooking(id);
    } else if (user?.id) {
      try {
        console.log('Deleting booking:', id);
        const success = await UnifiedDataService.deleteBooking(user.id, id);
        if (success) {
          console.log('Booking deleted successfully');
        } else {
          console.error('Failed to delete booking');
        }
      } catch (error) {
        console.error('Error deleting booking:', error);
      }
    }
    
    setDeleteBookingConfirmation(null);
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
    if (serviceTypes.length === 0) return; // Don't do anything if no service types exist
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
    if (serviceTypes.length === 0) return "No service types created";
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
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Sales Tracker</h1>
        <p style={{ fontSize: '14px', color: '#666' }}>Manage and track your sales data.</p>
      </header>


      {/* Action buttons */}
      <section style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowAddBooking(true)}
          style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 18px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(37, 99, 235, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(37, 99, 235, 0.3)';
          }}
        >
          <Plus size={16} />
          Add New Booking
        </button>
        <button
          onClick={() => setShowServiceTypes(true)}
          style={{
            backgroundColor: 'white',
            color: '#374151',
            border: '2px solid #d1d5db',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#9ca3af';
            e.currentTarget.style.backgroundColor = '#f9fafb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#d1d5db';
            e.currentTarget.style.backgroundColor = 'white';
          }}
        >
          <Edit size={16} />
          Manage Service Types
        </button>
        
        <button
          onClick={() => setShowLeadSources(true)}
          style={{
            backgroundColor: 'white',
            color: '#374151',
            border: '2px solid #d1d5db',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#9ca3af';
            e.currentTarget.style.backgroundColor = '#f9fafb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#d1d5db';
            e.currentTarget.style.backgroundColor = 'white';
          }}
        >
          <Edit size={16} />
          Manage Lead Sources
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
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', textAlign: 'left' }}>
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
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', textAlign: 'left' }}>
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
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', textAlign: 'left' }}>
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
          leadSources={leadSources}
          onAdd={addBooking}
          onClose={() => setShowAddBooking(false)}
          dataManager={dataManager}
        />
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          serviceTypes={serviceTypes}
          leadSources={leadSources}
          onUpdate={updateBooking}
          onClose={() => setEditingBooking(null)}
          dataManager={dataManager}
        />
      )}

      {/* Service Types Modal */}
      {showServiceTypes && (
        <ServiceTypesModal
          serviceTypes={serviceTypes}
          onAdd={addServiceType}
          onRemove={removeServiceType}
          onUpdate={updateServiceType}
          onToggleFunnelTracking={toggleFunnelTracking}
          onClose={() => setShowServiceTypes(false)}
        />
      )}

      {/* Lead Sources Modal */}
      {showLeadSources && (
        <LeadSourcesModal
          leadSources={leadSources}
          onAdd={addLeadSource}
          onRemove={removeLeadSource}
          onUpdate={updateLeadSource}
          onClose={() => setShowLeadSources(false)}
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
                <Th>Lead Source</Th>
                <Th>Date Inquired</Th>
                <Th>Date Booked</Th>
                <Th>Project Date</Th>
                <Th align="right">Revenue</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedBookings.map((booking, index) => {
                const serviceType = serviceTypes.find(st => st.id === booking.serviceTypeId);
                const leadSource = leadSources.find(ls => ls.id === booking.leadSourceId);
                const bookingPayments = payments.filter(p => p.bookingId === booking.id);
                const collected = sum(bookingPayments.filter(p => p.paidAt).map(p => p.amount));
                const outstanding = booking.bookedRevenue - collected;
                
                return (
                  <tr key={booking.id} style={{ 
                    borderBottom: '1px solid #eee',
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                  }}>
                    <Td>
                      <div style={{ fontWeight: '500' }}>{booking.projectName}</div>
                    </Td>
                    <Td>
                      {serviceType?.name || (
                        <span style={{ 
                          color: '#ef4444', 
                          fontStyle: 'italic',
                          fontSize: '12px'
                        }}>
                          Deleted Service Type
                        </span>
                      )}
                    </Td>
                    <Td>
                      {leadSource?.name || (
                        <span style={{ 
                          color: '#ef4444', 
                          fontStyle: 'italic',
                          fontSize: '12px'
                        }}>
                          Deleted Lead Source
                        </span>
                      )}
                    </Td>
                    <Td>{formatDate(booking.dateInquired)}</Td>
                    <Td>{formatDate(booking.dateBooked)}</Td>
                    <Td>{formatDate(booking.projectDate)}</Td>
                    <Td align="right">
                      <div style={{ fontWeight: '500' }}>{toUSD(booking.bookedRevenue)}</div>
                    </Td>
                    <Td>
                      <div style={{ display: 'flex', gap: '8px' }}>
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
                        <button
                          style={{
                            backgroundColor: '#ef4444',
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
                          onClick={() => deleteBooking(booking.id)}
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
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

      {/* Delete Service Type Confirmation Modal */}
      {deleteServiceTypeConfirmation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Trash2 size={24} color="#dc2626" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#1f2937', textAlign: 'left' }}>
                Delete Service Type
              </h3>
            </div>
            
            <p style={{ color: '#374151', margin: '0 0 8px 0', fontSize: '14px', textAlign: 'left', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong>{deleteServiceTypeConfirmation.name}</strong>?
            </p>
            
            {deleteServiceTypeConfirmation.bookingCount > 0 ? (
              <p style={{ color: '#dc2626', margin: '0 0 20px 0', fontSize: '13px', textAlign: 'left', lineHeight: '1.5', backgroundColor: '#fee2e2', padding: '12px', borderRadius: '6px' }}>
                <strong>Warning:</strong> This service type is used by {deleteServiceTypeConfirmation.bookingCount} booking(s). Deleting it will remove the service type association from those bookings. This action cannot be undone.
              </p>
            ) : (
              <p style={{ color: '#dc2626', margin: '0 0 20px 0', fontSize: '13px', textAlign: 'left', lineHeight: '1.5', backgroundColor: '#fee2e2', padding: '12px', borderRadius: '6px' }}>
                <strong>Warning:</strong> This action cannot be undone.
              </p>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteServiceTypeConfirmation(null)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteServiceType}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Delete Service Type
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Lead Source Confirmation Modal */}
      {deleteLeadSourceConfirmation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Trash2 size={24} color="#dc2626" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#1f2937', textAlign: 'left' }}>
                Delete Lead Source
              </h3>
            </div>
            
            <p style={{ color: '#374151', margin: '0 0 8px 0', fontSize: '14px', textAlign: 'left', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong>{deleteLeadSourceConfirmation.name}</strong>?
            </p>
            
            {deleteLeadSourceConfirmation.bookingCount > 0 ? (
              <p style={{ color: '#dc2626', margin: '0 0 20px 0', fontSize: '13px', textAlign: 'left', lineHeight: '1.5', backgroundColor: '#fee2e2', padding: '12px', borderRadius: '6px' }}>
                <strong>Warning:</strong> This lead source is used by {deleteLeadSourceConfirmation.bookingCount} booking(s). Deleting it will remove the lead source association from those bookings. This action cannot be undone.
              </p>
            ) : (
              <p style={{ color: '#dc2626', margin: '0 0 20px 0', fontSize: '13px', textAlign: 'left', lineHeight: '1.5', backgroundColor: '#fee2e2', padding: '12px', borderRadius: '6px' }}>
                <strong>Warning:</strong> This action cannot be undone.
              </p>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteLeadSourceConfirmation(null)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteLeadSource}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Delete Lead Source
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Booking Confirmation Modal */}
      {deleteBookingConfirmation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Trash2 size={24} color="#dc2626" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#1f2937', textAlign: 'left' }}>
                Delete Booking
              </h3>
            </div>
            
            <p style={{ color: '#374151', margin: '0 0 8px 0', fontSize: '14px', textAlign: 'left', lineHeight: '1.5' }}>
              Are you sure you want to delete the booking for <strong>{deleteBookingConfirmation.name}</strong>?
            </p>
            
            <p style={{ color: '#dc2626', margin: '0 0 20px 0', fontSize: '13px', textAlign: 'left', lineHeight: '1.5', backgroundColor: '#fee2e2', padding: '12px', borderRadius: '6px' }}>
              <strong>Warning:</strong> This will permanently delete the booking and all associated payment schedules. This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteBookingConfirmation(null)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteBooking}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Delete Booking
              </button>
            </div>
          </div>
        </div>
      )}
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

function Th({ children, className = "", align = 'left' }: { children: React.ReactNode; className?: string; align?: 'left' | 'right' | 'center' }) {
  return <th style={{ textAlign: align, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666', padding: '12px 16px' }}>{children}</th>;
}

function Td({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
  return <td style={{ padding: '12px 16px', verticalAlign: 'top', textAlign: align }}>{children}</td>;
}

// Add Booking Modal - Completely Clean (v3)
function AddBookingModal({ serviceTypes, leadSources, onAdd, onClose, dataManager }: {
  serviceTypes: ServiceType[];
  leadSources: LeadSource[];
  onAdd: (booking: Omit<Booking, 'id' | 'createdAt'>) => Promise<Booking | null> | void;
  onClose: () => void;
  dataManager?: any;
}) {
  const [formData, setFormData] = useState({
    projectName: '',
    serviceTypeId: '',
    leadSourceId: '',
    dateInquired: '',
    dateBooked: '',
    projectDate: '',
    bookedRevenue: '',
  });
  const [scheduledPayments, setScheduledPayments] = useState<Omit<Payment, 'id'>[]>([]);

  // Add new payment schedule
  const handleAddPayment = () => {
    const newPayment: Omit<Payment, 'id'> = {
      bookingId: '', // Will be set after booking is created
      amount: 0,
      amountCents: 0,
      paymentDate: undefined,
      dueDate: undefined,
      status: 'pending',
      memo: '',
      expectedDate: undefined,
      isExpected: true,
      paidAt: null
    };
    setScheduledPayments([...scheduledPayments, newPayment]);
  };

  // Remove payment schedule
  const handleRemovePayment = (index: number) => {
    setScheduledPayments(scheduledPayments.filter((_, i) => i !== index));
  };

  // Update payment schedule
  const handleUpdatePayment = (index: number, updates: Partial<Payment>) => {
    const payment = scheduledPayments[index];
    const updatedPayment = { ...payment, ...updates };
    const newPayments = [...scheduledPayments];
    newPayments[index] = updatedPayment;
    setScheduledPayments(newPayments);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectName || !formData.serviceTypeId || !formData.leadSourceId || !formData.bookedRevenue) {
      alert('Please fill in all required fields');
      return;
    }

    const newBooking = {
      projectName: formData.projectName,
      serviceTypeId: formData.serviceTypeId,
      leadSourceId: formData.leadSourceId,
      dateInquired: formData.dateInquired || undefined,
      dateBooked: formData.dateBooked || undefined,
      projectDate: formData.projectDate || undefined,
      bookedRevenue: Math.round(parseFloat(formData.bookedRevenue) * 100),
    };

    // Create the booking
    const createdBooking = await onAdd(newBooking);
    
    // If booking was created and we have payments, create them
    if (createdBooking && createdBooking.id && scheduledPayments.length > 0 && dataManager?.createPayment) {
      for (const payment of scheduledPayments) {
        // Only create payments with amount or expectedDate
        if (payment.amount > 0 || payment.expectedDate) {
          await dataManager.createPayment({
            bookingId: createdBooking.id,
            amount: payment.amount || 0,
            amountCents: payment.amount || 0,
            paymentDate: payment.expectedDate,
            dueDate: payment.expectedDate,
            status: 'pending',
            isExpected: true,
            paidAt: null,
            expectedDate: payment.expectedDate,
            memo: '',
            paymentMethod: ''
          });
        }
      }
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
        width: '95%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Add New Booking</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
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
                  boxSizing: 'border-box',
                  height: '40px'
                }}
                placeholder="e.g., Ashley & Devon"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
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
                  boxSizing: 'border-box',
                  height: '40px'
                }}
              >
                <option value="">Select service type</option>
                {serviceTypes.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
                Lead Source *
              </label>
              <select
                value={formData.leadSourceId}
                onChange={(e) => setFormData({ ...formData, leadSourceId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  height: '40px'
                }}
              >
                <option value="">Select lead source</option>
                {leadSources.map(ls => (
                  <option key={ls.id} value={ls.id}>{ls.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
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
                  boxSizing: 'border-box',
                  height: '40px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
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
                  boxSizing: 'border-box',
                  height: '40px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
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
                  boxSizing: 'border-box',
                  height: '40px'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
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
                boxSizing: 'border-box',
                height: '40px'
              }}
              placeholder="0.00"
            />
          </div>

          {/* Payment Schedule */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', margin: 0 }}>
                Payment Schedule (for Forecast)
              </label>
              <button
                type="button"
                onClick={handleAddPayment}
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
                <Plus size={14} />
                Add Payment
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px', marginTop: 0 }}>
              Add expected payments for forecasting future cash. Dates are Month/Year only.
            </p>

            {scheduledPayments.map((payment, index) => (
              <div key={index} style={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 1fr 80px',
                gap: '8px',
                marginBottom: '8px',
                padding: '8px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px'
              }}>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount ($)"
                  value={payment.amount ? (payment.amount / 100).toString() : ''}
                  onChange={(e) => {
                    const cents = Math.round(parseFloat(e.target.value || '0') * 100);
                    handleUpdatePayment(index, { amount: cents, amountCents: cents });
                  }}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="month"
                  placeholder="Month/Year"
                  value={payment.expectedDate || ''}
                  onChange={(e) => handleUpdatePayment(index, { expectedDate: e.target.value })}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemovePayment(index)}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
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
function ServiceTypesModal({ serviceTypes, onAdd, onRemove, onUpdate, onToggleFunnelTracking, onClose }: {
  serviceTypes: ServiceType[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, newName: string) => void;
  onToggleFunnelTracking: (id: string) => void;
  onClose: () => void;
}) {
  const [newServiceType, setNewServiceType] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = () => {
    if (newServiceType.trim()) {
      onAdd(newServiceType.trim());
      setNewServiceType('');
    }
  };

  const handleEdit = (serviceType: ServiceType) => {
    setEditingId(serviceType.id);
    setEditingName(serviceType.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      onUpdate(editingId, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = (id: string, name: string) => {
    const confirmMessage = `Are you sure you want to delete "${name}"? This action cannot be undone.`;
    if (confirm(confirmMessage)) {
      onRemove(id);
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
            {serviceTypes.length === 0 ? (
              <div style={{
                textAlign: 'left',
                padding: '24px',
                color: '#6b7280',
                fontSize: '14px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                No service types created yet. Add your first service type above to get started.
              </div>
            ) : (
              serviceTypes.map(st => (
              <div key={st.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                {editingId === st.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        border: '1px solid #3b82f6',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEdit}
                      style={{
                        backgroundColor: '#10b981',
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
                      <Check size={12} />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        backgroundColor: '#6b7280',
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
                      <X size={12} />
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <span style={{ fontSize: '14px' }}>{st.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="checkbox"
                          checked={st.tracksInFunnel}
                          onChange={() => onToggleFunnelTracking(st.id)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ 
                          fontSize: '11px', 
                          color: st.tracksInFunnel ? '#10b981' : '#6b7280',
                          fontWeight: '500'
                        }}>
                          Track in Funnel
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => handleEdit(st)}
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
                        <Edit3 size={12} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(st.id, st.name)}
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
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
            )}
          </div>
        </div>

        <div style={{ 
          backgroundColor: '#f3f4f6', 
          padding: '12px', 
          borderRadius: '6px', 
          marginBottom: '20px',
          fontSize: '12px',
          color: '#6b7280',
          textAlign: 'left'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>Funnel Tracking:</strong> Service types marked as "Track in Funnel" will be included in your funnel analytics for Closes, Bookings and Cash. 
            Uncheck for any Sales that you do not want to track in your Sales Funnel.
          </div>
          <div>
            <strong>Deletion:</strong> Deleting a service type will remove it from any existing bookings that use it. 
            The booking data will be preserved, but the service type association will be lost.
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

// Lead Sources Modal
function LeadSourcesModal({ leadSources, onAdd, onRemove, onUpdate, onClose }: {
  leadSources: LeadSource[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, newName: string) => void;
  onClose: () => void;
}) {
  const [newLeadSource, setNewLeadSource] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = async () => {
    if (newLeadSource.trim()) {
      await onAdd(newLeadSource.trim());
      setNewLeadSource('');
    }
  };

  const handleEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const handleSaveEdit = async () => {
    if (editingId && editingName.trim()) {
      await onUpdate(editingId, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Manage Lead Sources</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              value={newLeadSource}
              onChange={(e) => setNewLeadSource(e.target.value)}
              placeholder="Add new lead source"
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
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {leadSources.length === 0 ? (
              <div style={{
                textAlign: 'left',
                padding: '24px',
                color: '#6b7280',
                fontSize: '14px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                No lead sources created yet. Add your first lead source above to get started.
              </div>
            ) : (
              leadSources.map((leadSource) => (
                <div key={leadSource.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  {editingId === leadSource.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          border: '1px solid #3b82f6',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveEdit}
                        style={{
                          backgroundColor: '#10b981',
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
                        <Check size={12} />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        style={{
                          backgroundColor: '#6b7280',
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
                        <X size={12} />
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <span style={{ fontSize: '14px' }}>{leadSource.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleEdit(leadSource.id, leadSource.name)}
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
                          <Edit3 size={12} />
                          Edit
                        </button>
                        <button
                          onClick={() => onRemove(leadSource.id)}
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
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ 
          backgroundColor: '#f3f4f6', 
          padding: '12px', 
          borderRadius: '6px', 
          marginBottom: '20px',
          fontSize: '12px',
          color: '#6b7280',
          textAlign: 'left'
        }}>
          <div>
            <strong>Lead Sources:</strong> Lead sources help you track where your bookings come from. 
            You can add, edit, and delete lead sources. Changes will reset when you reload the app.
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
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', textAlign: 'left' }}>
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
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', textAlign: 'left' }}>
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
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', textAlign: 'left' }}>
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
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', textAlign: 'left' }}>
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

// Edit Booking Modal - Simplified
function EditBookingModal({ booking, serviceTypes, leadSources, onUpdate, onClose, dataManager }: {
  booking: Booking;
  serviceTypes: ServiceType[];
  leadSources: LeadSource[];
  onUpdate: (booking: Omit<Booking, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  dataManager?: any;
}) {
  const [formData, setFormData] = useState({
    projectName: booking.projectName,
    serviceTypeId: booking.serviceTypeId,
    leadSourceId: booking.leadSourceId,
    dateInquired: booking.dateInquired || '',
    dateBooked: booking.dateBooked || '',
    projectDate: booking.projectDate || '',
    bookedRevenue: (booking.bookedRevenue / 100).toString(),
  });

  const [scheduledPayments, setScheduledPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Load existing scheduled payments for this booking
  useEffect(() => {
    if (dataManager?.payments) {
      console.log('Loading scheduled payments for booking:', booking.id);
      console.log('All payments in dataManager:', dataManager.payments);
      const bookingPayments = dataManager.payments.filter((p: Payment) => 
        p.bookingId === booking.id
      );
      console.log('Filtered payments for this booking:', bookingPayments);
      setScheduledPayments(bookingPayments || []);
    }
  }, [booking.id, dataManager?.payments]);

  // Add new payment schedule
  const handleAddPayment = async () => {
    const newPayment: Omit<Payment, 'id'> = {
      bookingId: booking.id,
      amount: 0,
      amountCents: 0,
      paymentDate: undefined,
      dueDate: undefined,
      status: 'pending',
      memo: '',
      expectedDate: undefined, // Month/Year for when payment is expected
      isExpected: true, // This is a scheduled/expected payment
      paidAt: null
    };
    setScheduledPayments([...scheduledPayments, newPayment as Payment]);
  };

  // Remove payment schedule
  const handleRemovePayment = async (index: number) => {
    const payment = scheduledPayments[index];
    if (payment.id && dataManager?.deletePayment) {
      // If it has an ID, delete from database
      await dataManager.deletePayment(payment.id);
    }
    setScheduledPayments(scheduledPayments.filter((_, i) => i !== index));
  };

  // Update payment schedule
  const handleUpdatePayment = async (index: number, updates: Partial<Payment>) => {
    if (!dataManager) return; // Can't save without dataManager
    
    const payment = scheduledPayments[index];
    const updatedPayment = { ...payment, ...updates };
    
    const newPayments = [...scheduledPayments];
    newPayments[index] = updatedPayment;
    setScheduledPayments(newPayments);

    // Save to database
    if (payment.id && dataManager.updatePayment) {
      // Update existing payment
      await dataManager.updatePayment(payment.id, updates);
    } else if (dataManager.createPayment && (updates.amount !== undefined || (updates.expectedDate !== undefined && updates.expectedDate))) {
      // Create new payment only if we have amount or a non-empty expectedDate
      const newPayment = await dataManager.createPayment({
        bookingId: booking.id,
        amount: updatedPayment.amount || 0,
        amountCents: updatedPayment.amount || 0,
        paymentDate: updatedPayment.expectedDate,
        dueDate: updatedPayment.expectedDate,
        status: 'pending',
        isExpected: true,
        paidAt: null,
        expectedDate: updatedPayment.expectedDate,
        memo: '',
        paymentMethod: ''
      });
      
      // Update local state with the ID from the created payment
      if (newPayment) {
        newPayments[index] = { ...updatedPayment, id: newPayment.id };
        setScheduledPayments(newPayments);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectName || !formData.serviceTypeId || !formData.leadSourceId || !formData.bookedRevenue) {
      alert('Please fill in all required fields');
      return;
    }

    onUpdate({
      projectName: formData.projectName,
      serviceTypeId: formData.serviceTypeId,
      leadSourceId: formData.leadSourceId,
      dateInquired: formData.dateInquired || undefined,
      dateBooked: formData.dateBooked || undefined,
      projectDate: formData.projectDate || undefined,
      bookedRevenue: Math.round(parseFloat(formData.bookedRevenue) * 100),
    });

    // Simplified - no payment updates needed
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
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
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
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
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
            
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
                Lead Source *
              </label>
              <select
                value={formData.leadSourceId}
                onChange={(e) => setFormData({ ...formData, leadSourceId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Select lead source</option>
                {leadSources.map(ls => (
                  <option key={ls.id} value={ls.id}>{ls.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
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
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
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
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
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
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
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

          {/* Payment Schedule */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', margin: 0 }}>
                Payment Schedule (for Forecast)
              </label>
              <button
                type="button"
                onClick={handleAddPayment}
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
                <Plus size={14} />
                Add Payment
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px', marginTop: 0 }}>
              Add expected payments for forecasting future cash. Dates are Month/Year only.
            </p>

            {scheduledPayments.map((payment, index) => (
              <div key={index} style={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 1fr 80px',
                gap: '8px',
                marginBottom: '8px',
                padding: '8px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px'
              }}>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount ($)"
                  value={payment.amount ? (payment.amount / 100).toString() : ''}
                  onChange={(e) => {
                    const cents = Math.round(parseFloat(e.target.value || '0') * 100);
                    handleUpdatePayment(index, { amount: cents, amountCents: cents });
                  }}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="month"
                  placeholder="Month/Year"
                  value={payment.expectedDate || ''}
                  onChange={(e) => handleUpdatePayment(index, { expectedDate: e.target.value })}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemovePayment(index)}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    padding: '6px'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {scheduledPayments.length === 0 && (
              <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '20px' }}>
                No payments scheduled. Click "Add Payment" to add expected payments.
              </p>
            )}
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
