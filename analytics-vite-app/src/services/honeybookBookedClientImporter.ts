/**
 * Honeybook Booked Client CSV Importer
 * Maps Honeybook Booked Client report to our data structures
 * Handles deduplication (multiple rows per project for multiple people)
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
 * Import bookings from Honeybook Booked Client CSV
 * Columns: First Name, Last Name, Email, Project Name, Project Type, Project Source,
 *          Project Creation Date, Project Date, Booked Date, Total Booked Value, etc.
 * 
 * Note: Honeybook creates one row per person in a project, so we need to deduplicate by Project Name
 */
export function importBookedClientsFromCSV(
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

  // Map Honeybook Booked Client report columns
  const columnMap = {
    firstName: findColumn(headers, ['first name', 'firstname']),
    lastName: findColumn(headers, ['last name', 'lastname']),
    email: findColumn(headers, ['email']),
    projectName: findColumn(headers, ['project name', 'project']),
    projectType: findColumn(headers, ['project type', 'service type', 'type']),
    projectSource: findColumn(headers, ['project source', 'lead source', 'source']),
    projectCreationDate: findColumn(headers, ['project creation date', 'creation date', 'created date', 'date created']),
    projectDate: findColumn(headers, ['project date', 'event date', 'service date']),
    bookedDate: findColumn(headers, ['booked date', 'date booked', 'signed date']),
    totalBookedValue: findColumn(headers, ['total booked value', 'booked value', 'total', 'amount', 'revenue']),
  };

  // Log which columns were found
  logger.debug('Honeybook Booked Client column mapping:', columnMap);

  // Create service types and lead sources as we encounter them
  const serviceTypeMap = new Map<string, string>(); // name -> id
  const leadSourceMap = new Map<string, string>(); // name -> id

  existingServiceTypes.forEach(st => serviceTypeMap.set(st.name.toLowerCase(), st.id));
  existingLeadSources.forEach(ls => leadSourceMap.set(ls.name.toLowerCase(), ls.id));

  let serviceTypeCounter = existingServiceTypes.length;
  let leadSourceCounter = existingLeadSources.length;

  // Deduplication: Track projects we've already imported
  // Key: Project Name + Booked Date (or Project Creation Date if no Booked Date)
  const importedProjects = new Set<string>();

  // Process each row
  rows.forEach((row, index) => {
    try {
      // Get project name (required)
      const projectName = columnMap.projectName ? row[columnMap.projectName]?.trim() : '';
      if (!projectName || projectName === '') {
        result.warnings.push(`Row ${index + 2}: Skipping row with no project name`);
        return;
      }

      // Get dates
      const projectCreationDate = columnMap.projectCreationDate
        ? parseDate(row[columnMap.projectCreationDate])
        : null;
      
      const bookedDate = columnMap.bookedDate && row[columnMap.bookedDate]?.trim()
        ? parseDate(row[columnMap.bookedDate])
        : null;
      
      const projectDate = columnMap.projectDate && row[columnMap.projectDate]?.trim()
        ? parseDate(row[columnMap.projectDate])
        : null;

      // Create deduplication key: Project Name + Booked Date (or Creation Date)
      const dedupeKey = `${projectName.toLowerCase()}-${bookedDate || projectCreationDate || 'unknown'}`;
      
      // Skip if we've already imported this project
      if (importedProjects.has(dedupeKey)) {
        // This is a duplicate row (another person in the same project)
        return;
      }
      
      // Mark as imported
      importedProjects.add(dedupeKey);

      // Skip client contact info - not needed for sales tracking
      // Use project name as client name for simplicity

      // Get or create service type (Project Type)
      let serviceTypeId = '';
      if (columnMap.projectType && row[columnMap.projectType]) {
        const serviceTypeName = row[columnMap.projectType].trim();
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

      // Get or create lead source (Project Source)
      let leadSourceId = '';
      if (columnMap.projectSource && row[columnMap.projectSource]) {
        const leadSourceName = row[columnMap.projectSource].trim();
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

      // Parse amount (in cents) - Total Booked Value
      const totalAmount = columnMap.totalBookedValue
        ? parseCents(row[columnMap.totalBookedValue]) || 0
        : 0;

      // Booked Date is required for booked clients
      if (!bookedDate) {
        result.warnings.push(`Row ${index + 2}: Missing Booked Date for "${projectName}", skipping`);
        return;
      }

      // Create booking (focus on sales data, not client contact info)
      const booking: Booking = {
        id: `imported-booked-${Date.now()}-${index}`,
        projectName: projectName,
        clientName: projectName, // Use project name as client name (simplified)
        clientEmail: undefined, // Not needed for sales tracking
        clientPhone: undefined, // Not needed for sales tracking
        serviceTypeId,
        leadSourceId,
        bookingDate: bookedDate,
        status: 'booked',
        notes: undefined,
        dateInquired: projectCreationDate || undefined,
        dateBooked: bookedDate,
        projectDate: projectDate || undefined,
        bookedRevenue: totalAmount,
        revenue: totalAmount,
        createdAt: new Date().toISOString(),
        payments: [], // Payment schedules will be added manually
      };

      result.bookings.push(booking);
    } catch (error) {
      result.errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Generate funnel data from bookings (ONLY closes and bookings revenue, NOT inquiries)
  // Inquiries come from the Leads report
  result.funnelData = generateFunnelDataFromBookedClients(result.bookings);

  return result;
}

/**
 * Generate funnel data from imported booked clients
 * IMPORTANT: Only creates/updates Closes and Bookings (revenue) in funnel data
 * Inquiries should come from the Leads report import
 * Groups by Booked Date (close date) only
 */
function generateFunnelDataFromBookedClients(bookings: Booking[]): FunnelData[] {
  const monthlyData = new Map<string, {
    year: number;
    month: number;
    closes: number;
    bookings: number; // in cents
  }>();

  bookings.forEach(booking => {
    // Use bookingDate for close month (this is when the sale closed)
    const closeDate = new Date(booking.bookingDate);
    const closeYear = closeDate.getFullYear();
    const closeMonth = closeDate.getMonth() + 1;
    const closeKey = `${closeYear}-${closeMonth}`;

    // Initialize close month if needed
    if (!monthlyData.has(closeKey)) {
      monthlyData.set(closeKey, {
        year: closeYear,
        month: closeMonth,
        closes: 0,
        bookings: 0,
      });
    }

    const closeData = monthlyData.get(closeKey)!;
    closeData.closes += 1;
    closeData.bookings += booking.bookedRevenue || 0;
  });

  // Convert to FunnelData array
  // Note: inquiries will be 0 - they should come from Leads report
  const funnelData: FunnelData[] = Array.from(monthlyData.values())
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    })
    .map(data => ({
      id: `imported-funnel-booked-${data.year}-${data.month}`,
      name: 'Default',
      year: data.year,
      month: data.month,
      inquiries: 0, // Inquiries come from Leads report, not Booked Client report
      inquiriesYtd: 0,
      callsBooked: 0,
      callsTaken: 0,
      callsYtd: 0,
      inquiryToCall: 0,
      callToBooking: 0,
      closes: data.closes,
      bookings: data.bookings,
      bookingsYtd: 0, // Will be calculated below
      bookingsGoal: 0,
      cash: 0,
      notes: 'Imported from Honeybook Booked Client report (closes and bookings only)',
      closesManual: false,
      bookingsManual: false,
      cashManual: false,
      lastUpdated: new Date().toISOString(),
    }));

  // Calculate bookings YTD (inquiries YTD stays 0 - comes from Leads report)
  funnelData.forEach((data, index) => {
    const previousBookingsYtd = index > 0 && funnelData[index - 1].year === data.year
      ? funnelData[index - 1].bookingsYtd
      : 0;
    data.bookingsYtd = previousBookingsYtd + data.bookings;
  });

  return funnelData;
}

