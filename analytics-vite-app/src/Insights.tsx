import React, { useCallback, useMemo, useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import Forecast from './Forecast'
import ForecastModeling from './ForecastModeling'
import Calculator from './Calculator'
import type { FunnelData, Booking, Payment, ServiceType, AdCampaign, LeadSource } from './types'
import { Users, Phone, CheckCircle, DollarSign, TrendingUp, Target, BarChart3 } from 'lucide-react'

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
  const { user } = useAuth()
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

  const funnelData: FunnelData[] = dataManager?.funnelData || []
  const bookings: Booking[] = dataManager?.bookings || []
  const payments: Payment[] = dataManager?.payments || []
  const serviceTypes: ServiceType[] = dataManager?.serviceTypes || []
  const adCampaigns: AdCampaign[] = dataManager?.adCampaigns || []
  const leadSources: LeadSource[] = dataManager?.leadSources || []

  // Debug logging
  console.log('=== INSIGHTS COMPONENT DEBUG ===');
  console.log('dataManager exists:', !!dataManager);
  console.log('dataManager keys:', dataManager ? Object.keys(dataManager) : 'no dataManager');
  console.log('dataManager.loading:', dataManager?.loading);
  console.log('dataManager.adCampaigns (raw):', dataManager?.adCampaigns);
  console.log('dataManager.adCampaigns length:', dataManager?.adCampaigns?.length || 0);
  console.log('adCampaigns array:', adCampaigns);
  console.log('adCampaigns length:', adCampaigns.length);
  console.log('bookings length:', bookings.length);
  console.log('payments length:', payments.length);
  console.log('leadSources length:', leadSources.length);
  console.log('================================');

  const trackableServiceIds = useMemo(() => new Set(serviceTypes.filter(st => st.tracksInFunnel).map(st => st.id)), [serviceTypes])

  const yearsWithBookings = useMemo(() => {
    const years = new Set<number>()
    bookings.forEach(b => {
      if (!b?.dateBooked) return
      const year = parseInt(b.dateBooked.split('-')[0], 10)
      if (Number.isFinite(year)) {
        years.add(year)
      }
    })
    years.add(currentDateInfo.year)
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
  const salesFunnelMonths = useMemo(
    () => funnelData.filter(month => isMonthInRange(month.year, month.month, salesFunnelRange)),
    [funnelData, salesFunnelRange]
  )
  const salesFunnelBookings = useMemo(
    () => bookings.filter(b => isDateInRange(b.dateBooked, salesFunnelRange)),
    [bookings, salesFunnelRange]
  )
  const salesDynamicTotals = useMemo(() => {
    let closes = 0
    let bookingsCents = 0
    salesFunnelBookings.forEach(b => {
      bookingsCents += b.bookedRevenue || 0
      if (trackableServiceIds.has(b.serviceTypeId)) {
        closes += 1
      }
    })
    return { closes, bookingsCents }
  }, [salesFunnelBookings, trackableServiceIds])

  const salesTotals = useMemo(() => {
    const totalInquiries = salesFunnelMonths.reduce((sum, month) => sum + (month.inquiries || 0), 0)
    const totalCash = salesFunnelMonths.reduce((sum, month) => sum + (month.cash || 0), 0)
    const monthsWithData = salesFunnelMonths.filter(month =>
      (month.inquiries || 0) > 0 ||
      (month.callsBooked || 0) > 0 ||
      (month.callsTaken || 0) > 0 ||
      (month.closes || 0) > 0 ||
      (month.bookings || 0) > 0
    ).length
    const totalCloses = salesDynamicTotals.closes
    const totalBookings = salesDynamicTotals.bookingsCents
    const avgInquiries = monthsWithData > 0 ? Math.round(totalInquiries / monthsWithData) : 0
    const avgCloses = monthsWithData > 0 ? Math.round(totalCloses / monthsWithData) : 0
    const avgBookings = monthsWithData > 0 ? Math.round(totalBookings / monthsWithData) : 0
    const avgCash = monthsWithData > 0 ? Math.round(totalCash / monthsWithData) : 0
    const inquiryToClose = totalInquiries > 0 ? ((totalCloses / totalInquiries) * 100).toFixed(1) : '0.0'
    return { totalInquiries, totalCloses, totalBookings, totalCash, inquiryToClose, monthsWithData, avgInquiries, avgCloses, avgBookings, avgCash }
  }, [salesFunnelMonths, salesDynamicTotals])

  const callTotals = useMemo(() => {
    const totalInquiries = salesFunnelMonths.reduce((sum, month) => sum + (month.inquiries || 0), 0)
    const totalCallsBooked = salesFunnelMonths.reduce((sum, month) => sum + (month.callsBooked || 0), 0)
    const totalCallsTaken = salesFunnelMonths.reduce((sum, month) => sum + (month.callsTaken || 0), 0)
    const monthsWithData = salesFunnelMonths.filter(month =>
      (month.inquiries || 0) > 0 ||
      (month.callsBooked || 0) > 0 ||
      (month.callsTaken || 0) > 0 ||
      (month.closes || 0) > 0 ||
      (month.bookings || 0) > 0
    ).length
    const avgCallsBooked = monthsWithData > 0 ? Math.round(totalCallsBooked / monthsWithData) : 0
    const avgCallsTaken = monthsWithData > 0 ? Math.round(totalCallsTaken / monthsWithData) : 0
    const totalCloses = salesDynamicTotals.closes
    const inquiryToBooked = totalInquiries > 0 ? ((totalCallsBooked / totalInquiries) * 100).toFixed(1) : '0.0'
    const inquiryToTaken = totalInquiries > 0 ? ((totalCallsTaken / totalInquiries) * 100).toFixed(1) : '0.0'
    const showUpRate = totalCallsBooked > 0 ? ((totalCallsTaken / totalCallsBooked) * 100).toFixed(1) : '0.0'
    const takenToClose = totalCallsTaken > 0 ? ((totalCloses / totalCallsTaken) * 100).toFixed(1) : '0.0'
    const revenuePerCallTaken = totalCallsTaken > 0 ? Math.round(salesDynamicTotals.bookingsCents / totalCallsTaken) : 0
    return { totalCallsBooked, totalCallsTaken, inquiryToBooked, inquiryToTaken, showUpRate, takenToClose, revenuePerCallTaken, avgCallsBooked, avgCallsTaken }
  }, [salesFunnelMonths, salesDynamicTotals])

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
          {/* Ordered cards */}
          <Card icon={<Users size={20} color="#3b82f6" />} label="Inquiries" value={formatNumber(salesTotals.totalInquiries)} sub={`Avg: ${formatNumber(salesTotals.avgInquiries)}/month`} />
          <Card icon={<Phone size={20} color="#10b981" />} label="Calls Booked" value={formatNumber(callTotals.totalCallsBooked)} sub={`Avg: ${formatNumber(callTotals.avgCallsBooked)}/month`} />
          <Card icon={<Phone size={20} color="#f59e0b" />} label="Calls Taken" value={formatNumber(callTotals.totalCallsTaken)} sub={`Avg: ${formatNumber(callTotals.avgCallsTaken)}/month`} />
          <Card icon={<CheckCircle size={20} color="#ef4444" />} label="Closes" value={formatNumber(salesTotals.totalCloses)} sub={`Avg: ${formatNumber(salesTotals.avgCloses)}/month`} />

          <Card icon={<DollarSign size={20} color="#8b5cf6" />} label="Bookings" value={toUSD(salesTotals.totalBookings)} sub={`Avg: ${toUSD(salesTotals.avgBookings)}/month`} />
          <Card icon={<DollarSign size={20} color="#10b981" />} label="Cash" value={toUSD(salesTotals.totalCash)} sub={`Avg: ${toUSD(salesTotals.avgCash)}/month`} />

          <Card icon={<Users size={20} color="#3b82f6" />} label="Inquiry to Call Booked %" value={`${callTotals.inquiryToBooked}%`} sub="Inquiry conversion" />
          <Card icon={<Users size={20} color="#3b82f6" />} label="Inquiry to Call Taken %" value={`${callTotals.inquiryToTaken}%`} sub="Inquiry conversion" />

          <Card icon={<CheckCircle size={20} color="#ef4444" />} label="Call Taken to Close %" value={`${callTotals.takenToClose}%`} sub="Call completion" />
          <Card icon={<TrendingUp size={20} color="#06b6d4" />} label="Inquiry to Close %" value={`${salesTotals.inquiryToClose}%`} sub="Overall conversion" />
          <Card icon={<Target size={20} color="#8b5cf6" />} label="Call Show Up Rate" value={`${callTotals.showUpRate}%`} sub="Call attendance" />
          <Card icon={<DollarSign size={20} color="#10b981" />} label="Revenue Per Call Taken" value={toUSD(callTotals.revenuePerCallTaken)} sub="Per call value" />
        </Cards>
      </Section>

      {/* SALES FORECAST - Tracker from Forecast Modeling (use existing component for now) */}
      <Section title="Sales Forecast">
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12 }}>
          {dataManager?.loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
              Loading forecast data...
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

function EmptyState() {
  return (
    <div style={{ color: '#9ca3af', fontSize: 14 }}>No data</div>
  )
}


