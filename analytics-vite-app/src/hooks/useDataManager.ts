import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UnifiedDataService } from '../services/unifiedDataService';
import type { FunnelData, Booking, Payment, ServiceType, LeadSource, AdSource, AdCampaign } from '../types';

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
  const [adSources, setAdSources] = useState<AdSource[]>([]);
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>([]);

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
      
      const [funnelDataResult, bookingsResult, paymentsResult, serviceTypesResult, leadSourcesResult, adSourcesResult, adCampaignsResult] = await Promise.all([
        UnifiedDataService.getFunnelData(user.id, new Date().getFullYear()),
        UnifiedDataService.getBookings(user.id),
        UnifiedDataService.getPayments(user.id),
        UnifiedDataService.getServiceTypes(user.id),
        UnifiedDataService.getLeadSources(user.id),
        UnifiedDataService.getAdSources(user.id),
        UnifiedDataService.getAdCampaigns(user.id)
      ]);

      console.log('All data loaded successfully:', {
        funnelData: funnelDataResult.length,
        bookings: bookingsResult.length,
        payments: paymentsResult.length,
        serviceTypes: serviceTypesResult.length,
        leadSources: leadSourcesResult.length,
        adSources: adSourcesResult.length,
        adCampaigns: adCampaignsResult.length
      });

      setFunnelData(funnelDataResult);
      setBookings(bookingsResult);
      setPayments(paymentsResult);
      setServiceTypes(serviceTypesResult);
      setLeadSources(leadSourcesResult);
      setAdSources(adSourcesResult);
      setAdCampaigns(adCampaignsResult);
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
    
    console.log('useDataManager.saveFunnelData called with:', funnelData);
    
    try {
      const success = await UnifiedDataService.saveFunnelData(user.id, funnelData);
      console.log('Save success:', success);
      
      if (success) {
        setFunnelData(prev => {
          console.log('Previous funnelData:', prev);
          const existing = prev.find(f => f.year === funnelData.year && f.month === funnelData.month);
          console.log('Existing found:', existing);
          
          const updated = existing
            ? prev.map(f => f.year === funnelData.year && f.month === funnelData.month ? funnelData : f)
            : [...prev, funnelData];
          
          console.log('Updated funnelData:', updated);
          return updated;
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

  const toggleServiceTypeFunnelTracking = useCallback(async (id: string) => {
    if (!user?.id) return false;
    
    // Find the current service type to get its current tracksInFunnel value
    const serviceType = serviceTypes.find(st => st.id === id);
    if (!serviceType) return false;
    
    const newValue = !serviceType.tracksInFunnel;
    
    try {
      const success = await UnifiedDataService.updateServiceTypeFunnelTracking(user.id, id, newValue);
      if (success) {
        setServiceTypes(prev => prev.map(st => 
          st.id === id ? { ...st, tracksInFunnel: newValue } : st
        ));
      }
      return success;
    } catch (err) {
      console.error('Error toggling service type funnel tracking:', err);
      return false;
    }
  }, [user?.id, serviceTypes]);

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

  // AdSource operations
  const createAdSource = useCallback(async (adSourceData: Omit<AdSource, 'id' | 'createdAt'>) => {
    if (!user?.id) return null;
    
    try {
      const adSource = await UnifiedDataService.createAdSource(user.id, adSourceData);
      if (adSource) {
        setAdSources(prev => [...prev, adSource]);
      }
      return adSource;
    } catch (err) {
      console.error('Error creating ad source:', err);
      return null;
    }
  }, [user?.id]);

  const updateAdSource = useCallback(async (id: string, updates: Partial<AdSource>) => {
    if (!user?.id) return false;
    
    try {
      const success = await UnifiedDataService.updateAdSource(user.id, id, updates);
      if (success) {
        setAdSources(prev => prev.map(adSource => 
          adSource.id === id ? { ...adSource, ...updates } : adSource
        ));
      }
      return success;
    } catch (err) {
      console.error('Error updating ad source:', err);
      return false;
    }
  }, [user?.id]);

  const deleteAdSource = useCallback(async (id: string) => {
    if (!user?.id) return false;
    
    try {
      const success = await UnifiedDataService.deleteAdSource(user.id, id);
      if (success) {
        setAdSources(prev => prev.filter(adSource => adSource.id !== id));
        // Also remove associated campaigns
        setAdCampaigns(prev => prev.filter(campaign => campaign.adSourceId !== id));
      }
      return success;
    } catch (err) {
      console.error('Error deleting ad source:', err);
      return false;
    }
  }, [user?.id]);

  // AdCampaign operations
  const createAdCampaign = useCallback(async (adCampaignData: Omit<AdCampaign, 'id' | 'createdAt'>) => {
    if (!user?.id) return null;
    
    try {
      const adCampaign = await UnifiedDataService.createAdCampaign(user.id, adCampaignData);
      if (adCampaign) {
        setAdCampaigns(prev => [...prev, adCampaign]);
      }
      return adCampaign;
    } catch (err) {
      console.error('Error creating ad campaign:', err);
      return null;
    }
  }, [user?.id]);

  const updateAdCampaign = useCallback(async (id: string, updates: Partial<AdCampaign>) => {
    if (!user?.id) return false;
    
    try {
      const success = await UnifiedDataService.updateAdCampaign(user.id, id, updates);
      if (success) {
        setAdCampaigns(prev => prev.map(adCampaign => 
          adCampaign.id === id ? { ...adCampaign, ...updates } : adCampaign
        ));
      }
      return success;
    } catch (err) {
      console.error('Error updating ad campaign:', err);
      return false;
    }
  }, [user?.id]);

  const deleteAdCampaign = useCallback(async (id: string) => {
    if (!user?.id) return false;
    
    try {
      const success = await UnifiedDataService.deleteAdCampaign(user.id, id);
      if (success) {
        setAdCampaigns(prev => prev.filter(adCampaign => adCampaign.id !== id));
      }
      return success;
    } catch (err) {
      console.error('Error deleting ad campaign:', err);
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
    adSources,
    adCampaigns,
    
    // Actions
    loadAllData,
    
    // Funnel operations
    saveFunnelData,
    
    // Service type operations
    createServiceType,
    updateServiceType,
    toggleServiceTypeFunnelTracking,
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
    
    // AdSource operations
    createAdSource,
    updateAdSource,
    deleteAdSource,
    
    // AdCampaign operations
    createAdCampaign,
    updateAdCampaign,
    deleteAdCampaign,
  };
}
