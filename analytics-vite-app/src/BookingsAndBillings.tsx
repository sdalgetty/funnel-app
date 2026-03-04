import React, { useMemo, useState, useEffect } from "react";
import { Plus, Trash2, CalendarDays, DollarSign, Download, Edit, X, Edit3, Check, Upload } from "lucide-react";
import type { ServiceType, LeadSource, Booking, Payment } from './types';
import { UnifiedDataService } from './services/unifiedDataService';
import { useAuth } from './contexts/AuthContext';
import { toUSD, formatDate } from './utils/formatters';
import CSVImportModal from './components/CSVImportModal';
import ServiceTypesModal from './components/ServiceTypesModal';
import { InfoTooltip } from './components/InfoTooltip';
import type { ImportResult } from './services/honeybookImporter';

// Empty data for new users - they should start fresh
const defaultServiceTypes: ServiceType[] = [];

// Empty data for new users - they should start fresh
const defaultLeadSources: LeadSource[] = [];

// Empty data for new users - they should start fresh
const mockBookings: Booking[] = [];

// Empty data for new users - they should start fresh
const mockPayments: Payment[] = [];

// Helpers
const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

// Format date helper (using short format for BookingsAndBillings)
const formatBookingDate = (dateString: string) => formatDate(dateString, 'short');

interface BookingsAndBillingsProps {
  dataManager?: any;
  navigationAction?: { page: string; action?: string; month?: { year: number; month: number } } | null;
  isViewOnly?: boolean;
}

export default function BookingsAndBillingsPOC({ dataManager, navigationAction, isViewOnly = false }: BookingsAndBillingsProps) {
  const { user } = useAuth();
  
  // Use data manager if available, otherwise fallback to local state
  const bookings = dataManager?.bookings || mockBookings;
  const payments = dataManager?.payments || mockPayments;
  const serviceTypes = dataManager?.serviceTypes || defaultServiceTypes;
  const leadSources = dataManager?.leadSources || defaultLeadSources;
  const loading = dataManager?.loading || false;

  // Active (non-archived) for Add/Edit dropdowns - archived stay in filters for historical reporting
  const activeServiceTypes = useMemo(() => serviceTypes.filter(st => !st.archived), [serviceTypes]);
  const activeLeadSources = useMemo(() => leadSources.filter(ls => !ls.archived), [leadSources]);

  const [showAddBooking, setShowAddBooking] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  
  // Helper to get disabled button styles
  const getDisabledButtonStyle = (baseStyle: any) => {
    if (!isViewOnly) return baseStyle;
    return {
      ...baseStyle,
      opacity: 0.5,
      cursor: 'not-allowed',
      backgroundColor: baseStyle.backgroundColor || '#e5e7eb',
      color: baseStyle.color || '#9ca3af',
      borderColor: baseStyle.borderColor || '#d1d5db'
    };
  };

  // Handle navigation action to open add booking modal or filter by month
  useEffect(() => {
    if (navigationAction?.action === 'add-booking') {
      setShowAddBooking(true)
    } else if (navigationAction?.action === 'filter-month' && navigationAction.month) {
      // Filter bookings by month - this would need to be implemented in the component
      // For now, we'll just navigate to the page and the user can filter manually
      // Note: Month filtering can be implemented when needed
      // See: https://github.com/your-org/funnel-app/issues/XXX (create issue when implementing)
    }
  }, [navigationAction])
  const [showServiceTypes, setShowServiceTypes] = useState(false);
  const [showLeadSources, setShowLeadSources] = useState(false);
  const [showLeadSourceDropdown, setShowLeadSourceDropdown] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  // For Edit modal: include current booking's lead source/service type even if archived
  const serviceTypesForEdit = useMemo(() => {
    if (!editingBooking) return activeServiceTypes;
    const current = serviceTypes.find(st => st.id === editingBooking.serviceTypeId);
    if (current?.archived) return [current, ...activeServiceTypes.filter(s => s.id !== current.id)];
    return activeServiceTypes;
  }, [activeServiceTypes, serviceTypes, editingBooking?.serviceTypeId]);
  const leadSourcesForEdit = useMemo(() => {
    if (!editingBooking) return activeLeadSources;
    const current = leadSources.find(ls => ls.id === editingBooking.leadSourceId);
    if (current?.archived) return [current, ...activeLeadSources.filter(l => l.id !== current.id)];
    return activeLeadSources;
  }, [activeLeadSources, leadSources, editingBooking?.leadSourceId]);

  const [showServiceTypeDropdown, setShowServiceTypeDropdown] = useState(false);
  const [deleteServiceTypeConfirmation, setDeleteServiceTypeConfirmation] = useState<{ id: string; name: string; bookingCount: number } | null>(null);
  const [deleteLeadSourceConfirmation, setDeleteLeadSourceConfirmation] = useState<{ id: string; name: string; bookingCount: number } | null>(null);
  const [deleteBookingConfirmation, setDeleteBookingConfirmation] = useState<{ id: string; name: string } | null>(null);
  
  // Filtering and sorting state
  const [filters, setFilters] = useState({
    serviceTypes: [], // Start with no filters when no service types exist
    leadSources: [],
    search: ''
  });
  const [sortBy, setSortBy] = useState<keyof Booking>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Data is now managed by the parent component's data manager

  // Filtered and sorted bookings
  const filteredAndSortedBookings = useMemo(() => {
    let filtered = bookings.filter(booking => {
      const serviceType = serviceTypes.find(st => st.id === booking.serviceTypeId);
      const matchesServiceType = filters.serviceTypes.length === 0 || 
        (serviceTypes.length > 0 && filters.serviceTypes.length === serviceTypes.length) || 
        filters.serviceTypes.includes(booking.serviceTypeId) ||
        (!booking.serviceTypeId && filters.serviceTypes.includes('')); // Handle deleted service types
      const matchesLeadSource = filters.leadSources.length === 0 ||
        (leadSources.length > 0 && filters.leadSources.length === leadSources.length) ||
        filters.leadSources.includes(booking.leadSourceId) ||
        (!booking.leadSourceId && filters.leadSources.includes(''));
      const matchesSearch = !filters.search || 
        booking.projectName.toLowerCase().includes(filters.search.toLowerCase()) ||
        (serviceType?.name.toLowerCase().includes(filters.search.toLowerCase()) ?? false) ||
        (!serviceType && 'deleted service type'.includes(filters.search.toLowerCase()));
      
      return matchesServiceType && matchesLeadSource && matchesSearch;
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

  // Paginated bookings (only show current page)
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAndSortedBookings.slice(start, end);
  }, [filteredAndSortedBookings, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredAndSortedBookings.length / itemsPerPage);

  // Reset to page 1 when filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.serviceTypes, filters.leadSources, filters.search, sortBy, sortOrder]);

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

  // Handle CSV import
  const handleCSVImport = async (result: ImportResult) => {
    if (!user?.id) {
      console.error('User not logged in');
      return;
    }

    try {
      // Import service types and lead sources (only for Booked Client report, not Leads report)
      // Check if this is a Leads report by checking if there are no bookings
      const isLeadsReport = result.bookings.length === 0 && result.funnelData.length > 0;
      
      if (!isLeadsReport) {
        // Only import service types and lead sources for Booked Client report
        for (const serviceType of result.serviceTypes) {
          if (!serviceTypes.find(st => st.id === serviceType.id)) {
            if (dataManager) {
              await dataManager.createServiceType(serviceType.name, serviceType.description);
            } else {
              await UnifiedDataService.createServiceType(user.id, serviceType.name, serviceType.description);
            }
          }
        }

        // Import lead sources
        for (const leadSource of result.leadSources) {
          if (!leadSources.find(ls => ls.id === leadSource.id)) {
            if (dataManager) {
              await dataManager.createLeadSource(leadSource.name, leadSource.description);
            } else {
              await UnifiedDataService.createLeadSource(user.id, leadSource.name, leadSource.description);
            }
          }
        }
      }

      // Import bookings with deduplication
      // Check existing bookings to prevent duplicates
      const existingBookings = dataManager?.bookings || (user?.id ? await UnifiedDataService.getBookings(user.id) : []);
      
      // Create a set of existing booking keys: projectName + dateBooked
      const existingBookingKeys = new Set(
        existingBookings
          .filter(b => b.projectName && b.dateBooked)
          .map(b => `${b.projectName.toLowerCase().trim()}-${b.dateBooked}`)
      );
      
      let skippedCount = 0;
      let importedCount = 0;
      
      for (const booking of result.bookings) {
        // Create deduplication key: projectName + dateBooked
        const bookingKey = booking.projectName && booking.dateBooked
          ? `${booking.projectName.toLowerCase().trim()}-${booking.dateBooked}`
          : null;
        
        // Skip if this booking already exists
        if (bookingKey && existingBookingKeys.has(bookingKey)) {
          skippedCount++;
          continue;
        }
        
        // Create the booking
        if (dataManager) {
          await dataManager.createBooking(booking);
        } else {
          await UnifiedDataService.createBooking(user.id, booking);
        }
        importedCount++;
        
        // Add to existing set to prevent duplicates within the same import
        if (bookingKey) {
          existingBookingKeys.add(bookingKey);
        }
      }
      
      // Show warning if duplicates were skipped
      if (skippedCount > 0) {
        console.warn(`Skipped ${skippedCount} duplicate booking(s) that already exist`);
      }

      // Import funnel data (merge with existing data to preserve inquiries from Leads report)
      if (dataManager && dataManager.funnelData) {
        // Merge with existing funnel data
        for (const newFunnelData of result.funnelData) {
          // Find existing funnel data for this year/month
          const existing = dataManager.funnelData.find(
            f => f.year === newFunnelData.year && f.month === newFunnelData.month
          );
          
          if (existing) {
            // Merge: preserve inquiries (from Leads report), update closes/bookings (from Booked Client report)
            const merged: typeof newFunnelData = {
              ...existing,
              closes: newFunnelData.closes > 0 ? newFunnelData.closes : existing.closes,
              bookings: newFunnelData.bookings > 0 ? newFunnelData.bookings : existing.bookings,
              // Only update inquiries if the new data has inquiries (from Leads report)
              inquiries: newFunnelData.inquiries > 0 ? newFunnelData.inquiries : existing.inquiries,
            };
            await dataManager.saveFunnelData(merged);
          } else {
            // No existing data, save as-is
            await dataManager.saveFunnelData(newFunnelData);
          }
        }
      } else if (user?.id) {
        // Load existing funnel data to merge
        const existingFunnelData = await UnifiedDataService.getAllFunnelData(user.id);
        
        for (const newFunnelData of result.funnelData) {
          // Find existing funnel data for this year/month
          const existing = existingFunnelData.find(
            f => f.year === newFunnelData.year && f.month === newFunnelData.month
          );
          
          if (existing) {
            // Merge: preserve inquiries (from Leads report), update closes/bookings (from Booked Client report)
            const merged: typeof newFunnelData = {
              ...existing,
              closes: newFunnelData.closes > 0 ? newFunnelData.closes : existing.closes,
              bookings: newFunnelData.bookings > 0 ? newFunnelData.bookings : existing.bookings,
              // Only update inquiries if the new data has inquiries (from Leads report)
              inquiries: newFunnelData.inquiries > 0 ? newFunnelData.inquiries : existing.inquiries,
            };
            await UnifiedDataService.saveFunnelData(user.id, merged);
          } else {
            // No existing data, save as-is
            await UnifiedDataService.saveFunnelData(user.id, newFunnelData);
          }
        }
      }

      // Reload data if using data manager
      if (dataManager && dataManager.loadAllData) {
        await dataManager.loadAllData();
      }

      console.log('CSV import completed successfully');
      
      // Show success message with deduplication info
      const importedItems = [];
      if (result.bookings.length > 0) {
        // Special case: all data was duplicates
        if (importedCount === 0 && skippedCount > 0) {
          importedItems.push('No duplicate data imported. All uploaded data already exists');
        } else if (importedCount > 0 && skippedCount > 0) {
          // Some new data, some duplicates
          importedItems.push(`Successfully imported ${importedCount} new booking(s), ${skippedCount} duplicate(s) skipped`);
        } else if (importedCount > 0) {
          // All new data, no duplicates
          importedItems.push(`${importedCount} booking(s) imported`);
        }
      }
      if (result.funnelData.length > 0) importedItems.push(`${result.funnelData.length} months of funnel data`);
      if (importedItems.length > 0) {
        alert(`Successfully imported ${importedItems.join(' and ')}!`);
      }
    } catch (error) {
      console.error('Error importing CSV data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to import data. Please try again.';
      alert(`Import error: ${errorMessage}`);
      throw error;
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

  const confirmArchiveServiceType = async () => {
    if (!deleteServiceTypeConfirmation) return;
    const { id } = deleteServiceTypeConfirmation;
    let success = false;
    if (dataManager?.archiveServiceType) {
      success = await dataManager.archiveServiceType(id);
    } else if (user?.id) {
      success = await UnifiedDataService.archiveServiceType(user.id, id);
      if (success) window.location.reload();
    }
    if (success) setDeleteServiceTypeConfirmation(null);
  };

  const confirmDeleteServiceType = async () => {
    if (!deleteServiceTypeConfirmation) return;
    const { id } = deleteServiceTypeConfirmation;
    let success = false;
    if (dataManager) {
      success = await dataManager.deleteServiceType(id);
    } else if (user?.id) {
      try {
        success = await UnifiedDataService.deleteServiceType(user.id, id);
        if (success) window.location.reload();
      } catch (error) {
        console.error('Error deleting service type:', error);
      }
    }
    if (success) setDeleteServiceTypeConfirmation(null);
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
  const toggleFunnelTracking = async (id: string) => {
    if (dataManager?.toggleServiceTypeFunnelTracking) {
      // Use data manager if available to persist the change
      await dataManager.toggleServiceTypeFunnelTracking(id);
    } else {
      console.warn('toggleFunnelTracking called without dataManager; skipping local update');
    }
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

  const confirmArchiveLeadSource = async () => {
    if (!deleteLeadSourceConfirmation) return;
    const { id } = deleteLeadSourceConfirmation;
    let success = false;
    if (dataManager?.archiveLeadSource) {
      success = await dataManager.archiveLeadSource(id);
    } else if (user?.id) {
      success = await UnifiedDataService.archiveLeadSource(user.id, id);
      if (success) window.location.reload();
    }
    if (success) setDeleteLeadSourceConfirmation(null);
  };

  const confirmDeleteLeadSource = async () => {
    if (!deleteLeadSourceConfirmation) return;
    const { id } = deleteLeadSourceConfirmation;
    let success = false;
    if (dataManager) {
      success = await dataManager.deleteLeadSource(id);
    } else if (user?.id) {
      try {
        success = await UnifiedDataService.deleteLeadSource(user.id, id);
        if (success) window.location.reload();
      } catch (error) {
        console.error('Error deleting lead source:', error);
      }
    }
    if (success) setDeleteLeadSourceConfirmation(null);
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

  // Toggle ad source for lead source
  const toggleLeadSourceAdSource = async (id: string) => {
    if (dataManager?.toggleLeadSourceAdSource) {
      await dataManager.toggleLeadSourceAdSource(id);
    } else if (user?.id) {
      try {
        const success = await UnifiedDataService.toggleLeadSourceAdSource(user.id, id);
        if (success) {
          // Reload lead sources
          window.location.reload();
        }
      } catch (error) {
        console.error('Error toggling ad source:', error);
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

  // Lead source filter helpers
  const toggleLeadSourceFilter = (leadSourceId: string) => {
    setFilters(prev => ({
      ...prev,
      leadSources: prev.leadSources.includes(leadSourceId)
        ? prev.leadSources.filter(id => id !== leadSourceId)
        : [...prev.leadSources, leadSourceId]
    }));
  };

  const selectAllLeadSources = () => {
    setFilters(prev => ({ ...prev, leadSources: leadSources.map(ls => ls.id) }));
  };

  const clearAllLeadSources = () => {
    setFilters(prev => ({ ...prev, leadSources: [] }));
  };

  const getLeadSourceFilterText = () => {
    if (leadSources.length === 0) return "No lead sources created";
    if (filters.leadSources.length === 0) return "No lead sources selected";
    if (filters.leadSources.length === leadSources.length) return "All lead sources";
    if (filters.leadSources.length === 1) {
      const selected = leadSources.find(ls => ls.id === filters.leadSources[0]);
      return selected?.name || "1 lead source";
    }
    return `${filters.leadSources.length} lead sources`;
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (e: React.MouseEvent) => {
    if (showServiceTypeDropdown && !(e.target as Element).closest('[data-dropdown]')) {
      setShowServiceTypeDropdown(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', color: '#333', padding: '24px', maxWidth: '1200px', margin: '0 auto' }} onClick={handleClickOutside}>
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
          onClick={() => !isViewOnly && setShowAddBooking(true)}
          disabled={isViewOnly}
          style={getDisabledButtonStyle({
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
          })}
          onMouseEnter={(e) => {
            if (!isViewOnly) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(37, 99, 235, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isViewOnly) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(37, 99, 235, 0.3)';
            }
          }}
        >
          <Plus size={16} />
          Add New Booking
        </button>
        {user?.crm === 'honeybook' && (
          <button
            onClick={() => !isViewOnly && setShowCSVImport(true)}
            disabled={isViewOnly}
            style={getDisabledButtonStyle({
              backgroundColor: '#10b981',
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
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s'
            })}
          onMouseEnter={(e) => {
            if (!isViewOnly) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(16, 185, 129, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isViewOnly) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
            }
            }}
          >
            <Upload size={16} />
            Import from CSV
          </button>
        )}
        <button
          onClick={() => !isViewOnly && setShowServiceTypes(true)}
          disabled={isViewOnly}
          style={getDisabledButtonStyle({
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
          })}
          onMouseEnter={(e) => {
            if (!isViewOnly) {
              e.currentTarget.style.borderColor = '#9ca3af';
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }
          }}
          onMouseLeave={(e) => {
            if (!isViewOnly) {
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.backgroundColor = 'white';
            }
          }}
        >
          <Edit size={16} />
          Manage Service Types
        </button>
        
        <button
          onClick={() => !isViewOnly && setShowLeadSources(true)}
          disabled={isViewOnly}
          style={getDisabledButtonStyle({
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
          })}
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
      <section style={{ marginBottom: '24px', backgroundColor: 'white', borderRadius: '12px', padding: isMobile ? '16px' : '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', 
          gap: isMobile ? '12px' : '16px', 
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
          
          {/* Lead Source Filter */}
          
          
          {/* Service Type Filter (first) */}
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
          
          {/* Lead Source Filter (second) */}
          <div style={{ position: 'relative', minWidth: '200px' }} data-dropdown>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', textAlign: 'left' }}>
              Filter by Lead Source
            </label>
            <button
              onClick={() => setShowLeadSourceDropdown(!showLeadSourceDropdown)}
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
              <span>{getLeadSourceFilterText()}</span>
              <span style={{ transform: showLeadSourceDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                ▼
              </span>
            </button>
            {showLeadSourceDropdown && (
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
                    onClick={selectAllLeadSources}
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
                    onClick={clearAllLeadSources}
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
                {leadSources.map(ls => (
                  <label key={ls.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <input
                      type="checkbox"
                      checked={filters.leadSources.includes(ls.id)}
                      onChange={() => toggleLeadSourceFilter(ls.id)}
                      style={{ margin: 0 }}
                    />
                    <span style={{ fontSize: '14px' }}>{ls.name}</span>
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
          serviceTypes={activeServiceTypes}
          leadSources={activeLeadSources}
          onAdd={addBooking}
          onAddServiceType={dataManager?.createServiceType}
          onAddLeadSource={dataManager?.createLeadSource}
          onClose={() => setShowAddBooking(false)}
          dataManager={dataManager}
          isViewOnly={isViewOnly}
        />
      )}

      {/* CSV Import Modal */}
      {showCSVImport && user && (
        <CSVImportModal
          isOpen={showCSVImport}
          onClose={() => setShowCSVImport(false)}
          onImport={handleCSVImport}
          existingServiceTypes={serviceTypes}
          existingLeadSources={leadSources}
          userId={user.id}
          pageType="sales"
        />
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          serviceTypes={serviceTypesForEdit}
          leadSources={leadSourcesForEdit}
          onUpdate={updateBooking}
          onClose={() => setEditingBooking(null)}
          dataManager={dataManager}
        />
      )}

      {/* Service Types Modal */}
      {showServiceTypes && (
        <ServiceTypesModal
          serviceTypes={serviceTypes}
          getBookingCountForServiceType={(id) => bookings.filter(b => b.serviceTypeId === id).length}
          onAdd={addServiceType}
          onRemove={removeServiceType}
          onArchive={async (id) => {
            if (dataManager?.archiveServiceType) return dataManager.archiveServiceType(id);
            if (user?.id) {
              const ok = await UnifiedDataService.archiveServiceType(user.id, id);
              if (ok) window.location.reload();
              return ok;
            }
            return false;
          }}
          onUnarchive={dataManager?.unarchiveServiceType}
          onUpdate={updateServiceType}
          onToggleFunnelTracking={toggleFunnelTracking}
          onClose={() => setShowServiceTypes(false)}
        />
      )}

      {/* Lead Sources Modal */}
      {showLeadSources && (
        <LeadSourcesModal
          leadSources={leadSources}
          getBookingCountForLeadSource={(id) => bookings.filter(b => b.leadSourceId === id).length}
          onAdd={addLeadSource}
          onRemove={removeLeadSource}
          onArchive={async (id) => {
            if (dataManager?.archiveLeadSource) return dataManager.archiveLeadSource(id);
            if (user?.id) {
              const ok = await UnifiedDataService.archiveLeadSource(user.id, id);
              if (ok) window.location.reload();
              return ok;
            }
            return false;
          }}
          onUnarchive={dataManager?.unarchiveLeadSource}
          onUpdate={updateLeadSource}
          onToggleAdSource={toggleLeadSourceAdSource}
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

      {/* Bookings table - Desktop */}
      {!isMobile && (
      <section style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: '70vh' }}>
          <table style={{ width: '100%', fontSize: '14px', tableLayout: 'fixed' }}>
            <thead style={{ 
              backgroundColor: '#f5f5f5',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <tr>
                <Th width="20%">Project Name</Th>
                <Th width="12%">Service Type</Th>
                <Th width="12%">Lead Source</Th>
                <Th width="10%">Date Inquired</Th>
                <Th width="10%">Date Booked</Th>
                <Th width="10%">Project Date</Th>
                <Th align="right" width="12%">Revenue</Th>
                <Th width="14%">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    {filteredAndSortedBookings.length === 0 
                      ? 'No bookings found. Click "Add New Booking" to get started.'
                      : 'No bookings match your current filters.'}
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((booking, index) => {
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
                      <div style={{ fontWeight: '500', wordWrap: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }}>{booking.projectName}</div>
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
                    <Td>{formatBookingDate(booking.dateInquired)}</Td>
                    <Td>{formatBookingDate(booking.dateBooked)}</Td>
                    <Td>{formatBookingDate(booking.projectDate)}</Td>
                    <Td align="right">
                      <div style={{ fontWeight: '500' }}>{toUSD(booking.bookedRevenue)}</div>
                    </Td>
                    <Td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        disabled={isViewOnly}
                        style={getDisabledButtonStyle({
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
                        })}
                        onClick={() => !isViewOnly && setEditingBooking(booking)}
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
                          onClick={() => !isViewOnly && deleteBooking(booking.id)}
                          disabled={isViewOnly}
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {filteredAndSortedBookings.length > itemsPerPage && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedBookings.length)} of {filteredAndSortedBookings.length} bookings
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: currentPage === 1 ? '#f3f4f6' : 'white',
                  color: currentPage === 1 ? '#9ca3af' : '#374151',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                Previous
              </button>
              <div style={{ 
                fontSize: '14px', 
                color: '#374151',
                padding: '0 12px',
                minWidth: '100px',
                textAlign: 'center'
              }}>
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: currentPage === totalPages ? '#f3f4f6' : 'white',
                  color: currentPage === totalPages ? '#9ca3af' : '#374151',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
      )}

      {/* Mobile Card View */}
      {isMobile && (
        <section style={{ 
          padding: '16px', 
          backgroundColor: '#f9fafb', 
          minHeight: '100vh',
          width: '100%',
          maxWidth: '100vw',
          boxSizing: 'border-box',
          overflowX: 'hidden'
        }}>
          {paginatedBookings.length === 0 ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              color: '#9ca3af',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              {filteredAndSortedBookings.length === 0 
                ? 'No bookings found. Click "Add New Booking" to get started.'
                : 'No bookings match your current filters.'}
            </div>
          ) : (
            <>
              {paginatedBookings.map((booking) => {
                const serviceType = serviceTypes.find(st => st.id === booking.serviceTypeId);
                const leadSource = leadSources.find(ls => ls.id === booking.leadSourceId);
                const bookingPayments = payments.filter(p => p.bookingId === booking.id);
                const collected = sum(bookingPayments.filter(p => p.paidAt).map(p => p.amount));
                
                return (
                  <div
                    key={booking.id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      border: '1px solid #e5e7eb',
                      width: '100%',
                      maxWidth: '100%',
                      boxSizing: 'border-box',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0', color: '#1f2937' }}>
                          {booking.projectName}
                        </h4>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981', marginBottom: '12px' }}>
                          {toUSD(booking.bookedRevenue)}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '14px', color: '#6b7280' }}>Service Type:</span>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                            {serviceType?.name || (
                              <span style={{ color: '#ef4444', fontStyle: 'italic', fontSize: '12px' }}>
                                Deleted Service Type
                              </span>
                            )}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '14px', color: '#6b7280' }}>Lead Source:</span>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                            {leadSource?.name || (
                              <span style={{ color: '#ef4444', fontStyle: 'italic', fontSize: '12px' }}>
                                Deleted Lead Source
                              </span>
                            )}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '14px', color: '#6b7280' }}>Date Inquired:</span>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                            {formatBookingDate(booking.dateInquired)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '14px', color: '#6b7280' }}>Date Booked:</span>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                            {formatBookingDate(booking.dateBooked)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '14px', color: '#6b7280' }}>Project Date:</span>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                            {formatBookingDate(booking.projectDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        disabled={isViewOnly}
                        style={getDisabledButtonStyle({
                          flex: 1,
                          padding: '8px 12px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        })}
                        onClick={() => !isViewOnly && setEditingBooking(booking)}
                      >
                        <Edit size={14} />
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
                          cursor: isViewOnly ? 'not-allowed' : 'pointer',
                          opacity: isViewOnly ? 0.5 : 1
                        }}
                        onClick={() => !isViewOnly && deleteBooking(booking.id)}
                        disabled={isViewOnly}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {/* Mobile Pagination */}
              {filteredAndSortedBookings.length > itemsPerPage && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  marginTop: '16px',
                  border: '1px solid #e5e7eb'
                }}>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '10px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: currentPage === 1 ? '#f3f4f6' : 'white',
                      color: currentPage === 1 ? '#9ca3af' : '#374151',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Previous
                  </button>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#374151',
                    fontWeight: '500'
                  }}>
                    Page {currentPage} of {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '10px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: currentPage === totalPages ? '#f3f4f6' : 'white',
                      color: currentPage === totalPages ? '#9ca3af' : '#374151',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Delete / Archive Service Type Confirmation Modal */}
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
            {deleteServiceTypeConfirmation.bookingCount > 0 ? (
              <>
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
                    Cannot delete Service Type
                  </h3>
                </div>
                <p style={{ color: '#374151', margin: '0 0 12px 0', fontSize: '14px', textAlign: 'left', lineHeight: '1.5' }}>
                  This Service Type is used by {deleteServiceTypeConfirmation.bookingCount} existing sales record{deleteServiceTypeConfirmation.bookingCount !== 1 ? 's' : ''}.
                </p>
                <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: '14px', textAlign: 'left', lineHeight: '1.5' }}>
                  Deleting it would affect your historical reporting.
                </p>
                <p style={{ color: '#374151', margin: '0 0 20px 0', fontSize: '14px', textAlign: 'left', lineHeight: '1.5' }}>
                  Instead, you can archive this Service Type. Archived Service Types remain attached to past sales but cannot be used for new sales.
                </p>
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
                    onClick={confirmArchiveServiceType}
                    style={{
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
                    Archive Service Type
                  </button>
                </div>
              </>
            ) : (
              <>
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
                <p style={{ color: '#dc2626', margin: '0 0 20px 0', fontSize: '13px', textAlign: 'left', lineHeight: '1.5', backgroundColor: '#fee2e2', padding: '12px', borderRadius: '6px' }}>
                  <strong>Warning:</strong> This action cannot be undone.
                </p>
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
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete / Archive Lead Source Confirmation Modal */}
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
            {deleteLeadSourceConfirmation.bookingCount > 0 ? (
              <>
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
                    Cannot delete Lead Source
                  </h3>
                </div>
                <p style={{ color: '#374151', margin: '0 0 12px 0', fontSize: '14px', textAlign: 'left', lineHeight: '1.5' }}>
                  This Lead Source is used by {deleteLeadSourceConfirmation.bookingCount} existing sales record{deleteLeadSourceConfirmation.bookingCount !== 1 ? 's' : ''}.
                </p>
                <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: '14px', textAlign: 'left', lineHeight: '1.5' }}>
                  Deleting it would affect your historical reporting.
                </p>
                <p style={{ color: '#374151', margin: '0 0 20px 0', fontSize: '14px', textAlign: 'left', lineHeight: '1.5' }}>
                  Instead, you can archive this Lead Source. Archived Lead Sources remain attached to past sales but cannot be used for new sales.
                </p>
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
                    onClick={confirmArchiveLeadSource}
                    style={{
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
                    Archive Lead Source
                  </button>
                </div>
              </>
            ) : (
              <>
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
                <p style={{ color: '#dc2626', margin: '0 0 20px 0', fontSize: '13px', textAlign: 'left', lineHeight: '1.5', backgroundColor: '#fee2e2', padding: '12px', borderRadius: '6px' }}>
                  <strong>Warning:</strong> This action cannot be undone.
                </p>
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
              </>
            )}
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

function Th({ children, className = "", align = 'left', width }: { children: React.ReactNode; className?: string; align?: 'left' | 'right' | 'center'; width?: string }) {
  return <th style={{ textAlign: align, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666', padding: '12px 12px', width }}>{children}</th>;
}

function Td({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
  return <td style={{ padding: '12px 12px', verticalAlign: 'top', textAlign: align, wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</td>;
}

// Add Booking Modal - Completely Clean (v3)
function AddBookingModal({ serviceTypes, leadSources, onAdd, onAddServiceType, onAddLeadSource, onClose, dataManager, isViewOnly = false }: {
  serviceTypes: ServiceType[];
  leadSources: LeadSource[];
  onAdd: (booking: Omit<Booking, 'id' | 'createdAt'>) => Promise<Booking | null> | void;
  onAddServiceType?: (name: string) => Promise<ServiceType | null>;
  onAddLeadSource?: (name: string) => Promise<LeadSource | null>;
  onClose: () => void;
  dataManager?: any;
  isViewOnly?: boolean;
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
  const [scheduledPayments, setScheduledPayments] = useState<Array<Omit<Payment, 'id'> & { amountInput?: string }>>([]);
  const [addingServiceType, setAddingServiceType] = useState(false);
  const [newServiceTypeName, setNewServiceTypeName] = useState('');
  const [addingLeadSource, setAddingLeadSource] = useState(false);
  const [newLeadSourceName, setNewLeadSourceName] = useState('');

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
  const handleUpdatePayment = (index: number, updates: Partial<Payment & { amountInput?: string }>) => {
    const payment = scheduledPayments[index];
    const updatedPayment = { ...payment, ...updates };
    const newPayments = [...scheduledPayments];
    newPayments[index] = updatedPayment;
    setScheduledPayments(newPayments);
  };

  // Helper to parse month/year from YYYY-MM format
  const parseMonthYear = (monthYear: string | undefined) => {
    if (!monthYear || monthYear.length === 0) return { month: '', year: '' };
    const parts = monthYear.split('-');
    if (parts.length === 2) {
      return { month: parts[1], year: parts[0] };
    }
    return { month: '', year: '' };
  };

  // Helper to combine month and year into YYYY-MM format
  const combineMonthYear = (month: string, year: string) => {
    if (!month || !year) return undefined;
    return `${year}-${month.padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectName || !formData.serviceTypeId || !formData.leadSourceId || !formData.dateBooked || !formData.bookedRevenue) {
      alert('Please fill in all required fields (Project Name, Service Type, Lead Source, Date Booked, Booked Revenue)');
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
                Service Type *
                <InfoTooltip content="Used to categorize your work (e.g., Wedding, Engagement, Family). Service Types allow you to filter Sales and analyze performance in Insights." />
              </label>
              {addingServiceType ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={newServiceTypeName}
                    onChange={(e) => setNewServiceTypeName(e.target.value)}
                    placeholder="New service type name"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newServiceTypeName.trim() && onAddServiceType) {
                          onAddServiceType(newServiceTypeName.trim()).then((st) => {
                            if (st) {
                              setFormData({ ...formData, serviceTypeId: st.id });
                              setAddingServiceType(false);
                              setNewServiceTypeName('');
                            }
                          });
                        }
                      } else if (e.key === 'Escape') {
                        setAddingServiceType(false);
                        setNewServiceTypeName('');
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      height: '40px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (newServiceTypeName.trim() && onAddServiceType) {
                        const st = await onAddServiceType(newServiceTypeName.trim());
                        if (st) {
                          setFormData({ ...formData, serviceTypeId: st.id });
                          setAddingServiceType(false);
                          setNewServiceTypeName('');
                        }
                      }
                    }}
                    style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingServiceType(false); setNewServiceTypeName(''); }}
                    style={{
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    value={formData.serviceTypeId}
                    onChange={(e) => setFormData({ ...formData, serviceTypeId: e.target.value })}
                    style={{
                      flex: 1,
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
                  {onAddServiceType && !isViewOnly && (
                    <button
                      type="button"
                      onClick={() => setAddingServiceType(true)}
                      style={{
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      + Add new
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
                Lead Source *
                <InfoTooltip content="Tracks where the booking came from. Lead Sources power your Funnel metrics and can also be used to track Advertising ROI." />
              </label>
              {addingLeadSource ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={newLeadSourceName}
                    onChange={(e) => setNewLeadSourceName(e.target.value)}
                    placeholder="New lead source name"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newLeadSourceName.trim() && onAddLeadSource) {
                          onAddLeadSource(newLeadSourceName.trim()).then((ls) => {
                            if (ls) {
                              setFormData({ ...formData, leadSourceId: ls.id });
                              setAddingLeadSource(false);
                              setNewLeadSourceName('');
                            }
                          });
                        }
                      } else if (e.key === 'Escape') {
                        setAddingLeadSource(false);
                        setNewLeadSourceName('');
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      height: '40px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (newLeadSourceName.trim() && onAddLeadSource) {
                        const ls = await onAddLeadSource(newLeadSourceName.trim());
                        if (ls) {
                          setFormData({ ...formData, leadSourceId: ls.id });
                          setAddingLeadSource(false);
                          setNewLeadSourceName('');
                        }
                      }
                    }}
                    style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingLeadSource(false); setNewLeadSourceName(''); }}
                    style={{
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    value={formData.leadSourceId}
                    onChange={(e) => setFormData({ ...formData, leadSourceId: e.target.value })}
                    style={{
                      flex: 1,
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
                  {onAddLeadSource && !isViewOnly && (
                    <button
                      type="button"
                      onClick={() => setAddingLeadSource(true)}
                      style={{
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      + Add new
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
                Date Inquired
                <InfoTooltip content="The date the client first contacted you. Used to track inquiry trends and conversion rates in your Funnel." />
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
                Date Booked *
                <InfoTooltip content="The date the client officially booked with you. This helps track how long it takes to convert inquiries into bookings." />
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
                Project Date
                <InfoTooltip content="The date the work will take place (e.g., wedding date or session date). Used for planning and forecasting." />
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
              Booked Revenue *
              <InfoTooltip content="The total value of the booking." />
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={formData.bookedRevenue}
              onChange={(e) => {
                const value = e.target.value;
                // Allow empty string or valid decimal numbers
                if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                  setFormData({ ...formData, bookedRevenue: value });
                }
              }}
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
                Payment Schedule (For Cash Tracking)
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
              Add expected payments to forecast when Cash will be received. Payment dates are entered as Month and Year only.
            </p>

            {scheduledPayments.map((payment, index) => {
              const { month, year } = parseMonthYear(payment.expectedDate);
              const currentYear = new Date().getFullYear();
              // Show years from 2 years ago to 8 years in the future (10 year range)
              const years = Array.from({ length: 11 }, (_, i) => currentYear - 2 + i);
              
              return (
                <div key={index} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '2fr 1fr 1fr 80px',
                  gap: '8px',
                  marginBottom: '8px',
                  padding: '8px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px'
                }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Amount ($)"
                    value={payment.amountInput ?? (payment.amount ? (payment.amount / 100).toFixed(2) : '')}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        const numValue = value === '' ? 0 : parseFloat(value);
                        const cents = value === '' || Number.isNaN(numValue) ? 0 : Math.round(numValue * 100);
                        handleUpdatePayment(index, { amountInput: value, amount: cents, amountCents: cents });
                      }
                    }}
                    onBlur={() => {
                      if (payment.amountInput === undefined) return;
                      const numValue = payment.amountInput === '' ? 0 : parseFloat(payment.amountInput);
                      if (Number.isNaN(numValue)) return;
                      const cents = Math.round(numValue * 100);
                      handleUpdatePayment(index, { amountInput: (cents / 100).toFixed(2), amount: cents, amountCents: cents });
                    }}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                  <select
                    value={month}
                    onChange={(e) => {
                      const newDate = combineMonthYear(e.target.value, year || currentYear.toString());
                      handleUpdatePayment(index, { expectedDate: newDate });
                    }}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Month</option>
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
                    value={year}
                    onChange={(e) => {
                      const newDate = combineMonthYear(month || '01', e.target.value);
                      handleUpdatePayment(index, { expectedDate: newDate });
                    }}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Year</option>
                    {years.map(y => (
                      <option key={y} value={y.toString()}>{y}</option>
                    ))}
                  </select>
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
              );
            })}
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

// Lead Sources Modal
function LeadSourcesModal({ leadSources, getBookingCountForLeadSource, onAdd, onRemove, onArchive, onUnarchive, onUpdate, onToggleAdSource, onClose }: {
  leadSources: LeadSource[];
  getBookingCountForLeadSource: (id: string) => number;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onArchive?: (id: string) => Promise<boolean>;
  onUnarchive?: (id: string) => Promise<boolean>;
  onUpdate: (id: string, newName: string) => void;
  onToggleAdSource: (id: string) => void;
  onClose: () => void;
}) {
  const [newLeadSource, setNewLeadSource] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const activeLeadSources = leadSources.filter(ls => !ls.archived);
  const archivedLeadSources = leadSources.filter(ls => ls.archived);
  const displayLeadSources = showArchived ? leadSources : activeLeadSources;

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Manage Lead Sources</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0', lineHeight: 1.4 }}>
              Lead Sources track where your bookings come from and can also be used to measure Advertising ROI.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {archivedLeadSources.length > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', marginTop: '16px', cursor: 'pointer', fontSize: '14px', color: '#6b7280' }}>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#3b82f6' }}
            />
            Show archived lead sources
            <InfoTooltip content="Archived lead sources remain attached to past sales but are hidden from new sale dropdowns." />
          </label>
        )}

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
          <div style={{
            maxHeight: '280px',
            overflowY: 'auto',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}>
            {displayLeadSources.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor: '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
                fontWeight: 600,
                fontSize: '12px',
                color: '#374151',
                position: 'sticky',
                top: 0,
                zIndex: 1,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>Lead Source</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, width: '140px', justifyContent: 'flex-start' }}>
                  <span>Ad Source</span>
                  <InfoTooltip content="Mark this lead source as advertising so bookings from this source are included in your Advertising metrics and ROI calculations." />
                </div>
                <div style={{ width: '52px', flexShrink: 0, textAlign: 'left' }}>Edit</div>
                <div style={{ width: '88px', flexShrink: 0, textAlign: 'left' }}>Actions</div>
              </div>
            )}
            {displayLeadSources.length === 0 ? (
              <div style={{
                textAlign: 'left',
                padding: '24px',
                color: '#6b7280',
                fontSize: '14px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
              }}>
                {showArchived ? 'No archived lead sources.' : 'No lead sources created yet. Add your first lead source above to get started.'}
              </div>
            ) : (
              displayLeadSources.map((leadSource) => {
                const isAdSource = leadSource.isAdSource || false;
                const isArchived = leadSource.archived || false;
                return (
                <div key={leadSource.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderBottom: '1px solid #f3f4f6',
                  backgroundColor: isArchived ? '#f9fafb' : (isAdSource ? '#eff6ff' : '#f9fafb'),
                }}>
                  {isArchived ? (
                    <>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>{leadSource.name} <span style={{ fontStyle: 'italic', fontSize: '12px' }}>(archived)</span></span>
                      </div>
                      <div style={{ flexShrink: 0, width: '140px' }} />
                      <div style={{ flexShrink: 0, width: '52px' }} />
                      <div style={{ flexShrink: 0, width: '88px', display: 'flex', justifyContent: 'flex-start' }}>
                        {onUnarchive && (
                          <button
                            onClick={() => onUnarchive(leadSource.id)}
                            style={{
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 12px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </>
                  ) : editingId === leadSource.id ? (
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
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '14px', fontWeight: isAdSource ? 600 : 500 }}>{leadSource.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <div style={{ width: '140px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={isAdSource}
                              onChange={() => onToggleAdSource(leadSource.id)}
                              style={{ width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '13px', color: isAdSource ? '#3b82f6' : '#6b7280', fontWeight: '500' }}>
                              Ad Source
                            </span>
                          </label>
                        </div>
                        <div style={{ width: '52px', flexShrink: 0 }}>
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
                        </div>
                        <div style={{ width: '88px', flexShrink: 0, display: 'flex', justifyContent: 'flex-start' }}>
                          {getBookingCountForLeadSource(leadSource.id) > 0 ? (
                            onArchive && (
                              <button
                                onClick={() => onArchive(leadSource.id)}
                                style={{
                                  backgroundColor: '#6b7280',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 12px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  width: '80px',
                                  justifyContent: 'center'
                                }}
                              >
                                <Trash2 size={12} />
                                Archive
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() => onRemove(leadSource.id)}
                            style={{
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 12px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              width: '80px',
                              justifyContent: 'center'
                            }}
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
              })
            )}
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
                type="text"
                inputMode="decimal"
                value={formData.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string or valid decimal numbers
                  if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                    setFormData({ ...formData, amount: value });
                  }
                }}
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

  const [scheduledPayments, setScheduledPayments] = useState<Array<Payment & { amountInput?: string }>>([]);
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
      setScheduledPayments(prev => (bookingPayments || []).map(payment => {
        const existing = prev.find(p => p.id === payment.id);
        return { ...payment, amountInput: existing?.amountInput };
      }));
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

  // Helper to parse month/year from YYYY-MM format
  const parseMonthYear = (monthYear: string | undefined) => {
    if (!monthYear || monthYear.length === 0) return { month: '', year: '' };
    const parts = monthYear.split('-');
    if (parts.length === 2) {
      return { month: parts[1], year: parts[0] };
    }
    return { month: '', year: '' };
  };

  // Helper to combine month and year into YYYY-MM format
  const combineMonthYear = (month: string, year: string) => {
    if (!month || !year) return undefined;
    return `${year}-${month.padStart(2, '0')}`;
  };

  // Update payment schedule
  const handleUpdatePayment = async (index: number, updates: Partial<Payment & { amountInput?: string }>) => {
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

  const updatePaymentLocal = (index: number, updates: Partial<Payment & { amountInput?: string }>) => {
    setScheduledPayments(prev => {
      const payment = prev[index];
      if (!payment) return prev;
      const newPayments = [...prev];
      newPayments[index] = { ...payment, ...updates };
      return newPayments;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectName || !formData.serviceTypeId || !formData.leadSourceId || !formData.bookedRevenue) {
      alert('Please fill in all required fields');
      return;
    }

    // Check if the selected service type tracks in funnel
    const selectedServiceType = serviceTypes.find(st => st.id === formData.serviceTypeId);
    if (selectedServiceType?.tracksInFunnel && !formData.dateBooked) {
      alert('Date Booked is required for service types that are tracked in the Funnel. Please enter a booking date or uncheck "Track in Funnel" for this service type.');
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

  const isMobile = window.innerWidth < 768;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: isMobile ? '0' : '16px'
    }}
    onClick={onClose}
    >
      <div style={{
        backgroundColor: 'white',
        borderRadius: isMobile ? '20px 20px 0 0' : '12px',
        padding: isMobile ? '20px' : '24px',
        width: isMobile ? '100%' : '90%',
        maxWidth: isMobile ? '100vw' : '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: isMobile ? '0 -4px 6px rgba(0,0,0,0.1)' : '0 4px 6px rgba(0,0,0,0.1)',
        boxSizing: 'border-box',
        position: 'relative',
        overflowX: 'hidden'
      }}
      onClick={(e) => e.stopPropagation()}
      >
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
                  fontSize: isMobile ? '16px' : '14px',
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
                  fontSize: isMobile ? '16px' : '14px',
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
                  fontSize: isMobile ? '16px' : '14px',
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

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '20px' }}>
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
                  fontSize: isMobile ? '16px' : '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
                Date Booked{(() => {
                  const selectedServiceType = serviceTypes.find(st => st.id === formData.serviceTypeId);
                  return selectedServiceType?.tracksInFunnel ? ' *' : '';
                })()}
              </label>
              {(() => {
                const selectedServiceType = serviceTypes.find(st => st.id === formData.serviceTypeId);
                if (selectedServiceType?.tracksInFunnel) {
                  return (
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '0', marginBottom: '4px' }}>
                      Required when service type tracks in Funnel
                    </p>
                  );
                }
                return null;
              })()}
              <input
                type="date"
                value={formData.dateBooked}
                onChange={(e) => setFormData({ ...formData, dateBooked: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: isMobile ? '16px' : '14px',
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
                  fontSize: isMobile ? '16px' : '14px',
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
              onChange={(e) => {
                const value = e.target.value;
                // Allow empty string for better mobile editing experience
                setFormData({ ...formData, bookedRevenue: value });
              }}
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
                Payment Schedule (For Cash Tracking)
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
              Add expected payments to forecast when Cash will be received. Payment dates are entered as Month and Year only.
            </p>

            {scheduledPayments.map((payment, index) => {
              const { month, year } = parseMonthYear(payment.expectedDate);
              const currentYear = new Date().getFullYear();
              // Show years from 2 years ago to 8 years in the future (10 year range)
              const years = Array.from({ length: 11 }, (_, i) => currentYear - 2 + i);
              
              return (
                <div key={index} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr 1fr 1fr 50px' : '2fr 1fr 1fr 80px',
                  gap: '8px',
                  marginBottom: '8px',
                  padding: '8px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px'
                }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Amount ($)"
                    value={payment.amountInput ?? (payment.amount ? (payment.amount / 100).toFixed(2) : '')}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        const numValue = value === '' ? 0 : parseFloat(value);
                        const cents = value === '' || Number.isNaN(numValue) ? 0 : Math.round(numValue * 100);
                        handleUpdatePayment(index, { amountInput: value, amount: cents, amountCents: cents });
                      }
                    }}
                    onBlur={() => {
                      if (payment.amountInput === undefined) return;
                      const numValue = payment.amountInput === '' ? 0 : parseFloat(payment.amountInput);
                      if (Number.isNaN(numValue)) return;
                      const cents = Math.round(numValue * 100);
                      handleUpdatePayment(index, { amountInput: (cents / 100).toFixed(2), amount: cents, amountCents: cents });
                    }}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: isMobile ? '16px' : '14px',
                      minWidth: isMobile ? '80px' : 'auto'
                    }}
                  />
                  <select
                    value={month}
                    onChange={(e) => {
                      const newDate = combineMonthYear(e.target.value, year || currentYear.toString());
                      handleUpdatePayment(index, { expectedDate: newDate });
                    }}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: isMobile ? '16px' : '14px'
                    }}
                  >
                    <option value="">Month</option>
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
                    value={year}
                    onChange={(e) => {
                      const newDate = combineMonthYear(month || '01', e.target.value);
                      handleUpdatePayment(index, { expectedDate: newDate });
                    }}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: isMobile ? '16px' : '14px'
                    }}
                  >
                    <option value="">Year</option>
                    {years.map(y => (
                      <option key={y} value={y.toString()}>{y}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemovePayment(index)}
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}

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
