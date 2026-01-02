import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import Forecast from './Forecast'
import ForecastModeling from './ForecastModeling'
import Calculator from './Calculator'
import type { FunnelData, Booking, Payment, ServiceType, AdCampaign, LeadSource, ForecastModel } from './types'
import { Users, Phone, CheckCircle, DollarSign, TrendingUp, Target, BarChart3, Plus, X, ArrowRight } from 'lucide-react'
import { logger } from './utils/logger'

type MonthRange = { start: number; end: number }
type TimeFilterOption = { key: string; label: string }

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
    salesFunnel: 'currentYear',
    leadSources: 'currentYear',
    advertising: 'currentYear'
  })
  const [forecastModels, setForecastModels] = useState<ForecastModel[]>([])
  const [loadingForecastModels, setLoadingForecastModels] = useState(true)

  const funnelData: FunnelData[] = dataManager?.funnelData || []
  const bookings: Booking[] = dataManager?.bookings || []
  const payments: Payment[] = dataManager?.payments || []
  const serviceTypes: ServiceType[] = dataManager?.serviceTypes || []
  const adCampaigns: AdCampaign[] = dataManager?.adCampaigns || []
  const leadSources: LeadSource[] = dataManager?.leadSources || []

  // Load forecast models to check for active forecast
  useEffect(() => {
    const loadForecastModels = async () => {
      const userId = effectiveUserId || user?.id
      if (!userId) {
        setLoadingForecastModels(false)
        return
      }
      try {
        const { UnifiedDataService } = await import('./services/unifiedDataService')
        const models = await UnifiedDataService.getForecastModels(userId)
        setForecastModels(models)
      } catch (error) {
        console.error('Error loading forecast models:', error)
        setForecastModels([])
      } finally {
        setLoadingForecastModels(false)
      }
    }
    loadForecastModels()
  }, [user?.id, effectiveUserId])

  // Check if there's an active forecast model
  const hasActiveForecast = useMemo(() => {
    return forecastModels.some(m => m.isActive)
  }, [forecastModels])

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
    const baseOptions = [
      { key: 'currentYear', label: 'Current Year' },
      { key: 'past12Months', label: 'Past 12 Months' },
      { key: 'past6Months', label: 'Past 6 Months' },
      { key: 'past3Months', label: 'Past 3 Months' }
    ]
    const yearOptions = yearsWithBookings
      .map(year => ({ key: `year-${year}`, label: `${year}` }))
      .filter(option => !baseOptions.some(base => base.key === option.key))
    return [...baseOptions, ...yearOptions]
  }, [yearsWithBookings])

  const validFilterKeys = useMemo(() => new Set(timeFilterOptions.map(option => option.key)), [timeFilterOptions])

  useEffect(() => {
    setSectionFilters(prev => {
      let changed = false
      const next = { ...prev }
      ;(['salesFunnel', 'leadSources', 'advertising'] as const).forEach(section => {
        if (!validFilterKeys.has(prev[section])) {
          next[section] = 'currentYear'
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [validFilterKeys])

  const buildMonthRange = useCallback((filterKey: string): MonthRange => {
    const currentMonthIndex = currentDateInfo.year * 12 + currentDateInfo.month
    switch (filterKey) {
      case 'past12Months': {
        const start = currentMonthIndex - 11
        return { start: Math.max(0, start), end: currentMonthIndex }
      }
      case 'past6Months': {
        const start = currentMonthIndex - 5
        return { start: Math.max(0, start), end: currentMonthIndex }
      }
      case 'past3Months': {
        const start = currentMonthIndex - 2
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
        return {
          start: monthToIndex(currentDateInfo.year, 1),
          end: monthToIndex(currentDateInfo.year, 12)
        }
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
      // For date ranges (past 3/6/12 months), only use existing months
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
    const monthsWithData = salesFunnelMonths.filter(month =>
      (month.inquiries || 0) > 0 ||
      (month.callsBooked || 0) > 0 ||
      (month.callsTaken || 0) > 0 ||
      (month.closes || 0) > 0 ||
      (month.bookings || 0) > 0
    ).length
    const avgInquiries = monthsWithData > 0 ? Math.round(totalInquiries / monthsWithData) : 0
    const avgCloses = monthsWithData > 0 ? Math.round(totalCloses / monthsWithData) : 0
    const avgBookings = monthsWithData > 0 ? Math.round(totalBookings / monthsWithData) : 0
    const avgCash = monthsWithData > 0 ? Math.round(totalCash / monthsWithData) : 0
    const inquiryToClose = totalInquiries > 0 ? ((totalCloses / totalInquiries) * 100).toFixed(1) : '0.0'
    return { totalInquiries, totalCloses, totalBookings, totalCash, inquiryToClose, monthsWithData, avgInquiries, avgCloses, avgBookings, avgCash, avgWeddingBooking }
  }, [salesFunnelMonths, avgWeddingBooking])

  const callTotals = useMemo(() => {
    const totalInquiries = salesFunnelMonths.reduce((sum, month) => sum + (month.inquiries || 0), 0)
    const totalCallsBooked = salesFunnelMonths.reduce((sum, month) => sum + (month.callsBooked || 0), 0)
    const totalCallsTaken = salesFunnelMonths.reduce((sum, month) => sum + (month.callsTaken || 0), 0)
    // Use closes and bookings from funnelData (respects manual overrides)
    const totalCloses = salesFunnelMonths.reduce((sum, month) => sum + (month.closes || 0), 0)
    const totalBookings = salesFunnelMonths.reduce((sum, month) => sum + (month.bookings || 0), 0)
    const monthsWithData = salesFunnelMonths.filter(month =>
      (month.inquiries || 0) > 0 ||
      (month.callsBooked || 0) > 0 ||
      (month.callsTaken || 0) > 0 ||
      (month.closes || 0) > 0 ||
      (month.bookings || 0) > 0
    ).length
    const avgCallsBooked = monthsWithData > 0 ? Math.round(totalCallsBooked / monthsWithData) : 0
    const avgCallsTaken = monthsWithData > 0 ? Math.round(totalCallsTaken / monthsWithData) : 0
    const inquiryToBooked = totalInquiries > 0 ? ((totalCallsBooked / totalInquiries) * 100).toFixed(1) : '0.0'
    const inquiryToTaken = totalInquiries > 0 ? ((totalCallsTaken / totalInquiries) * 100).toFixed(1) : '0.0'
    const showUpRate = totalCallsBooked > 0 ? ((totalCallsTaken / totalCallsBooked) * 100).toFixed(1) : '0.0'
    const takenToClose = totalCallsTaken > 0 ? ((totalCloses / totalCallsTaken) * 100).toFixed(1) : '0.0'
    const revenuePerCallTaken = totalCallsTaken > 0 ? Math.round(totalBookings / totalCallsTaken) : 0
    return { totalCallsBooked, totalCallsTaken, inquiryToBooked, inquiryToTaken, showUpRate, takenToClose, revenuePerCallTaken, avgCallsBooked, avgCallsTaken }
  }, [salesFunnelMonths])

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
      const pctCount = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
      const pctRevenue = totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0
      return { id: lsId, name, count, revenue, pctCount, pctRevenue }
    })
    const byCountDesc = [...items].sort((a, b) => b.count - a.count)
    const byRevenueDesc = [...items].sort((a, b) => b.revenue - a.revenue)
    return { items, totalCount, totalRevenue, byCountDesc, byRevenueDesc }
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
    totalAdSpend: number
    totalBookedFromAds: number
    overallROI: number | null
    costPerClose: number
  }>(() => {
    if (!dataManager || dataManager.loading) {
      return { totalAdSpend: 0, totalBookedFromAds: 0, overallROI: null, costPerClose: 0 }
    }
    if (dedupedAdCampaigns.length === 0) {
      return { totalAdSpend: 0, totalBookedFromAds: 0, overallROI: null, costPerClose: 0 }
    }
    const totalAdSpend = dedupedAdCampaigns.reduce((sum, campaign) => {
      const spend = campaign.spend ?? campaign.adSpendCents ?? 0
      return sum + spend
    }, 0)
    const bookingsFromAds = advertisingBookings.filter(b => advertisingLeadSourceIds.has(b.leadSourceId))
    const totalBookedFromAds = bookingsFromAds.reduce((sum, booking) => sum + (booking.revenue || booking.bookedRevenue || 0), 0)
    const closesFromAds = bookingsFromAds.length
    const overallROI = totalAdSpend > 0 && totalBookedFromAds > 0 ? totalBookedFromAds / totalAdSpend : null
    const costPerClose = closesFromAds > 0 ? Math.round(totalAdSpend / closesFromAds) : 0
    return { totalAdSpend, totalBookedFromAds, overallROI, costPerClose }
  }, [dataManager, dataManager?.loading, dedupedAdCampaigns, advertisingBookings, advertisingLeadSourceIds])

  const toUSD = (cents: number) => (cents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' })
  const formatNumber = (n: number) => n.toLocaleString()

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, color: '#1f2937' }}>Insights</h1>
      </div>

      {/* Welcome Section and Tasks */}
      <WelcomeAndTasks 
        user={user}
        funnelData={funnelData}
        dataManager={dataManager}
      />

      {/* CALCULATOR */}
      <Section title="Sales Calculator">
        <Calculator dataManager={dataManager} compact />
      </Section>

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
        <Cards>
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
        </Cards>
      </Section>

      {/* SALES FORECAST - Tracker from Forecast Modeling (use existing component for now) */}
      <Section title="Sales Forecast">
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12 }}>
          {dataManager?.loading || loadingForecastModels ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
              Loading forecast data...
            </div>
          ) : !hasActiveForecast && !isViewOnly ? (
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <p style={{ 
                fontSize: '16px', 
                color: '#374151', 
                margin: '0 0 24px 0',
                lineHeight: '1.6'
              }}>
                You haven't built or activated a Sales Forecast for the current year. Build and activate a Sales Forecast now so you can track your goals and progress throughout the year.
              </p>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('navigateToPage', {
                    detail: { action: 'view-forecast' }
                  }))
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
                  e.currentTarget.style.backgroundColor = '#2563eb'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)'
                }}
              >
                Create and Activate Forecast
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <ForecastModeling 
              serviceTypes={serviceTypes}
              setServiceTypes={() => {}}
              bookings={bookings}
              payments={payments}
              showTrackerOnly
            />
          )}
        </div>
      </Section>

      {/* FORECAST TRENDS */}
      <Section title="Forecast Trends">
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <Forecast 
            funnelData={funnelData}
            serviceTypes={serviceTypes}
            setServiceTypes={() => {}}
            bookings={bookings}
            payments={payments}
            showTrendsOnly
          />
        </div>
      </Section>

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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 14, color: '#374151' }}>Bookings by Lead Source</h3>
            {leadSourceBreakdown.items.length === 0 ? (
              <EmptyState />
            ) : (
              <div>
                {leadSourceBreakdown.byCountDesc.map(item => (
                  <div key={item.id} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ flex: 1, color: '#374151' }}>{item.name}</div>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>{formatNumber(item.count)} ({item.pctCount}%)</div>
                    </div>
                    {/* Bar */}
                    <div style={{ height: 6, background: '#eef2ff', borderRadius: 4 }}>
                      <div style={{ width: `${item.pctCount}%`, height: '100%', background: '#3b82f6', borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 14, color: '#374151' }}>Revenue by Lead Source</h3>
            {leadSourceBreakdown.items.length === 0 ? (
              <EmptyState />
            ) : (
              <div>
                {leadSourceBreakdown.byRevenueDesc.map(item => (
                  <div key={item.id} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ flex: 1, color: '#374151' }}>{item.name}</div>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>{toUSD(item.revenue)} ({item.pctRevenue}%)</div>
                    </div>
                    {/* Bar */}
                    <div style={{ height: 6, background: '#ecfdf5', borderRadius: 4 }}>
                      <div style={{ width: `${item.pctRevenue}%`, height: '100%', background: '#10b981', borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <p style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>Includes only bookings whose service types are tracked in the Funnel.</p>
      </Section>

      {/* ADVERTISING */}
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
        <Cards>
          <Card icon={<DollarSign size={20} color="#3b82f6" />} label="Total Ad Spend" value={toUSD(advertisingTotals.totalAdSpend)} />
          <Card icon={<TrendingUp size={20} color="#10b981" />} label="Total Booked from Ads" value={toUSD(advertisingTotals.totalBookedFromAds)} />
          <Card icon={<BarChart3 size={20} color="#f59e0b" />} label="Ad Spend ROI" value={advertisingTotals.overallROI !== null ? advertisingTotals.overallROI.toFixed(2) : 'N/A'} />
          <Card icon={<Target size={20} color="#8b5cf6" />} label="Cost Per Close" value={toUSD(advertisingTotals.costPerClose)} />
        </Cards>
      </Section>
    </div>
  )
}

function Section({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: '#1f2937', textAlign: 'left' }}>{title}</h2>
        {actions ? (
          <div style={{ flexShrink: 0 }}>{actions}</div>
        ) : null}
      </div>
      {children}
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

function Cards({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
      {children}
    </div>
  )
}

function Card({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
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
function WelcomeAndTasks({ user, funnelData, dataManager }: { user: any; funnelData: FunnelData[]; dataManager: any }) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [tasks, setTasks] = useState<Array<{ id: string; label: string; completed: boolean; action: string; month?: { year: number; month: number } }>>([])
  const [forecastModels, setForecastModels] = useState<any[]>([])
  const { user: authUser, effectiveUserId, isViewOnly } = useAuth()

  // Get current and last month info
  const currentMonth = useMemo(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  }, [])

  const lastMonth = useMemo(() => {
    const now = new Date()
    const last = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return { year: last.getFullYear(), month: last.getMonth() + 1 }
  }, [])

  const isNewMonth = useMemo(() => {
    const now = new Date()
    return now.getDate() === 1 // First day of the month
  }, [])

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  // Load forecast models
  useEffect(() => {
    const loadForecastModels = async () => {
      // Use effectiveUserId (owner's ID when viewing as guest, otherwise user's ID)
      const userId = effectiveUserId || authUser?.id
      if (!userId) return
      try {
        const { UnifiedDataService } = await import('./services/unifiedDataService')
        const models = await UnifiedDataService.getForecastModels(userId)
        setForecastModels(models)
      } catch (error) {
        console.error('Error loading forecast models:', error)
      }
    }
    loadForecastModels()
  }, [authUser?.id, effectiveUserId])

  // Check if current month has data
  const currentMonthHasData = useMemo(() => {
    const monthData = funnelData.find(
      f => f.year === currentMonth.year && f.month === currentMonth.month
    )
    return monthData && (
      (monthData.inquiries || 0) > 0 ||
      (monthData.callsBooked || 0) > 0 ||
      (monthData.callsTaken || 0) > 0 ||
      (monthData.closes || 0) > 0 ||
      (monthData.bookings || 0) > 0 ||
      (monthData.cash || 0) > 0
    )
  }, [funnelData, currentMonth])

  // Check if last month has data
  const lastMonthHasData = useMemo(() => {
    const monthData = funnelData.find(
      f => f.year === lastMonth.year && f.month === lastMonth.month
    )
    return monthData && (
      (monthData.inquiries || 0) > 0 ||
      (monthData.callsBooked || 0) > 0 ||
      (monthData.callsTaken || 0) > 0 ||
      (monthData.closes || 0) > 0 ||
      (monthData.bookings || 0) > 0 ||
      (monthData.cash || 0) > 0
    )
  }, [funnelData, lastMonth])

  // Check if forecast model exists and is active
  const hasActiveForecastModel = useMemo(() => {
    return forecastModels.some(m => m.isActive)
  }, [forecastModels])

  const hasForecastModel = useMemo(() => {
    return forecastModels.length > 0
  }, [forecastModels])

  // Check if there's an active forecast model for the current year
  const hasActiveForecastModelForCurrentYear = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return forecastModels.some(m => m.isActive && m.year === currentYear)
  }, [forecastModels])

  // Check if it's January (the month, not just the 1st)
  const isJanuary = useMemo(() => {
    const now = new Date()
    return now.getMonth() === 0 // January (month 0)
  }, [])

  // Generate tasks based on state
  useEffect(() => {
    const generateTasks = () => {
      const newTasks: Array<{ id: string; label: string; completed: boolean; action: string; month?: { year: number; month: number } }> = []

      if (isNewMonth) {
        // Finalize tasks for last month
        newTasks.push({
          id: `finalize-funnel-${lastMonth.year}-${lastMonth.month}`,
          label: `Finalize ${monthNames[lastMonth.month - 1]}'s Sales Funnel Data`,
          completed: false,
          action: 'edit-funnel',
          month: lastMonth
        })
        newTasks.push({
          id: `finalize-sales-${lastMonth.year}-${lastMonth.month}`,
          label: `Finalize ${monthNames[lastMonth.month - 1]}'s Sales Data`,
          completed: false,
          action: 'view-sales',
          month: lastMonth
        })
        newTasks.push({
          id: `finalize-advertising-${lastMonth.year}-${lastMonth.month}`,
          label: `Finalize ${monthNames[lastMonth.month - 1]}'s Advertising Data`,
          completed: false,
          action: 'edit-advertising',
          month: lastMonth
        })
      } else {
        // Regular tasks for current month
        if (!currentMonthHasData) {
          newTasks.push({
            id: `enter-funnel-${currentMonth.year}-${currentMonth.month}`,
            label: `Enter ${monthNames[currentMonth.month - 1]}'s Sales Funnel Data`,
            completed: false,
            action: 'edit-funnel',
            month: currentMonth
          })
          newTasks.push({
            id: `enter-sales-${currentMonth.year}-${currentMonth.month}`,
            label: `Enter ${monthNames[currentMonth.month - 1]}'s Sales Data`,
            completed: false,
            action: 'view-sales',
            month: currentMonth
          })
          newTasks.push({
            id: `enter-advertising-${currentMonth.year}-${currentMonth.month}`,
            label: `Enter ${monthNames[currentMonth.month - 1]}'s Advertising Data`,
            completed: false,
            action: 'edit-advertising',
            month: currentMonth
          })
        }
      }

      // Forecast model tasks
      // New Year task: In January, always show if there's no active forecast model for current year
      // This ensures users activate a new model even if last year's model is still active
      if (isJanuary && !hasActiveForecastModelForCurrentYear) {
        const currentYear = new Date().getFullYear()
        newTasks.push({
          id: `activate-forecast-${currentYear}`,
          label: `Activate your ${currentYear} Forecast Model`,
          completed: false,
          action: 'view-forecast'
        })
      }
      
      // Regular forecast model tasks (only show if not January)
      if (!isJanuary) {
        if (!hasForecastModel) {
          newTasks.push({
            id: 'create-forecast',
            label: 'Create a Forecast Model to plan your year',
            completed: false,
            action: 'view-forecast'
          })
        } else if (!hasActiveForecastModel) {
          newTasks.push({
            id: 'activate-forecast',
            label: 'Activate A Forecast Model to track your goals in real time',
            completed: false,
            action: 'view-forecast'
          })
        }
      }

      // Load completed tasks from localStorage
      const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '[]')
      
      // If it's a new month, clear old month's tasks from localStorage
      if (isNewMonth) {
        const currentMonthKey = `${currentMonth.year}-${currentMonth.month}`
        const lastMonthKey = `${lastMonth.year}-${lastMonth.month}`
        const cleanedTasks = completedTasks.filter((taskId: string) => {
          // Keep tasks that are for the current month or last month (finalize tasks)
          return taskId.includes(currentMonthKey) || taskId.includes(lastMonthKey) || 
                 taskId.includes('forecast') // Keep forecast tasks
        })
        localStorage.setItem('completedTasks', JSON.stringify(cleanedTasks))
      }
      
      const finalCompletedTasks = JSON.parse(localStorage.getItem('completedTasks') || '[]')
      const tasksWithCompletion = newTasks.map(task => ({
        ...task,
        completed: finalCompletedTasks.includes(task.id)
      }))

      setTasks(tasksWithCompletion)
    }

    generateTasks()
  }, [isNewMonth, currentMonthHasData, lastMonthHasData, hasForecastModel, hasActiveForecastModel, hasActiveForecastModelForCurrentYear, isJanuary, currentMonth, lastMonth, monthNames, forecastModels])

  // Toggle task completion
  const toggleTask = (taskId: string) => {
    const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '[]')
    const isCompleted = completedTasks.includes(taskId)
    
    if (isCompleted) {
      localStorage.setItem('completedTasks', JSON.stringify(completedTasks.filter((id: string) => id !== taskId)))
    } else {
      localStorage.setItem('completedTasks', JSON.stringify([...completedTasks, taskId]))
    }

    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ))
  }

  // Handle navigation
  const handleNavigate = (action: string, month?: { year: number; month: number }) => {
    // Dispatch custom event for navigation
    window.dispatchEvent(new CustomEvent('navigateToPage', {
      detail: { action, month }
    }))
  }

  // Handle create modal actions
  const handleCreateAction = (action: string) => {
    setShowCreateModal(false)
    const now = new Date()
    const month = { year: now.getFullYear(), month: now.getMonth() + 1 }
    
    switch (action) {
      case 'add-sale':
        handleNavigate('add-booking')
        break
      case 'add-inquiry':
        handleNavigate('edit-funnel', month)
        break
      case 'add-call-booked':
        handleNavigate('edit-funnel', month)
        break
      case 'add-call-taken':
        handleNavigate('edit-funnel', month)
        break
    }
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
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
      gap: '24px', 
      marginBottom: '32px'
    }}>
      {/* Welcome Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0', color: '#1f2937' }}>
          Welcome back {firstName}!
        </h2>
        <p style={{ fontSize: '16px', color: '#6b7280', margin: '0 0 20px 0' }}>
          Remember, winning is a numbers game.
        </p>
        <button
          onClick={() => !isViewOnly && setShowCreateModal(true)}
          disabled={isViewOnly}
          style={{
            backgroundColor: isViewOnly ? '#e5e7eb' : '#3b82f6',
            color: isViewOnly ? '#9ca3af' : 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: isViewOnly ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: isViewOnly ? 0.5 : 1
          }}
        >
          + New
        </button>
      </div>

      {/* Tasks Section */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#1f2937' }}>
            This Month's Tasks
          </h3>
          {tasks.length > 0 && (
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              {tasks.filter(t => t.completed).length} of {tasks.length} complete
            </div>
          )}
        </div>
        {tasks.length === 0 ? (
          <div style={{
            padding: '16px',
            backgroundColor: '#d1fae5',
            borderRadius: '8px',
            border: '1px solid #10b981',
            textAlign: 'center'
          }}>
            <CheckCircle size={24} color="#065f46" style={{ marginBottom: '8px' }} />
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#065f46' }}>
              You're fully caught up through last month's data. Great job! 🎉
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tasks.map(task => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: task.completed ? '#f9fafb' : 'white',
                  border: `1px solid ${task.completed ? '#d1d5db' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  opacity: task.completed ? 0.7 : 1
                }}
              >
                <div
                  onClick={() => toggleTask(task.id)}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    border: task.completed ? 'none' : '2px solid #d1d5db',
                    backgroundColor: task.completed ? '#10b981' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  {task.completed && <CheckCircle size={14} color="white" />}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{
                    fontSize: '14px',
                    color: task.completed ? '#6b7280' : '#1f2937',
                    textDecoration: task.completed ? 'line-through' : 'none'
                  }}>
                    {task.label}
                  </span>
                </div>
                <button
                  onClick={() => handleNavigate(task.action, task.month)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Do Now
                  <ArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
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
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Add New</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => handleCreateAction('add-sale')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Add New Sale
              </button>
              <button
                onClick={() => handleCreateAction('add-inquiry')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Add New Inquiry
              </button>
              <button
                onClick={() => handleCreateAction('add-call-booked')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Add New Call Booked
              </button>
              <button
                onClick={() => handleCreateAction('add-call-taken')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Add New Call Taken
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ color: '#9ca3af', fontSize: 14 }}>No data</div>
  )
}


