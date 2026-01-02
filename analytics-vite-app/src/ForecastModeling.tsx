import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Target, TrendingUp, DollarSign, Calendar, CheckCircle, X } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { UnifiedDataService } from './services/unifiedDataService';
import { calculateCurrentYearRevenueByServiceType } from './services/revenueCalculationService';
import { logger } from './utils/logger';
import { toUSD, formatNumber } from './utils/formatters';
import type { ServiceType, Booking, Payment, ForecastModel } from './types';

interface ForecastModelingProps {
  serviceTypes: ServiceType[];
  setServiceTypes: (types: ServiceType[]) => void;
  bookings: Booking[];
  payments: Payment[];
  showTrackerOnly?: boolean;
  hideTracker?: boolean;
}

const ForecastModeling: React.FC<ForecastModelingProps> = ({ 
  serviceTypes, 
  setServiceTypes, 
  bookings, 
  payments,
  showTrackerOnly = false,
  hideTracker = false
}) => {
  const { user, effectiveUserId, isViewOnly } = useAuth();
  
  // Track if component has mounted to avoid false warnings during initial render
  const hasMountedRef = useRef(false);
  const previousDataLengthsRef = useRef({ payments: 0, bookings: 0, serviceTypes: 0 });
  
  // Debug: Log props received
  logger.debug('ForecastModeling props', { 
    bookingsCount: bookings?.length || 0, 
    paymentsCount: payments?.length || 0,
    serviceTypesCount: serviceTypes?.length || 0,
    showTrackerOnly 
  });
  
  const [models, setModels] = useState<ForecastModel[]>([]);
  const [activeModel, setActiveModel] = useState<ForecastModel | null>(null);
  const [viewingModel, setViewingModel] = useState<ForecastModel | null>(null); // Model being viewed (may not be active)
  const [showModelModal, setShowModelModal] = useState(false);
  const [editingModel, setEditingModel] = useState<ForecastModel | null>(null);
  const [loadingModels, setLoadingModels] = useState(true);

  // Mark component as mounted after initial render
  useEffect(() => {
    hasMountedRef.current = true;
  }, []);

  // Load models from database on mount
  useEffect(() => {
    const loadModels = async () => {
      // Use effectiveUserId (owner's ID when viewing as guest, otherwise user's ID)
      const userId = effectiveUserId || user?.id;
      if (!userId) {
        setLoadingModels(false);
        return;
      }

      try {
        setLoadingModels(true);
        const loadedModels = await UnifiedDataService.getForecastModels(userId);
        
        if (loadedModels.length > 0) {
          setModels(loadedModels);
          const active = loadedModels.find(m => m.isActive) || loadedModels[0];
          setActiveModel(active);
          setViewingModel(active); // Default to viewing the active model
        } else {
          // No models exist - start with empty state
          setModels([]);
          setActiveModel(null);
          setViewingModel(null);
        }
      } catch (error) {
        logger.error('Error loading forecast models:', error);
        // On error, start with empty state
        setModels([]);
        setActiveModel(null);
        setViewingModel(null);
      } finally {
        setLoadingModels(false);
      }
    };

    loadModels();
  }, [user?.id]);


  // Calculate year progress
  const yearProgress = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    const totalDays = Math.ceil((endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    return Math.round((daysElapsed / totalDays) * 100);
  }, []);

  // Calculate actual revenue by service type for current calendar year
  // Using dedicated revenue calculation service for reliability
  const actualRevenueByServiceType = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const revenueByServiceType: { [key: string]: number } = {};

    logger.debug('Forecast Tracker - Calculating actual revenue', {
      currentYear,
      paymentsCount: payments.length,
      bookingsCount: bookings.length,
      serviceTypesCount: serviceTypes.length
    });
    
    // Track previous data lengths to detect if data was loaded then disappeared
    const previousLengths = previousDataLengthsRef.current;
    const hadDataBefore = previousLengths.payments > 0 || previousLengths.bookings > 0 || previousLengths.serviceTypes > 0;
    const hasDataNow = payments.length > 0 || bookings.length > 0 || serviceTypes.length > 0;
    
    // Update refs
    previousDataLengthsRef.current = {
      payments: payments.length,
      bookings: bookings.length,
      serviceTypes: serviceTypes.length
    };
    
    // Early return if no data
    if (payments.length === 0 || bookings.length === 0 || serviceTypes.length === 0) {
      // Only warn if:
      // 1. Component has mounted (avoid initial render false positive)
      // 2. Data was previously loaded but now missing (actual problem)
      // 3. Or if we've been mounted for a while and still no data (likely missing)
      if (hasMountedRef.current && (hadDataBefore || (hasMountedRef.current && !hasDataNow))) {
        logger.warn('Missing data for forecast calculation', {
          payments: payments.length,
          bookings: bookings.length,
          serviceTypes: serviceTypes.length,
          hadDataBefore
        });
      } else {
        // Just debug log during initial load
        logger.debug('Waiting for data to load', {
          payments: payments.length,
          bookings: bookings.length,
          serviceTypes: serviceTypes.length
        });
      }
      return revenueByServiceType;
    }
    
    // Use the dedicated revenue calculation service
    const revenueResults = calculateCurrentYearRevenueByServiceType(
      payments,
      bookings,
      serviceTypes,
      currentYear
    );
    
    // Convert to the expected format (serviceTypeId -> cents)
    revenueResults.forEach(result => {
      revenueByServiceType[result.serviceTypeId] = result.totalRevenueCents;
    });
    
    logger.debug('Final revenueByServiceType from service', { revenueByServiceType });
    return revenueByServiceType;
  }, [bookings, payments, serviceTypes]);

  // Calculate performance metrics for the model being viewed (viewingModel or activeModel)
  const displayModel = viewingModel || activeModel;
  const performanceMetrics = useMemo(() => {
    if (!displayModel) return [];

    logger.debug('Performance metrics calculation', {
      serviceTypesCount: displayModel.serviceTypes.length,
      revenueByServiceTypeCount: Object.keys(actualRevenueByServiceType).length
    });

    const metrics = displayModel.serviceTypes.map(modelService => {
      const serviceType = serviceTypes.find(st => st.id === modelService.serviceTypeId);
      const actualRevenue = actualRevenueByServiceType[modelService.serviceTypeId] || 0;
      const forecastGoal = modelService.totalForecast;
      const remaining = forecastGoal - actualRevenue;
      const percentOfPlan = forecastGoal > 0 ? Math.round((actualRevenue / forecastGoal) * 100) : 0;
      const pacingDelta = percentOfPlan - yearProgress;

      logger.debug(`Metric for ${serviceType?.name || 'Unknown'}`, {
        serviceTypeId: modelService.serviceTypeId,
        actualRevenue,
        actualRevenueDollars: `$${(actualRevenue / 100).toFixed(2)}`,
        forecastGoal,
        remaining,
        percentOfPlan
      });

      return {
        serviceTypeId: modelService.serviceTypeId,
        serviceTypeName: serviceType?.name || 'Unknown',
        forecastGoal,
        actualRevenue,
        remaining,
        percentOfPlan,
        pacingDelta,
      };
    });
    
    const totalActual = metrics.reduce((sum, m) => sum + m.actualRevenue, 0);
    logger.debug('Final performance metrics', {
      metricsCount: metrics.length,
      totalActualRevenue: `$${(totalActual / 100).toFixed(2)}`
    });
    
    return metrics;
  }, [displayModel, serviceTypes, actualRevenueByServiceType, yearProgress]);

  // Helper functions
  const toUSD = (cents: number) => (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
  const formatNumber = (num: number) => num.toLocaleString();

  // Model management functions
  const createModel = async (modelData: Omit<ForecastModel, 'id' | 'createdAt' | 'updatedAt'>) => {
    logger.debug('createModel called', { modelData });
    if (!user?.id) {
      logger.error('createModel: No user ID');
      return;
    }
    
    const newModel: ForecastModel = {
      ...modelData,
      id: `model_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    logger.debug('createModel: Saving new model', { modelId: newModel.id });
    // Save to database and get the saved model with real ID
    const userId = effectiveUserId || user?.id;
    const savedModel = await UnifiedDataService.saveForecastModel(userId, newModel, isViewOnly);
    logger.debug('createModel: Save result', { saved: !!savedModel });
    
    if (savedModel) {
      setModels(prev => [...prev, savedModel]);
      if (savedModel.isActive) {
        setActiveModel(savedModel);
        setViewingModel(savedModel); // View the newly activated model
      }
    } else {
      logger.error('createModel: Save failed, using local state');
      // Fallback to local state if save fails
    setModels(prev => [...prev, newModel]);
    }
  };

  const updateModel = async (modelData: ForecastModel) => {
    if (!user?.id) return;
    
    const updatedModel = { ...modelData, updatedAt: new Date().toISOString() };
    
    // Save to database
    const userId = effectiveUserId || user?.id;
    const savedModel = await UnifiedDataService.saveForecastModel(userId, updatedModel, isViewOnly);
    
    if (savedModel) {
    setModels(prev => prev.map(model => 
        model.id === modelData.id ? savedModel : model
    ));
    if (activeModel?.id === modelData.id) {
        setActiveModel(savedModel);
      }
      if (viewingModel?.id === modelData.id) {
        setViewingModel(savedModel); // Update viewing model if it was edited
      }
    } else {
      // Fallback to local update if save fails
      setModels(prev => prev.map(model => 
        model.id === modelData.id ? updatedModel : model
      ));
      if (activeModel?.id === modelData.id) {
        setActiveModel(updatedModel);
      }
      if (viewingModel?.id === modelData.id) {
        setViewingModel(updatedModel); // Update viewing model if it was edited
      }
    }
  };

  const deleteModel = async (modelId: string) => {
    if (!user?.id) return;
    
    // Delete from database first
    if (!modelId.startsWith('model_')) {
      const userId = effectiveUserId || user?.id;
      await UnifiedDataService.deleteForecastModel(userId, modelId, isViewOnly);
    }
    
    setModels(prev => prev.filter(model => model.id !== modelId));
    if (activeModel?.id === modelId) {
      const remainingModels = models.filter(model => model.id !== modelId);
      const newActiveModel = remainingModels.length > 0 ? remainingModels[0] : null;
      setActiveModel(newActiveModel);
      setViewingModel(newActiveModel); // View the new active model
    } else if (viewingModel?.id === modelId) {
      // If viewing a non-active model that gets deleted, go back to active model
      setViewingModel(activeModel);
    }
  };

  const activateModel = async (modelId: string) => {
    if (!user?.id) return;
    
    const updatedModels = models.map(model => ({
      ...model,
      isActive: model.id === modelId,
      updatedAt: new Date().toISOString()
    }));
    
      // Save all models to update isActive flags
      const userId = effectiveUserId || user?.id;
      const savedModels = await Promise.all(
        updatedModels.map(m => UnifiedDataService.saveForecastModel(userId, m, isViewOnly))
      );
    
    // Update state with saved models (filter out nulls)
    const validModels = savedModels.filter((m): m is ForecastModel => m !== null);
    if (validModels.length > 0) {
      setModels(validModels);
      const activeModelData = validModels.find(m => m.id === modelId);
      if (activeModelData) {
        setActiveModel(activeModelData);
        setViewingModel(activeModelData); // View the newly activated model
      }
    } else {
      // Fallback to local state if save fails
      setModels(updatedModels);
      const model = updatedModels.find(m => m.id === modelId);
    if (model) {
      setActiveModel(model);
      setViewingModel(model); // View the newly activated model
      }
    }
  };

  const addServiceType = (name: string) => {
    const newServiceType: ServiceType = {
      id: `st_${Date.now()}`,
      name,
      isCustom: true,
    };
    setServiceTypes(prev => [...prev, newServiceType]);
  };

  const removeServiceType = (id: string) => {
    setServiceTypes(prev => prev.filter(st => st.id !== id));
  };

  // Tracker-only mode: render just the performance tracker block
  if (showTrackerOnly) {
  return (
      <div style={{ padding: '0', maxWidth: '100%', margin: '0' }}>
        {!activeModel && !loadingModels ? (
          // Empty state when no active model
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
            padding: '60px 20px',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '16px',
              lineHeight: '1.5'
            }}>
              Build and activate a Forecast Model to track your sales progress in real time
            </div>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('navigateToPage', {
                  detail: { action: 'view-forecast' }
                }));
              }}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.4)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Create Forecast Model
            </button>
          </div>
        ) : activeModel && (
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
            overflow: 'hidden'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    margin: '0 0 4px 0', 
                    color: '#1f2937' 
                  }}>
                    Forecast Tracker
                  </h2>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#6b7280', 
                    margin: 0 
                  }}>
                    Active model tracking
                  </p>
                </div>
                {(() => {
                  const totalActual = performanceMetrics.reduce((sum, m) => sum + m.actualRevenue, 0);
                  const totalForecast = performanceMetrics.reduce((sum, m) => sum + m.forecastGoal, 0);
                  const overallPercentOfPlan = totalForecast > 0 ? Math.round((totalActual / totalForecast) * 100) : 0;
                  const overallPacingDelta = overallPercentOfPlan - yearProgress;
                  
                  // % of Plan colors (based on achievement)
                  const planBackgroundColor = overallPercentOfPlan >= 100 ? '#d1fae5' : 
                                        overallPercentOfPlan < 80 ? '#fee2e2' : '#fef3c7';
                  const planTextColor = overallPercentOfPlan >= 100 ? '#065f46' : 
                                  overallPercentOfPlan < 80 ? '#991b1b' : '#92400e';
                  const planBorderColor = overallPercentOfPlan >= 100 ? '#10b981' : overallPercentOfPlan < 80 ? '#ef4444' : '#f59e0b';
                  
                  // Pacing colors (based on pacing delta)
                  const pacingBackgroundColor = overallPacingDelta >= 5 ? '#d1fae5' : 
                                                overallPacingDelta <= -5 ? '#fee2e2' : '#fef3c7';
                  const pacingTextColor = overallPacingDelta >= 5 ? '#065f46' : 
                                          overallPacingDelta <= -5 ? '#991b1b' : '#92400e';
                  const pacingBorderColor = overallPacingDelta >= 5 ? '#10b981' : 
                                            overallPacingDelta <= -5 ? '#ef4444' : '#f59e0b';
                  
                  return (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{
                        backgroundColor: planBackgroundColor,
                        padding: '8px 16px',
                        borderRadius: '8px',
                        textAlign: 'left',
                        border: `1px solid ${planBorderColor}`
                      }}>
                        <div style={{ 
                          fontSize: '12px', 
                          color: planTextColor, 
                          marginBottom: '2px' 
                        }}>
                          % of Plan
                        </div>
                        <div style={{ 
                          fontSize: '18px', 
                          fontWeight: '600', 
                          color: planTextColor
                        }}>
                          {overallPercentOfPlan}%
                        </div>
                      </div>
                      <div style={{
                        backgroundColor: pacingBackgroundColor,
                        padding: '8px 16px',
                        borderRadius: '8px',
                        textAlign: 'left',
                        border: `1px solid ${pacingBorderColor}`
                      }}>
                        <div style={{ 
                          fontSize: '12px', 
                          color: pacingTextColor, 
                          marginBottom: '2px' 
                        }}>
                          Overall Pacing
                        </div>
                        <div style={{ 
                          fontSize: '18px', 
                          fontWeight: '600', 
                          color: pacingTextColor
                        }}>
                          {overallPacingDelta >= 0 ? '+' : ''}{overallPacingDelta}%
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '14px' }}>
                <thead style={{ backgroundColor: '#f5f5f5' }}>
                  <tr>
                    <Th>Service Type</Th>
                    <Th align="right">Forecast Goal</Th>
                    <Th align="right">Actual $</Th>
                    <Th align="right">Remaining</Th>
                    <Th align="right">% of Plan</Th>
                    <Th align="right">Pacing Delta</Th>
                  </tr>
                </thead>
                <tbody>
                  {performanceMetrics.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ 
                        textAlign: 'center', 
                        padding: '60px 20px',
                        color: '#374151'
                      }}>
                        <div style={{ 
                          fontSize: '20px', 
                          fontWeight: '600',
                          color: '#1f2937',
                          marginBottom: '16px',
                          lineHeight: '1.5'
                        }}>
                          Build and activate a Forecast Model to track your sales progress in real time
                        </div>
                        <button
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('navigateToPage', {
                              detail: { action: 'view-forecast' }
                            }));
                          }}
                          style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 24px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#2563eb';
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.4)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#3b82f6';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          Create Forecast Model
                        </button>
                      </td>
                    </tr>
                  ) : (
                    performanceMetrics.map((metric, index) => (
                    <tr 
                      key={metric.serviceTypeId}
                      style={{ 
                        borderBottom: '1px solid #eee',
                        backgroundColor: index % 2 === 0 ? '#fafafa' : '#f5f5f5'
                      }}
                    >
                      <Td style={{ fontWeight: '500' }}>{metric.serviceTypeName}</Td>
                      <Td align="right">{toUSD(metric.forecastGoal)}</Td>
                      <Td align="right">{toUSD(metric.actualRevenue)}</Td>
                      <Td align="right" style={{ 
                        color: metric.remaining < 0 ? '#10b981' : '#ef4444',
                        fontWeight: '500'
                      }}>
                        {metric.remaining < 0 
                          ? toUSD(Math.abs(metric.remaining)) // Surplus: show as positive (green)
                          : `-${toUSD(metric.remaining)}` // Deficit: show with negative (red)
                        }
                      </Td>
                      <Td align="right" style={{ 
                        color: metric.percentOfPlan >= 100 ? '#10b981' : 
                              metric.percentOfPlan < 80 ? '#ef4444' : '#f59e0b',
                        fontWeight: '600'
                      }}>
                        {metric.percentOfPlan}%
                      </Td>
                      <Td align="right" style={{ 
                        color: metric.pacingDelta >= 0 ? '#10b981' : '#ef4444',
                        fontWeight: '500'
                      }}>
                        {metric.pacingDelta >= 0 ? '+' : ''}{metric.pacingDelta}%
                      </Td>
                    </tr>
                    ))
                  )}
                  {performanceMetrics.length > 0 && (
                  <tr style={{ 
                    backgroundColor: '#e5e7eb',
                    borderTop: '2px solid #9ca3af',
                    fontWeight: '600'
                  }}>
                    <Td style={{ fontWeight: '700', fontSize: '14px' }}>Total</Td>
                    <Td align="right" style={{ fontWeight: '700', fontSize: '14px' }}>
                      {toUSD(performanceMetrics.reduce((sum, m) => sum + m.forecastGoal, 0))}
                    </Td>
                    <Td align="right" style={{ fontWeight: '700', fontSize: '14px' }}>
                      {toUSD(performanceMetrics.reduce((sum, m) => sum + m.actualRevenue, 0))}
                    </Td>
                    <Td align="right" style={{ 
                      fontWeight: '700', 
                      fontSize: '14px',
                      color: performanceMetrics.reduce((sum, m) => sum + m.remaining, 0) < 0 ? '#10b981' : '#ef4444'
                    }}>
                      {(() => {
                        const totalRemaining = performanceMetrics.reduce((sum, m) => sum + m.remaining, 0);
                        return totalRemaining < 0 
                          ? toUSD(Math.abs(totalRemaining)) // Surplus: show as positive (green)
                          : `-${toUSD(totalRemaining)}` // Deficit: show with negative (red)
                      })()}
                    </Td>
                    <Td align="right" style={{ 
                      fontWeight: '700', 
                      fontSize: '14px',
                      color: Math.round(performanceMetrics.reduce((sum, m) => sum + m.actualRevenue, 0) / performanceMetrics.reduce((sum, m) => sum + m.forecastGoal, 0) * 100) >= 100 ? '#10b981' : 
                            Math.round(performanceMetrics.reduce((sum, m) => sum + m.actualRevenue, 0) / performanceMetrics.reduce((sum, m) => sum + m.forecastGoal, 0) * 100) < 80 ? '#ef4444' : '#f59e0b'
                    }}>
                      {Math.round(performanceMetrics.reduce((sum, m) => sum + m.actualRevenue, 0) / performanceMetrics.reduce((sum, m) => sum + m.forecastGoal, 0) * 100)}%
                    </Td>
                    <Td align="right" style={{ 
                      fontWeight: '700', 
                      fontSize: '14px',
                      color: Math.round(performanceMetrics.reduce((sum, m) => sum + m.actualRevenue, 0) / performanceMetrics.reduce((sum, m) => sum + m.forecastGoal, 0) * 100) - yearProgress >= 0 ? '#10b981' : '#ef4444'
                    }}>
                      {Math.round(performanceMetrics.reduce((sum, m) => sum + m.actualRevenue, 0) / performanceMetrics.reduce((sum, m) => sum + m.forecastGoal, 0) * 100) - yearProgress >= 0 ? '+' : ''}
                      {Math.round(performanceMetrics.reduce((sum, m) => sum + m.actualRevenue, 0) / performanceMetrics.reduce((sum, m) => sum + m.forecastGoal, 0) * 100) - yearProgress}%
                    </Td>
                  </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          margin: '0 0 8px 0', 
          color: '#1f2937' 
        }}>
          Forecast Modeling
        </h1>
        <p style={{ 
          color: '#6b7280', 
          margin: 0, 
          fontSize: '16px' 
        }}>
          Build and track forecast models against real-time sales performance
        </p>
      </div>

      {/* Model Management */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <button
          onClick={() => setShowModelModal(true)}
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
          New Model
        </button>
      </div>

      {/* Model Selector - Fixed Layout v4 */}
      {models.length > 0 && (
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          {models.map(model => {
            return (
              <div
                key={model.id}
                onClick={() => {
                  // Clicking any model card sets it as the viewing model
                  // This allows users to click back to the active model if they're viewing another one
                  setViewingModel(model);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: viewingModel?.id === model.id 
                    ? '#3b82f6' 
                    : '#f8fafc',
                  color: viewingModel?.id === model.id ? 'white' : '#374151',
                  border: viewingModel?.id === model.id ? 'none' : '2px solid #6b7280',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  minWidth: '200px',
                  width: '100%',
                  maxWidth: '300px',
                  boxShadow: viewingModel?.id === model.id 
                    ? '0 2px 4px rgba(59, 130, 246, 0.3)' 
                    : '0 1px 3px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (viewingModel?.id !== model.id) {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewingModel?.id !== model.id) {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }
                }}
              >
                            {/* Model Info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {model.isActive && <CheckCircle size={16} />}
                              <span>{model.name}</span>
                            </div>
                
                {/* Action Buttons */}
                <div 
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                  onClick={(e) => e.stopPropagation()} // Prevent card click when clicking buttons
                >
                  {!model.isActive ? (
                    <button
                      onClick={() => activateModel(model.id)}
                      style={{
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: '2px solid #6b7280',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e5e7eb';
                        e.currentTarget.style.borderColor = '#4b5563';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                        e.currentTarget.style.borderColor = '#6b7280';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
                      }}
                      title="Make Active Model"
                    >
                      <Target size={10} />
                      Activate
                    </button>
                  ) : null}
                  <button
                    onClick={() => setEditingModel(model)}
                    style={{
                      backgroundColor: 'transparent',
                      color: 'inherit',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: 0.7
                    }}
                    title="Edit Model"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.7';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => deleteModel(model.id)}
                    style={{
                      backgroundColor: 'transparent',
                      color: 'inherit',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: 0.7
                    }}
                    title="Delete Model"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.7';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Performance Tracker - Show for viewingModel (or activeModel if no viewingModel) */}
      {/* Show empty state if no model exists */}
      {!hideTracker && !displayModel && !loadingModels && (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
          padding: '60px 20px',
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '16px',
            lineHeight: '1.5'
          }}>
            Build and activate a Forecast Model to track your sales progress in real time
          </div>
          <button
            onClick={() => setShowModelModal(true)}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.4)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Create Forecast Model
          </button>
        </div>
      )}
      {!hideTracker && displayModel && (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
          overflow: 'hidden',
          marginBottom: '24px'
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  margin: '0 0 4px 0', 
                  color: '#1f2937' 
                }}>
                  Forecast Tracker
                </h2>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6b7280', 
                  margin: 0 
                }}>
                  {displayModel.name}
                  {!displayModel.isActive && (
                    <span style={{ 
                      marginLeft: '8px', 
                      fontSize: '12px', 
                      color: '#9ca3af',
                      fontStyle: 'italic'
                    }}>
                      (View Only)
                    </span>
                  )}
                </p>
              </div>
              {(() => {
                const totalActual = performanceMetrics.reduce((sum, m) => sum + m.actualRevenue, 0);
                const totalForecast = performanceMetrics.reduce((sum, m) => sum + m.forecastGoal, 0);
                const overallPercentOfPlan = totalForecast > 0 ? Math.round((totalActual / totalForecast) * 100) : 0;
                const overallPacingDelta = overallPercentOfPlan - yearProgress;
                
                // % of Plan colors (based on achievement)
                const planBackgroundColor = overallPercentOfPlan >= 100 ? '#d1fae5' : 
                                      overallPercentOfPlan < 80 ? '#fee2e2' : '#fef3c7';
                const planTextColor = overallPercentOfPlan >= 100 ? '#065f46' : 
                                overallPercentOfPlan < 80 ? '#991b1b' : '#92400e';
                const planBorderColor = overallPercentOfPlan >= 100 ? '#10b981' : overallPercentOfPlan < 80 ? '#ef4444' : '#f59e0b';
                
                // Pacing colors (based on pacing delta)
                const pacingBackgroundColor = overallPacingDelta >= 5 ? '#d1fae5' : 
                                              overallPacingDelta <= -5 ? '#fee2e2' : '#fef3c7';
                const pacingTextColor = overallPacingDelta >= 5 ? '#065f46' : 
                                        overallPacingDelta <= -5 ? '#991b1b' : '#92400e';
                const pacingBorderColor = overallPacingDelta >= 5 ? '#10b981' : 
                                          overallPacingDelta <= -5 ? '#ef4444' : '#f59e0b';
                
                return (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{
                      backgroundColor: planBackgroundColor,
                      padding: '8px 16px',
                      borderRadius: '8px',
                      textAlign: 'left',
                      border: `1px solid ${planBorderColor}`
                    }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: planTextColor, 
                        marginBottom: '2px' 
                      }}>
                        % of Plan
                      </div>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        color: planTextColor
                      }}>
                        {overallPercentOfPlan}%
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: pacingBackgroundColor,
                      padding: '8px 16px',
                      borderRadius: '8px',
                      textAlign: 'left',
                      border: `1px solid ${pacingBorderColor}`
                    }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: pacingTextColor, 
                        marginBottom: '2px' 
                      }}>
                        Overall Pacing
                      </div>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        color: pacingTextColor
                      }}>
                        {overallPacingDelta >= 0 ? '+' : ''}{overallPacingDelta}%
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px' }}>
              <thead style={{ backgroundColor: '#f5f5f5' }}>
                <tr>
                  <Th>Service Type</Th>
                  <Th align="right">Forecast Goal</Th>
                  <Th align="right">Actual $</Th>
                  <Th align="right">Remaining</Th>
                  <Th align="right">% of Plan</Th>
                  <Th align="right">Pacing Delta</Th>
                </tr>
              </thead>
              <tbody>
                {performanceMetrics.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ 
                      textAlign: 'center', 
                      padding: '60px 20px',
                      color: '#374151'
                    }}>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: '16px',
                        lineHeight: '1.5'
                      }}>
                        Build and activate a Forecast Model to track your sales progress in real time
                      </div>
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('navigateToPage', {
                            detail: { action: 'view-forecast' }
                          }));
                        }}
                        style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '12px 24px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#2563eb';
                          e.currentTarget.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.4)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#3b82f6';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        Create Forecast Model
                      </button>
                    </td>
                  </tr>
                ) : (
                  performanceMetrics.map((metric, index) => (
                  <tr 
                    key={metric.serviceTypeId}
                    style={{ 
                      borderBottom: '1px solid #eee',
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f5f5f5'
                    }}
                  >
                    <Td style={{ fontWeight: '500' }}>{metric.serviceTypeName}</Td>
                    <Td align="right">{toUSD(metric.forecastGoal)}</Td>
                    <Td align="right">{toUSD(metric.actualRevenue)}</Td>
                    <Td align="right" style={{ 
                      color: metric.remaining < 0 ? '#10b981' : '#ef4444',
                      fontWeight: '500'
                    }}>
                      {metric.remaining < 0 
                        ? toUSD(Math.abs(metric.remaining)) // Surplus: show as positive (green)
                        : `-${toUSD(metric.remaining)}` // Deficit: show with negative (red)
                      }
                    </Td>
                    <Td align="right" style={{ 
                      color: metric.percentOfPlan >= 100 ? '#10b981' : 
                            metric.percentOfPlan < 80 ? '#ef4444' : '#f59e0b',
                      fontWeight: '600'
                    }}>
                      {metric.percentOfPlan}%
                    </Td>
                    <Td align="right" style={{ 
                      color: metric.pacingDelta >= 0 ? '#10b981' : '#ef4444',
                      fontWeight: '500'
                    }}>
                      {metric.pacingDelta >= 0 ? '+' : ''}{metric.pacingDelta}%
                    </Td>
                  </tr>
                  ))
                )}
                
                {/* Total Row - Only show if there are service types */}
                {performanceMetrics.length > 0 && (
                <tr style={{ 
                  backgroundColor: '#e5e7eb',
                  borderTop: '2px solid #9ca3af',
                  fontWeight: '600'
                }}>
                  <Td style={{ fontWeight: '700', fontSize: '14px' }}>Total</Td>
                  <Td align="right" style={{ fontWeight: '700', fontSize: '14px' }}>
                    {toUSD(performanceMetrics.reduce((sum, m) => sum + m.forecastGoal, 0))}
                  </Td>
                  <Td align="right" style={{ fontWeight: '700', fontSize: '14px' }}>
                    {toUSD(performanceMetrics.reduce((sum, m) => sum + m.actualRevenue, 0))}
                  </Td>
                  <Td align="right" style={{ 
                    fontWeight: '700', 
                    fontSize: '14px',
                    color: performanceMetrics.reduce((sum, m) => sum + m.remaining, 0) < 0 ? '#10b981' : '#ef4444'
                  }}>
                    {(() => {
                      const totalRemaining = performanceMetrics.reduce((sum, m) => sum + m.remaining, 0);
                      return totalRemaining < 0 
                        ? toUSD(Math.abs(totalRemaining)) // Surplus: show as positive (green)
                        : `-${toUSD(totalRemaining)}` // Deficit: show with negative (red)
                    })()}
                  </Td>
                  <Td align="right" style={{ 
                    fontWeight: '700', 
                    fontSize: '14px',
                    color: Math.round(performanceMetrics.reduce((sum, m) => sum + m.actualRevenue, 0) / performanceMetrics.reduce((sum, m) => sum + m.forecastGoal, 0) * 100) >= 100 ? '#10b981' : 
                          Math.round(performanceMetrics.reduce((sum, m) => sum + m.actualRevenue, 0) / performanceMetrics.reduce((sum, m) => sum + m.forecastGoal, 0) * 100) < 80 ? '#ef4444' : '#f59e0b'
                  }}>
                    {Math.round(performanceMetrics.reduce((sum, m) => sum + m.actualRevenue, 0) / performanceMetrics.reduce((sum, m) => sum + m.forecastGoal, 0) * 100)}%
                  </Td>
                  <Td align="right" style={{ 
                    fontWeight: '700', 
                    fontSize: '14px',
                    color: Math.round(performanceMetrics.reduce((sum, m) => sum + m.actualRevenue, 0) / performanceMetrics.reduce((sum, m) => sum + m.forecastGoal, 0) * 100) - yearProgress >= 0 ? '#10b981' : '#ef4444'
                  }}>
                    {Math.round(performanceMetrics.reduce((sum, m) => sum + m.actualRevenue, 0) / performanceMetrics.reduce((sum, m) => sum + m.forecastGoal, 0) * 100) - yearProgress >= 0 ? '+' : ''}
                    {Math.round(performanceMetrics.reduce((sum, m) => sum + m.actualRevenue, 0) / performanceMetrics.reduce((sum, m) => sum + m.forecastGoal, 0) * 100) - yearProgress}%
                  </Td>
                </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Model Details - Show for viewingModel (or activeModel if no viewingModel) */}
      {displayModel && (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
          overflow: 'hidden'
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  margin: '0 0 4px 0', 
                  color: '#1f2937' 
                }}>
                  {displayModel.name}
                </h2>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6b7280', 
                  margin: 0 
                }}>
                  {displayModel.year} • {displayModel.isActive ? 'Active Model' : 'Inactive Model'}
                  {!displayModel.isActive && viewingModel?.id === displayModel.id && (
                    <span style={{ 
                      marginLeft: '8px', 
                      fontSize: '12px', 
                      color: '#9ca3af',
                      fontStyle: 'italic'
                    }}>
                      (View Only)
                    </span>
                  )}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setEditingModel(displayModel)}
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '8px 12px',
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
                <button
                  onClick={() => deleteModel(displayModel.id)}
                  style={{
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    padding: '8px 12px',
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
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px' }}>
              <thead style={{ backgroundColor: '#f5f5f5' }}>
                <tr>
                  <Th>Service Type</Th>
                  <Th align="right">Quantity</Th>
                  <Th align="right">Avg Booking</Th>
                  <Th align="right">Total Forecast</Th>
                </tr>
              </thead>
              <tbody>
                {displayModel.serviceTypes.map((service, index) => {
                  const serviceType = serviceTypes.find(st => st.id === service.serviceTypeId);
                  return (
                    <tr 
                      key={service.serviceTypeId}
                      style={{ 
                        borderBottom: '1px solid #eee',
                        backgroundColor: index % 2 === 0 ? '#fafafa' : '#f5f5f5'
                      }}
                    >
                      <Td style={{ fontWeight: '500' }}>{serviceType?.name || 'Unknown'}</Td>
                      <Td align="right">{formatNumber(service.quantity)}</Td>
                      <Td align="right">{toUSD(service.avgBooking)}</Td>
                      <Td align="right" style={{ fontWeight: '600' }}>{toUSD(service.totalForecast)}</Td>
                    </tr>
                  );
                })}
                
                {/* Total Row */}
                <tr style={{ 
                  backgroundColor: '#e5e7eb',
                  borderTop: '2px solid #9ca3af',
                  fontWeight: '600'
                }}>
                  <Td style={{ fontWeight: '700', fontSize: '14px' }}>Total</Td>
                  <Td align="right" style={{ fontWeight: '700', fontSize: '14px' }}>—</Td>
                  <Td align="right" style={{ fontWeight: '700', fontSize: '14px' }}>—</Td>
                  <Td align="right" style={{ fontWeight: '700', fontSize: '14px' }}>
                    {toUSD(displayModel.serviceTypes.reduce((sum, s) => sum + s.totalForecast, 0))}
                  </Td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showModelModal && (
        <ModelModal
          models={models}
          serviceTypes={serviceTypes}
          setServiceTypes={setServiceTypes}
          onCreate={createModel}
          onUpdate={updateModel}
          onClose={() => setShowModelModal(false)}
        />
      )}

      {editingModel && (
        <ModelModal
          models={models}
          serviceTypes={serviceTypes}
          setServiceTypes={setServiceTypes}
          model={editingModel}
          onCreate={createModel}
          onUpdate={updateModel}
          onClose={() => setEditingModel(null)}
        />
      )}


    </div>
  );
};

// UI Components
function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
  return (
    <th style={{ 
      textAlign: align, 
      fontSize: '12px', 
      fontWeight: '600', 
      textTransform: 'uppercase', 
      letterSpacing: '0.05em', 
      color: '#666', 
      padding: '12px 16px' 
    }}>
      {children}
    </th>
  );
}

function Td({ children, style, align = 'left' }: { children: React.ReactNode; style?: React.CSSProperties; align?: 'left' | 'right' | 'center' }) {
  return (
    <td style={{ 
      padding: '12px 16px', 
      verticalAlign: 'top', 
      textAlign: align,
      ...style 
    }}>
      {children}
    </td>
  );
}

// Model Modal
function ModelModal({ 
  models, 
  serviceTypes, 
  setServiceTypes,
  model, 
  onCreate, 
  onUpdate, 
  onClose 
}: {
  models: ForecastModel[];
  serviceTypes: ServiceType[];
  setServiceTypes: (types: ServiceType[]) => void;
  model?: ForecastModel;
  onCreate: (model: Omit<ForecastModel, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (model: ForecastModel) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: model?.name || '',
    serviceTypes: model?.serviceTypes?.map(st => ({
      serviceTypeId: st.serviceTypeId,
      quantity: st.quantity,
      avgBooking: st.avgBooking,
      totalForecast: st.totalForecast
    })) || [],
  });
  const [newServiceTypeName, setNewServiceTypeName] = useState('');
  const [showNewServiceTypeInput, setShowNewServiceTypeInput] = useState(false);

  // Helper functions
  const toUSD = (cents: number) => (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
  const formatNumber = (num: number) => num.toLocaleString();

  // Update form data when model prop changes
  useEffect(() => {
    if (model) {
      setFormData({
        name: model.name,
        serviceTypes: model.serviceTypes.map(st => ({
          serviceTypeId: st.serviceTypeId,
          quantity: st.quantity,
          avgBooking: st.avgBooking,
          totalForecast: st.totalForecast
        }))
      });
    }
  }, [model]);

  const addServiceType = () => {
    setFormData(prev => ({
      ...prev,
      serviceTypes: [...prev.serviceTypes, {
        serviceTypeId: serviceTypes[0]?.id || '',
        quantity: 0,
        avgBooking: 0, // in cents
        totalForecast: 0, // in cents
      }]
    }));
  };

  const handleAddNewServiceType = () => {
    if (newServiceTypeName.trim()) {
      const newServiceType: ServiceType = {
        id: `st_${Date.now()}`,
        name: newServiceTypeName.trim(),
        isCustom: true,
      };
      setServiceTypes(prev => [...prev, newServiceType]);
      
      // Add the new service type to the form
      setFormData(prev => ({
        ...prev,
        serviceTypes: [...prev.serviceTypes, {
          serviceTypeId: newServiceType.id,
          quantity: 0,
          avgBooking: 0, // in cents
          totalForecast: 0, // in cents
        }]
      }));
      
      setNewServiceTypeName('');
      setShowNewServiceTypeInput(false);
    }
  };

  const updateServiceType = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.map((service, i) => 
        i === index 
          ? { 
              ...service, 
              [field]: value,
              totalForecast: field === 'quantity' || field === 'avgBooking' 
                ? (field === 'quantity' ? value : service.quantity) * (field === 'avgBooking' ? value : service.avgBooking)
                : service.totalForecast
            }
          : service
      )
    }));
  };

  const removeServiceType = (index: number) => {
    setFormData(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please enter a model name');
      return;
    }

    // Recalculate totalForecast for all service types before saving
    const serviceTypesWithTotals = formData.serviceTypes.map(st => ({
      ...st,
      totalForecast: st.quantity * st.avgBooking
    }));

    const modelToSave = {
      ...formData,
      serviceTypes: serviceTypesWithTotals,
      modelType: model?.modelType || 'forecast',
      createdAt: model?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (model) {
      // Update existing model - ensure we preserve the real database ID
      const realModelId = model.id?.startsWith('model_') ? null : model.id;
      if (!realModelId) {
        alert('Error: Cannot update model - model has temporary ID. Please refresh and try again.');
        return;
      }
      const modelToUpdate = { ...model, ...modelToSave, id: realModelId };
      await onUpdate(modelToUpdate);
    } else {
      // Create new model
      const newModelData = { ...modelToSave, year: modelToSave.year || new Date().getFullYear() };
      await onCreate(newModelData);
    }
    onClose();
  };

  // Add error boundary
  if (!formData) {
    return null;
  }


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
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
            {model ? 'Edit Model' : 'Create New Model'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={(e) => {
          logger.debug('Form onSubmit triggered');
          handleSubmit(e);
        }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', textAlign: 'left' }}>
                Model Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="e.g., 2025 Model"
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <label style={{ fontSize: '16px', fontWeight: '600' }}>
                Service Types
              </label>
              <button
                type="button"
                onClick={addServiceType}
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
                <Plus size={12} />
                Add Service Type
              </button>
            </div>

            {formData.serviceTypes.length === 0 && (
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
                textAlign: 'left'
              }}>
                <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
                  No service types added yet. You can add them now or edit this model later.
                </p>
                <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>
                  If you activate this model without service types, the forecast tracker will show no data.
                </p>
              </div>
            )}

            {formData.serviceTypes.map((service, index) => {
              const serviceType = serviceTypes.find(st => st.id === service.serviceTypeId);
              return (
                <div key={index} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px',
                  backgroundColor: '#f9fafb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                      Service Type {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeServiceType(index)}
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
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', textAlign: 'left' }}>
                        Service Type
                      </label>
                      <select
                        value={service.serviceTypeId}
                        onChange={(e) => {
                          if (e.target.value === 'add_new') {
                            setShowNewServiceTypeInput(true);
                          } else {
                            updateServiceType(index, 'serviceTypeId', e.target.value);
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
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
                        <option value="add_new" style={{ fontStyle: 'italic', color: '#6b7280' }}>
                          + Add New Service Type
                        </option>
                      </select>
                      
                      {showNewServiceTypeInput && (
                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            value={newServiceTypeName}
                            onChange={(e) => setNewServiceTypeName(e.target.value)}
                            placeholder="Enter new service type name"
                            style={{
                              flex: 1,
                              padding: '6px 8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '12px',
                              boxSizing: 'border-box'
                            }}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddNewServiceType()}
                          />
                          <button
                            type="button"
                            onClick={handleAddNewServiceType}
                            style={{
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewServiceTypeInput(false);
                              setNewServiceTypeName('');
                            }}
                            style={{
                              backgroundColor: '#f3f4f6',
                              color: '#374151',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', textAlign: 'left' }}>
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={service.quantity}
                        onChange={(e) => updateServiceType(index, 'quantity', parseInt(e.target.value) || 0)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                        min="0"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', textAlign: 'left' }}>
                        Avg Booking ($)
                      </label>
                      <input
                        type="number"
                        value={service.avgBooking / 100}
                        onChange={(e) => updateServiceType(index, 'avgBooking', Math.round((parseFloat(e.target.value) || 0) * 100))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', textAlign: 'left' }}>
                        Total Forecast
                      </label>
                      <div style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                        boxSizing: 'border-box'
                      }}>
                        {toUSD(service.totalForecast)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Summary */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                Total Forecast Amount
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {formData.serviceTypes.length} service type{formData.serviceTypes.length !== 1 ? 's' : ''}
                {formData.serviceTypes.length === 0 && ' (empty model)'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                color: formData.serviceTypes.length === 0 ? '#9ca3af' : '#1f2937'
              }}>
                {formData.serviceTypes.length === 0 ? '$0.00' : toUSD(formData.serviceTypes.reduce((sum, service) => sum + service.totalForecast, 0))}
              </div>
            </div>
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
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                logger.debug('Submit button clicked', { hasFormData: !!formData, hasModel: !!model });
                await handleSubmit(e as any);
              }}
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
              {model ? 'Update Model' : 'Create Model'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default ForecastModeling;
