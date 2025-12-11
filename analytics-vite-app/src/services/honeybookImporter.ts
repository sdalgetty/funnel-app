/**
 * Honeybook CSV Importer
 * Maps Honeybook CSV exports to our data structures
 */

import { parseCSV, parseDate, parseCents, findColumn, type CSVRow } from '../utils/csvParser';
import type { Booking, FunnelData, ServiceType, LeadSource } from '../types';
import { logger } from '../utils/logger';

export interface ImportResult {
  bookings: Booking[];
  funnelData: FunnelData[];
  serviceTypes: ServiceType[];
  leadSources: LeadSource[];
  errors: string[];
  warnings: string[];
}

/**
 * Import bookings from Honeybook CSV
 * Common Honeybook fields:
 * - Project Name, Client Name, Client Email, Client Phone
 * - Service Type, Lead Source
 * - Booking Date, Project Date, Date Inquired
 * - Total Amount, Status, Notes
 */
export function importBookingsFromCSV(
  csvText: string,
  existingServiceTypes: ServiceType[],
  existingLeadSources: LeadSource[],
  userId: string
): ImportResult {
  const result: ImportResult = {
    bookings: [],
    funnelData: [],
    serviceTypes: [...existingServiceTypes],
    leadSources: [...existingLeadSources],
    errors: [],
    warnings: [],
  };

  const { headers, rows, errors } = parseCSV(csvText);
  result.errors.push(...errors);

  if (headers.length === 0) {
    result.errors.push('No headers found in CSV file');
    return result;
  }

  // Map Honeybook Leads report columns to our fields
  // Exact column names from Honeybook: #, Project Name, Full Name, Email Address, Phone Number, 
  // Project Date, Lead Created Date, Total Project Value, Lead Source, Lead Source Open Text, Booked Date
  const columnMap = {
    projectName: findColumn(headers, ['project name', 'project', 'event name', 'event', 'job name', 'job']),
    clientName: findColumn(headers, ['full name', 'client name', 'client', 'customer name', 'customer', 'contact name']),
    clientEmail: findColumn(headers, ['email address', 'client email', 'email', 'contact email', 'customer email']),
    clientPhone: findColumn(headers, ['phone number', 'client phone', 'phone', 'contact phone']),
    serviceType: findColumn(headers, ['service type', 'service', 'package', 'product']), // Not in Leads report, will use default
    leadSource: findColumn(headers, ['lead source', 'source', 'referral source', 'how did you hear']),
    leadSourceOpenText: findColumn(headers, ['lead source open text', 'lead source detail', 'source detail']),
    bookingDate: findColumn(headers, ['booked date', 'booking date', 'signed date', 'contract date', 'date booked', 'booked on']),
    projectDate: findColumn(headers, ['project date', 'event date', 'shoot date', 'session date', 'service date']),
    dateInquired: findColumn(headers, ['lead created date', 'date inquired', 'inquiry date', 'contacted date', 'first contact', 'created date']),
    totalAmount: findColumn(headers, ['total project value', 'total amount', 'total', 'amount', 'price', 'revenue', 'contract value', 'project value']),
    status: findColumn(headers, ['status', 'project status', 'booking status']), // Not in Leads report, will infer from Booked Date
    notes: findColumn(headers, ['notes', 'description', 'comments', 'internal notes']), // Not in Leads report
  };

  // Log which columns were found
  logger.debug('Honeybook column mapping:', columnMap);

  // Create service types and lead sources as we encounter them
  const serviceTypeMap = new Map<string, string>(); // name -> id
  const leadSourceMap = new Map<string, string>(); // name -> id

  existingServiceTypes.forEach(st => serviceTypeMap.set(st.name.toLowerCase(), st.id));
  existingLeadSources.forEach(ls => leadSourceMap.set(ls.name.toLowerCase(), ls.id));

  let serviceTypeCounter = existingServiceTypes.length;
  let leadSourceCounter = existingLeadSources.length;

  // Process each row
  rows.forEach((row, index) => {
    try {
      // Get project name (required)
      const projectName = columnMap.projectName ? row[columnMap.projectName] : '';
      if (!projectName || projectName.trim() === '') {
        result.warnings.push(`Row ${index + 2}: Skipping row with no project name`);
        return;
      }

      // Get client name (use project name if no client name, or just use project name)
      const clientName = columnMap.clientName && row[columnMap.clientName]?.trim()
        ? row[columnMap.clientName].trim()
        : projectName.trim(); // Fallback to project name

      // Get or create service type
      let serviceTypeId = '';
      if (columnMap.serviceType && row[columnMap.serviceType]) {
        const serviceTypeName = row[columnMap.serviceType].trim();
        if (serviceTypeName) {
          const lowerName = serviceTypeName.toLowerCase();
          if (!serviceTypeMap.has(lowerName)) {
            // Create new service type
            const newId = `imported-st-${Date.now()}-${serviceTypeCounter++}`;
            result.serviceTypes.push({
              id: newId,
              name: serviceTypeName,
              description: `Imported from Honeybook`,
              isCustom: true,
            });
            serviceTypeMap.set(lowerName, newId);
          }
          serviceTypeId = serviceTypeMap.get(lowerName)!;
        }
      }

      // Default service type if none found
      if (!serviceTypeId && result.serviceTypes.length > 0) {
        serviceTypeId = result.serviceTypes[0].id;
      } else if (!serviceTypeId) {
        // Create a default service type
        const defaultId = `imported-st-default-${Date.now()}`;
        result.serviceTypes.push({
          id: defaultId,
          name: 'General Service',
          description: 'Default service type for imported bookings',
          isCustom: true,
        });
        serviceTypeId = defaultId;
      }

      // Get or create lead source (combine Lead Source + Lead Source Open Text if available)
      let leadSourceId = '';
      let leadSourceName = '';
      if (columnMap.leadSource && row[columnMap.leadSource]) {
        leadSourceName = row[columnMap.leadSource].trim();
        
        // Combine with open text if available (e.g., "Vendor Referral" + "Veronica - Estate at Bluemont")
        if (columnMap.leadSourceOpenText && row[columnMap.leadSourceOpenText] && row[columnMap.leadSourceOpenText].trim()) {
          const openText = row[columnMap.leadSourceOpenText].trim();
          if (openText && openText !== '""') {
            leadSourceName = `${leadSourceName} - ${openText}`;
          }
        }
        
        if (leadSourceName) {
          const lowerName = leadSourceName.toLowerCase();
          if (!leadSourceMap.has(lowerName)) {
            // Create new lead source
            const newId = `imported-ls-${Date.now()}-${leadSourceCounter++}`;
            result.leadSources.push({
              id: newId,
              name: leadSourceName,
              description: `Imported from Honeybook`,
              isCustom: true,
            });
            leadSourceMap.set(lowerName, newId);
          }
          leadSourceId = leadSourceMap.get(lowerName)!;
        }
      }

      // Default lead source if none found
      if (!leadSourceId && result.leadSources.length > 0) {
        leadSourceId = result.leadSources[0].id;
      } else if (!leadSourceId) {
        // Create a default lead source
        const defaultId = `imported-ls-default-${Date.now()}`;
        result.leadSources.push({
          id: defaultId,
          name: 'Direct',
          description: 'Default lead source for imported bookings',
          isCustom: true,
        });
        leadSourceId = defaultId;
      }

      // Parse dates
      // Lead Created Date = inquiry date (required for funnel)
      const dateInquired = columnMap.dateInquired 
        ? parseDate(row[columnMap.dateInquired]) 
        : null;
      
      if (!dateInquired) {
        result.warnings.push(`Row ${index + 2}: Missing Lead Created Date, skipping`);
        return;
      }
      
      // Booked Date = when they actually booked (if present, indicates a close)
      const bookingDate = columnMap.bookingDate && row[columnMap.bookingDate]?.trim()
        ? parseDate(row[columnMap.bookingDate]) 
        : null;
      
      // Project Date = event/service date (can be TBD)
      const projectDate = columnMap.projectDate && row[columnMap.projectDate]?.trim()?.toUpperCase() !== 'TBD'
        ? parseDate(row[columnMap.projectDate]) 
        : null;

      // Parse amount (in cents) - Total Project Value
      const totalAmount = columnMap.totalAmount 
        ? parseCents(row[columnMap.totalAmount]) || 0 
        : 0;

      // Determine status: if Booked Date exists, it's booked; otherwise it's an inquiry/lead
      const status = bookingDate ? 'booked' : 'inquiry';

      // Get notes
      const notes = columnMap.notes ? row[columnMap.notes].trim() : '';

      // Leads Report: Do NOT create booking records
      // Bookings should come from Booked Client Report (Sales data)
      // This report is only for funnel data (inquiries and closes count)
      // If there's a Booked Date, we'll count it as a close in funnel data, but not create a booking record
    } catch (error) {
      result.errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Generate funnel data from all rows (inquiries) and bookings (closes)
  result.funnelData = generateFunnelDataFromLeadsReport(rows, columnMap, result.bookings);

  return result;
}

/**
 * Generate funnel data from imported data
 * For Honeybook Leads report: each row is an inquiry (Lead Created Date)
 * Rows with Booked Date are closes
 */
export function generateFunnelDataFromLeadsReport(
  rows: CSVRow[],
  columnMap: any,
  bookings: Booking[]
): FunnelData[] {
  const monthlyData = new Map<string, {
    year: number;
    month: number;
    inquiries: number;
    closes: number;
    bookings: number; // in cents
  }>();

  // Count all inquiries (all rows have Lead Created Date)
  rows.forEach((row, index) => {
    const dateInquired = columnMap.dateInquired 
      ? parseDate(row[columnMap.dateInquired]) 
      : null;
    
    if (!dateInquired) return;

    const inquiryDate = new Date(dateInquired);
    const year = inquiryDate.getFullYear();
    const month = inquiryDate.getMonth() + 1;
    const key = `${year}-${month}`;

    if (!monthlyData.has(key)) {
      monthlyData.set(key, {
        year,
        month,
        inquiries: 0,
        closes: 0,
        bookings: 0,
      });
    }

    const data = monthlyData.get(key)!;
    data.inquiries += 1; // Every row is an inquiry
    
    // Check if this row has a Booked Date (indicates a close)
    const bookedDate = columnMap.bookingDate && row[columnMap.bookingDate]?.trim()
      ? parseDate(row[columnMap.bookingDate])
      : null;
    
    if (bookedDate) {
      data.closes += 1;
      
      // Get revenue for this booking
      const totalAmount = columnMap.totalAmount 
        ? parseCents(row[columnMap.totalAmount]) || 0 
        : 0;
      data.bookings += totalAmount;
    }
  });

  // Convert to FunnelData array
  const funnelData: FunnelData[] = Array.from(monthlyData.values())
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    })
    .map(data => ({
      id: `imported-funnel-${data.year}-${data.month}`,
      name: 'Default',
      year: data.year,
      month: data.month,
      inquiries: data.inquiries,
      inquiriesYtd: 0, // Will be calculated after all months are imported
      callsBooked: 0,
      callsTaken: 0,
      callsYtd: 0,
      inquiryToCall: 0,
      callToBooking: 0,
      closes: data.closes,
      bookings: data.bookings,
      bookingsYtd: 0, // Will be calculated after all months are imported
      bookingsGoal: 0,
      cash: 0,
      notes: 'Imported from Honeybook',
      closesManual: false,
      bookingsManual: false,
      cashManual: false,
      lastUpdated: new Date().toISOString(),
    }));

  // Calculate YTD values
  funnelData.forEach((data, index) => {
    const previousYtd = index > 0 && funnelData[index - 1].year === data.year
      ? funnelData[index - 1].inquiriesYtd
      : 0;
    data.inquiriesYtd = previousYtd + data.inquiries;

    const previousBookingsYtd = index > 0 && funnelData[index - 1].year === data.year
      ? funnelData[index - 1].bookingsYtd
      : 0;
    data.bookingsYtd = previousBookingsYtd + data.bookings;
  });

  return funnelData;
}

