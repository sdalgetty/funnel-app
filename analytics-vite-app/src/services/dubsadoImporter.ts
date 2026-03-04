/**
 * Dubsado Leads CSV Importer
 * Maps Dubsado Leads exports to funnel events and monthly funnel data.
 */

import { parseCSV, parseDate, findColumn, type CSVRow } from '../utils/csvParser'
import type { FunnelData, FunnelEvent, ServiceType, LeadSource } from '../types'
import { logger } from '../utils/logger'

export interface ImportResult {
  bookings: []
  funnelData: FunnelData[]
  funnelEvents: FunnelEvent[]
  serviceTypes: ServiceType[]
  leadSources: LeadSource[]
  errors: string[]
  warnings: string[]
}

export function importDubsadoLeadsFromCSV(
  csvText: string,
  existingServiceTypes: ServiceType[],
  existingLeadSources: LeadSource[],
): ImportResult {
  const result: ImportResult = {
    bookings: [],
    funnelData: [],
    funnelEvents: [],
    serviceTypes: [...existingServiceTypes],
    leadSources: [...existingLeadSources],
    errors: [],
    warnings: [],
  }

  const { headers, rows, errors } = parseCSV(csvText)
  result.errors.push(...errors)

  if (headers.length === 0) {
    result.errors.push('No headers found in CSV file')
    return result
  }

  const columnMap = {
    firstName: findColumn(headers, ['first name', 'firstname']),
    lastName: findColumn(headers, ['last name', 'lastname']),
    email: findColumn(headers, ['email address', 'email']),
    service: findColumn(headers, ['service']),
    dateSubmitted: findColumn(headers, ['date submitted']),
  }

  logger.debug('Dubsado column mapping:', columnMap)

  const dedupeKeys = new Set<string>()
  const monthlyData = new Map<string, { year: number; month: number; inquiries: number }>()
  rows.forEach((row, index) => {
    try {
      const serviceValue = columnMap.service ? row[columnMap.service]?.trim() : ''
      if (!serviceValue) {
        return
      }
      const serviceLower = serviceValue.toLowerCase()
      if (!serviceLower.includes('wedding')) {
        return
      }

      const dateSubmitted = columnMap.dateSubmitted ? parseDate(row[columnMap.dateSubmitted]) : null
      if (!dateSubmitted) {
        result.warnings.push(`Row ${index + 2}: Missing Date Submitted, skipping`)
        return
      }

      const email = columnMap.email ? row[columnMap.email]?.trim().toLowerCase() : ''
      const firstName = columnMap.firstName ? row[columnMap.firstName]?.trim().toLowerCase() : ''
      const lastName = columnMap.lastName ? row[columnMap.lastName]?.trim().toLowerCase() : ''
      const nameKey = `${firstName} ${lastName}`.trim()
      const dedupeKey = email || nameKey || `row-${index + 2}`

      if (dedupeKeys.has(dedupeKey)) {
        return
      }
      dedupeKeys.add(dedupeKey)

      result.funnelEvents.push({
        id: `imported-dubsado-${index}`,
        metric: 'inquiries',
        value: 1,
        eventDate: dateSubmitted,
        source: 'dubsado',
        sourceId: dedupeKey,
      })

      const submittedDate = new Date(dateSubmitted)
      const year = submittedDate.getFullYear()
      const month = submittedDate.getMonth() + 1
      const key = `${year}-${month}`
      if (!monthlyData.has(key)) {
        monthlyData.set(key, { year, month, inquiries: 0 })
      }
      monthlyData.get(key)!.inquiries += 1
    } catch (error) {
      result.errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  result.funnelData = Array.from(monthlyData.values())
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })
    .map(data => ({
      id: `imported-dubsado-${data.year}-${data.month}`,
      name: 'Default',
      year: data.year,
      month: data.month,
      inquiries: data.inquiries,
      inquiriesYtd: 0,
      confirmedAvailable: 0,
      callsBooked: 0,
      callsCancelled: 0,
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
      cashManual: false,
      lastUpdated: new Date().toISOString(),
    }))

  result.funnelData.forEach((data, index) => {
    const previousYtd = index > 0 && result.funnelData[index - 1].year === data.year
      ? result.funnelData[index - 1].inquiriesYtd
      : 0
    data.inquiriesYtd = previousYtd + data.inquiries
  })

  return result
}
