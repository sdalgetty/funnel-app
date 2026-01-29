import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from './contexts/AuthContext'
// Forecast components kept for potential future Tools page
// import Forecast from './Forecast'
// import ForecastModeling from './ForecastModeling'
import type { FunnelData, Booking, Payment, ServiceType, AdCampaign, LeadSource } from './types'
// ForecastModel type kept for potential future Tools page
import { Users, Phone, CheckCircle, DollarSign, TrendingUp, Target, BarChart3, Plus, ArrowRight, Clock, Calendar } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { UnifiedDataService } from './services/unifiedDataService'
import { logger } from './utils/logger'

type MonthRange = { start: number; end: number }
type TimeFilterOption = { key: string; label: string }

const LEAD_SOURCE_COLORS = [
  '#3b82f6', // Blue
  '#f59e0b', // Orange/Amber
  '#10b981', // Green
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
  '#6366f1', // Indigo
  '#ef4444', // Red
]

const hexToRgba = (hex: string, alpha: number) => {
  const value = hex.replace('#', '')
  const r = parseInt(value.substring(0, 2), 16)
  const g = parseInt(value.substring(2, 4), 16)
  const b = parseInt(value.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const getLeadSourceColorByIndex = (index: number) => {
  const base = LEAD_SOURCE_COLORS[index % LEAD_SOURCE_COLORS.length]
  const cycle = Math.floor(index / LEAD_SOURCE_COLORS.length)
  if (cycle === 0) return base
  const alpha = Math.max(0.4, 0.75 - cycle * 0.15)
  return hexToRgba(base, alpha)
}

const monthToIndex = (year: number, month: number) => year * 12 + (month - 1)

const isMonthInRange = (year: number, month: number, range: MonthRange) => {
  const idx = monthToIndex(year, month)
  return idx >= range.start && idx <= range.end
}

const parseDateToMonthIndex = (date: string | undefined) => {
  if (!date) return null
  const parts = date.split('-')
  if (parts.length < 2) return null
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  return monthToIndex(year, month)
}

const isDateInRange = (date: string | undefined, range: MonthRange) => {
  const idx = parseDateToMonthIndex(date)
  if (idx === null) return false
  return idx >= range.start && idx <= range.end
}

export default function Insights({ dataManager }: { dataManager: any }) {
  const { user, isViewOnly, effectiveUserId } = useAuth()
  const currentDateInfo = useMemo(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  }, [])
  const [sectionFilters, setSectionFilters] = useState<{
    salesFunnel: string
    leadSources: string
    advertising: string
  }>({
    salesFunnel: 'past90Days',
    leadSources: 'past90Days',
    advertising: 'past90Days'
  })
  // Forecast models state removed - keeping for potential future Tools page
  // const [forecastModels, setForecastModels] = useState<ForecastModel[]>([])
  // const [loadingForecastModels, setLoadingForecastModels] = useState(true)
  const [calculatorGoals, setCalculatorGoals] = useState<{
    bookingsRevenueGoal: number;
    cashGoal: number;
  } | null>(null)

  const funnelData: FunnelData[] = dataManager?.funnelData || []
  const bookings: Booking[] = dataManager?.bookings || []
  const payments: Payment[] = dataManager?.payments || []
  const serviceTypes: ServiceType[] = dataManager?.serviceTypes || []
  const adCampaigns: AdCampaign[] = dataManager?.adCampaigns || []
  const leadSources: LeadSource[] = dataManager?.leadSources || []

  const leadSourceColorKey = useMemo(() => {
    const id = effectiveUserId || user?.id
    return id ? `fnnl:leadSourceColors:${id}` : null
  }, [effectiveUserId, user?.id])
  const [leadSourceColors, setLeadSourceColors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!leadSourceColorKey) return
    try {
      const stored = localStorage.getItem(leadSourceColorKey)
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, string>
        setLeadSourceColors(parsed || {})
        return
      }
    } catch {
      // Ignore storage errors
    }
    setLeadSourceColors({})
  }, [leadSourceColorKey])

  useEffect(() => {
    if (!leadSourceColorKey || leadSources.length === 0) return
    const nextColors: Record<string, string> = { ...leadSourceColors }
    let nextIndex = Object.keys(nextColors).length
    let changed = false

    leadSources.forEach((source) => {
      if (!nextColors[source.id]) {
        nextColors[source.id] = getLeadSourceColorByIndex(nextIndex)
        nextIndex += 1
        changed = true
      }
    })

    if (changed) {
      setLeadSourceColors(nextColors)
      try {
        localStorage.setItem(leadSourceColorKey, JSON.stringify(nextColors))
      } catch {
        // Ignore storage errors
      }
    }
  }, [leadSources, leadSourceColors, leadSourceColorKey])

  const getLeadSourceColor = useCallback(
    (id: string) => leadSourceColors[id] || LEAD_SOURCE_COLORS[0],
    [leadSourceColors]
  )

  // Forecast models loading removed - keeping for potential future Tools page
  // useEffect(() => {
  //   const loadForecastModels = async () => {
  //     const userId = effectiveUserId || user?.id
  //     if (!userId) {
  //       setLoadingForecastModels(false)
  //       return
  //     }
  //     try {
  //       const { UnifiedDataService } = await import('./services/unifiedDataService')
  //       const models = await UnifiedDataService.getForecastModels(userId)
  //       setForecastModels(models)
  //     } catch (error) {
  //       console.error('Error loading forecast models:', error)
  //       setForecastModels([])
  //     } finally {
  //       setLoadingForecastModels(false)
  //     }
  //   }
  //   loadForecastModels()
  // }, [user?.id, effectiveUserId])

  // Load calculator goals
  const loadCalculatorGoals = React.useCallback(async () => {
    const userId = effectiveUserId || user?.id
    if (!userId) return
    try {
      const goals = await UnifiedDataService.getCalculatorGoals(userId)
      if (goals) {
        setCalculatorGoals({
          bookingsRevenueGoal: goals.bookingsRevenueGoal || 0,
          cashGoal: goals.cashGoal || 0,
        })
      } else {
        // Set to empty object if no goals found
        setCalculatorGoals({
          bookingsRevenueGoal: 0,
          cashGoal: 0,
        })
      }
    } catch (error) {
      console.error('Error loading calculator goals:', error)
      // Set to empty object on error as well
      setCalculatorGoals({
        bookingsRevenueGoal: 0,
        cashGoal: 0,
      })
    }
  }, [user?.id, effectiveUserId])

  useEffect(() => {
    loadCalculatorGoals()
    
    // Listen for goal updates from Calculator
    const handleGoalUpdate = () => {
      loadCalculatorGoals()
    }
    window.addEventListener('calculatorGoalsUpdated', handleGoalUpdate)
    
    return () => {
      window.removeEventListener('calculatorGoalsUpdated', handleGoalUpdate)
    }
  }, [loadCalculatorGoals])

  // Forecast check removed - keeping for potential future Tools page
  // const hasActiveForecast = useMemo(() => {
  //   return forecastModels.some(m => m.isActive)
  // }, [forecastModels])

  // Debug logging (development only)
  logger.group('Insights Component Debug', {
    dataManagerExists: !!dataManager,
    dataManagerLoading: dataManager?.loading,
    adCampaignsCount: adCampaigns.length,
    bookingsCount: bookings.length,
    paymentsCount: payments.length,
    leadSourcesCount: leadSources.length,
  });

  const trackableServiceIds = useMemo(() => new Set(serviceTypes.filter(st => st.tracksInFunnel).map(st => st.id)), [serviceTypes])

  const yearsWithBookings = useMemo(() => {
    const years = new Set<number>()
    bookings.forEach(b => {
      if (!b?.dateBooked) return
      const year = parseInt(b.dateBooked.split('-')[0], 10)
      if (Number.isFinite(year) && year < currentDateInfo.year) {
        years.add(year)
      }
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [bookings, currentDateInfo.year])

  const timeFilterOptions = useMemo(() => {
    const currentYear = currentDateInfo.year
    const lastYear = currentYear - 1
    const yearBeforeThat = currentYear - 2
    const yearBeforeThat2 = currentYear - 3
    
    const baseOptions = [
      { key: 'past30Days', label: 'Current Month' },
      { key: 'past90Days', label: 'Past 3 Months' },
      { key: 'past6Months', label: 'Past 6 Months' },
      { key: 'past12Months', label: 'Past 12 Months' },
      { key: 'currentYear', label: `${currentYear}` },
      { key: `year-${lastYear}`, label: `${lastYear}` },
      { key: `year-${yearBeforeThat}`, label: `${yearBeforeThat}` },
      { key: `year-${yearBeforeThat2}`, label: `${yearBeforeThat2}` }
    ]
    
    // Add any additional years from bookings that aren't already in the list
    const additionalYearOptions = yearsWithBookings
      .filter(year => year !== currentYear && year !== lastYear && year !== yearBeforeThat && year !== yearBeforeThat2)
      .map(year => ({ key: `year-${year}`, label: `${year}` }))
    
    return [...baseOptions, ...additionalYearOptions]
  }, [yearsWithBookings, currentDateInfo.year])

  const validFilterKeys = useMemo(() => new Set(timeFilterOptions.map(option => option.key)), [timeFilterOptions])

  useEffect(() => {
    setSectionFilters(prev => {
      let changed = false
      const next = { ...prev }
      ;(['salesFunnel', 'leadSources', 'advertising'] as const).forEach(section => {
        if (!validFilterKeys.has(prev[section])) {
          next[section] = 'past90Days'
          changed = true
        }
      })
      // Only update if something actually changed to prevent infinite loops
      return changed ? next : prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilterOptions]) // Use timeFilterOptions directly instead of validFilterKeys to avoid Set reference issues

  const buildMonthRange = useCallback((filterKey: string): MonthRange => {
    const now = new Date()
    const currentMonthIndex = currentDateInfo.year * 12 + currentDateInfo.month
    
    switch (filterKey) {
      case 'past30Days': {
        // Current month only
        return { start: currentMonthIndex, end: currentMonthIndex }
      }
      case 'past90Days': {
        // Past 3 months: current + previous 2
        const start = currentMonthIndex - 2
        return { start: Math.max(0, start), end: currentMonthIndex }
      }
      case 'past6Months': {
        const start = currentMonthIndex - 5
        return { start: Math.max(0, start), end: currentMonthIndex }
      }
      case 'past12Months': {
        const start = currentMonthIndex - 11
        return { start: Math.max(0, start), end: currentMonthIndex }
      }
      case 'currentYear':
        return {
          start: monthToIndex(currentDateInfo.year, 1),
          end: monthToIndex(currentDateInfo.year, 12)
        }
      default:
        if (filterKey.startsWith('year-')) {
          const year = parseInt(filterKey.split('-')[1], 10)
          if (Number.isFinite(year)) {
            return {
              start: monthToIndex(year, 1),
              end: monthToIndex(year, 12)
            }
          }
        }
        // Default to current month if unknown filter
        return { start: currentMonthIndex, end: currentMonthIndex }
    }
  }, [currentDateInfo])

  const handleFilterChange = useCallback((section: 'salesFunnel' | 'leadSources' | 'advertising', value: string) => {
    setSectionFilters(prev => ({ ...prev, [section]: value }))
  }, [])

  // SALES FUNNEL
  const salesFunnelRange = useMemo(() => buildMonthRange(sectionFilters.salesFunnel), [buildMonthRange, sectionFilters.salesFunnel])
  
  // Calculate dynamic values for the filtered range (same logic as Funnel component)
  const calculateDynamicDataForRange = useMemo(() => {
    const monthlyData: { [key: string]: { bookings: number; closes: number; cash: number } } = {}
    
    // Initialize months in range
    for (let year = Math.floor(salesFunnelRange.start / 12); year <= Math.floor(salesFunnelRange.end / 12); year++) {
      for (let month = 1; month <= 12; month++) {
        const idx = monthToIndex(year, month)
        if (idx >= salesFunnelRange.start && idx <= salesFunnelRange.end) {
          const key = `${year}-${month}`
          monthlyData[key] = { bookings: 0, closes: 0, cash: 0 }
        }
      }
    }
    
    // Helper to parse year/month from date string
    const parseYearMonth = (dateString: string | undefined | null): { year: number; month: number } | null => {
      if (!dateString) return null
      const parts = dateString.split('-')
      if (parts.length >= 2) {
        const yearNum = parseInt(parts[0], 10)
        const monthNum = parseInt(parts[1], 10)
        if (Number.isFinite(yearNum) && Number.isFinite(monthNum) && monthNum >= 1 && monthNum <= 12) {
          return { year: yearNum, month: monthNum }
        }
      }
      return null
    }
    
    // Calculate bookings and closes from sales data
    bookings.forEach((booking: Booking) => {
      const parsed = parseYearMonth(booking?.dateBooked)
      if (!parsed) return
      const idx = monthToIndex(parsed.year, parsed.month)
      if (idx < salesFunnelRange.start || idx > salesFunnelRange.end) return
      
      const key = `${parsed.year}-${parsed.month}`
      if (!monthlyData[key]) monthlyData[key] = { bookings: 0, closes: 0, cash: 0 }
      
      monthlyData[key].bookings += booking.bookedRevenue || 0
      if (trackableServiceIds.has(booking.serviceTypeId)) {
        monthlyData[key].closes += 1
      }
    })
    
    // Calculate Cash from scheduled/expected payments
    payments.forEach((payment: Payment) => {
      let dateStr = payment.expectedDate || payment.dueDate || payment.paymentDate
      if (!dateStr) return
      
      const parsed = parseYearMonth(dateStr)
      if (!parsed) return
      const idx = monthToIndex(parsed.year, parsed.month)
      if (idx < salesFunnelRange.start || idx > salesFunnelRange.end) return
      
      const key = `${parsed.year}-${parsed.month}`
      if (!monthlyData[key]) monthlyData[key] = { bookings: 0, closes: 0, cash: 0 }
      
      monthlyData[key].cash += payment.amount || payment.amountCents || 0
    })
    
    return monthlyData
  }, [salesFunnelRange, bookings, payments, trackableServiceIds])
  
  // Apply manual override logic to funnel data (same as Funnel component)
  // For "Current Year", ensure we include ALL 12 months (even if not in funnelData yet)
  const salesFunnelMonths = useMemo(() => {
    const existingMonths = funnelData.filter(month => isMonthInRange(month.year, month.month, salesFunnelRange))
    
    // If filtering for a full year (currentYear or year-YYYY), create all 12 months
    const isFullYear = sectionFilters.salesFunnel === 'currentYear' || sectionFilters.salesFunnel.startsWith('year-')
    let targetYear = currentDateInfo.year
    if (sectionFilters.salesFunnel.startsWith('year-')) {
      targetYear = parseInt(sectionFilters.salesFunnel.split('-')[1], 10)
    }
    
    if (isFullYear) {
      // Create all 12 months for the target year
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      return months.map((monthName, index) => {
        const monthNumber = index + 1
        const existingData = existingMonths.find(m => m.year === targetYear && m.month === monthNumber)
        const key = `${targetYear}-${monthNumber}`
        const dynamicData = calculateDynamicDataForRange[key] || { bookings: 0, closes: 0, cash: 0 }
        
        // Use manual value if flag is set, otherwise use dynamic value
        return {
          id: existingData?.id || `${targetYear}_${monthName.toLowerCase()}`,
          year: targetYear,
          month: monthNumber,
          inquiries: existingData?.inquiries || 0,
          callsBooked: existingData?.callsBooked || 0,
          callsTaken: existingData?.callsTaken || 0,
          closes: existingData?.closesManual ? (existingData.closes || 0) : dynamicData.closes,
          bookings: existingData?.bookingsManual ? (existingData.bookings || 0) : dynamicData.bookings,
          cash: existingData?.cashManual ? (existingData.cash || 0) : dynamicData.cash,
          closesManual: existingData?.closesManual || false,
          bookingsManual: existingData?.bookingsManual || false,
          cashManual: existingData?.cashManual || false,
          notes: existingData?.notes || '',
          lastUpdated: existingData?.lastUpdated || new Date().toISOString()
        }
      })
    } else {
      // For month ranges, only use existing months
      return existingMonths.map(month => {
        const key = `${month.year}-${month.month}`
        const dynamicData = calculateDynamicDataForRange[key] || { bookings: 0, closes: 0, cash: 0 }
        
        // Use manual value if flag is set, otherwise use dynamic value
        return {
          ...month,
          closes: month.closesManual ? (month.closes || 0) : dynamicData.closes,
          bookings: month.bookingsManual ? (month.bookings || 0) : dynamicData.bookings,
          cash: month.cashManual ? (month.cash || 0) : dynamicData.cash
        }
      })
    }
  }, [funnelData, salesFunnelRange, calculateDynamicDataForRange, sectionFilters.salesFunnel, currentDateInfo.year])
  
  // Calculate average wedding booking for the filtered period
  const avgWeddingBooking = useMemo(() => {
    // Find Wedding service type
    const weddingServiceType = serviceTypes.find(st => st.name === 'Wedding')
    if (!weddingServiceType) return 0
    
    // Filter bookings for the selected time range that are Wedding service type
    const weddingBookings = bookings.filter(b => {
      if (b.serviceTypeId !== weddingServiceType.id) return false
      return isDateInRange(b.dateBooked, salesFunnelRange)
    })
    
    if (weddingBookings.length === 0) return 0
    
    // Calculate average: total revenue / number of bookings
    const totalRevenue = weddingBookings.reduce((sum, b) => sum + (b.bookedRevenue || 0), 0)
    return Math.round(totalRevenue / weddingBookings.length)
  }, [bookings, serviceTypes, salesFunnelRange])

  // Use values from funnelData which already respects manual overrides
  const salesTotals = useMemo(() => {
    const totalInquiries = salesFunnelMonths.reduce((sum, month) => sum + (month.inquiries || 0), 0)
    const totalCash = salesFunnelMonths.reduce((sum, month) => sum + (month.cash || 0), 0)
    // Use closes and bookings from funnelData (respects manual overrides)
    const totalCloses = salesFunnelMonths.reduce((sum, month) => sum + (month.closes || 0), 0)
    const totalBookings = salesFunnelMonths.reduce((sum, month) => sum + (month.bookings || 0), 0)
    
    // For date-based ranges, use a fixed divisor; for month-based ranges, count months with data
    let divisor: number
    if (sectionFilters.salesFunnel === 'past30Days') {
      divisor = 1 // 30 days ≈ 1 month
    } else if (sectionFilters.salesFunnel === 'past90Days') {
      divisor = 3 // 90 days ≈ 3 months
    } else {
      // For month-based ranges, count months with data
      divisor = salesFunnelMonths.filter(month =>
        (month.inquiries || 0) > 0 ||
        (month.callsBooked || 0) > 0 ||
        (month.callsTaken || 0) > 0 ||
        (month.closes || 0) > 0 ||
        (month.bookings || 0) > 0
      ).length
    }
    
    const monthsWithData = divisor // Keep for compatibility
    const avgInquiries = divisor > 0 ? Math.round(totalInquiries / divisor) : 0
    const avgCloses = divisor > 0 ? Math.round(totalCloses / divisor) : 0
    const avgBookings = divisor > 0 ? Math.round(totalBookings / divisor) : 0
    const avgCash = divisor > 0 ? Math.round(totalCash / divisor) : 0
    const inquiryToClose = totalInquiries > 0 ? ((totalCloses / totalInquiries) * 100).toFixed(1) : '0.0'
    return { totalInquiries, totalCloses, totalBookings, totalCash, inquiryToClose, monthsWithData, avgInquiries, avgCloses, avgBookings, avgCash, avgWeddingBooking }
  }, [salesFunnelMonths, avgWeddingBooking, sectionFilters.salesFunnel])

  const callTotals = useMemo(() => {
    const totalInquiries = salesFunnelMonths.reduce((sum, month) => sum + (month.inquiries || 0), 0)
    const totalCallsBooked = salesFunnelMonths.reduce((sum, month) => sum + (month.callsBooked || 0), 0)
    const totalCallsTaken = salesFunnelMonths.reduce((sum, month) => sum + (month.callsTaken || 0), 0)
    // Use closes and bookings from funnelData (respects manual overrides)
    const totalCloses = salesFunnelMonths.reduce((sum, month) => sum + (month.closes || 0), 0)
    const totalBookings = salesFunnelMonths.reduce((sum, month) => sum + (month.bookings || 0), 0)
    
    // For date-based ranges, use a fixed divisor; for month-based ranges, count months with data
    let divisor: number
    if (sectionFilters.salesFunnel === 'past30Days') {
      divisor = 1 // 30 days ≈ 1 month
    } else if (sectionFilters.salesFunnel === 'past90Days') {
      divisor = 3 // 90 days ≈ 3 months
    } else {
      // For month-based ranges, count months with data
      divisor = salesFunnelMonths.filter(month =>
        (month.inquiries || 0) > 0 ||
        (month.callsBooked || 0) > 0 ||
        (month.callsTaken || 0) > 0 ||
        (month.closes || 0) > 0 ||
        (month.bookings || 0) > 0
      ).length
    }
    
    const avgCallsBooked = divisor > 0 ? Math.round(totalCallsBooked / divisor) : 0
    const avgCallsTaken = divisor > 0 ? Math.round(totalCallsTaken / divisor) : 0
    const inquiryToBooked = totalInquiries > 0 ? ((totalCallsBooked / totalInquiries) * 100).toFixed(1) : '0.0'
    const inquiryToTaken = totalInquiries > 0 ? ((totalCallsTaken / totalInquiries) * 100).toFixed(1) : '0.0'
    const showUpRate = totalCallsBooked > 0 ? ((totalCallsTaken / totalCallsBooked) * 100).toFixed(1) : '0.0'
    const takenToClose = totalCallsTaken > 0 ? ((totalCloses / totalCallsTaken) * 100).toFixed(1) : '0.0'
    const revenuePerCallTaken = totalCallsTaken > 0 ? Math.round(totalBookings / totalCallsTaken) : 0
    return { totalCallsBooked, totalCallsTaken, inquiryToBooked, inquiryToTaken, showUpRate, takenToClose, revenuePerCallTaken, avgCallsBooked, avgCallsTaken }
  }, [salesFunnelMonths, sectionFilters.salesFunnel])

  // Calculate average time metrics for bookings in the selected range
  const bookingTimeMetrics = useMemo(() => {
    // Filter bookings by tracked service types and selected time range (based on dateBooked)
    const filteredBookings = bookings.filter(b => {
      if (!b.dateBooked) return false
      if (!trackableServiceIds.has(b.serviceTypeId)) return false
      return isDateInRange(b.dateBooked, salesFunnelRange)
    })

    // Calculate average days from inquiry to booking
    const inquiryToBookingDays: number[] = []
    filteredBookings.forEach(b => {
      if (b.dateInquired && b.dateBooked) {
        try {
          const inquiredDate = new Date(b.dateInquired)
          const bookedDate = new Date(b.dateBooked)
          if (!isNaN(inquiredDate.getTime()) && !isNaN(bookedDate.getTime())) {
            const diffTime = bookedDate.getTime() - inquiredDate.getTime()
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
            if (diffDays >= 0) { // Only count positive differences
              inquiryToBookingDays.push(diffDays)
            }
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
    })
    const avgDaysInquiryToBooking = inquiryToBookingDays.length > 0
      ? Math.round(inquiryToBookingDays.reduce((sum, days) => sum + days, 0) / inquiryToBookingDays.length)
      : null

    // Calculate average months from booking to wedding/project date
    const bookingToWeddingMonths: number[] = []
    filteredBookings.forEach(b => {
      if (b.dateBooked && b.projectDate) {
        try {
          const bookedDate = new Date(b.dateBooked)
          const projectDate = new Date(b.projectDate)
          if (!isNaN(bookedDate.getTime()) && !isNaN(projectDate.getTime())) {
            // Calculate months more accurately
            const yearDiff = projectDate.getFullYear() - bookedDate.getFullYear()
            const monthDiff = projectDate.getMonth() - bookedDate.getMonth()
            const dayDiff = projectDate.getDate() - bookedDate.getDate()
            
            // Total months = years * 12 + months, with day adjustment
            let totalMonths = yearDiff * 12 + monthDiff
            if (dayDiff < 0) {
              // If the day hasn't passed yet this month, subtract a month
              totalMonths -= 1
            }
            
            if (totalMonths >= 0) { // Only count positive differences
              bookingToWeddingMonths.push(totalMonths)
            }
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
    })
    const avgMonthsBookingToWedding = bookingToWeddingMonths.length > 0
      ? Math.round((bookingToWeddingMonths.reduce((sum, months) => sum + months, 0) / bookingToWeddingMonths.length) * 10) / 10 // Round to 1 decimal
      : null

    return { avgDaysInquiryToBooking, avgMonthsBookingToWedding }
  }, [bookings, salesFunnelRange, trackableServiceIds])

  // LEAD SOURCES
  const leadSourcesRange = useMemo(() => buildMonthRange(sectionFilters.leadSources), [buildMonthRange, sectionFilters.leadSources])
  const leadSourceBookings = useMemo(
    () => bookings.filter(b => trackableServiceIds.has(b.serviceTypeId) && isDateInRange(b.dateBooked, leadSourcesRange)),
    [bookings, leadSourcesRange, trackableServiceIds]
  )
  const leadSourceBreakdown = useMemo(() => {
    const byCount: Record<string, number> = {}
    const byRevenue: Record<string, number> = {}
    leadSourceBookings.forEach(b => {
      const lsId = b.leadSourceId
      byCount[lsId] = (byCount[lsId] || 0) + 1
      byRevenue[lsId] = (byRevenue[lsId] || 0) + (b.bookedRevenue || 0)
    })
    const totalCount = Object.values(byCount).reduce((sum, value) => sum + value, 0)
    const totalRevenue = Object.values(byRevenue).reduce((sum, value) => sum + value, 0)
    const items = Object.keys(byCount).map(lsId => {
      const name = leadSources.find(l => l.id === lsId)?.name || 'Unknown'
      const count = byCount[lsId] || 0
      const revenue = byRevenue[lsId] || 0
      const avgRevenue = count > 0 ? Math.round(revenue / count) : 0
      const pctCount = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
      const pctRevenue = totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0
      return { id: lsId, name, count, revenue, avgRevenue, pctCount, pctRevenue }
    })
    const byCountDesc = [...items].sort((a, b) => b.count - a.count)
    const byRevenueDesc = [...items].sort((a, b) => b.revenue - a.revenue)
    const byAvgRevenueDesc = [...items].sort((a, b) => b.avgRevenue - a.avgRevenue)
    return { items, totalCount, totalRevenue, byCountDesc, byRevenueDesc, byAvgRevenueDesc }
  }, [leadSourceBookings, leadSources])

  // ADVERTISING
  const advertisingRange = useMemo(() => buildMonthRange(sectionFilters.advertising), [buildMonthRange, sectionFilters.advertising])
  const filteredAdCampaigns = useMemo(
    () => adCampaigns.filter(c => !c.id.startsWith('default_') && isMonthInRange(c.year, c.month, advertisingRange)),
    [adCampaigns, advertisingRange]
  )
  const dedupedAdCampaigns = useMemo(() => {
    const seenKeys = new Set<string>()
    const campaigns: AdCampaign[] = []
    filteredAdCampaigns.forEach(campaign => {
      const key = `${campaign.leadSourceId}_${campaign.year}_${campaign.month}`
      if (!seenKeys.has(key)) {
        seenKeys.add(key)
        campaigns.push(campaign)
      }
    })
    return campaigns
  }, [filteredAdCampaigns])
  const advertisingBookings = useMemo(
    () => bookings.filter(b => isDateInRange(b.dateBooked, advertisingRange)),
    [bookings, advertisingRange]
  )
  const advertisingLeadSourceIds = useMemo(() => {
    const ids = new Set<string>()
    dedupedAdCampaigns.forEach(c => ids.add(c.leadSourceId))
    return ids
  }, [dedupedAdCampaigns])
  const advertisingTotals = useMemo<{
    totalAdLeads: number
    totalAdSpend: number
    totalBookedFromAds: number
    overallROI: number | null
    costPerClose: number
  }>(() => {
    if (!dataManager || dataManager.loading) {
      return { totalAdLeads: 0, totalAdSpend: 0, totalBookedFromAds: 0, overallROI: null, costPerClose: 0 }
    }
    // If ads tracking is enabled, use funnel data instead of ad_campaigns
    if (user?.adsTrackingEnabled) {
      // Calculate from funnelData for months in the selected range
      const filteredMonths = funnelData.filter(month => isMonthInRange(month.year, month.month, advertisingRange))
      const totalAdSpend = filteredMonths.reduce((sum, month) => sum + (month.adsSpend || 0), 0)
      const totalAdLeads = filteredMonths.reduce((sum, month) => sum + (month.adsLead || 0), 0)
      
      // Filter bookings by ad lead sources
      const adLeadSourceIds = new Set(leadSources.filter(ls => ls.isAdSource).map(ls => ls.id))
      const bookingsFromAds = advertisingBookings.filter(b => b.leadSourceId && adLeadSourceIds.has(b.leadSourceId))
      const totalBookedFromAds = bookingsFromAds.reduce((sum, booking) => sum + (booking.revenue || booking.bookedRevenue || 0), 0)
      const closesFromAds = bookingsFromAds.length
      const overallROI = totalAdSpend > 0 && totalBookedFromAds > 0 ? totalBookedFromAds / totalAdSpend : null
      const costPerClose = closesFromAds > 0 ? Math.round(totalAdSpend / closesFromAds) : 0
      return { totalAdLeads, totalAdSpend, totalBookedFromAds, overallROI, costPerClose }
    }
    
    // Fallback to old ad_campaigns approach (for backwards compatibility)
    if (dedupedAdCampaigns.length === 0) {
      return { totalAdLeads: 0, totalAdSpend: 0, totalBookedFromAds: 0, overallROI: null, costPerClose: 0 }
    }
    const totalAdSpend = dedupedAdCampaigns.reduce((sum, campaign) => {
      const spend = campaign.spend ?? campaign.adSpendCents ?? 0
      return sum + spend
    }, 0)
    const totalAdLeads = dedupedAdCampaigns.reduce((sum, campaign) => sum + (campaign.leadsGenerated || 0), 0)
    const bookingsFromAds = advertisingBookings.filter(b => advertisingLeadSourceIds.has(b.leadSourceId))
    const totalBookedFromAds = bookingsFromAds.reduce((sum, booking) => sum + (booking.revenue || booking.bookedRevenue || 0), 0)
    const closesFromAds = bookingsFromAds.length
    const overallROI = totalAdSpend > 0 && totalBookedFromAds > 0 ? totalBookedFromAds / totalAdSpend : null
    const costPerClose = closesFromAds > 0 ? Math.round(totalAdSpend / closesFromAds) : 0
    return { totalAdLeads, totalAdSpend, totalBookedFromAds, overallROI, costPerClose }
  }, [dataManager, dataManager?.loading, user?.adsTrackingEnabled, funnelData, advertisingRange, leadSources, dedupedAdCampaigns, advertisingBookings, advertisingLeadSourceIds])

  const toUSD = (cents: number) => (cents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' })
  const formatNumber = (n: number) => n.toLocaleString()

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, color: '#1f2937' }}>Insights</h1>
          <div style={{ marginTop: '6px', fontSize: '15px', fontWeight: 500, color: '#4b5563' }}>
            Know where your business stands — and where it’s headed.
          </div>
          <div style={{ marginTop: '4px', fontSize: '14px', fontWeight: 400, color: '#6b7280', maxWidth: '720px' }}>
            This page turns your sales data into signals about performance, momentum, and focus.
          </div>
        </div>
      </div>

      {/* Welcome Section and Tasks */}
      <WelcomeAndTasks 
        user={user}
        funnelData={funnelData}
        dataManager={dataManager}
        calculatorGoals={calculatorGoals}
        bookings={bookings}
        payments={payments}
        currentYear={currentDateInfo.year}
      />

      {/* SALES FUNNEL */}
      <Section
        title="Sales Funnel"
        actions={
          <TimeFilterSelect
            value={sectionFilters.salesFunnel}
            onChange={(value) => handleFilterChange('salesFunnel', value)}
            options={timeFilterOptions}
          />
        }
      >
        <Cards columns={2}>
          {/* Row 1 */}
          <Card icon={<Users size={20} color="#3b82f6" />} label="Inquiries" value={formatNumber(salesTotals.totalInquiries)} sub={`Avg: ${formatNumber(salesTotals.avgInquiries)}/month`} />
          <Card icon={<Phone size={20} color="#10b981" />} label="Calls Booked" value={formatNumber(callTotals.totalCallsBooked)} sub={`Avg: ${formatNumber(callTotals.avgCallsBooked)}/month`} />
          <Card icon={<Phone size={20} color="#f59e0b" />} label="Calls Taken" value={formatNumber(callTotals.totalCallsTaken)} sub={`Avg: ${formatNumber(callTotals.avgCallsTaken)}/month`} />
          <Card icon={<CheckCircle size={20} color="#ef4444" />} label="Closes" value={formatNumber(salesTotals.totalCloses)} sub={`Avg: ${formatNumber(salesTotals.avgCloses)}/month`} />

          {/* Row 2 */}
          <Card icon={<DollarSign size={20} color="#8b5cf6" />} label="Bookings" value={toUSD(salesTotals.totalBookings)} sub={`Avg: ${toUSD(salesTotals.avgBookings)}/month`} />
          <Card icon={<DollarSign size={20} color="#10b981" />} label="Cash" value={toUSD(salesTotals.totalCash)} sub={`Avg: ${toUSD(salesTotals.avgCash)}/month`} />
          <Card icon={<DollarSign size={20} color="#10b981" />} label="Revenue Per Call Taken" value={toUSD(callTotals.revenuePerCallTaken)} sub="Per call value" />
          <Card icon={<DollarSign size={20} color="#f59e0b" />} label="Average Wedding Booking" value={toUSD(salesTotals.avgWeddingBooking)} sub="Wedding service average" />

          {/* Row 3 */}
          <Card icon={<Users size={20} color="#3b82f6" />} label="Inquiry to Call Taken %" value={`${callTotals.inquiryToTaken}%`} sub="Inquiry conversion" />
          <Card icon={<CheckCircle size={20} color="#ef4444" />} label="Call Taken to Close %" value={`${callTotals.takenToClose}%`} sub="Call completion" />
          <Card icon={<TrendingUp size={20} color="#06b6d4" />} label="Inquiry to Close %" value={`${salesTotals.inquiryToClose}%`} sub="Overall conversion" />
          <Card icon={<Target size={20} color="#8b5cf6" />} label="Call Show Up Rate" value={`${callTotals.showUpRate}%`} sub="Call attendance" />

          {/* Row 4 */}
          <Card icon={<Clock size={20} color="#ec4899" />} label="Time from Inquiry to Booking" value={bookingTimeMetrics.avgDaysInquiryToBooking !== null ? `${bookingTimeMetrics.avgDaysInquiryToBooking} days` : 'N/A'} sub="Average days" />
          <Card icon={<Calendar size={20} color="#14b8a6" />} label="Time from Booking to Wedding" value={bookingTimeMetrics.avgMonthsBookingToWedding !== null ? `${bookingTimeMetrics.avgMonthsBookingToWedding} months` : 'N/A'} sub="Average months" />
        </Cards>
      </Section>

      {/* Forecast sections removed - keeping code for potential future Tools page */}

      {/* LEAD SOURCES */}
      <Section
        title="Lead Sources"
        actions={
          <TimeFilterSelect
            value={sectionFilters.leadSources}
            onChange={(value) => handleFilterChange('leadSources', value)}
            options={timeFilterOptions}
          />
        }
      >
        {/* Pie Chart Visualizations */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: isMobile ? 12 : 16, marginBottom: isMobile ? 12 : 16 }}>
            {/* Bookings by Lead Source Pie Chart */}
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: isMobile ? 16 : 24 }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: 16, fontWeight: 600, color: '#1f2937' }}>Number of Bookings by Lead Source</h3>
              {leadSourceBreakdown.items.length === 0 ? (
                <p style={{ fontSize: 13, color: '#6b7280' }}>
                  No lead source data exists for the selected time range. You can either adjust the time range or add new sales data.
                </p>
              ) : (
                <LeadSourcePieChart
                  data={leadSourceBreakdown.byCountDesc}
                  isMobile={isMobile}
                  toUSD={toUSD}
                  formatNumber={formatNumber}
                  getColor={getLeadSourceColor}
                />
              )}
            </div>
            
            {/* Revenue by Lead Source Pie Chart */}
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: isMobile ? 16 : 24 }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: 16, fontWeight: 600, color: '#1f2937' }}>Total Booked Revenue by Lead Source</h3>
              {leadSourceBreakdown.items.length === 0 ? (
                <p style={{ fontSize: 13, color: '#6b7280' }}>
                  No lead source data exists for the selected time range. You can either adjust the time range or add new sales data.
                </p>
              ) : (
                <LeadSourcePieChart
                  data={leadSourceBreakdown.byRevenueDesc.map(item => ({ 
                    id: item.id,
                    name: item.name, 
                    count: item.count,
                    revenue: item.revenue,
                    pctCount: item.pctRevenue 
                  }))} 
                  isMobile={isMobile} 
                  showRevenue 
                  toUSD={toUSD}
                  formatNumber={formatNumber}
                  getColor={getLeadSourceColor}
                />
              )}
            </div>

            {/* Average Booking by Lead Source Bar Chart */}
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: isMobile ? 16 : 24 }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: 16, fontWeight: 600, color: '#1f2937' }}>Average Booking Amount by Lead Source</h3>
              {leadSourceBreakdown.items.length === 0 ? (
                <p style={{ fontSize: 13, color: '#6b7280' }}>
                  No lead source data exists for the selected time range. You can either adjust the time range or add new sales data.
                </p>
              ) : (
                <div>
                  {leadSourceBreakdown.byAvgRevenueDesc.map(item => {
                    const maxAvg = leadSourceBreakdown.byAvgRevenueDesc[0]?.avgRevenue || 0
                    const widthPct = maxAvg > 0 ? Math.round((item.avgRevenue / maxAvg) * 100) : 0
                    const barColor = getLeadSourceColor(item.id)
                    return (
                      <div key={item.id} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <div style={{ flex: 1, color: '#374151' }}>{item.name}</div>
                          <div style={{ color: '#6b7280', fontSize: 12 }}>{toUSD(item.avgRevenue)}</div>
                        </div>
                        <div style={{ height: 8, background: hexToRgba(barColor, 0.12), borderRadius: 4 }}>
                          <div style={{ width: `${widthPct}%`, height: '100%', background: barColor, borderRadius: 4 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
      </Section>

      {/* ADVERTISING - Only show if ads tracking is enabled */}
      {user?.adsTrackingEnabled && (
        <Section
          title="Advertising"
          actions={
            <TimeFilterSelect
              value={sectionFilters.advertising}
              onChange={(value) => handleFilterChange('advertising', value)}
              options={timeFilterOptions}
            />
          }
        >
          <Cards columns={2} desktopColumns={5}>
            <Card icon={<Users size={20} color="#06b6d4" />} label="Total Ad Leads" value={formatNumber(advertisingTotals.totalAdLeads)} />
            <Card icon={<DollarSign size={20} color="#3b82f6" />} label="Total Ad Spend" value={toUSD(advertisingTotals.totalAdSpend)} />
            <Card icon={<TrendingUp size={20} color="#10b981" />} label="Total Booked from Ads" value={toUSD(advertisingTotals.totalBookedFromAds)} />
            <Card icon={<BarChart3 size={20} color="#f59e0b" />} label="Ad Spend ROI" value={advertisingTotals.overallROI !== null ? advertisingTotals.overallROI.toFixed(2) : 'N/A'} />
            <Card icon={<Target size={20} color="#8b5cf6" />} label="Cost Per Close" value={toUSD(advertisingTotals.costPerClose)} />
          </Cards>
        </Section>
      )}
    </div>
  )
}

// Lead Source Pie Chart Component using recharts
function LeadSourcePieChart({ data, isMobile, showRevenue = false, toUSD, formatNumber, getColor }: { 
  data: Array<{ id: string; name: string; count: number; revenue?: number; pctCount: number }>; 
  isMobile: boolean; 
  showRevenue?: boolean;
  toUSD: (cents: number) => string;
  formatNumber: (n: number) => string;
  getColor: (id: string) => string;
}) {
  // Prepare data for recharts
  const chartData = data.map((item) => ({
    name: item.name,
    value: showRevenue ? (item.revenue || 0) : item.count,
    percentage: item.pctCount,
    color: getColor(item.id),
    count: item.count,
    revenue: item.revenue || 0,
  }))
  
  // Custom label formatter
  const renderLabel = (entry: any) => {
    return `${entry.percentage}%`
  }
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: '#1f2937' }}>{data.payload.name}</p>
          {showRevenue ? (
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
              {toUSD(data.payload.revenue)} ({data.payload.percentage}%)
            </p>
          ) : (
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
              {formatNumber(data.payload.count)} bookings ({data.payload.percentage}%)
            </p>
          )}
        </div>
      )
    }
    return null
  }
  
  // Dynamic height for the pie itself (legend is rendered below the chart)
  const chartHeight = useMemo(() => {
    const radius = isMobile ? 80 : 100
    const chartBase = radius * 2 + 60 // pie diameter + clearance for % labels outside
    const minHeight = isMobile ? 220 : 260
    return Math.max(minHeight, Math.round(chartBase))
  }, [isMobile])
  
  return (
    <div style={{ width: '100%' }}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={data.length > 1 ? renderLabel : false}
            outerRadius={isMobile ? 80 : 100}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={400}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
        {chartData.map((entry, index) => (
          <div
            key={entry.name || index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px',
              borderRadius: '6px',
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: entry.color,
                flexShrink: 0,
                border: '2px solid #ffffff',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#1f2937', marginBottom: 2 }}>
                {entry.name}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {showRevenue
                  ? `${toUSD(entry.revenue)} (${entry.percentage}%)`
                  : `${formatNumber(entry.count)} bookings (${entry.percentage}%)`
                }
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Section({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return (
    <div style={{ 
      marginBottom: isMobile ? '24px' : '32px', 
      paddingBottom: isMobile ? '24px' : '32px',
      position: 'relative',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        marginBottom: '12px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: 12,
        flexWrap: isMobile ? 'wrap' : 'nowrap'
      }}>
        <h2 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 600, margin: 0, color: '#1f2937', textAlign: 'left' }}>{title}</h2>
        {actions ? (
          <div style={{ flexShrink: 0 }}>{actions}</div>
        ) : null}
      </div>
      <div style={{ position: 'relative' }}>
        {children}
      </div>
    </div>
  )
}

function TimeFilterSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: TimeFilterOption[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <label style={{ fontSize: 12, color: '#6b7280' }}>Time Range</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: 'white', fontSize: 13 }}
      >
        {options.map(option => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function Cards({ children, columns = 4, desktopColumns, mobileColumns }: { children: React.ReactNode; columns?: number; desktopColumns?: number; mobileColumns?: number }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Mobile: use specified columns, Desktop: use desktopColumns or default to 4
  const defaultMobileColumns = columns === 1 ? 1 : 2
  const gridColumns = isMobile ? (mobileColumns ?? defaultMobileColumns) : (desktopColumns || 4)
  
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridColumns}, 1fr)`, gap: isMobile ? 12 : 16 }}>
      {children}
    </div>
  )
}

function Card({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: React.ReactNode }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {icon}
        <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#1f2937' }}>{value}</div>
      {sub && <div style={{ marginTop: 4, fontSize: 12, color: '#6b7280' }}>{sub}</div>}
    </div>
  )
}

// Welcome and Tasks Component
function WelcomeAndTasks({ 
  user, 
  funnelData, 
  dataManager,
  calculatorGoals,
  bookings,
  payments,
  currentYear
}: { 
  user: any; 
  funnelData: FunnelData[]; 
  dataManager: any;
  calculatorGoals?: { bookingsRevenueGoal: number; cashGoal: number } | null;
  bookings?: Booking[];
  payments?: Payment[];
  currentYear?: number;
}) {
  // Forecast models state removed - keeping for potential future Tools page
  // const [forecastModels, setForecastModels] = useState<any[]>([])
  const { user: authUser, effectiveUserId, isViewOnly } = useAuth()

  // Get current and last month info
  const currentMonth = useMemo(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  }, [])

  // Forecast models loading removed - keeping for potential future Tools page
  // useEffect(() => {
  //   const loadForecastModels = async () => {
  //     const userId = effectiveUserId || authUser?.id
  //     if (!userId) return
  //     try {
  //       const { UnifiedDataService } = await import('./services/unifiedDataService')
  //       const models = await UnifiedDataService.getForecastModels(userId)
  //       setForecastModels(models)
  //     } catch (error) {
  //       console.error('Error loading forecast models:', error)
  //     }
  //   }
  //   loadForecastModels()
  // }, [authUser?.id, effectiveUserId])

  const lastEntryDate = useMemo(() => {
    let latest: Date | null = null
    funnelData.forEach(month => {
      if (!month.lastUpdated) return
      const parsed = new Date(month.lastUpdated)
      if (Number.isNaN(parsed.getTime())) return
      if (!latest || parsed > latest) {
        latest = parsed
      }
    })
    return latest
  }, [funnelData])

  const lastEntryLabel = lastEntryDate
    ? lastEntryDate.toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
    : 'Not recorded yet'
  const isEntryStale = !lastEntryDate || (Date.now() - lastEntryDate.getTime()) > (30 * 24 * 60 * 60 * 1000)

  // Forecast model checks removed - keeping for potential future Tools page
  // const hasActiveForecastModel = useMemo(() => {
  //   return forecastModels.some(m => m.isActive)
  // }, [forecastModels])
  // const hasForecastModel = useMemo(() => {
  //   return forecastModels.length > 0
  // }, [forecastModels])
  // const hasActiveForecastModelForCurrentYear = useMemo(() => {
  //   const currentYear = new Date().getFullYear()
  //   return forecastModels.some(m => m.isActive && m.year === currentYear)
  // }, [forecastModels])
  // const isJanuary = useMemo(() => {
  //   const now = new Date()
  //   return now.getMonth() === 0
  // }, [])

  // Handle navigation
  const handleNavigate = (action: string, month?: { year: number; month: number }) => {
    // Dispatch custom event for navigation
    window.dispatchEvent(new CustomEvent('navigateToPage', {
      detail: { action, month }
    }))
  }

  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'there'

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])


  return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr', 
        gap: isMobile ? '16px' : '24px', 
        marginBottom: isMobile ? '36px' : '48px',
        padding: 0,
        alignItems: 'start'
      }}>
        {/* Welcome Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: isMobile ? '20px' : '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', margin: '0 0 8px 0', color: '#1f2937' }}>
            Welcome back {firstName}!
          </h2>
          <p style={{ fontSize: isMobile ? '14px' : '16px', color: '#6b7280', margin: '0 0 12px 0' }}>
            Remember, winning is a numbers game. Go make some moves!
          </p>
          <div style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 500, color: '#6b7280', margin: '0 0 4px 0' }}>
            Last data entry: {lastEntryLabel}
          </div>
          <div style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 400, color: '#9ca3af', margin: '0 0 16px 0' }}>
            {isEntryStale
              ? 'Some insights may be incomplete until your latest data is added.'
              : 'Your insights reflect your most recently added data.'
            }
          </div>
          <button
              onClick={() => !isViewOnly && handleNavigate('edit-funnel', currentMonth)}
              disabled={isViewOnly}
              style={{
                background: isViewOnly ? '#e5e7eb' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: isViewOnly ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: '8px',
                padding: isMobile ? '14px 20px' : '12px 24px',
                fontSize: isMobile ? '16px' : '14px',
                fontWeight: '600',
                cursor: isViewOnly ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isViewOnly ? 0.5 : 1,
                boxShadow: isViewOnly ? 'none' : '0 2px 4px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s',
                alignSelf: 'flex-start'
              }}
              onMouseEnter={(e) => {
                if (isViewOnly) return
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(16, 185, 129, 0.4)'
              }}
              onMouseLeave={(e) => {
                if (isViewOnly) return
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Plus size={isMobile ? 18 : 16} />
              New Data
            </button>
        </div>

        {/* Bottom Row: Goal Tracker + Annualized Pace */}
        {(() => {
          const hasGoals = calculatorGoals && 
                             bookings && 
                             payments && 
                             currentYear && 
                             ((calculatorGoals.bookingsRevenueGoal > 0) || (calculatorGoals.cashGoal > 0));
          
          if (isMobile) {
            // On mobile, stack vertically
            return (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: isMobile ? '24px' : '30px', 
                gridColumn: '1 / -1',
                marginTop: isMobile ? '24px' : '36px'
              }}>
                {hasGoals ? (
                  <GoalVisualization
                    bookingsRevenueGoal={calculatorGoals.bookingsRevenueGoal || 0}
                    cashGoal={calculatorGoals.cashGoal || 0}
                    bookings={bookings}
                    payments={payments}
                    currentYear={currentYear}
                    isMobile={isMobile}
                  />
                ) : (
                  <GoalEmptyState onSetGoals={() => handleNavigate('view-goals')} isMobile={isMobile} />
                )}
                <AnnualizedPace 
                  funnelData={funnelData}
                  bookings={bookings || []}
                  serviceTypes={dataManager?.serviceTypes || []}
                  calculatorGoals={calculatorGoals}
                  currentYear={currentYear}
                  isMobile={isMobile}
                />
              </div>
            );
          } else {
            // On desktop, show side-by-side
            return (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '36px', 
                gridColumn: '1 / -1',
                marginTop: '36px'
              }}>
                {hasGoals ? (
                  <GoalVisualization
                    bookingsRevenueGoal={calculatorGoals.bookingsRevenueGoal || 0}
                    cashGoal={calculatorGoals.cashGoal || 0}
                    bookings={bookings}
                    payments={payments}
                    currentYear={currentYear}
                    isMobile={isMobile}
                  />
                ) : (
                  <GoalEmptyState onSetGoals={() => handleNavigate('view-goals')} isMobile={isMobile} />
                )}
                <AnnualizedPace 
                  funnelData={funnelData}
                  bookings={bookings || []}
                  serviceTypes={dataManager?.serviceTypes || []}
                  calculatorGoals={calculatorGoals}
                  currentYear={currentYear}
                  isMobile={isMobile}
                />
              </div>
            );
          }
        })()}

    </div>
  )
}

function AnnualizedPace({
  funnelData,
  bookings,
  serviceTypes,
  calculatorGoals,
  currentYear,
  isMobile
}: {
  funnelData: FunnelData[];
  bookings: Booking[];
  serviceTypes: ServiceType[];
  calculatorGoals?: { bookingsRevenueGoal: number; cashGoal: number } | null;
  currentYear?: number;
  isMobile: boolean;
}) {
  const { user } = useAuth();
  const [bookingsGoal, setBookingsGoal] = useState<number>(0);
  const yearLabel = currentYear || new Date().getFullYear();

  // Load bookings number goal
  useEffect(() => {
    const loadGoal = async () => {
      if (!user?.id) return;
      try {
        const goals = await UnifiedDataService.getCalculatorGoals(user.id);
        if (goals) {
          setBookingsGoal(goals.bookingsGoal || 0);
        }
      } catch (error) {
        console.error('Error loading bookings goal:', error);
      }
    };
    loadGoal();
  }, [user?.id]);

  const trackableServiceIds = useMemo(
    () => new Set(serviceTypes.filter(st => st.tracksInFunnel).map(st => st.id)),
    [serviceTypes]
  );

  // Calculate pace
  const calculations = useMemo(() => {
    const now = new Date();
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const startIdx = ninetyDaysAgo.getFullYear() * 12 + ninetyDaysAgo.getMonth();
    const endIdx = now.getFullYear() * 12 + now.getMonth();

    const inquiriesLast90 = funnelData.reduce((sum, month) => {
      const idx = month.year * 12 + (month.month - 1);
      if (idx < startIdx || idx > endIdx) return sum;
      return sum + (month.inquiries || 0);
    }, 0);

    const callsLast90 = funnelData.reduce((sum, month) => {
      const idx = month.year * 12 + (month.month - 1);
      if (idx < startIdx || idx > endIdx) return sum;
      return sum + (month.callsTaken || 0);
    }, 0);

    const bookingsLast90 = bookings.filter(b => {
      if (!b?.dateBooked) return false;
      if (!trackableServiceIds.has(b.serviceTypeId)) return false;
      const bookedDate = new Date(b.dateBooked);
      if (Number.isNaN(bookedDate.getTime())) return false;
      return bookedDate >= ninetyDaysAgo && bookedDate <= now;
    }).length;

    const paceInq = Math.round((inquiriesLast90 / 90) * 365);
    const paceCalls = Math.round((callsLast90 / 90) * 365);
    const paceBookings = Math.round((bookingsLast90 / 90) * 365);
    
    // Check if on track for bookings goal
    const isOnTrack = bookingsGoal === 0 || paceBookings >= bookingsGoal;

    return {
      paceInq,
      paceCalls,
      paceBookings,
      isOnTrack,
    };
  }, [bookings, bookingsGoal, funnelData, trackableServiceIds]);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  };

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: isMobile ? '16px' : '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{ marginBottom: '8px' }}>
        <h3 style={{ 
          fontSize: isMobile ? '16px' : '18px', 
          fontWeight: '600', 
          margin: 0, 
          color: '#1f2937' 
        }}>
          Sales Activity Pace for {yearLabel}
        </h3>
      </div>
      <p style={{ margin: '4px 0 16px 0', fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
        Track your pace for the year based on your activity over the last 90 days.
      </p>

      <Cards columns={2} desktopColumns={2} mobileColumns={1}>
        <Card
          icon={<Users size={20} color="#3b82f6" />}
          label="Inquiries Pace"
          value={formatNumber(calculations.paceInq)}
        />
        <Card
          icon={<Phone size={20} color="#10b981" />}
          label="Calls Pace"
          value={formatNumber(calculations.paceCalls)}
        />
        <div style={{ gridColumn: '1 / -1' }}>
          <Card
            icon={<CheckCircle size={20} color="#ef4444" />}
            label="Bookings Pace"
            value={formatNumber(calculations.paceBookings)}
            sub={calculations.isOnTrack ? (
              <span style={{ color: '#065f46' }}>✓ On track</span>
            ) : (
              <span style={{ color: '#991b1b' }}>⚠ Behind goal</span>
            )}
          />
        </div>
      </Cards>
    </div>
  );
}

function GoalVisualization({
  bookingsRevenueGoal,
  cashGoal,
  bookings,
  payments,
  currentYear,
  isMobile
}: {
  bookingsRevenueGoal: number;
  cashGoal: number;
  bookings: Booking[];
  payments: Payment[];
  currentYear: number;
  isMobile: boolean;
}) {
  const [activeView, setActiveView] = useState<'bookings' | 'cash'>('bookings');

  // Calculate YTD totals
  const ytdData = useMemo(() => {
    const bookingYearById = new Map<string, number>();
    bookings.forEach((b) => {
      if (!b?.id || !b?.dateBooked) return;
      const year = parseInt(b.dateBooked.split('-')[0], 10);
      if (Number.isFinite(year)) {
        bookingYearById.set(b.id, year);
      }
    });

    // Bookings Revenue YTD
    const bookingsRevenueYtd = bookings
      .filter((b) => {
        if (!b?.dateBooked) return false;
        try {
          const [y] = b.dateBooked.split('-');
          return parseInt(y, 10) === currentYear;
        } catch {
          return false;
        }
      })
      .reduce((sum, b) => sum + (b?.bookedRevenue || 0), 0);

    // Cash YTD - sum of all payments expected for current year
    let cashYtd = 0;
    let lockedInCash = 0;
    payments.forEach((p) => {
      const dateStr = p?.paymentDate || p?.expectedDate || p?.dueDate;
      if (!dateStr) return;
      const [y] = dateStr.split('-');
      const paymentYear = parseInt(y, 10);
      if (!Number.isFinite(paymentYear) || paymentYear !== currentYear) return;

      const amount = p?.amount || p?.amountCents || 0;
      cashYtd += amount;

      const bookingYear = bookingYearById.get(p?.bookingId);
      if (bookingYear !== undefined && bookingYear < currentYear) {
        lockedInCash += amount;
      }
    });

    return { bookingsRevenueYtd, cashYtd, lockedInCash };
  }, [bookings, payments, currentYear]);

  // Calculate year progress percentage
  const yearProgress = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    const totalDays = Math.ceil((endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    return Math.round((daysElapsed / totalDays) * 100);
  }, []);

  // Calculate metrics for Bookings
  const bookingsMetrics = useMemo(() => {
    if (bookingsRevenueGoal === 0) return null;
    const percentOfPlan = Math.round((ytdData.bookingsRevenueYtd / bookingsRevenueGoal) * 100);
    const pacingDelta = percentOfPlan - yearProgress;
    const remaining = bookingsRevenueGoal - ytdData.bookingsRevenueYtd;
    
    return {
      actual: ytdData.bookingsRevenueYtd,
      goal: bookingsRevenueGoal,
      percentOfPlan,
      pacingDelta,
      remaining,
    };
  }, [ytdData.bookingsRevenueYtd, bookingsRevenueGoal, yearProgress]);

  // Calculate metrics for Cash
  const cashMetrics = useMemo(() => {
    if (cashGoal === 0) return null;

    // Remove cash already locked in from prior-year bookings for pacing only
    const adjustedGoal = Math.max(cashGoal - ytdData.lockedInCash, 0);
    const adjustedActual = Math.max(ytdData.cashYtd - ytdData.lockedInCash, 0);
    const percentOfPlan = Math.round((ytdData.cashYtd / cashGoal) * 100);
    const pacingPercent = adjustedGoal === 0
      ? 100
      : Math.round((adjustedActual / adjustedGoal) * 100);
    const pacingDelta = pacingPercent - yearProgress;
    const remaining = cashGoal - ytdData.cashYtd;
    
    return {
      actual: ytdData.cashYtd,
      goal: cashGoal,
      percentOfPlan,
      pacingDelta,
      remaining,
    };
  }, [ytdData.cashYtd, ytdData.lockedInCash, cashGoal, yearProgress]);

  const toUSD = (cents: number) => (cents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' });

  // Simple pie chart component with percentage in center
    const PieChart = ({ percentage, size = 100 }: { percentage: number; size?: number }) => {
    const strokeWidth = 16;
    const radius = size / 2 - strokeWidth / 2 - 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const displayPercentage = Math.min(percentage, 100);
    
    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={displayPercentage >= 100 ? '#10b981' : '#3b82f6'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: size < 150 ? '26px' : '36px',
            fontWeight: '700',
            color: '#1f2937',
            lineHeight: '1'
          }}>
            {displayPercentage}%
          </div>
        </div>
      </div>
    );
  };

  // Determine which metric to show
  const currentMetrics = activeView === 'bookings' ? bookingsMetrics : cashMetrics;
  const currentTitle = activeView === 'bookings' ? 'Bookings Goal' : 'Cash Goal';

  if (!bookingsMetrics && !cashMetrics) return null;

  // If only one metric exists, auto-select it
  const hasBoth = bookingsMetrics && cashMetrics;
  const effectiveView = !hasBoth 
    ? (bookingsMetrics ? 'bookings' : 'cash')
    : activeView;
  const displayMetrics = effectiveView === 'bookings' ? bookingsMetrics : cashMetrics;

  if (!displayMetrics) return null;

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: isMobile ? '20px' : '24px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ 
        fontSize: isMobile ? '18px' : '20px', 
        fontWeight: '600', 
        margin: '0 0 12px 0', 
        color: '#1f2937' 
      }}>
        {currentYear} Goal Tracker
      </h3>
      
      {hasBoth && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
            <button
              onClick={() => setActiveView('bookings')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: effectiveView === 'bookings' ? 'white' : 'transparent',
                color: effectiveView === 'bookings' ? '#1f2937' : '#6b7280',
                fontWeight: effectiveView === 'bookings' ? '600' : '400',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: effectiveView === 'bookings' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Bookings
            </button>
            <button
              onClick={() => setActiveView('cash')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: effectiveView === 'cash' ? 'white' : 'transparent',
                color: effectiveView === 'cash' ? '#1f2937' : '#6b7280',
                fontWeight: effectiveView === 'cash' ? '600' : '400',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: effectiveView === 'cash' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Cash
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px', flexDirection: isMobile ? 'column' : 'row' }}>
        <div style={{ flexShrink: 0 }}>
          <PieChart percentage={Math.min(displayMetrics.percentOfPlan, 100)} size={isMobile ? 240 : 200} />
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
            {toUSD(displayMetrics.actual)}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            of {toUSD(displayMetrics.goal)} goal
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        paddingTop: '16px',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Remaining</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563' }}>
            {toUSD(displayMetrics.remaining)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Pacing</div>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: displayMetrics.pacingDelta >= 0 ? '#10b981' : '#ef4444'
          }}>
            {displayMetrics.pacingDelta >= 0 ? '+' : ''}{displayMetrics.pacingDelta}%
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalEmptyState({ onSetGoals, isMobile }: { onSetGoals: () => void; isMobile: boolean }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: isMobile ? '20px' : '24px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ 
        fontSize: isMobile ? '16px' : '18px', 
        fontWeight: '600', 
        margin: '0 0 12px 0', 
        color: '#1f2937' 
      }}>
        Goal Tracker
      </h3>
      <p style={{ margin: '0 0 20px 0', fontSize: isMobile ? '14px' : '16px', color: '#6b7280' }}>
        No goals have been set. Add your bookings and cash goals for the year to track your progress.
      </p>
      <button
        onClick={onSetGoals}
        style={{
          padding: isMobile ? '14px 20px' : '12px 24px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: isMobile ? '16px' : '14px',
          boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
        }}
      >
        Set Goals
      </button>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ color: '#9ca3af', fontSize: 14 }}>No data</div>
  )
}


