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
  const addBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
    if (dataManager) {
      const newBooking = await dataManager.createBooking(bookingData);
      if (newBooking) {
        setShowAddBooking(false);
      }
    } else if (user?.id) {
      try {
        console.log('Creating booking:', bookingData);
        const newBooking = await UnifiedDataService.createBooking(user.id, bookingData);
        
        if (newBooking) {
          console.log('Booking created successfully:', newBooking);
          setShowAddBooking(false);
        } else {
          console.error('Failed to create booking');
        }
      } catch (error) {
        console.error('Error creating booking:', error);
      }
    }
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
        />
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          serviceTypes={serviceTypes}
          leadSources={leadSources}
          payments={payments.filter(p => p.bookingId === editingBooking.id)}
          onUpdate={updateBooking}
          onUpdatePayments={async (updatedPayments) => {
            // Use data manager to update payments
            if (window.dataManager) {
              // Remove existing payments for this booking
              const existingPayments = window.dataManager.payments.filter(p => p.bookingId !== editingBooking.id);
              // Add updated payments
              for (const payment of updatedPayments) {
                await window.dataManager.createPayment(payment);
              }
            }
          }}
          onClose={() => setEditingBooking(null)}
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
                    <Td>{booking.dateInquired ? new Date(booking.dateInquired).toLocaleDateString() : '—'}</Td>
                    <Td>{booking.dateBooked ? new Date(booking.dateBooked).toLocaleDateString() : '—'}</Td>
                    <Td>{booking.projectDate ? new Date(booking.projectDate).toLocaleDateString() : '—'}</Td>
                    <Td align="right">
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

// Add Booking Modal - Simplified
function AddBookingModal({ serviceTypes, leadSources, onAdd, onClose }: {
  serviceTypes: ServiceType[];
  leadSources: LeadSource[];
  onAdd: (booking: Omit<Booking, 'id' | 'createdAt'>) => void;
  onClose: () => void;
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

  const handleSubmit = (e: React.FormEvent) => {
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

    onAdd(newBooking);
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

    const totalCents = Math.round(totalAmount * 100);
    let newPayments: Omit<Payment, 'id' | 'bookingId'>[] = [];

    if (paymentType === 'one-time') {
      newPayments = [{
        amount: totalCents,
        dueDate: formData.dateBooked || new Date().toISOString().split('T')[0],
        paidAt: null,
        memo: ''
      }];
    } else if (paymentType === 'installments') {
      // For installments, don't auto-generate - let user add manually
      return;
    } else if (paymentType === 'recurring') {
      if (!recurringStartDate || !recurringEndDate) return;
      
      const startDate = new Date(recurringStartDate);
      const endDate = new Date(recurringEndDate);
      const totalMonths = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      
      let paymentCount = 0;
      if (recurringInterval === 'monthly') {
        paymentCount = totalMonths;
      } else if (recurringInterval === 'bi-monthly') {
        paymentCount = Math.ceil(totalMonths / 2);
      }
      
      const baseAmount = Math.floor(totalCents / paymentCount);
      const remainder = totalCents - (baseAmount * paymentCount);
      
      for (let i = 0; i < paymentCount; i++) {
        const amount = i === paymentCount - 1 ? baseAmount + remainder : baseAmount;
        const dueDate = new Date(startDate);
        
        if (recurringInterval === 'monthly') {
          dueDate.setMonth(dueDate.getMonth() + i);
        } else if (recurringInterval === 'bi-monthly') {
          dueDate.setMonth(dueDate.getMonth() + (i * 2));
        }
        
        newPayments.push({
          amount,
          dueDate: dueDate.toISOString().split('T')[0],
          paidAt: null,
          memo: ''
        });
      }
    }

    setPayments(newPayments);
  };

  // Reset payments when payment type changes
  React.useEffect(() => {
    setPayments([]);
  }, [paymentType]);

  // Auto-generate payments when booking amount or payment type changes
  React.useEffect(() => {
    if (formData.bookedRevenue && paymentType) {
      generatePaymentSchedule();
    }
  }, [formData.bookedRevenue, paymentType, recurringInterval, recurringStartDate, recurringEndDate]);

  const updatePayment = (index: number, field: keyof Omit<Payment, 'id' | 'bookingId'>, value: any) => {
    setBookingPayments(prev => prev.map((payment, i) => 
      i === index ? { ...payment, [field]: value } : payment
    ));
  };

  const removePayment = (index: number) => {
    setBookingPayments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectName || !formData.serviceTypeId || !formData.leadSourceId || !formData.bookedRevenue) {
      alert('Please fill in all required fields');
      return;
    }

    // Create the booking first
    const newBooking = {
      projectName: formData.projectName,
      serviceTypeId: formData.serviceTypeId,
      leadSourceId: formData.leadSourceId,
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
        width: '95%',
        maxWidth: '800px',
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

          {/* Payment Schedule Section */}
          <div style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            padding: '20px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '16px', fontWeight: '600' }}>
                Payment Schedule
              </label>
            </div>

            {/* Payment Type Selection */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="paymentType"
                    value="one-time"
                    checked={paymentType === 'one-time'}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                  />
                  <span style={{ fontSize: '14px' }}>One-time Payment</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="paymentType"
                    value="installments"
                    checked={paymentType === 'installments'}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                  />
                  <span style={{ fontSize: '14px' }}>Installments</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="paymentType"
                    value="recurring"
                    checked={paymentType === 'recurring'}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                  />
                  <span style={{ fontSize: '14px' }}>Recurring</span>
                </label>
              </div>
            </div>

            {/* One-time Payment - Due Date */}
            {paymentType === 'one-time' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
                  Payment Due Date
                </label>
                <input
                  type="date"
                  value={formData.dateBooked || new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    // Update the due date for the one-time payment
                    if (payments.length > 0) {
                      updatePayment(0, 'dueDate', e.target.value);
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    width: '200px'
                  }}
                />
              </div>
            )}

            {/* Installment Options */}
            {paymentType === 'installments' && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500', textAlign: 'left' }}>
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
              </div>
            )}

            {/* Recurring Options */}
            {paymentType === 'recurring' && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
                      Payment Frequency
                    </label>
                    <select
                      value={recurringInterval}
                      onChange={(e) => setRecurringInterval(e.target.value as any)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        width: '100%',
                        boxSizing: 'border-box',
                        height: '40px'
                      }}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="bi-monthly">Bi-Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={recurringStartDate}
                      onChange={(e) => setRecurringStartDate(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        width: '100%',
                        boxSizing: 'border-box',
                        height: '40px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={recurringEndDate}
                      onChange={(e) => setRecurringEndDate(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        width: '100%',
                        boxSizing: 'border-box',
                        height: '40px'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Summary */}
            {payments.length > 0 && (
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    Total Payment Schedule: {toUSD(payments.reduce((sum, p) => sum + p.amount, 0))}
                  </span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: payments.reduce((sum, p) => sum + p.amount, 0) === Math.round(parseFloat(formData.bookedRevenue || '0') * 100) 
                      ? '#10b981' 
                      : '#f59e0b' 
                  }}>
                    {payments.reduce((sum, p) => sum + p.amount, 0) === Math.round(parseFloat(formData.bookedRevenue || '0') * 100) 
                      ? '✓ Matches booking amount' 
                      : '⚠ Amount mismatch'}
                  </span>
                </div>
              </div>
            )}
            
            {payments.map((payment, index) => (
              <div key={index} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>Payment {index + 1}</span>
                  {paymentType === 'installments' && (
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
                  )}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={payment.amount / 100}
                      onChange={(e) => updatePayment(index, 'amount', Math.round(parseFloat(e.target.value || '0') * 100))}
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
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={payment.dueDate}
                      onChange={(e) => updatePayment(index, 'dueDate', e.target.value)}
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
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
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

// Edit Booking Modal
function EditBookingModal({ booking, serviceTypes, leadSources, payments, onUpdate, onUpdatePayments, onClose }: {
  booking: Booking;
  serviceTypes: ServiceType[];
  leadSources: LeadSource[];
  payments: Payment[];
  onUpdate: (booking: Omit<Booking, 'id' | 'createdAt'>) => void;
  onUpdatePayments: (payments: Omit<Payment, 'id'>[]) => void;
  onClose: () => void;
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

  const [bookingPayments, setBookingPayments] = useState<Omit<Payment, 'id' | 'bookingId'>[]>(
    payments.map(p => ({
      amount: p.amount,
      dueDate: p.dueDate,
      paidAt: p.paidAt,
      memo: p.memo || ''
    }))
  );
  const [paymentType, setPaymentType] = useState<'one-time' | 'installments' | 'recurring' | null>(null);
  const [recurringInterval, setRecurringInterval] = useState<'monthly' | 'bi-monthly'>('monthly');
  const [recurringStartDate, setRecurringStartDate] = useState('');

  // Payment management functions
  const addPayment = () => {
    setBookingPayments(prev => [...prev, {
      amount: 0,
      dueDate: '',
      paidAt: null,
      memo: ''
    }]);
  };

  const removePayment = (index: number) => {
    setBookingPayments(prev => prev.filter((_, i) => i !== index));
  };

  const updatePayment = (index: number, field: keyof Omit<Payment, 'id' | 'bookingId'>, value: any) => {
    setBookingPayments(prev => prev.map((payment, i) => 
      i === index ? { ...payment, [field]: value } : payment
    ));
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

    // Update payments
    onUpdatePayments(bookingPayments.map(payment => ({
      ...payment,
      bookingId: booking.id
    })));
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

          {/* Payment Schedule Section */}
          <div style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            padding: '20px',
            backgroundColor: '#f9fafb'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0', color: '#1f2937' }}>
              Payment Schedule
            </h3>
            
            {bookingPayments.length > 0 && (
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    Total Payment Schedule: {toUSD(bookingPayments.reduce((sum, p) => sum + p.amount, 0))}
                  </span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: bookingPayments.reduce((sum, p) => sum + p.amount, 0) === Math.round(parseFloat(formData.bookedRevenue || '0') * 100) 
                      ? '#10b981' 
                      : '#f59e0b' 
                  }}>
                    {bookingPayments.reduce((sum, p) => sum + p.amount, 0) === Math.round(parseFloat(formData.bookedRevenue || '0') * 100) 
                      ? '✓ Matches booking amount' 
                      : '⚠ Amount mismatch'}
                  </span>
                </div>
              </div>
            )}
            
            {bookingPayments.map((payment, index) => (
              <div key={index} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
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
                    Remove
                  </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={payment.amount / 100}
                      onChange={(e) => updatePayment(index, 'amount', Math.round(parseFloat(e.target.value || '0') * 100))}
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
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={payment.dueDate}
                      onChange={(e) => updatePayment(index, 'dueDate', e.target.value)}
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
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                      Paid Date (optional)
                    </label>
                    <input
                      type="date"
                      value={payment.paidAt || ''}
                      onChange={(e) => updatePayment(index, 'paidAt', e.target.value || null)}
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
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                      Memo
                    </label>
                    <input
                      type="text"
                      value={payment.memo}
                      onChange={(e) => updatePayment(index, 'memo', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                      placeholder="e.g., Retainer, Milestone"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addPayment}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 16px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>+</span>
              Add Payment
            </button>
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
