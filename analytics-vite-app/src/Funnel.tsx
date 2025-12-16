import { useState, useMemo, useEffect } from "react";
import { TrendingUp, Users, Phone, CheckCircle, DollarSign, Edit, Lock, Crown, StickyNote, Calendar, Upload } from "lucide-react";
import { useAuth } from "./contexts/AuthContext";
// Calculator moved to its own top-level page
import { UnifiedDataService } from "./services/unifiedDataService";
import type { FunnelData, Booking, Payment } from "./types";
import { logger } from "./utils/logger";
import CSVImportModal from "./components/CSVImportModal";
import { importBookingsFromCSV, type ImportResult } from "./services/honeybookImporter";

interface FunnelProps {
  funnelData: FunnelData[];
  dataManager?: any;
  salesData?: Booking[];
  paymentsData?: Payment[];
  serviceTypes?: any[];
  navigationAction?: { page: string; action?: string; month?: { year: number; month: number } } | null;
  isViewOnly?: boolean;
}

// Helper functions
const toUSD = (cents: number) => {
  if (isNaN(cents) || cents === null || cents === undefined) return "$0.00";
  return (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
};
const formatNumber = (num: number) => {
  if (isNaN(num) || num === null || num === undefined) return "0";
  return num.toLocaleString();
};

// Conversion rate calculation
const calculateConversionRate = (from: number, to: number) => {
  if (from === 0) return 0;
  return ((to / from) * 100).toFixed(1);
};

export default function Funnel({ funnelData, dataManager, salesData = [], paymentsData = [], serviceTypes = [], navigationAction, isViewOnly = false }: FunnelProps) {
  const leadSources = dataManager?.leadSources || [];
  logger.debug('Funnel component loaded', { 
    funnelDataCount: funnelData.length, 
    salesDataCount: salesData.length, 
    paymentsDataCount: paymentsData.length 
  });
  
  const { user, features } = useAuth();
  logger.debug('Auth context loaded', { 
    userId: user?.id, 
    email: user?.email, 
    subscriptionTier: user?.subscriptionTier 
  });
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMonth, setEditingMonth] = useState<FunnelData | null>(null);

  // Handle navigation action to open edit modal for specific month
  useEffect(() => {
    if (navigationAction?.action === 'edit-month' && navigationAction.month) {
      const { year, month } = navigationAction.month
      setSelectedYear(year)
      
      // Use a small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        // Find or create the month data
        let monthData = funnelData.find(f => f.year === year && f.month === month)
        if (!monthData) {
          // Create a new month entry
          monthData = {
            id: `temp_${year}_${month}`,
            name: 'Default',
            year,
            month,
            inquiries: 0,
            inquiriesYtd: 0,
            callsBooked: 0,
            callsTaken: 0,
            callsYtd: 0,
            inquiryToCall: 0,
            callToBooking: 0,
            closes: 0,
            bookings: 0,
            bookingsYtd: 0,
            bookingsGoal: 0,
            cash: 0,
            notes: undefined,
            closesManual: false,
            bookingsManual: false,
            cashManual: false
          }
        }
        setEditingMonth(monthData)
        setIsEditModalOpen(true)
        logger.debug('Edit modal opened via navigation action', { year, month })
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [navigationAction, funnelData])
  // Calculator removed from Funnel page; single view only
  const [loading, setLoading] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [notesMonth, setNotesMonth] = useState<FunnelData | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);

  // Funnel data is provided via props from dataManager, so we don't need to reload it
  // The dataManager handles all data loading centrally

  // All users now have Pro features (simplified permission system)
  const isProAccount = true;

  // Get trackable service type IDs (for closes calculation only)
  const trackableServiceIds = useMemo(() => {
    return new Set(serviceTypes.filter((st: any) => st.tracksInFunnel).map((st: any) => st.id));
  }, [serviceTypes]);

  // Calculate dynamic data from sales for Pro accounts
  const calculateDynamicData = useMemo(() => {
    if (!isProAccount) return {};

    const monthlyData: { [key: string]: { bookings: number; closes: number; cash: number } } = {};

    // Initialize all months with zeros
    for (let month = 1; month <= 12; month++) {
      monthlyData[month] = { bookings: 0, closes: 0, cash: 0 };
    }

    // Helper to safely extract year and month from YYYY-MM-DD without timezone shifts
    const parseYearMonth = (dateString: string | undefined | null): { year: number; month: number } | null => {
      if (!dateString) return null;
      // Prefer strict split to avoid JS Date timezone issues with YYYY-MM-DD strings
      const parts = dateString.split('-');
      if (parts.length >= 2) {
        const yearNum = parseInt(parts[0], 10);
        const monthNum = parseInt(parts[1], 10);
        if (Number.isFinite(yearNum) && Number.isFinite(monthNum) && monthNum >= 1 && monthNum <= 12) {
          return { year: yearNum, month: monthNum };
    }
      }
      // Fallback to Date only if needed
      try {
        const d = new Date(dateString);
        return { year: d.getFullYear(), month: d.getMonth() + 1 };
      } catch {
        return null;
      }
    };

    // Calculate bookings and closes from sales data
    // Bookings: ALL bookings regardless of trackInFunnel
    // Closes: Only bookings with trackable service types
    salesData.forEach((booking: any) => {
      const parsed = parseYearMonth(booking?.dateBooked);
      if (!parsed || parsed.year !== selectedYear) return;
      
      const month = parsed.month;
      const bookedRevenue = booking.bookedRevenue || 0;
      
      // Always add to bookings (all bookings count)
      monthlyData[month].bookings += bookedRevenue;

      // Only add to closes if service type is trackable
      if (booking.serviceTypeId && trackableServiceIds.has(booking.serviceTypeId)) {
        monthlyData[month].closes += 1;
      }
    });

    // Calculate Cash from scheduled/expected payments (same logic as Forecast)
    // Use expectedDate first, then dueDate, then paymentDate
    paymentsData.forEach((payment: any) => {
      let dateStr = payment.expectedDate || payment.dueDate || payment.paymentDate;
      if (!dateStr) return;
      
      const parsed = parseYearMonth(dateStr);
      if (!parsed || parsed.year !== selectedYear) return;
      
      const month = parsed.month;
      const amount = payment.amount || payment.amountCents || 0;
      
      // Add to cash (all scheduled payments count, including future months)
      monthlyData[month].cash += amount;
    });

    return monthlyData;
  }, [isProAccount, salesData, paymentsData, selectedYear, trackableServiceIds]);

  // Handler functions for edit modal
  const handleEditMonth = (month: any) => {
    logger.debug('Opening edit modal for month', { month });
    setEditingMonth(month as FunnelData);
    setIsEditModalOpen(true);
    logger.debug('Modal should be open now');
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingMonth(null);
  };

  const handleSave = async () => {
    logger.debug('handleSave function called', { editingMonth: !!editingMonth, userId: user?.id });
    
    if (!editingMonth || !user?.id) {
      logger.debug('Early return: missing editingMonth or user.id', { editingMonth: !!editingMonth, userId: !!user?.id });
      return;
    }
    
    logger.debug('Starting save process', { userId: user.id, isProAccount });
    
    // For all accounts, just save what was edited
    const dataToSave = {
          ...editingMonth,
          lastUpdated: new Date().toISOString()
    };
    
    logger.debug('Data to save', { funnelId: dataToSave.id, year: dataToSave.year, month: dataToSave.month });
    
    try {
      logger.debug('Attempting to save', { hasDataManager: !!dataManager, hasSaveMethod: !!dataManager?.saveFunnelData });
      
      // Use dataManager.saveFunnelData if available, otherwise use UnifiedDataService
      let success;
      if (dataManager?.saveFunnelData) {
        logger.debug('Using dataManager.saveFunnelData');
        success = await dataManager.saveFunnelData(dataToSave);
      } else {
        logger.debug('Using UnifiedDataService.saveFunnelData');
        success = await UnifiedDataService.saveFunnelData(user.id, dataToSave);
        // If no dataManager, reload after save
      if (success) {
          logger.debug('Reloading page in 300ms');
          setTimeout(() => {
            window.location.reload();
          }, 300);
        }
      }
        
      if (success) {
        setJustSaved(true);
        handleCloseModal();
        logger.debug('Successfully saved to database and updated UI immediately');
      } else {
        logger.error('Save failed - service returned false');
        alert('Failed to save data. Please try again.');
      }
    } catch (error) {
      logger.error('Save error:', error);
      alert('Failed to save data. Please try again.');
    }
  };

  const handleOpenNotesModal = (month: FunnelData) => {
    setNotesMonth(month);
    setNotesDraft(month.notes || "");
    setIsNotesModalOpen(true);
  };

  const persistNotes = async (monthToSave: FunnelData) => {
    if (!user?.id) return false;

    setIsSavingNotes(true);

    try {
      let success;
      if (dataManager?.saveFunnelData) {
        success = await dataManager.saveFunnelData(monthToSave);
      } else {
        success = await UnifiedDataService.saveFunnelData(user.id, monthToSave);
        if (success) {
          setTimeout(() => {
            window.location.reload();
          }, 300);
        }
      }

      if (!success) {
        logger.error('Failed to save notes for month', { month: monthToSave.month });
        alert('Failed to save notes. Please try again.');
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error saving notes:', error);
      alert('Failed to save notes. Please try again.');
      return false;
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCloseNotesModal = async () => {
    if (notesMonth) {
      const existingNotes = notesMonth.notes || "";
      if (existingNotes !== notesDraft) {
        const updatedMonth = { ...notesMonth, notes: notesDraft };
        const success = await persistNotes(updatedMonth);
        if (!success) {
          return;
        }
        setNotesMonth(updatedMonth);
      }
    }

    setIsNotesModalOpen(false);
    setNotesMonth(null);
  };

  // Filter data by selected year
  const filteredData = useMemo(() => {
    logger.debug('filteredData recalculating', { funnelDataCount: funnelData.length, selectedYear });
    const yearData = funnelData.filter(data => data.year === selectedYear);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Create all 12 months for the selected year, using existing data or default values
    const allMonths = months.map((month, index) => {
      const monthNumber = index + 1;
      const existingData = yearData.find(data => data.month === monthNumber);
      
      if (isProAccount) {
        // For Pro accounts, use dynamic data from sales/payments, but respect manual overrides
        const dynamicData = calculateDynamicData[monthNumber] || { bookings: 0, closes: 0, cash: 0 };
        
        // Use manual value if flag is set, otherwise use dynamic value
        const closes = existingData?.closesManual ? (existingData.closes || 0) : dynamicData.closes;
        const bookings = existingData?.bookingsManual ? (existingData.bookings || 0) : dynamicData.bookings;
        const cash = existingData?.cashManual ? (existingData.cash || 0) : dynamicData.cash;
        
        return {
          id: existingData?.id || `${selectedYear}_${month.toLowerCase()}`,
          month: monthNumber,
          year: selectedYear,
          inquiries: existingData?.inquiries || 0, // Keep manual inquiries
          callsBooked: existingData?.callsBooked || 0, // Keep manual calls
          callsTaken: existingData?.callsTaken || 0, // Keep manual calls
          closes: closes,
          bookings: bookings,
          cash: cash,
          closesManual: existingData?.closesManual || false,
          bookingsManual: existingData?.bookingsManual || false,
          cashManual: existingData?.cashManual || false,
          notes: existingData?.notes || '',
          lastUpdated: existingData?.lastUpdated || new Date().toISOString()
        };
      } else {
        // For Free accounts, use static mock data
        if (existingData) {
          return existingData;
        }
        
        // Create default month data
        return {
          id: `${selectedYear}_${month.toLowerCase()}`,
          month: monthNumber,
          year: selectedYear,
          inquiries: 0,
          callsBooked: 0,
          callsTaken: 0,
          closes: 0,
          bookings: 0,
          cash: 0,
          notes: '',
          lastUpdated: new Date().toISOString()
        };
      }
    });
    
    return allMonths;
  }, [funnelData, selectedYear, isProAccount, calculateDynamicData]);

  // Calculate analytics metrics
  const analyticsMetrics = useMemo(() => {
    const currentYearData = filteredData;
    const totalInquiries = currentYearData.reduce((sum, month) => sum + (month.inquiries || 0), 0);
    const totalCallsBooked = currentYearData.reduce((sum, month) => sum + (month.callsBooked || 0), 0);
    const totalCallsTaken = currentYearData.reduce((sum, month) => sum + (month.callsTaken || 0), 0);
    const totalCloses = currentYearData.reduce((sum, month) => sum + (month.closes || 0), 0);
    const totalBookings = currentYearData.reduce((sum, month) => sum + (month.bookings || 0), 0);
    const totalCash = currentYearData.reduce((sum, month) => {
      const cash = month.cash || 0;
      return sum + (isNaN(cash) ? 0 : cash);
    }, 0);

    const monthsWithData = currentYearData.filter(month => 
      month.inquiries > 0 || month.callsBooked > 0 || month.callsTaken > 0 || month.closes > 0 || month.bookings > 0
    ).length;

    return {
      totalInquiries,
      totalCallsBooked,
      totalCallsTaken,
      totalCloses,
      totalBookings,
      avgInquiries: monthsWithData > 0 ? Math.round(totalInquiries / monthsWithData) : 0,
      avgCallsBooked: monthsWithData > 0 ? Math.round(totalCallsBooked / monthsWithData) : 0,
      avgCallsTaken: monthsWithData > 0 ? Math.round(totalCallsTaken / monthsWithData) : 0,
      avgCloses: monthsWithData > 0 ? Math.round(totalCloses / monthsWithData) : 0,
      avgBookings: monthsWithData > 0 ? Math.round(totalBookings / monthsWithData) : 0,
      totalCash,
      avgCash: monthsWithData > 0 ? Math.round(totalCash / monthsWithData) : 0,
      inquiryToCloseRate: calculateConversionRate(totalInquiries, totalCloses),
      callBookedToCloseRate: calculateConversionRate(totalCallsBooked, totalCloses),
      callTakenToCloseRate: calculateConversionRate(totalCallsTaken, totalCloses),
      inquiryToCallBookedRate: calculateConversionRate(totalInquiries, totalCallsBooked),
      callShowUpRate: calculateConversionRate(totalCallsBooked, totalCallsTaken),
      revenuePerCallTaken: totalCallsTaken > 0 ? Math.round(totalBookings / totalCallsTaken) : 0
    };
  }, [filteredData]);

  // Generate years from upcoming year back 5 years for new users
  const generateAvailableYears = () => {
    const years = [];
    const upcomingYear = currentYear + 1;
    // Include upcoming year, current year, and 5 previous years
    years.push(upcomingYear); // Add upcoming year first
    for (let i = 0; i < 6; i++) { // Current year + 5 previous years
      years.push(currentYear - i);
    }
    return years.sort((a, b) => b - a); // Sort descending (upcoming year first)
  };
  
  const availableYears = generateAvailableYears();
  
  // Helper to check if a month is in the future
  const isFutureMonth = (year: number, month: number) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
    
    if (year > currentYear) return true;
    if (year === currentYear && month > currentMonth) return true;
    return false;
  };

  // Show loading spinner while loading funnel data
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        fontSize: '16px',
        color: '#6b7280'
      }}>
        Loading funnel data...
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#1f2937' }}>
            Sales Funnel
          </h1>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user.crm === 'honeybook' && !isViewOnly && (
                <button
                  onClick={() => setShowCSVImport(true)}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
                  }}
                >
                  <Upload size={16} />
                  Import Leads Report
                </button>
              )}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: '#fef3c7',
                fontSize: '12px',
                fontWeight: '500',
                color: '#92400e'
              }}>
                <Crown size={12} />
                Pro
              </div>
            </div>
          )}
        </div>
        <p style={{ color: '#6b7280', margin: 0, fontSize: '16px' }}>
          Track and analyze your sales funnel performance
        </p>
      </div>

      {/* Year Selector */}
      <div style={{ marginBottom: '32px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '500', 
          marginBottom: '6px' 
        }}>
          Select Year
        </label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          style={{
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            backgroundColor: 'white',
            minWidth: '120px'
          }}
        >
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      

      {/* Monthly Data Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#1f2937' }}>
            Monthly Data - {selectedYear}
          </h2>
          {selectedYear > currentYear && (
            <div style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#92400e',
              marginTop: '12px'
            }}>
              <Calendar size={16} color="#f59e0b" />
              <span>
                <strong>Future Year:</strong> Data shown is projected from scheduled payments. Future months cannot be edited.
              </span>
            </div>
          )}
        </div>

        {/* Sales Funnel Table */}
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', minWidth: '120px' }}>Month</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: '#374151', width: '90px' }}>Inquiries</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: '#374151', width: '110px' }}>Calls Booked</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: '#374151', width: '110px' }}>Calls Taken</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: '#374151', width: '90px' }}>Closes</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: '#374151', width: '120px' }}>Bookings</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: '#374151', width: '120px' }}>Cash</th>
                <th style={{ padding: '12px 6px', textAlign: 'center', fontWeight: '600', color: '#374151', width: '60px' }}>Notes</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#374151', minWidth: '110px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((month, index) => {
                const monthName = new Date(selectedYear, month.month - 1).toLocaleString('default', { month: 'long' });
                const hasNotes = !!(month.notes && month.notes.trim().length > 0);
                return (
                  <tr
                    key={month.id}
                    style={{
                      borderBottom: '1px solid #e5e7eb',
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f5f5f5'
                    }}
                  >
                    <td style={{ padding: '12px', fontWeight: '500', color: '#1f2937', textAlign: 'left' }}>
                      {monthName}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', color: '#374151' }}>
                      {formatNumber(month.inquiries)}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', color: '#374151' }}>
                      {formatNumber(month.callsBooked)}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', color: '#374151' }}>
                      {formatNumber(month.callsTaken)}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', color: '#374151' }}>
                      {formatNumber(month.closes)}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', color: '#374151' }}>
                      {toUSD(month.bookings)}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', color: '#374151' }}>
                      {toUSD(month.cash)}
                    </td>
                    <td style={{ padding: '12px 6px', textAlign: 'center' }}>
                      {(() => {
                        const isFuture = isFutureMonth(month.year, month.month);
                        return (
                          <button
                            onClick={() => !isFuture && handleOpenNotesModal(month)}
                            disabled={isFuture}
                            style={{
                              background: isFuture ? 'transparent' : (hasNotes ? 'rgba(59, 130, 246, 0.12)' : 'transparent'),
                              border: isFuture ? '1px solid transparent' : (hasNotes ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid transparent'),
                              borderRadius: '6px',
                              padding: '4px',
                              cursor: isFuture ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background-color 0.15s ease, border-color 0.15s ease',
                              opacity: isFuture ? 0.5 : 1
                            }}
                            title={isFuture 
                              ? 'Notes cannot be added for future months' 
                              : (hasNotes ? 'View notes' : 'Add notes')
                            }
                          >
                            <StickyNote size={16} color={isFuture ? '#d1d5db' : (hasNotes ? '#2563eb' : '#9ca3af')} />
                          </button>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'left' }}>
                      {(() => {
                        const isFuture = isFutureMonth(month.year, month.month);
                        return (
                          <button
                            onClick={() => !isViewOnly && !isFuture && handleEditMonth(month)}
                            disabled={isViewOnly || isFuture}
                            style={{
                              backgroundColor: (isViewOnly || isFuture) ? '#e5e7eb' : '#3b82f6',
                              color: (isViewOnly || isFuture) ? '#9ca3af' : 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              cursor: (isViewOnly || isFuture) ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              opacity: (isViewOnly || isFuture) ? 0.5 : 1
                            }}
                            title={isFuture 
                              ? 'Future months cannot be edited - data is calculated from scheduled payments' 
                              : (isProAccount ? 'Edit Inquiries, Calls Booked, Calls Taken, and Cash (Closes and Bookings are calculated automatically)' : 'Edit month data')
                            }
                          >
                            <Edit size={14} />
                            Edit
                          </button>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
              
              {/* Total Row */}
              <tr style={{
                backgroundColor: '#e5e7eb',
                borderTop: '2px solid #9ca3af',
                fontWeight: '600'
              }}>
                <td style={{ padding: '12px', color: '#1f2937', textAlign: 'left' }}>Total</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#1f2937' }}>
                  {formatNumber(analyticsMetrics.totalInquiries)}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#1f2937' }}>
                  {formatNumber(analyticsMetrics.totalCallsBooked)}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#1f2937' }}>
                  {formatNumber(analyticsMetrics.totalCallsTaken)}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#1f2937' }}>
                  {formatNumber(analyticsMetrics.totalCloses)}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#1f2937' }}>
                  {toUSD(analyticsMetrics.totalBookings)}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#1f2937' }}>
                  {toUSD(analyticsMetrics.totalCash)}
                </td>
                <td style={{ padding: '12px 6px' }}></td>
                <td style={{ padding: '12px 8px' }}></td>
              </tr>
            </tbody>
          </table>
        </div>
        
      </div>

      {/* Notes Modal */}
      {isNotesModalOpen && notesMonth && (
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
            maxWidth: '480px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 10px 40px rgba(15, 23, 42, 0.12)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#1f2937' }}>
                  Notes for {new Date(notesMonth.year, notesMonth.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                  Use notes to log marketing changes. Updates save automatically when you close.
                </p>
              </div>
              <button
                onClick={handleCloseNotesModal}
                disabled={isSavingNotes}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  lineHeight: 1,
                  padding: '0 0 0 12px',
                  opacity: isSavingNotes ? 0.5 : 1
                }}
                aria-label="Close notes"
              >
                ×
              </button>
            </div>

            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Example: Launched new ad creative, adjusted pricing, updated follow-up sequence..."
              style={{
                flex: '1',
                minHeight: '180px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                lineHeight: 1.5,
                resize: 'vertical',
                color: '#1f2937'
              }}
              autoFocus
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setNotesDraft('')}
                disabled={isSavingNotes || !(notesDraft && notesDraft.length)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white',
                  color: '#1f2937',
                  fontSize: '13px',
                  cursor: isSavingNotes || !(notesDraft && notesDraft.length) ? 'not-allowed' : 'pointer',
                  opacity: isSavingNotes || !(notesDraft && notesDraft.length) ? 0.5 : 1
                }}
              >
                Clear
              </button>
              <button
                onClick={handleCloseNotesModal}
                disabled={isSavingNotes}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  fontSize: '14px',
                  cursor: isSavingNotes ? 'not-allowed' : 'pointer',
                  opacity: isSavingNotes ? 0.7 : 1
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingMonth && (() => {
        logger.debug('Rendering edit modal', { editingMonth: editingMonth ? { year: editingMonth.year, month: editingMonth.month } : null });
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
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#1f2937', textAlign: 'left' }}>
                Edit {new Date(editingMonth.year, editingMonth.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            {isProAccount && (
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #0ea5e9',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                fontSize: '14px',
                color: '#0c4a6e'
              }}>
                <strong>Pro Account:</strong> Closes, Bookings, and Cash are calculated automatically from your Sales data by default. Uncheck "Calculate from Sales Data" to manually override any field.
              </div>
            )}

            {editingMonth.lastUpdated && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 8px 0' }}>
                  <strong>Last updated:</strong> {new Date(editingMonth.lastUpdated).toLocaleString()}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Inquiries */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Inquiries
                </label>
                <input
                  type="number"
                  value={editingMonth.inquiries}
                  onChange={(e) => setEditingMonth({ ...editingMonth, inquiries: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Calls Booked */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Calls Booked
                </label>
                <input
                  type="number"
                  value={editingMonth.callsBooked}
                  onChange={(e) => setEditingMonth({ ...editingMonth, callsBooked: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Calls Taken */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Calls Taken
                </label>
                <input
                  type="number"
                  value={editingMonth.callsTaken}
                  onChange={(e) => setEditingMonth({ ...editingMonth, callsTaken: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Dynamic/Manual fields for Pro accounts */}
              {isProAccount && (() => {
                // Get dynamic values for this month
                const dynamicData = calculateDynamicData[editingMonth.month] || { bookings: 0, closes: 0, cash: 0 };
                const closesDynamic = dynamicData.closes;
                const bookingsDynamic = dynamicData.bookings;
                const cashDynamic = dynamicData.cash;
                
                const closesIsManual = editingMonth.closesManual || false;
                const bookingsIsManual = editingMonth.bookingsManual || false;
                const cashIsManual = editingMonth.cashManual || false;
                
                return (
                  <>
                    {/* Closes */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                          Closes
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={!closesIsManual}
                            onChange={(e) => {
                              const isDynamic = e.target.checked;
                              setEditingMonth({ 
                                ...editingMonth, 
                                closesManual: !isDynamic,
                                closes: isDynamic ? closesDynamic : editingMonth.closes
                              });
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                          <label style={{ fontSize: '12px', color: '#6b7280', cursor: 'pointer' }}>
                            Calculate from Sales Data
                          </label>
                        </div>
                      </div>
                      <input
                        type="number"
                        value={closesIsManual ? editingMonth.closes : closesDynamic}
                        disabled={!closesIsManual}
                        onChange={(e) => {
                          if (closesIsManual) {
                            setEditingMonth({ ...editingMonth, closes: parseInt(e.target.value) || 0 });
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          backgroundColor: closesIsManual ? 'white' : '#f9fafb',
                          color: closesIsManual ? '#1f2937' : '#6b7280',
                          cursor: closesIsManual ? 'text' : 'not-allowed'
                        }}
                      />
                    </div>

                    {/* Bookings */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                          Bookings ($)
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={!bookingsIsManual}
                            onChange={(e) => {
                              const isDynamic = e.target.checked;
                              setEditingMonth({ 
                                ...editingMonth, 
                                bookingsManual: !isDynamic,
                                bookings: isDynamic ? bookingsDynamic : editingMonth.bookings
                              });
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                          <label style={{ fontSize: '12px', color: '#6b7280', cursor: 'pointer' }}>
                            Calculate from Sales Data
                          </label>
                        </div>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={bookingsIsManual ? (editingMonth.bookings / 100) : (bookingsDynamic / 100)}
                        disabled={!bookingsIsManual}
                        onChange={(e) => {
                          if (bookingsIsManual) {
                            const newValue = parseFloat(e.target.value) || 0;
                            setEditingMonth({ ...editingMonth, bookings: Math.round(newValue * 100) });
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          backgroundColor: bookingsIsManual ? 'white' : '#f9fafb',
                          color: bookingsIsManual ? '#1f2937' : '#6b7280',
                          cursor: bookingsIsManual ? 'text' : 'not-allowed'
                        }}
                      />
                    </div>

                    {/* Cash */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                          Cash ($)
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={!cashIsManual}
                            onChange={(e) => {
                              const isDynamic = e.target.checked;
                              setEditingMonth({ 
                                ...editingMonth, 
                                cashManual: !isDynamic,
                                cash: isDynamic ? cashDynamic : editingMonth.cash
                              });
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                          <label style={{ fontSize: '12px', color: '#6b7280', cursor: 'pointer' }}>
                            Calculate from Sales Data
                          </label>
                        </div>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={cashIsManual ? (editingMonth.cash / 100) : (cashDynamic / 100)}
                        disabled={!cashIsManual}
                        onChange={(e) => {
                          if (cashIsManual) {
                            const newValue = parseFloat(e.target.value) || 0;
                            setEditingMonth({ ...editingMonth, cash: Math.round(newValue * 100) });
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          backgroundColor: cashIsManual ? 'white' : '#f9fafb',
                          color: cashIsManual ? '#1f2937' : '#6b7280',
                          cursor: cashIsManual ? 'text' : 'not-allowed'
                        }}
                      />
                    </div>
                  </>
                );
              })()}

              {/* Free account fields */}
              {!isProAccount && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Closes
                    </label>
                    <input
                      type="number"
                      value={editingMonth.closes}
                      onChange={(e) => setEditingMonth({ ...editingMonth, closes: parseInt(e.target.value) || 0 })}
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
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Bookings ($)
                    </label>
                    <input
                      type="number"
                      value={editingMonth.bookings / 100}
                      onChange={(e) => setEditingMonth({ ...editingMonth, bookings: (parseFloat(e.target.value) || 0) * 100 })}
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
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Cash ($)
                    </label>
                    <input
                      type="number"
                      value={editingMonth.cash / 100}
                      onChange={(e) => setEditingMonth({ ...editingMonth, cash: (parseFloat(e.target.value) || 0) * 100 })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={handleCloseModal}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!isViewOnly) {
                    logger.debug('Save button clicked');
                    handleSave();
                  }
                }}
                disabled={isViewOnly}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: isViewOnly ? '#e5e7eb' : '#3b82f6',
                  color: isViewOnly ? '#9ca3af' : 'white',
                  fontSize: '14px',
                  cursor: isViewOnly ? 'not-allowed' : 'pointer',
                  opacity: isViewOnly ? 0.5 : 1
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* CSV Import Modal for Leads Report (Funnel page) */}
      {showCSVImport && user && (
        <CSVImportModal
          isOpen={showCSVImport}
          onClose={() => setShowCSVImport(false)}
          onImport={async (result: ImportResult) => {
            if (!user?.id) return;

            try {
              // Leads Report: Do NOT import service types or lead sources
              // These should be managed manually by the user since they can be very custom/nuanced
              // We only import funnel data (inquiries and closes count)

              // Import funnel data (merge with existing data)
              if (dataManager && dataManager.funnelData) {
                for (const newFunnelData of result.funnelData) {
                  const existing = dataManager.funnelData.find(
                    f => f.year === newFunnelData.year && f.month === newFunnelData.month
                  );
                  
                  if (existing) {
                    // Merge: preserve existing inquiries/closes/bookings, add new inquiries
                    const merged: typeof newFunnelData = {
                      ...existing,
                      inquiries: newFunnelData.inquiries > 0 ? newFunnelData.inquiries : existing.inquiries,
                      closes: newFunnelData.closes > 0 ? newFunnelData.closes : existing.closes,
                      bookings: newFunnelData.bookings > 0 ? newFunnelData.bookings : existing.bookings,
                    };
                    await dataManager.saveFunnelData(merged);
                  } else {
                    await dataManager.saveFunnelData(newFunnelData);
                  }
                }
              } else if (user?.id) {
                const existingFunnelData = await UnifiedDataService.getAllFunnelData(user.id);
                for (const newFunnelData of result.funnelData) {
                  const existing = existingFunnelData.find(
                    f => f.year === newFunnelData.year && f.month === newFunnelData.month
                  );
                  
                  if (existing) {
                    const merged: typeof newFunnelData = {
                      ...existing,
                      inquiries: newFunnelData.inquiries > 0 ? newFunnelData.inquiries : existing.inquiries,
                      closes: newFunnelData.closes > 0 ? newFunnelData.closes : existing.closes,
                      bookings: newFunnelData.bookings > 0 ? newFunnelData.bookings : existing.bookings,
                    };
                    await UnifiedDataService.saveFunnelData(user.id, merged);
                  } else {
                    await UnifiedDataService.saveFunnelData(user.id, newFunnelData);
                  }
                }
              }

              // Reload data if using data manager
              if (dataManager && dataManager.loadAllData) {
                await dataManager.loadAllData();
              }

              setShowCSVImport(false);
              // Show success message
              alert(`Successfully imported ${result.funnelData.length} months of funnel data!`);
              window.location.reload(); // Refresh to show updated data
            } catch (error) {
              console.error('Error importing CSV data:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to import data. Please try again.';
              alert(`Import error: ${errorMessage}`);
              throw error; // Re-throw so the modal can handle it
            }
          }}
          existingServiceTypes={serviceTypes}
          existingLeadSources={leadSources}
          userId={user.id}
          pageType="funnel"
        />
      )}
    </div>
  );
}