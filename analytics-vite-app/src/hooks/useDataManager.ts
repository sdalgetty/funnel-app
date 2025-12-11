import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UnifiedDataService } from '../services/unifiedDataService';
import { AdminService } from '../services/adminService';
import type { FunnelData, Booking, Payment, ServiceType, LeadSource, AdCampaign, ForecastModel, DataManager } from '../types';
import { logger } from '../utils/logger';

export function useDataManager(): DataManager {
  const { user, effectiveUserId, isViewOnly, isAdmin, impersonatingUserId, impersonationSessionId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>([]);
  const [forecastModels, setForecastModels] = useState<ForecastModel[]>([]);

  // Load all data on mount or user change
  const loadAllData = useCallback(async () => {
    // Use effectiveUserId (owner's ID when viewing as guest, otherwise user's ID)
    const userId = effectiveUserId || user?.id;
    
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.debug('Loading all data for user', { userId, isViewOnly });
      
      const [funnelDataResult, bookingsResult, paymentsResult, serviceTypesResult, leadSourcesResult, adCampaignsResult, forecastModelsResult] = await Promise.all([
        UnifiedDataService.getAllFunnelData(userId),
        UnifiedDataService.getBookings(userId),
        UnifiedDataService.getPayments(userId),
        UnifiedDataService.getServiceTypes(userId),
        UnifiedDataService.getLeadSources(userId),
        UnifiedDataService.getAdCampaigns(userId),
        UnifiedDataService.getForecastModels(userId)
      ]);

      logger.debug('All data loaded successfully', {
        funnelData: funnelDataResult.length,
        bookings: bookingsResult.length,
        payments: paymentsResult.length,
        serviceTypes: serviceTypesResult.length,
        leadSources: leadSourcesResult.length,
        adCampaigns: adCampaignsResult.length,
        forecastModels: forecastModelsResult.length
      });

      setFunnelData(funnelDataResult);
      setBookings(bookingsResult);
      setPayments(paymentsResult);
      setServiceTypes(serviceTypesResult);
      setLeadSources(leadSourcesResult);
      setAdCampaigns(adCampaignsResult);
      setForecastModels(forecastModelsResult);
    } catch (err) {
      logger.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId, user?.id, isViewOnly]);

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Funnel data operations
  const saveFunnelData = useCallback(async (funnelData: FunnelData) => {
    const userId = effectiveUserId || user?.id;
    if (!userId) return false;
    
    logger.debug('useDataManager.saveFunnelData called', { funnelId: funnelData.id, year: funnelData.year, month: funnelData.month });
    
    try {
      const success = await UnifiedDataService.saveFunnelData(userId, funnelData, isViewOnly);
      
      // Log action if impersonating
      if (isAdmin && impersonatingUserId) {
        await AdminService.logAction('edit_data', impersonatingUserId, {
          action: 'save_funnel_data',
          funnel_id: funnelData.id,
          year: funnelData.year,
          month: funnelData.month,
        }, impersonationSessionId || null);
      }
      
      if (success) {
        setFunnelData(prev => {
          const existing = prev.find(f => f.year === funnelData.year && f.month === funnelData.month);
          return existing
            ? prev.map(f => f.year === funnelData.year && f.month === funnelData.month ? funnelData : f)
            : [...prev, funnelData];
        });
      }
      return success;
    } catch (err) {
      logger.error('Error saving funnel data:', err);
      return false;
    }
  }, [effectiveUserId, user?.id, isViewOnly]);

  // Service type operations
  const createServiceType = useCallback(async (name: string) => {
    const userId = effectiveUserId || user?.id;
    if (!userId) return null;
    
    try {
      const serviceType = await UnifiedDataService.createServiceType(userId, name, isViewOnly);
      if (serviceType) {
        setServiceTypes(prev => [...prev, serviceType]);
      }
      return serviceType;
    } catch (err) {
      logger.error('Error creating service type:', err);
      return null;
    }
  }, [effectiveUserId, user?.id, isViewOnly]);

  const updateServiceType = useCallback(async (id: string, name: string) => {
    const userId = effectiveUserId || user?.id;
    if (!userId) return false;
    
    try {
      const success = await UnifiedDataService.updateServiceType(userId, id, name, isViewOnly);
      if (success) {
        setServiceTypes(prev => prev.map(st => st.id === id ? { ...st, name } : st));
      }
      return success;
    } catch (err) {
      logger.error('Error updating service type:', err);
      return false;
    }
  }, [effectiveUserId, user?.id, isViewOnly]);

  const toggleServiceTypeFunnelTracking = useCallback(async (id: string) => {
    const userId = effectiveUserId || user?.id;
    if (!userId) return false;
    
    // Find the current service type to get its current tracksInFunnel value
    const serviceType = serviceTypes.find(st => st.id === id);
    if (!serviceType) return false;
    
    const newValue = !serviceType.tracksInFunnel;
    
    try {
      const success = await UnifiedDataService.updateServiceTypeFunnelTracking(userId, id, newValue, isViewOnly);
      if (success) {
        setServiceTypes(prev => prev.map(st => 
          st.id === id ? { ...st, tracksInFunnel: newValue } : st
        ));
      }
      return success;
    } catch (err) {
      logger.error('Error toggling service type funnel tracking:', err);
      return false;
    }
  }, [effectiveUserId, user?.id, isViewOnly, serviceTypes]);

  const deleteServiceType = useCallback(async (id: string) => {
    const userId = effectiveUserId || user?.id;
    if (!userId) return false;
    
    try {
      const success = await UnifiedDataService.deleteServiceType(userId, id, isViewOnly);
      if (success) {
        setServiceTypes(prev => prev.filter(st => st.id !== id));
        // Also remove from bookings that use this service type
        setBookings(prev => prev.map(booking => 
          booking.serviceTypeId === id ? { ...booking, serviceTypeId: '' } : booking
        ));
      }
      return success;
    } catch (err) {
      logger.error('Error deleting service type:', err);
      return false;
    }
  }, [effectiveUserId, user?.id, isViewOnly]);

  // Lead source operations
  const createLeadSource = useCallback(async (name: string) => {
    const userId = effectiveUserId || user?.id;
    if (!userId) return null;
    
    try {
      const leadSource = await UnifiedDataService.createLeadSource(userId, name, isViewOnly);
      if (leadSource) {
        setLeadSources(prev => [...prev, leadSource]);
      }
      return leadSource;
    } catch (err) {
      logger.error('Error creating lead source:', err);
      return null;
    }
  }, [effectiveUserId, user?.id, isViewOnly]);

  const updateLeadSource = useCallback(async (id: string, name: string) => {
    const userId = effectiveUserId || user?.id;
    if (!userId) return false;
    
    try {
      const success = await UnifiedDataService.updateLeadSource(userId, id, name, isViewOnly);
      if (success) {
        setLeadSources(prev => prev.map(ls => ls.id === id ? { ...ls, name } : ls));
      }
      return success;
    } catch (err) {
      logger.error('Error updating lead source:', err);
      return false;
    }
  }, [effectiveUserId, user?.id, isViewOnly]);

  const deleteLeadSource = useCallback(async (id: string) => {
    const userId = effectiveUserId || user?.id;
    if (!userId) return false;
    
    try {
      const success = await UnifiedDataService.deleteLeadSource(userId, id, isViewOnly);
      if (success) {
        setLeadSources(prev => prev.filter(ls => ls.id !== id));
        // Also remove from bookings that use this lead source
        setBookings(prev => prev.map(booking => 
          booking.leadSourceId === id ? { ...booking, leadSourceId: '' } : booking
        ));
      }
      return success;
    } catch (err) {
      logger.error('Error deleting lead source:', err);
      return false;
    }
  }, [effectiveUserId, user?.id, isViewOnly]);

  // Booking operations
  const createBooking = useCallback(async (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
    const userId = effectiveUserId || user?.id;
    if (!userId) return null;
    
    try {
      const booking = await UnifiedDataService.createBooking(userId, bookingData, isViewOnly);
      
      // Log action if impersonating
      if (isAdmin && impersonatingUserId && booking) {
        await AdminService.logAction('edit_data', impersonatingUserId, {
          action: 'create_booking',
          booking_id: booking.id,
          project_name: bookingData.projectName,
        }, impersonationSessionId || null);
      }
      
      if (booking) {
        setBookings(prev => [...prev, booking]);
      }
      return booking;
    } catch (err) {
      logger.error('Error creating booking:', err);
      return null;
    }
  }, [effectiveUserId, user?.id, isViewOnly]);

  const updateBooking = useCallback(async (id: string, updates: Partial<Booking>) => {
    const userId = effectiveUserId || user?.id;
    if (!userId) return false;
    
    try {
      const success = await UnifiedDataService.updateBooking(userId, id, updates, isViewOnly);
      
      // Log action if impersonating
      if (isAdmin && impersonatingUserId && success) {
        await AdminService.logAction('edit_data', impersonatingUserId, {
          action: 'update_booking',
          booking_id: id,
          updates: Object.keys(updates),
        }, impersonationSessionId || null);
      }
      
      if (success) {
        setBookings(prev => prev.map(booking => 
          booking.id === id ? { ...booking, ...updates } : booking
        ));
      }
      return success;
    } catch (err) {
      logger.error('Error updating booking:', err);
      return false;
    }
  }, [effectiveUserId, user?.id, isViewOnly]);

  const deleteBooking = useCallback(async (id: string) => {
    const userId = effectiveUserId || user?.id;
    if (!userId) return false;
    
    try {
      const success = await UnifiedDataService.deleteBooking(userId, id, isViewOnly);
      
      // Log action if impersonating
      if (isAdmin && impersonatingUserId && success) {
        await AdminService.logAction('edit_data', impersonatingUserId, {
          action: 'delete_booking',
          booking_id: id,
        }, impersonationSessionId || null);
      }
      
      if (success) {
        setBookings(prev => prev.filter(booking => booking.id !== id));
        // Also remove associated payments
        setPayments(prev => prev.filter(payment => payment.bookingId !== id));
      }
      return success;
    } catch (err) {
      logger.error('Error deleting booking:', err);
      return false;
    }
  }, [effectiveUserId, user?.id, isViewOnly]);

  // Payment operations
  const createPayment = useCallback(async (paymentData: Omit<Payment, 'id' | 'createdAt'>) => {
    const userId = effectiveUserId || user?.id;
    if (!userId) return null;
    
    try {
      const payment = await UnifiedDataService.createPayment(userId, paymentData, isViewOnly);
      if (payment) {
        setPayments(prev => [...prev, payment]);
      }
      return payment;
    } catch (err) {
      logger.error('Error creating payment:', err);
      return null;
    }
  }, [effectiveUserId, user?.id, isViewOnly]);

  const updatePayment = useCallback(async (id: string, updates: Partial<Payment>) => {
    const userId = effectiveUserId || user?.id;
    if (!userId) return false;
    
    try {
      const success = await UnifiedDataService.updatePayment(userId, id, updates, isViewOnly);
      if (success) {
        setPayments(prev => prev.map(payment => 
          payment.id === id ? { ...payment, ...updates } : payment
        ));
      }
      return success;
    } catch (err) {
      logger.error('Error updating payment:', err);
      return false;
    }
  }, [effectiveUserId, user?.id, isViewOnly]);

  const deletePayment = useCallback(async (id: string) => {
    const userId = effectiveUserId || user?.id;
    if (!userId) return false;
    
    try {
      const success = await UnifiedDataService.deletePayment(userId, id, isViewOnly);
      if (success) {
        setPayments(prev => prev.filter(payment => payment.id !== id));
      }
      return success;
    } catch (err) {
      logger.error('Error deleting payment:', err);
      return false;
    }
  }, [effectiveUserId, user?.id, isViewOnly]);

  // AdCampaign operations (AdSource removed - campaigns now link directly to LeadSource)
  const createAdCampaign = useCallback(async (adCampaignData: Omit<AdCampaign, 'id' | 'createdAt'>) => {
    const userId = effectiveUserId || user?.id;
    if (!userId) return null;
    
    try {
      const adCampaign = await UnifiedDataService.createAdCampaign(userId, adCampaignData, isViewOnly);
      if (adCampaign) {
        setAdCampaigns(prev => [...prev, adCampaign]);
      }
      return adCampaign;
    } catch (err) {
      logger.error('Error creating ad campaign:', err);
      return null;
    }
  }, [effectiveUserId, user?.id, isViewOnly]);

  const updateAdCampaign = useCallback(async (id: string, updates: Partial<AdCampaign>) => {
    const userId = effectiveUserId || user?.id;
    if (!userId) return false;
    
    try {
      const success = await UnifiedDataService.updateAdCampaign(userId, id, updates, isViewOnly);
      if (success) {
        setAdCampaigns(prev => prev.map(adCampaign => 
          adCampaign.id === id ? { ...adCampaign, ...updates } : adCampaign
        ));
      }
      return success;
    } catch (err) {
      logger.error('Error updating ad campaign:', err);
      return false;
    }
  }, [effectiveUserId, user?.id, isViewOnly]);

  const deleteAdCampaign = useCallback(async (id: string) => {
    const userId = effectiveUserId || user?.id;
    if (!userId) return false;
    
    try {
      const success = await UnifiedDataService.deleteAdCampaign(userId, id, isViewOnly);
      if (success) {
        setAdCampaigns(prev => prev.filter(adCampaign => adCampaign.id !== id));
      }
      return success;
    } catch (err) {
      logger.error('Error deleting ad campaign:', err);
      return false;
    }
  }, [effectiveUserId, user?.id, isViewOnly]);

  // Forecast Model operations
  const loadForecastModels = useCallback(async () => {
    const userId = effectiveUserId || user?.id;
    if (!userId) return;

    try {
      const models = await UnifiedDataService.getForecastModels(userId);
      setForecastModels(models);
    } catch (err) {
      logger.error('Error loading forecast models:', err);
    }
  }, [effectiveUserId, user?.id]);

  const saveForecastModel = useCallback(async (model: ForecastModel) => {
    const userId = effectiveUserId || user?.id;
    if (!userId) return false;
    
    try {
      const success = await UnifiedDataService.saveForecastModel(userId, model, isViewOnly);
      if (success) {
        // Reload forecast models to get updated data
        await loadForecastModels();
      }
      return success;
    } catch (err) {
      logger.error('Error saving forecast model:', err);
      return false;
    }
  }, [effectiveUserId, user?.id, isViewOnly, loadForecastModels]);

  const deleteForecastModel = useCallback(async (id: string) => {
    const userId = effectiveUserId || user?.id;
    if (!userId) return false;
    
    try {
      const success = await UnifiedDataService.deleteForecastModel(userId, id, isViewOnly);
      if (success) {
        setForecastModels(prev => prev.filter(m => m.id !== id));
      }
      return success;
    } catch (err) {
      logger.error('Error deleting forecast model:', err);
      return false;
    }
  }, [effectiveUserId, user?.id, isViewOnly]);

  return {
    // State
    loading,
    error,
    funnelData,
    bookings,
    payments,
    serviceTypes,
    leadSources,
    adCampaigns,
    forecastModels,
    
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
    
    // AdCampaign operations
    createAdCampaign,
    updateAdCampaign,
    deleteAdCampaign,
    
    // Forecast Model operations
    saveForecastModel,
    deleteForecastModel,
    loadForecastModels,
  };
}