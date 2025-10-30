import React, { useMemo, useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import Forecast from './Forecast'
import ForecastModeling from './ForecastModeling'
import type { FunnelData, Booking, Payment, ServiceType, AdCampaign, AdSource, LeadSource } from './types'
import { Users, Phone, CheckCircle, DollarSign, TrendingUp, Target, BarChart3 } from 'lucide-react'

export default function Insights({ dataManager }: { dataManager: any }) {
  const { user } = useAuth()
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)

  const funnelData: FunnelData[] = dataManager?.funnelData || []
  const bookings: Booking[] = dataManager?.bookings || []
  const payments: Payment[] = dataManager?.payments || []
  const serviceTypes: ServiceType[] = dataManager?.serviceTypes || []
  const adSources: AdSource[] = dataManager?.adSources || []
  const adCampaigns: AdCampaign[] = dataManager?.adCampaigns || []
  const leadSources: LeadSource[] = dataManager?.leadSources || []

  const yearData = useMemo(() => funnelData.filter(m => m.year === selectedYear), [funnelData, selectedYear])

  // Dynamic totals (closes and bookings) derived from Sales records that are tracked in the Funnel
  const dynamicSalesTotals = useMemo(() => {
    const trackableServiceIds = new Set(serviceTypes.filter(st => st.tracksInFunnel).map(st => st.id))
    let closes = 0
    let bookingsCents = 0
    bookings.forEach(b => {
      if (!b?.dateBooked) return
      const [y] = b.dateBooked.split('-')
      if (parseInt(y, 10) === selectedYear && trackableServiceIds.has(b.serviceTypeId)) {
        closes += 1
        bookingsCents += b.bookedRevenue || 0
      }
    })
    return { closes, bookingsCents }
  }, [bookings, serviceTypes, selectedYear])

  // Sales metrics from funnel data (year totals)
  const salesTotals = useMemo(() => {
    const totalInquiries = yearData.reduce((s, m) => s + (m.inquiries || 0), 0)
    // Use dynamic totals for closes and bookings to avoid timezone/calculation issues from stored funnel rows
    const totalCloses = dynamicSalesTotals.closes
    const totalBookings = dynamicSalesTotals.bookingsCents
    const totalCash = yearData.reduce((s, m) => s + (m.cash || 0), 0)
    const monthsWithData = yearData.filter(m => (m.inquiries||0) > 0 || (m.callsBooked||0) > 0 || (m.callsTaken||0) > 0 || (m.closes||0) > 0 || (m.bookings||0) > 0).length
    const avgInquiries = monthsWithData > 0 ? Math.round(totalInquiries / monthsWithData) : 0
    const avgCloses = monthsWithData > 0 ? Math.round(totalCloses / monthsWithData) : 0
    const avgBookings = monthsWithData > 0 ? Math.round(totalBookings / monthsWithData) : 0
    const avgCash = monthsWithData > 0 ? Math.round(totalCash / monthsWithData) : 0
    const inquiryToClose = totalInquiries > 0 ? ((totalCloses / totalInquiries) * 100).toFixed(1) : '0.0'
    return { totalInquiries, totalCloses, totalBookings, totalCash, inquiryToClose, monthsWithData, avgInquiries, avgCloses, avgBookings, avgCash }
  }, [yearData, dynamicSalesTotals])

  // Calls metrics
  const callTotals = useMemo(() => {
    const totalInquiries = yearData.reduce((s, m) => s + (m.inquiries || 0), 0)
    const totalCallsBooked = yearData.reduce((s, m) => s + (m.callsBooked || 0), 0)
    const totalCallsTaken = yearData.reduce((s, m) => s + (m.callsTaken || 0), 0)
    // Use dynamic closes for accuracy
    const totalCloses = dynamicSalesTotals.closes
    const monthsWithData = yearData.filter(m => (m.inquiries||0) > 0 || (m.callsBooked||0) > 0 || (m.callsTaken||0) > 0 || (m.closes||0) > 0 || (m.bookings||0) > 0).length
    const avgCallsBooked = monthsWithData > 0 ? Math.round(totalCallsBooked / monthsWithData) : 0
    const avgCallsTaken = monthsWithData > 0 ? Math.round(totalCallsTaken / monthsWithData) : 0
    const inquiryToBooked = totalInquiries > 0 ? ((totalCallsBooked / totalInquiries) * 100).toFixed(1) : '0.0'
    const inquiryToTaken = totalInquiries > 0 ? ((totalCallsTaken / totalInquiries) * 100).toFixed(1) : '0.0'
    const showUpRate = totalCallsBooked > 0 ? ((totalCallsTaken / totalCallsBooked) * 100).toFixed(1) : '0.0'
    const takenToClose = totalCallsTaken > 0 ? ((totalCloses / totalCallsTaken) * 100).toFixed(1) : '0.0'
    // Revenue per call taken uses bookings dollars from funnel divided by callsTaken
    const totalBookings = dynamicSalesTotals.bookingsCents
    const revenuePerCallTaken = totalCallsTaken > 0 ? Math.round(totalBookings / totalCallsTaken) : 0
    return { totalCallsBooked, totalCallsTaken, inquiryToBooked, inquiryToTaken, showUpRate, takenToClose, revenuePerCallTaken, avgCallsBooked, avgCallsTaken }
  }, [yearData, dynamicSalesTotals])

  // Lead Sources (bookings filtered to service types that track in funnel)
  const leadSourceBreakdown = useMemo(() => {
    const trackableServiceIds = new Set(serviceTypes.filter(st => st.tracksInFunnel).map(st => st.id))
    // Filter bookings by selected year and trackable service types
    const inYear = bookings.filter(b => {
      if (!b.dateBooked) return false
      const [y] = b.dateBooked.split('-')
      return parseInt(y, 10) === selectedYear && trackableServiceIds.has(b.serviceTypeId)
    })
    const byCount: Record<string, number> = {}
    const byRevenue: Record<string, number> = {}
    inYear.forEach(b => {
      const ls = b.leadSourceId
      byCount[ls] = (byCount[ls] || 0) + 1
      byRevenue[ls] = (byRevenue[ls] || 0) + (b.bookedRevenue || 0)
    })
    const totalCount = Object.values(byCount).reduce((s, n) => s + n, 0)
    const totalRevenue = Object.values(byRevenue).reduce((s, n) => s + n, 0)
    const items = Object.keys(byCount).map(lsId => {
      const name = leadSources.find(l => l.id === lsId)?.name || 'Unknown'
      const count = byCount[lsId] || 0
      const revenue = byRevenue[lsId] || 0
      const pctCount = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
      const pctRevenue = totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0
      return { id: lsId, name, count, revenue, pctCount, pctRevenue }
    })
    // Sorted views
    const byCountDesc = [...items].sort((a, b) => b.count - a.count)
    const byRevenueDesc = [...items].sort((a, b) => b.revenue - a.revenue)
    return { items, totalCount, totalRevenue, byCountDesc, byRevenueDesc }
  }, [bookings, leadSources, selectedYear, serviceTypes])

  // Advertising totals (current selected year)
  const advertisingTotals = useMemo(() => {
    const campaigns = adCampaigns.filter(c => c.year === selectedYear)
    const totalAdSpend = campaigns.reduce((s, c) => s + (c.spend || c.adSpendCents || 0), 0)
    // Map adSource -> leadSource to attribute bookings
    const adSourceIdToLeadSource = new Map(adSources.map(as => [as.id, as.leadSourceId]))
    const totalBookedFromAds = bookings
      .filter(b => {
        const lsId = b.leadSourceId
        return Array.from(adSourceIdToLeadSource.values()).includes(lsId) && b.dateBooked?.startsWith(String(selectedYear))
      })
      .reduce((s, b) => s + (b.revenue || b.bookedRevenue || 0), 0)
    const closesFromAds = bookings.filter(b => {
      const lsId = b.leadSourceId
      return Array.from(adSourceIdToLeadSource.values()).includes(lsId) && b.dateBooked?.startsWith(String(selectedYear))
    }).length
    const overallROI = totalAdSpend > 0 && totalBookedFromAds > 0 ? (totalBookedFromAds / totalAdSpend) * 100 : null
    const costPerClose = closesFromAds > 0 ? Math.round(totalAdSpend / closesFromAds) : 0
    return { totalAdSpend, totalBookedFromAds, overallROI, costPerClose }
  }, [adCampaigns, adSources, bookings, selectedYear])

  const toUSD = (cents: number) => (cents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' })
  const formatNumber = (n: number) => n.toLocaleString()

  const availableYears = useMemo(() => {
    const years = new Set<number>()
    funnelData.forEach(m => years.add(m.year))
    const arr = Array.from(years).sort((a, b) => b - a)
    return arr.length ? arr : [currentYear]
  }, [funnelData, currentYear])

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, color: '#1f2937' }}>Insights</h1>
        <div>
          <label style={{ marginRight: 8, fontSize: 14, color: '#374151' }}>Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, background: 'white' }}
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SALES FUNNEL */}
      <Section title="Sales Funnel">
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
          <ForecastModeling 
            serviceTypes={serviceTypes}
            setServiceTypes={() => {}}
            bookings={bookings}
            payments={payments}
            showTrackerOnly
          />
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
      <Section title="Lead Sources">
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
                      <div style={{ width: 12, height: 12, borderRadius: 2, background: '#3b82f6' }} />
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
                      <div style={{ width: 12, height: 12, borderRadius: 2, background: '#10b981' }} />
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
      <Section title="Advertising">
        <Cards>
          <Card icon={<DollarSign size={20} color="#3b82f6" />} label="Total Ad Spend" value={toUSD(advertisingTotals.totalAdSpend)} />
          <Card icon={<TrendingUp size={20} color="#10b981" />} label="Total Booked from Ads" value={toUSD(advertisingTotals.totalBookedFromAds)} />
          <Card icon={<BarChart3 size={20} color="#f59e0b" />} label="Ad Spend ROI" value={advertisingTotals.overallROI !== null ? `${advertisingTotals.overallROI.toFixed(1)}%` : 'N/A'} />
          <Card icon={<Target size={20} color="#8b5cf6" />} label="Cost Per Close" value={toUSD(advertisingTotals.costPerClose)} />
        </Cards>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: '#1f2937', textAlign: 'left' }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Cards({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
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


