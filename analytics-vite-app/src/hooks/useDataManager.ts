import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UnifiedDataService } from '../services/unifiedDataService';
import type { FunnelData, Booking, Payment, ServiceType, LeadSource } from '../types';

export function useDataManager() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);

  // Load all data on mount or user change
  const loadAllData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Loading all data for user:', user.id);
      
      const [funnelDataResult, bookingsResult, paymentsResult, serviceTypesResult, leadSourcesResult] = await Promise.all([
        UnifiedDataService.getFunnelData(user.id, new Date().getFullYear()),
        UnifiedDataService.getBookings(user.id),
        UnifiedDataService.getPayments(user.id),
        UnifiedDataService.getServiceTypes(user.id),
        UnifiedDataService.getLeadSources(user.id)
      ]);

      console.log('All data loaded successfully:', {
        funnelData: funnelDataResult.length,
        bookings: bookingsResult.length,
        payments: paymentsResult.length,
        serviceTypes: serviceTypesResult.length,
        leadSources: leadSourcesResult.length
      });

      setFunnelData(funnelDataResult);
      setBookings(bookingsResult);
      setPayments(paymentsResult);
      setServiceTypes(serviceTypesResult);
      setLeadSources(leadSourcesResult);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Funnel data operations
  const saveFunnelData = useCallback(async (funnelData: FunnelData) => {
    if (!user?.id) return false;
    
    try {
      const success = await UnifiedDataService.saveFunnelData(user.id, funnelData);
      if (success) {
        setFunnelData(prev => {
          const existing = prev.find(f => f.year === funnelData.year && f.month === funnelData.month);
          if (existing) {
            return prev.map(f => f.year === funnelData.year && f.month === funnelData.month ? funnelData : f);
          } else {
            return [...prev, funnelData];
          }
        });
      }
      return success;
    } catch (err) {
      console.error('Error saving funnel data:', err);
      return false;
    }
  }, [user?.id]);

  // Service type operations
  const createServiceType = useCallback(async (name: string) => {
    if (!user?.id) return null;
    
    try {
      const serviceType = await UnifiedDataService.createServiceType(user.id, name);
      if (serviceType) {
        setServiceTypes(prev => [...prev, serviceType]);
      }
      return serviceType;
    } catch (err) {
      console.error('Error creating service type:', err);
      return null;
    }
  }, [user?.id]);

  const updateServiceType = useCallback(async (id: string, name: string) => {
    if (!user?.id) return false;
    
    try {
      const success = await UnifiedDataService.updateServiceType(user.id, id, name);
      if (success) {
        setServiceTypes(prev => prev.map(st => st.id === id ? { ...st, name } : st));
      }
      return success;
    } catch (err) {
      console.error('Error updating service type:', err);
      return false;
    }
  }, [user?.id]);

  const deleteServiceType = useCallback(async (id: string) => {
    if (!user?.id) return false;
    
    try {
      const success = await UnifiedDataService.deleteServiceType(user.id, id);
      if (success) {
        setServiceTypes(prev => prev.filter(st => st.id !== id));
        // Also remove from bookings that use this service type
        setBookings(prev => prev.map(booking => 
          booking.serviceTypeId === id ? { ...booking, serviceTypeId: '' } : booking
        ));
      }
      return success;
    } catch (err) {
      console.error('Error deleting service type:', err);
      return false;
    }
  }, [user?.id]);

  // Lead source operations
  const createLeadSource = useCallback(async (name: string) => {
    if (!user?.id) return null;
    
    try {
      const leadSource = await UnifiedDataService.createLeadSource(user.id, name);
      if (leadSource) {
        setLeadSources(prev => [...prev, leadSource]);
      }
      return leadSource;
    } catch (err) {
      console.error('Error creating lead source:', err);
      return null;
    }
  }, [user?.id]);

  const updateLeadSource = useCallback(async (id: string, name: string) => {
    if (!user?.id) return false;
    
    try {
      const success = await UnifiedDataService.updateLeadSource(user.id, id, name);
      if (success) {
        setLeadSources(prev => prev.map(ls => ls.id === id ? { ...ls, name } : ls));
      }
      return success;
    } catch (err) {
      console.error('Error updating lead source:', err);
      return false;
    }
  }, [user?.id]);

  const deleteLeadSource = useCallback(async (id: string) => {
    if (!user?.id) return false;
    
    try {
      const success = await UnifiedDataService.deleteLeadSource(user.id, id);
      if (success) {
        setLeadSources(prev => prev.filter(ls => ls.id !== id));
        // Also remove from bookings that use this lead source
        setBookings(prev => prev.map(booking => 
          booking.leadSourceId === id ? { ...booking, leadSourceId: '' } : booking
        ));
      }
      return success;
    } catch (err) {
      console.error('Error deleting lead source:', err);
      return false;
    }
  }, [user?.id]);

  // Booking operations
  const createBooking = useCallback(async (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
    if (!user?.id) return null;
    
    try {
      const booking = await UnifiedDataService.createBooking(user.id, bookingData);
      if (booking) {
        setBookings(prev => [...prev, booking]);
      }
      return booking;
    } catch (err) {
      console.error('Error creating booking:', err);
      return null;
    }
  }, [user?.id]);

  const updateBooking = useCallback(async (id: string, updates: Partial<Booking>) => {
    if (!user?.id) return false;
    
    try {
      const success = await UnifiedDataService.updateBooking(user.id, id, updates);
      if (success) {
        setBookings(prev => prev.map(booking => 
          booking.id === id ? { ...booking, ...updates } : booking
        ));
      }
      return success;
    } catch (err) {
      console.error('Error updating booking:', err);
      return false;
    }
  }, [user?.id]);

  const deleteBooking = useCallback(async (id: string) => {
    if (!user?.id) return false;
    
    try {
      const success = await UnifiedDataService.deleteBooking(user.id, id);
      if (success) {
        setBookings(prev => prev.filter(booking => booking.id !== id));
        // Also remove associated payments
        setPayments(prev => prev.filter(payment => payment.bookingId !== id));
      }
      return success;
    } catch (err) {
      console.error('Error deleting booking:', err);
      return false;
    }
  }, [user?.id]);

  // Payment operations
  const createPayment = useCallback(async (paymentData: Omit<Payment, 'id' | 'createdAt'>) => {
    if (!user?.id) return null;
    
    try {
      const payment = await UnifiedDataService.createPayment(user.id, paymentData);
      if (payment) {
        setPayments(prev => [...prev, payment]);
      }
      return payment;
    } catch (err) {
      console.error('Error creating payment:', err);
      return null;
    }
  }, [user?.id]);

  const updatePayment = useCallback(async (id: string, updates: Partial<Payment>) => {
    if (!user?.id) return false;
    
    try {
      const success = await UnifiedDataService.updatePayment(user.id, id, updates);
      if (success) {
        setPayments(prev => prev.map(payment => 
          payment.id === id ? { ...payment, ...updates } : payment
        ));
      }
      return success;
    } catch (err) {
      console.error('Error updating payment:', err);
      return false;
    }
  }, [user?.id]);

  const deletePayment = useCallback(async (id: string) => {
    if (!user?.id) return false;
    
    try {
      const success = await UnifiedDataService.deletePayment(user.id, id);
      if (success) {
        setPayments(prev => prev.filter(payment => payment.id !== id));
      }
      return success;
    } catch (err) {
      console.error('Error deleting payment:', err);
      return false;
    }
  }, [user?.id]);

  return {
    // State
    loading,
    error,
    funnelData,
    bookings,
    payments,
    serviceTypes,
    leadSources,
    
    // Actions
    loadAllData,
    
    // Funnel operations
    saveFunnelData,
    
    // Service type operations
    createServiceType,
    updateServiceType,
    deleteServiceType,
    
    // Lead source operations
    createLeadSource,
    updateLeadSource,
    deleteLeadSource,
    
    // Booking operations
    createBooking,
    updateBooking,
    deleteBooking,
    
    // Payment operations
    createPayment,
    updatePayment,
    deletePayment,
  };
}
