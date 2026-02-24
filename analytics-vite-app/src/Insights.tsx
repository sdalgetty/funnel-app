import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from './contexts/AuthContext'
// Forecast components kept for potential future Tools page
// import Forecast from './Forecast'
// import ForecastModeling from './ForecastModeling'
import type { FunnelData, Booking, Payment, ServiceType, AdCampaign, LeadSource } from './types'
// ForecastModel type kept for potential future Tools page
import { Users, Phone, CheckCircle, DollarSign, TrendingUp, Target, BarChart3, Plus, ArrowRight, Clock, Calendar, ChevronDown } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { UnifiedDataService } from './services/unifiedDataService'
import { logger } from './utils/logger'

type TimeRange = {
  startMonthIndex: number
  endMonthIndex: number
  startDate?: Date
  endDate?: Date
  isDateBased?: boolean
}
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

const isMonthInRange = (year: number, month: number, range: TimeRange) => {
  const idx = monthToIndex(year, month)
  return idx >= range.startMonthIndex && idx <= range.endMonthIndex
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

const parseDateStringToDate = (date: string | undefined) => {
  if (!date) return null
  const parts = date.split('-')
  if (parts.length < 2) return null
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  // YYYY-MM-DD: use the day; YYYY-MM: use 1st of month (payments often store expectedDate as month only)
  const day = parts.length >= 3 ? parseInt(parts[2], 10) : 1
  if (parts.length >= 3 && !Number.isFinite(day)) return null
  return new Date(year, month - 1, day)
}

const isDateInRange = (date: string | undefined, range: TimeRange) => {
  const idx = parseDateToMonthIndex(date)
  if (idx === null) return false
  const inMonthRange = idx >= range.startMonthIndex && idx <= range.endMonthIndex
  if (!range.isDateBased || !range.startDate || !range.endDate) {
    return inMonthRange
  }
  // For date-based ranges: YYYY-MM (e.g. payment expectedDate) = include if month overlaps range
  if (date && date.split('-').length === 2) return inMonthRange
  // YYYY-MM-DD: use exact date comparison
  const parsed = parseDateStringToDate(date)
  if (!parsed) return false
  return parsed >= range.startDate! && parsed <= range.endDate!
}


export default function Insights({ dataManager }: { dataManager: any }) {
  const { user, effectiveUser, isViewOnly, effectiveUserId } = useAuth()
  const currentDateInfo = useMemo(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  }, [])
  const [operationalTimeRange, setOperationalTimeRange] = useState<string>('last3Months')
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
  const serviceTypeColorKey = useMemo(() => {
    const id = effectiveUserId || user?.id
    return id ? `fnnl:serviceTypeColors:${id}` : null
  }, [effectiveUserId, user?.id])
  const [leadSourceColors, setLeadSourceColors] = useState<Record<string, string>>({})
  const [serviceTypeColors, setServiceTypeColors] = useState<Record<string, string>>({})

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

  useEffect(() => {
    if (!serviceTypeColorKey) return
    try {
      const stored = localStorage.getItem(serviceTypeColorKey)
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, string>
        setServiceTypeColors(parsed || {})
        return
      }
    } catch {
      // Ignore storage errors
    }
    setServiceTypeColors({})
  }, [serviceTypeColorKey])


  const getLeadSourceColor = useCallback(
    (id: string) => leadSourceColors[id] || LEAD_SOURCE_COLORS[0],
    [leadSourceColors]
  )
  const getServiceTypeColor = useCallback(
    (id: string) => serviceTypeColors[id] || LEAD_SOURCE_COLORS[0],
    [serviceTypeColors]
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

    const primaryPillOptions: TimeFilterOption[] = [
      { key: 'lastMonth', label: 'Last Month' },
      { key: 'last3Months', label: 'Last 3 Months' },
      { key: 'last6Months', label: 'Last 6 Months' },
      { key: 'last12Months', label: 'Last 12 Months' },
      { key: 'currentYear', label: `${currentYear}` }
    ]

    const moreOptions: TimeFilterOption[] = [
      { key: `year-${lastYear}`, label: `${lastYear}` },
      { key: `year-${yearBeforeThat}`, label: `${yearBeforeThat}` },
      { key: `year-${yearBeforeThat2}`, label: `${yearBeforeThat2}` }
    ]

    const additionalYearOptions = yearsWithBookings
      .filter(year => year !== currentYear && year !== lastYear && year !== yearBeforeThat && year !== yearBeforeThat2)
      .map(year => ({ key: `year-${year}`, label: `${year}` }))

    return {
      primaryPillOptions,
      moreOptions: [...moreOptions, ...additionalYearOptions],
      allOptions: [...primaryPillOptions, ...moreOptions, ...additionalYearOptions]
    }
  }, [yearsWithBookings, currentDateInfo.year])

  const validFilterKeys = useMemo(() => new Set(timeFilterOptions.allOptions.map(option => option.key)), [timeFilterOptions])

  useEffect(() => {
    if (!validFilterKeys.has(operationalTimeRange)) {
      setOperationalTimeRange('last3Months')
    }
  }, [validFilterKeys, operationalTimeRange])

  const buildTimeRange = useCallback((filterKey: string): TimeRange => {
    const y = currentDateInfo.year
    const m = currentDateInfo.month + 1 // 1-indexed for calendar month

    // Last complete month: if we're in Feb, last complete = Jan; if we're in Jan, last complete = Dec of prior year
    const lastCompleteYear = m > 1 ? y : y - 1
    const lastCompleteMonth = m > 1 ? m - 1 : 12
    const lastCompleteIdx = monthToIndex(lastCompleteYear, lastCompleteMonth)

    const buildLastNMonthsRange = (n: number): TimeRange => {
      const startIdx = lastCompleteIdx - (n - 1)
      return {
        startMonthIndex: startIdx,
        endMonthIndex: lastCompleteIdx,
        isDateBased: false
      }
    }

    switch (filterKey) {
      case 'lastMonth':
        return buildLastNMonthsRange(1)
      case 'last3Months':
        return buildLastNMonthsRange(3)
      case 'last6Months':
        return buildLastNMonthsRange(6)
      case 'last12Months':
        return buildLastNMonthsRange(12)
      case 'currentYear':
        // Current year: Jan through current month (can include partial current month)
        return {
          startMonthIndex: monthToIndex(y, 1),
          endMonthIndex: monthToIndex(y, m),
          isDateBased: false
        }
      default:
        if (filterKey.startsWith('year-')) {
          const year = parseInt(filterKey.split('-')[1], 10)
          if (Number.isFinite(year)) {
            return {
              startMonthIndex: monthToIndex(year, 1),
              endMonthIndex: monthToIndex(year, 12),
              isDateBased: false
            }
          }
        }
        return buildLastNMonthsRange(3)
    }
  }, [currentDateInfo])

  const handleTimeRangeChange = useCallback((value: string) => {
    setOperationalTimeRange(value)
  }, [])

  // SALES FUNNEL
  const salesFunnelRange = useMemo(() => buildTimeRange(operationalTimeRange), [buildTimeRange, operationalTimeRange])
  
  // Calculate dynamic values for the filtered range (same logic as Funnel component)
  const calculateDynamicDataForRange = useMemo(() => {
    const monthlyData: { [key: string]: { bookings: number; closes: number; cash: number } } = {}
    
    // Initialize months in range
    for (let year = Math.floor(salesFunnelRange.startMonthIndex / 12); year <= Math.floor(salesFunnelRange.endMonthIndex / 12); year++) {
      for (let month = 1; month <= 12; month++) {
        const idx = monthToIndex(year, month)
        if (idx >= salesFunnelRange.startMonthIndex && idx <= salesFunnelRange.endMonthIndex) {
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
      if (idx < salesFunnelRange.startMonthIndex || idx > salesFunnelRange.endMonthIndex) return
      
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
      if (idx < salesFunnelRange.startMonthIndex || idx > salesFunnelRange.endMonthIndex) return
      
      const key = `${parsed.year}-${parsed.month}`
      if (!monthlyData[key]) monthlyData[key] = { bookings: 0, closes: 0, cash: 0 }
      
      monthlyData[key].cash += payment.amount || payment.amountCents || 0
    })
    
    return monthlyData
  }, [salesFunnelRange, bookings, payments, trackableServiceIds])
  
  // Apply manual override logic to funnel data (same as Funnel component)
  // Include ALL months in range so we have complete data (bookings/cash from payments even if no manual funnel entry)
  const salesFunnelMonths = useMemo(() => {
    const existingMonths = funnelData.filter(month => isMonthInRange(month.year, month.month, salesFunnelRange))
    
    // Build list of (year, month) pairs that fall in the range
    const isFullYear = operationalTimeRange === 'currentYear' || operationalTimeRange.startsWith('year-')
    const monthsInRange: { year: number; month: number }[] = []

    if (isFullYear) {
      const targetYear = operationalTimeRange.startsWith('year-')
        ? parseInt(operationalTimeRange.split('-')[1], 10)
        : currentDateInfo.year
      for (let m = 1; m <= 12; m++) monthsInRange.push({ year: targetYear, month: m })
    } else {
      // For date-based or other ranges, include all months that overlap the range
      const startYear = Math.floor(salesFunnelRange.startMonthIndex / 12)
      const endYear = Math.floor(salesFunnelRange.endMonthIndex / 12)
      for (let year = startYear; year <= endYear; year++) {
        for (let month = 1; month <= 12; month++) {
          if (isMonthInRange(year, month, salesFunnelRange)) {
            monthsInRange.push({ year, month })
          }
        }
      }
    }

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    return monthsInRange.map(({ year, month }) => {
      const existingData = existingMonths.find(m => m.year === year && m.month === month)
      const key = `${year}-${month}`
      const dynamicData = calculateDynamicDataForRange[key] || { bookings: 0, closes: 0, cash: 0 }
      const monthName = monthNames[month - 1]
      return {
        id: existingData?.id || `${year}_${monthName.toLowerCase()}`,
        year,
        month,
        inquiries: existingData?.inquiries || 0,
        confirmedAvailable: existingData?.confirmedAvailable ?? 0,
        callsBooked: existingData?.callsBooked || 0,
        callsCancelled: existingData?.callsCancelled ?? 0,
        callsNoShows: existingData?.callsNoShows,
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
  }, [funnelData, salesFunnelRange, calculateDynamicDataForRange, operationalTimeRange, currentDateInfo.year])
  
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

  // All calculations use month-based aggregation (complete months only, except current year which can include partial)
  const salesTotals = useMemo(() => {
    const totalInquiries = salesFunnelMonths.reduce((sum, month) => sum + (month.inquiries || 0), 0)
    const totalConfirmedAvailable = salesFunnelMonths.reduce((sum, month) => sum + (month.confirmedAvailable ?? 0), 0)
    const totalCloses = salesFunnelMonths.reduce((sum, month) => sum + (month.closes || 0), 0)
    const totalBookings = salesFunnelMonths.reduce((sum, month) => sum + (month.bookings || 0), 0)
    const totalCash = salesFunnelMonths.reduce((sum, month) => sum + (month.cash || 0), 0)

    const divisor = salesFunnelMonths.filter(month =>
      (month.inquiries || 0) > 0 ||
      (month.callsBooked || 0) > 0 ||
      (month.callsTaken || 0) > 0 ||
      (month.closes || 0) > 0 ||
      (month.bookings || 0) > 0
    ).length
    const monthsWithData = divisor
    const avgInquiries = divisor > 0 ? Math.round(totalInquiries / divisor) : 0
    const avgCloses = divisor > 0 ? Math.round(totalCloses / divisor) : 0
    const avgBookings = divisor > 0 ? Math.round(totalBookings / divisor) : 0
    const avgCash = divisor > 0 ? Math.round(totalCash / divisor) : 0
    const inquiryToClose = totalInquiries > 0 ? ((totalCloses / totalInquiries) * 100).toFixed(1) : '0.0'
    return { totalInquiries, totalConfirmedAvailable, totalCloses, totalBookings, totalCash, inquiryToClose, monthsWithData, avgInquiries, avgCloses, avgBookings, avgCash, avgWeddingBooking }
  }, [salesFunnelMonths, avgWeddingBooking])

  const callTotals = useMemo(() => {
    const totalInquiries = salesFunnelMonths.reduce((sum, month) => sum + (month.inquiries || 0), 0)
    const totalCallsBooked = salesFunnelMonths.reduce((sum, month) => sum + (month.callsBooked || 0), 0)
    const totalCallsCancelled = salesFunnelMonths.reduce((sum, month) => sum + (month.callsCancelled ?? 0), 0)
    const totalCallsTaken = salesFunnelMonths.reduce((sum, month) => sum + (month.callsTaken || 0), 0)
    const totalCloses = salesFunnelMonths.reduce((sum, month) => sum + (month.closes || 0), 0)
    const totalBookings = salesFunnelMonths.reduce((sum, month) => sum + (month.bookings || 0), 0)

    const divisor = salesFunnelMonths.filter(month =>
      (month.inquiries || 0) > 0 ||
      (month.callsBooked || 0) > 0 ||
      (month.callsTaken || 0) > 0 ||
      (month.closes || 0) > 0 ||
      (month.bookings || 0) > 0
    ).length
    
    const avgCallsBooked = divisor > 0 ? Math.round(totalCallsBooked / divisor) : 0
    const avgCallsTaken = divisor > 0 ? Math.round(totalCallsTaken / divisor) : 0
    const inquiryToBooked = totalInquiries > 0 ? ((totalCallsBooked / totalInquiries) * 100).toFixed(1) : '0.0'
    const inquiryToTaken = totalInquiries > 0 ? ((totalCallsTaken / totalInquiries) * 100).toFixed(1) : '0.0'
    const totalEffectiveNoShows = salesFunnelMonths.reduce((sum, month) => {
      const noShows = month.callsNoShows ?? (month.callsBooked - (month.callsCancelled ?? 0) - month.callsTaken)
      return sum + Math.max(0, noShows)
    }, 0)
    const showUpRate = totalCallsTaken > 0
      ? ((totalCallsTaken / (totalCallsTaken + totalEffectiveNoShows)) * 100).toFixed(1)
      : '0.0'
    const takenToClose = totalCallsTaken > 0 ? ((totalCloses / totalCallsTaken) * 100).toFixed(1) : '0.0'
    const revenuePerCallTaken = totalCallsTaken > 0 ? Math.round(totalBookings / totalCallsTaken) : 0
    return { totalCallsBooked, totalCallsCancelled, totalEffectiveNoShows, totalCallsTaken, inquiryToBooked, inquiryToTaken, showUpRate, takenToClose, revenuePerCallTaken, avgCallsBooked, avgCallsTaken }
  }, [salesFunnelMonths])

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
  const leadSourcesRange = useMemo(() => buildTimeRange(operationalTimeRange), [buildTimeRange, operationalTimeRange])
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

  // SERVICE TYPES METRICS
  const serviceTypesRange = useMemo(() => buildTimeRange(operationalTimeRange), [buildTimeRange, operationalTimeRange])
  const serviceTypeBookings = useMemo(
    () => bookings.filter(b => isDateInRange(b.dateBooked, serviceTypesRange)),
    [bookings, serviceTypesRange]
  )
  const serviceTypeBreakdown = useMemo(() => {
    const byCount: Record<string, number> = {}
    const byRevenue: Record<string, number> = {}
    serviceTypeBookings.forEach(b => {
      const stId = b.serviceTypeId
      byCount[stId] = (byCount[stId] || 0) + 1
      byRevenue[stId] = (byRevenue[stId] || 0) + (b.bookedRevenue || b.revenue || 0)
    })
    const totalCount = Object.values(byCount).reduce((sum, value) => sum + value, 0)
    const totalRevenue = Object.values(byRevenue).reduce((sum, value) => sum + value, 0)
    const items = Object.keys(byCount).map(stId => {
      const name = serviceTypes.find(st => st.id === stId)?.name || 'Unknown'
      const count = byCount[stId] || 0
      const revenue = byRevenue[stId] || 0
      const avgRevenue = count > 0 ? Math.round(revenue / count) : 0
      const pctCount = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
      const pctRevenue = totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0
      return { id: stId, name, count, revenue, avgRevenue, pctCount, pctRevenue }
    })
    const byCountDesc = [...items].sort((a, b) => b.count - a.count)
    const byRevenueDesc = [...items].sort((a, b) => b.revenue - a.revenue)
    const byAvgRevenueDesc = [...items].sort((a, b) => b.avgRevenue - a.avgRevenue)
    return { items, totalCount, totalRevenue, byCountDesc, byRevenueDesc, byAvgRevenueDesc }
  }, [serviceTypeBookings, serviceTypes])

  useEffect(() => {
    if (!serviceTypeColorKey) return
    const ids = serviceTypeBreakdown.items.map(i => i.id)
    if (ids.length === 0) return
    const nextColors: Record<string, string> = { ...serviceTypeColors }
    let nextIndex = Object.keys(nextColors).length
    let changed = false
    ids.forEach((id) => {
      if (!nextColors[id]) {
        nextColors[id] = getLeadSourceColorByIndex(nextIndex)
        nextIndex += 1
        changed = true
      }
    })
    if (changed) {
      setServiceTypeColors(nextColors)
      try {
        localStorage.setItem(serviceTypeColorKey, JSON.stringify(nextColors))
      } catch {
        // Ignore storage errors
      }
    }
  }, [serviceTypeColorKey, serviceTypeBreakdown.items, serviceTypeColors])

  // ADVERTISING
  const advertisingRange = useMemo(() => buildTimeRange(operationalTimeRange), [buildTimeRange, operationalTimeRange])
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
    // If ads tracking is enabled, use funnel data (month-based)
    if (user?.adsTrackingEnabled) {
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
  const [timeRangeBarStuck, setTimeRangeBarStuck] = useState(false)
  const timeRangeSentinelRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Show fixed time range bar when user has scrolled past the Operational Performance section.
  // Use scroll listener for reliable cross-browser behavior.
  useEffect(() => {
    const sentinel = timeRangeSentinelRef.current
    if (!sentinel) return
    const checkStuck = () => {
      const rect = sentinel.getBoundingClientRect()
      setTimeRangeBarStuck(rect.top < 0)
    }
    checkStuck()
    window.addEventListener('scroll', checkStuck, { passive: true })
    return () => window.removeEventListener('scroll', checkStuck)
  }, [])

  return (
    <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, color: '#1f2937' }}>Insights</h1>
      </div>

      {/* Welcome Section and Tasks */}
      <WelcomeAndTasks 
        user={effectiveUser || user}
        funnelData={funnelData}
        dataManager={dataManager}
        calculatorGoals={calculatorGoals}
        bookings={bookings}
        payments={payments}
        currentYear={currentDateInfo.year}
      />

      {/* OPERATIONAL PERFORMANCE - Section title for all metrics below */}
      <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, margin: '0 0 16px 0', color: '#1f2937' }}>
        Operational Performance
      </h2>

      {/* Sentinel: when this scrolls out of view (above viewport), bar becomes fixed. Must stay in flow. */}
      <div ref={timeRangeSentinelRef} style={{ height: 1, marginTop: -1 }} aria-hidden="true" />

      {/* Wrapper reserves space so no layout shift when bar becomes fixed */}
      <div style={{ minHeight: isMobile ? 90 : 100, marginBottom: isMobile ? 24 : 32 }}>
        {/* Time range bar - In flow when at top, fixed when scrolled past */}
        <div
          style={{
            ...(timeRangeBarStuck
              ? {
                  position: 'fixed',
                  top: isMobile ? 56 : 0,
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  padding: isMobile ? '12px 16px' : '16px 24px',
                  display: 'flex',
                  justifyContent: 'center',
                }
              : {}),
          }}
        >
          <div style={{ width: '100%', maxWidth: timeRangeBarStuck ? 1200 : undefined }}>
            <OperationalTimeRangeSelector
              value={operationalTimeRange}
              onChange={handleTimeRangeChange}
              primaryOptions={timeFilterOptions.primaryPillOptions}
              moreOptions={timeFilterOptions.moreOptions}
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>

      {/* SALES FUNNEL METRICS - 3x3 grid: Row1 Inquiries|SalesMetrics, Row2-3 CallPerf|ConversionRates+TimeCards */}
      <Section title="Sales Funnel Metrics">
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
            <InquiriesCard
              totalInquiries={salesTotals.totalInquiries}
              confirmedAvailable={salesTotals.totalConfirmedAvailable}
              formatNumber={formatNumber}
              isMobile={isMobile}
            />
            <SalesMetricsCard
              closes={salesTotals.totalCloses}
              bookings={salesTotals.totalBookings}
              cash={salesTotals.totalCash}
              formatNumber={formatNumber}
              toUSD={toUSD}
              isMobile={isMobile}
            />
            <CallPerformanceCard
              callsBooked={callTotals.totalCallsBooked}
              callsCancelled={callTotals.totalCallsCancelled}
              callsNoShows={callTotals.totalEffectiveNoShows}
              callsTaken={callTotals.totalCallsTaken}
              showUpRate={callTotals.showUpRate}
              formatNumber={formatNumber}
              isMobile={isMobile}
            />
            <ConversionRatesCard
              inquiryToTaken={callTotals.inquiryToTaken}
              takenToClose={callTotals.takenToClose}
              inquiryToClose={salesTotals.inquiryToClose}
              isMobile={isMobile}
            />
            <Cards columns={2}>
              <Card icon={<Clock size={20} color="#ec4899" />} label="Time from Inquiry to Booking" value={bookingTimeMetrics.avgDaysInquiryToBooking !== null ? `${bookingTimeMetrics.avgDaysInquiryToBooking} days` : 'N/A'} sub="Average days" compact valueFontSize={18} />
              <Card icon={<Calendar size={20} color="#14b8a6" />} label="Time from Booking to Wedding" value={bookingTimeMetrics.avgMonthsBookingToWedding !== null ? `${bookingTimeMetrics.avgMonthsBookingToWedding} months` : 'N/A'} sub="Average months" compact valueFontSize={18} />
            </Cards>
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            {/* Row 1: Inquiries | Sales Performance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <InquiriesCard
                totalInquiries={salesTotals.totalInquiries}
                confirmedAvailable={salesTotals.totalConfirmedAvailable}
                formatNumber={formatNumber}
                isMobile={isMobile}
              />
              <SalesMetricsCard
                closes={salesTotals.totalCloses}
                bookings={salesTotals.totalBookings}
                cash={salesTotals.totalCash}
                formatNumber={formatNumber}
                toUSD={toUSD}
                isMobile={isMobile}
              />
            </div>
            {/* Row 2: Call Performance | Conversion Rates | Time cards stacked (3 equal columns, matched height via grid) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 16,
                width: '100%',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <CallPerformanceCard
                  callsBooked={callTotals.totalCallsBooked}
                  callsCancelled={callTotals.totalCallsCancelled}
                  callsNoShows={callTotals.totalEffectiveNoShows}
                  callsTaken={callTotals.totalCallsTaken}
                  showUpRate={callTotals.showUpRate}
                  formatNumber={formatNumber}
                  isMobile={isMobile}
                />
              </div>
              <div style={{ minWidth: 0, height: '100%' }}>
                <ConversionRatesCard
                  inquiryToTaken={callTotals.inquiryToTaken}
                  takenToClose={callTotals.takenToClose}
                  inquiryToClose={salesTotals.inquiryToClose}
                  isMobile={isMobile}
                  style={{ height: '100%' }}
                />
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateRows: '1fr 1fr',
                  gap: 16,
                  minHeight: 0,
                  minWidth: 0,
                }}
              >
                <div style={{ minHeight: 0 }}>
                  <Card icon={<Clock size={20} color="#ec4899" />} label="Time from Inquiry to Booking" value={bookingTimeMetrics.avgDaysInquiryToBooking !== null ? `${bookingTimeMetrics.avgDaysInquiryToBooking} days` : 'N/A'} sub="Average days" compact valueFontSize={18} style={{ height: '100%', boxSizing: 'border-box' }} />
                </div>
                <div style={{ minHeight: 0 }}>
                  <Card icon={<Calendar size={20} color="#14b8a6" />} label="Time from Booking to Wedding" value={bookingTimeMetrics.avgMonthsBookingToWedding !== null ? `${bookingTimeMetrics.avgMonthsBookingToWedding} months` : 'N/A'} sub="Average months" compact valueFontSize={18} style={{ height: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* Forecast sections removed - keeping code for potential future Tools page */}

      {/* LEAD SOURCE METRICS */}
      <Section title="Lead Source Metrics">
        {/* Pie Chart Visualizations */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: isMobile ? 12 : 16, marginBottom: isMobile ? 12 : 16 }}>
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

      {/* SERVICE TYPE METRICS */}
      <Section title="Service Type Metrics">
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: isMobile ? 12 : 16 }}>
          {/* Total Booked Revenue by Service Type Pie Chart */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: isMobile ? 16 : 24 }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: 16, fontWeight: 600, color: '#1f2937' }}>Total Booked Revenue by Service Type</h3>
            {serviceTypeBreakdown.items.length === 0 ? (
              <p style={{ fontSize: 13, color: '#6b7280' }}>
                No service type data exists for the selected time range. You can either adjust the time range or add new sales data.
              </p>
            ) : (
              <LeadSourcePieChart
                data={serviceTypeBreakdown.byRevenueDesc.map(item => ({
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
                getColor={getServiceTypeColor}
              />
            )}
          </div>

          {/* Number of Bookings by Service Type Pie Chart */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: isMobile ? 16 : 24 }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: 16, fontWeight: 600, color: '#1f2937' }}>Number of Bookings by Service Type</h3>
            {serviceTypeBreakdown.items.length === 0 ? (
              <p style={{ fontSize: 13, color: '#6b7280' }}>
                No service type data exists for the selected time range. You can either adjust the time range or add new sales data.
              </p>
            ) : (
              <LeadSourcePieChart
                data={serviceTypeBreakdown.byCountDesc}
                isMobile={isMobile}
                toUSD={toUSD}
                formatNumber={formatNumber}
                getColor={getServiceTypeColor}
              />
            )}
          </div>

          {/* Average Booking Amount by Service Type Bar Chart */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: isMobile ? 16 : 24 }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: 16, fontWeight: 600, color: '#1f2937' }}>Average Booking Amount by Service Type</h3>
            {serviceTypeBreakdown.items.length === 0 ? (
              <p style={{ fontSize: 13, color: '#6b7280' }}>
                No service type data exists for the selected time range. You can either adjust the time range or add new sales data.
              </p>
            ) : (
              <div>
                {serviceTypeBreakdown.byAvgRevenueDesc.map(item => {
                  const maxAvg = serviceTypeBreakdown.byAvgRevenueDesc[0]?.avgRevenue || 0
                  const widthPct = maxAvg > 0 ? Math.round((item.avgRevenue / maxAvg) * 100) : 0
                  const barColor = getServiceTypeColor(item.id)
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
        <Section title="Advertising Performance Metrics">
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
  
  // Custom label formatter - hide % for small slices (<3%) to avoid overlapping text; tooltip still shows it
  const renderLabel = (entry: any) => {
    if (entry?.percentage < 3) return ''
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
    const labelPadding = isMobile ? 80 : 96
    const chartBase = radius * 2 + labelPadding // pie diameter + clearance for % labels outside
    const minHeight = isMobile ? 260 : 320
    return Math.max(minHeight, Math.round(chartBase))
  }, [isMobile])
  
  return (
    <div style={{ width: '100%' }}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart margin={{ top: 24, right: 24, bottom: 24, left: 24 }}>
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

function SalesMetricsCard({
  closes,
  bookings,
  cash,
  formatNumber,
  toUSD,
  isMobile
}: {
  closes: number
  bookings: number
  cash: number
  formatNumber: (n: number) => string
  toUSD: (cents: number) => string
  isMobile: boolean
}) {
  const items = [
    { label: 'Closes', value: formatNumber(closes) },
    { label: 'Bookings', value: toUSD(bookings) },
    { label: 'Cash', value: toUSD(cash) },
  ]
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: isMobile ? 20 : 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <DollarSign size={20} color="#10b981" />
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1f2937' }}>Sales Performance</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap' }}>
        {items.map(({ label, value }, index) => (
          <div
            key={label}
            style={{
              flex: isMobile ? undefined : 1,
              minWidth: 0,
              ...(isMobile
                ? { paddingTop: index > 0 ? 12 : 0 }
                : {
                    paddingLeft: index > 0 ? 24 : 0,
                    borderLeft: index > 0 ? '1px solid #e5e7eb' : undefined,
                  }),
            }}
          >
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1f2937' }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function InquiriesCard({
  totalInquiries,
  confirmedAvailable,
  formatNumber,
  isMobile
}: {
  totalInquiries: number
  confirmedAvailable: number
  formatNumber: (n: number) => string
  isMobile: boolean
}) {
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: isMobile ? 20 : 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Users size={20} color="#3b82f6" />
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1f2937' }}>Inquiries</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1f2937' }}>{formatNumber(totalInquiries)} Total</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle size={16} color="#10b981" />
          <span style={{ fontSize: 14, color: '#6b7280' }}>Confirmed Available: {confirmedAvailable > 0 ? formatNumber(confirmedAvailable) : 'N/A'}</span>
        </div>
      </div>
    </div>
  )
}

function CallPerformanceCard({
  callsBooked,
  callsCancelled,
  callsNoShows,
  callsTaken,
  showUpRate,
  formatNumber,
  isMobile
}: {
  callsBooked: number
  callsCancelled: number
  callsNoShows: number
  callsTaken: number
  showUpRate: string
  formatNumber: (n: number) => string
  isMobile: boolean
}) {
  const row = (label: string, value: string) => (
    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
      <span style={{ fontSize: 14, color: '#374151' }}>{label}:</span>
      <span style={{ fontSize: 18, fontWeight: 700, color: '#1f2937' }}>{value}</span>
    </div>
  )
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: isMobile ? 20 : 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Phone size={20} color="#10b981" />
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1f2937' }}>Call Performance</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 24 }}>
          {row('Calls Booked', formatNumber(callsBooked))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 40 }}>
          {row('Calls Taken', formatNumber(callsTaken))}
          {row('Call Show Up Rate', `${showUpRate}%`)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {row('Cancelled Calls', formatNumber(callsCancelled))}
          {row('No-Shows', formatNumber(callsNoShows))}
        </div>
      </div>
    </div>
  )
}

function ConversionRatesCard({
  inquiryToTaken,
  takenToClose,
  inquiryToClose,
  isMobile,
  style: styleProp
}: {
  inquiryToTaken: string
  takenToClose: string
  inquiryToClose: string
  isMobile: boolean
  style?: React.CSSProperties
}) {
  const items = [
    { label: 'Inquiry to Call Taken %', value: `${inquiryToTaken}%` },
    { label: 'Call Taken to Close %', value: `${takenToClose}%` },
    { label: 'Inquiry to Close %', value: `${inquiryToClose}%` },
  ]
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: isMobile ? 20 : 24, boxSizing: 'border-box', ...styleProp }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <CheckCircle size={20} color="#ef4444" />
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1f2937' }}>Conversion Rates</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map(({ label, value }, index) => (
          <div
            key={label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 8,
              paddingTop: index === 0 ? 0 : 16,
              paddingBottom: 16,
              borderTop: index === 0 ? 'none' : '1px solid #e5e7eb'
            }}
          >
            <span style={{ fontSize: 14, color: '#374151' }}>{label}</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#1f2937' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function OperationalTimeRangeSelector({
  value,
  onChange,
  primaryOptions,
  moreOptions,
  isMobile
}: {
  value: string
  onChange: (value: string) => void
  primaryOptions: TimeFilterOption[]
  moreOptions: TimeFilterOption[]
  isMobile: boolean
}) {
  const [moreOpen, setMoreOpen] = useState(false)
  const isPrimarySelected = primaryOptions.some(o => o.key === value)
  const selectedMoreOption = moreOptions.find(o => o.key === value)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: isMobile ? 16 : 20,
        background: '#f8fafc',
        borderRadius: 12,
        border: '1px solid #e2e8f0'
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
          Time range:
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: isMobile ? 8 : 10 }}>
        {primaryOptions.map(opt => {
          const isSelected = value === opt.key
          return (
            <button
              key={opt.key}
              onClick={() => onChange(opt.key)}
              style={{
                padding: isMobile ? '8px 14px' : '10px 18px',
                borderRadius: 8,
                border: isSelected ? 'none' : '1px solid #d1d5db',
                background: isSelected ? '#10b981' : 'white',
                color: isSelected ? 'white' : '#374151',
                fontWeight: isSelected ? 600 : 500,
                fontSize: isMobile ? 13 : 14,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {opt.label}
            </button>
          )
        })}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMoreOpen(prev => !prev)}
            style={{
              padding: isMobile ? '8px 14px' : '10px 18px',
              borderRadius: 8,
              border: selectedMoreOption ? 'none' : '1px solid #d1d5db',
              background: selectedMoreOption ? '#10b981' : 'white',
              color: selectedMoreOption ? 'white' : '#374151',
              fontWeight: selectedMoreOption ? 600 : 500,
              fontSize: isMobile ? 13 : 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s'
            }}
          >
            {selectedMoreOption ? selectedMoreOption.label : 'Past years'}
            <ChevronDown size={16} style={{ transform: moreOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {moreOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                onClick={() => setMoreOpen(false)}
                aria-hidden="true"
              />
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: 4,
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 20,
                  minWidth: 100,
                  maxHeight: 240,
                  overflowY: 'auto'
                }}
              >
                {moreOptions.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      onChange(opt.key)
                      setMoreOpen(false)
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px 16px',
                      border: 'none',
                      background: value === opt.key ? '#10b981' : 'transparent',
                      color: value === opt.key ? 'white' : '#374151',
                      fontWeight: value === opt.key ? 600 : 400,
                      fontSize: 14,
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#94a3b8' }}>
        Applies to all metrics below
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

function Card({ icon, label, value, sub, compact, style: styleProp, valueFontSize }: { icon: React.ReactNode; label: string; value: string | number; sub?: React.ReactNode; compact?: boolean; style?: React.CSSProperties; valueFontSize?: number }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: compact ? 16 : 20, ...styleProp }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {icon}
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1f2937' }}>{label}</h3>
      </div>
      <div style={{ fontSize: valueFontSize ?? 20, fontWeight: 700, color: '#1f2937' }}>{value}</div>
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
          <div style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 500, color: '#4b5563', margin: '0 0 6px 0' }}>
            Know where your business stands — and where it’s headed.
          </div>
          <div style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: 400, color: '#6b7280', margin: '0 0 12px 0' }}>
            This page unlocks the understanding of how your business is actually performing. Turn that understanding into action and momentum towards achieving your goals.
          </div>
          <div style={{ height: 1, backgroundColor: '#e5e7eb', margin: '4px 0 12px 0' }} />
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

        {/* Goal Tracker (full width) + Pace Card (full width, 3 items side-by-side on desktop) */}
        {(() => {
          const hasGoals = calculatorGoals &&
                             bookings &&
                             payments &&
                             currentYear &&
                             ((calculatorGoals.bookingsRevenueGoal > 0) || (calculatorGoals.cashGoal > 0));

          return (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? 24 : 36,
              gridColumn: '1 / -1',
              marginTop: isMobile ? 24 : 36
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

  // Calculate pace based on last 3 complete months
  const calculations = useMemo(() => {
    const y = new Date().getFullYear();
    const m = new Date().getMonth() + 1; // 1-indexed calendar month
    const lastCompleteIdx = m > 1 ? (y * 12 + (m - 1) - 1) : ((y - 1) * 12 + 11);
    const startIdx = lastCompleteIdx - 2;

    const inquiriesLast3Months = funnelData.reduce((sum, month) => {
      const idx = month.year * 12 + (month.month - 1);
      if (idx < startIdx || idx > lastCompleteIdx) return sum;
      return sum + (month.inquiries || 0);
    }, 0);

    const callsLast3Months = funnelData.reduce((sum, month) => {
      const idx = month.year * 12 + (month.month - 1);
      if (idx < startIdx || idx > lastCompleteIdx) return sum;
      return sum + (month.callsTaken || 0);
    }, 0);

    const bookingsLast3Months = bookings.filter(b => {
      if (!b?.dateBooked) return false;
      if (!trackableServiceIds.has(b.serviceTypeId)) return false;
      const idx = (() => {
        const parts = b.dateBooked.split('-');
        if (parts.length < 2) return -1;
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        if (!Number.isFinite(year) || !Number.isFinite(month)) return -1;
        return year * 12 + (month - 1);
      })();
      return idx >= startIdx && idx <= lastCompleteIdx;
    }).length;

    const paceInq = Math.round((inquiriesLast3Months / 3) * 12);
    const paceCalls = Math.round((callsLast3Months / 3) * 12);
    const paceBookings = Math.round((bookingsLast3Months / 3) * 12);
    
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
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      width: '100%',
      boxSizing: 'border-box'
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
        Track your pace for the year based on your activity over the last 3 complete months.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
        gap: isMobile ? 12 : 20
      }}>
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

  // Calculate metrics for Cash (adjusted for locked-in from prior-year bookings for pacing)
  const cashMetrics = useMemo(() => {
    if (cashGoal === 0) return null;

    const adjustedGoal = Math.max(cashGoal - ytdData.lockedInCash, 0);
    const adjustedActual = Math.max(ytdData.cashYtd - ytdData.lockedInCash, 0);
    const pacingPercent = adjustedGoal === 0
      ? 100
      : Math.round((adjustedActual / adjustedGoal) * 100);
    const pacingDelta = pacingPercent - yearProgress;
    const remaining = cashGoal - ytdData.cashYtd;

    return {
      actual: ytdData.cashYtd,
      goal: cashGoal,
      percentOfPlan: Math.round((ytdData.cashYtd / cashGoal) * 100),
      pacingDelta,
      remaining,
    };
  }, [ytdData.cashYtd, ytdData.lockedInCash, cashGoal, yearProgress]);

  const toUSD = (cents: number) => (cents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' });

  if (!bookingsMetrics && !cashMetrics) return null;

  // Cash circle chart (always for Cash)
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

  const cashPercent = cashGoal > 0 ? Math.min(Math.round((ytdData.cashYtd / cashGoal) * 100), 100) : 0;

  const rowGap = 18;
  const labelValueGap = 8;

  const MetricRow = ({ label, value, pacingValue }: { label: string; value?: React.ReactNode; pacingValue?: { delta: number; color: string } }) => (
    <div style={{ marginBottom: rowGap }}>
      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: labelValueGap }}>{label}</div>
      {pacingValue !== undefined ? (
        <div style={{ fontSize: '16px', fontWeight: '600', color: pacingValue.color }}>
          {pacingValue.delta >= 0 ? '+' : ''}{pacingValue.delta}%
        </div>
      ) : (
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{value}</div>
      )}
    </div>
  );

  const GoalBlock = ({
    title,
    goal,
    achieved,
    remaining,
    pacingDelta,
  }: {
    title: string;
    goal: number;
    achieved: number;
    remaining: number;
    pacingDelta: number;
  }) => (
    <div>
      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: rowGap }}>{title}</div>
      <MetricRow label="Goal" value={toUSD(goal)} />
      <MetricRow label="Achieved" value={toUSD(achieved)} />
      <MetricRow label="Remaining" value={toUSD(remaining)} />
      <MetricRow
        label="Pacing"
        pacingValue={{
          delta: pacingDelta,
          color: pacingDelta >= 0 ? '#10b981' : '#ef4444',
        }}
      />
    </div>
  );

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: isMobile ? '20px' : '24px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <h3 style={{
        fontSize: isMobile ? '18px' : '20px',
        fontWeight: '600',
        margin: '0 0 20px 0',
        color: '#1f2937'
      }}>
        {currentYear} Goal Tracker
      </h3>

      <div style={{
        display: 'flex',
        gap: isMobile ? 24 : 40,
        alignItems: 'flex-start',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        <div style={{ flexShrink: 0 }}>
          <PieChart percentage={cashPercent} size={isMobile ? 200 : 180} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: isMobile ? 28 : 32, minWidth: 0 }}>
          {cashMetrics && (
            <GoalBlock
              title="Cash Goal"
              goal={cashMetrics.goal}
              achieved={cashMetrics.actual}
              remaining={cashMetrics.remaining}
              pacingDelta={cashMetrics.pacingDelta}
            />
          )}
          {bookingsMetrics && (
            <GoalBlock
              title="Bookings Goal"
              goal={bookingsMetrics.goal}
              achieved={bookingsMetrics.actual}
              remaining={bookingsMetrics.remaining}
              pacingDelta={bookingsMetrics.pacingDelta}
            />
          )}
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


