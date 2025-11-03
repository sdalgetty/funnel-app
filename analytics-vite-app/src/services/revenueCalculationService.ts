/**
 * Revenue Calculation Service
 * 
 * This service provides a dedicated calculation layer for computing
 * current year revenue by service type, separate from UI components.
 * This can be used as a reliable data source for the Forecast Tracker.
 */

import type { Booking, Payment, ServiceType } from '../types';

export interface ServiceTypeRevenue {
  serviceTypeId: string;
  serviceTypeName: string;
  totalRevenueCents: number;
  paymentCount: number;
  payments: Array<{
    paymentId: string;
    bookingName: string;
    amountCents: number;
    date: string;
    dateSource: 'paymentDate' | 'dueDate' | 'expectedDate';
  }>;
}

/**
 * Calculate current year revenue by service type
 * 
 * This function handles all date field variations and provides
 * detailed breakdown for debugging.
 */
export function calculateCurrentYearRevenueByServiceType(
  payments: Payment[],
  bookings: Booking[],
  serviceTypes: ServiceType[],
  year: number = new Date().getFullYear()
): ServiceTypeRevenue[] {
  console.log('=== Revenue Calculation Service ===');
  console.log(`Calculating revenue for year: ${year}`);
  console.log(`Input: ${payments.length} payments, ${bookings.length} bookings, ${serviceTypes.length} service types`);
  
  // Check for January dates that might have timezone issues
  const januaryPayments = payments.filter(p => {
    const dateStr = p.paymentDate || p.dueDate || p.expectedDate || '';
    return dateStr.includes('-01-') || dateStr.match(/^\d{4}-01$/);
  });
  console.log(`Found ${januaryPayments.length} payments with January dates:`, januaryPayments.slice(0, 5).map(p => ({
    id: p.id,
    paymentDate: p.paymentDate,
    dueDate: p.dueDate,
    expectedDate: p.expectedDate,
    bookingId: p.bookingId
  })));

  // Helper function to extract year from date string without timezone issues
  // Defined at function scope so it can be used in both calculation and logging
  const extractYearFromDateString = (dateString: string): number | null => {
    // If it's YYYY-MM format, extract year directly
    if (dateString.match(/^\d{4}-\d{2}$/)) {
      return parseInt(dateString.split('-')[0]);
    }
    // If it's YYYY-MM-DD format, extract year directly (avoid timezone issues)
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return parseInt(dateString.split('-')[0]);
    }
    // Fallback to Date parsing if format is different
    try {
      const d = new Date(dateString);
      if (!isNaN(d.getTime())) {
        return d.getFullYear();
      }
    } catch (e) {
      // Ignore
    }
    return null;
  };

  const revenueByServiceType: Map<string, ServiceTypeRevenue> = new Map();
  
  // Track unmatched payments for debugging
  const unmatchedPayments: Array<{ payment: Payment; reason: string }> = [];
  
  payments.forEach(payment => {
    // Determine which date field to use and extract year
    let paymentYear: number | null = null;
    let dateSource: 'paymentDate' | 'dueDate' | 'expectedDate' | null = null;
    let dateValue: string | null = null;
    
    // Try paymentDate first (full date YYYY-MM-DD)
    if (payment.paymentDate) {
      paymentYear = extractYearFromDateString(payment.paymentDate);
      if (paymentYear !== null) {
        dateSource = 'paymentDate';
        dateValue = payment.paymentDate;
      }
    }
    
    // Try dueDate if paymentDate didn't work
    if (!paymentYear && payment.dueDate) {
      paymentYear = extractYearFromDateString(payment.dueDate);
      if (paymentYear !== null) {
        dateSource = 'dueDate';
        dateValue = payment.dueDate;
      }
    }
    
    // Try expectedDate if neither paymentDate nor dueDate worked
    // expectedDate might be in YYYY-MM format
    if (!paymentYear && payment.expectedDate) {
      paymentYear = extractYearFromDateString(payment.expectedDate);
      if (paymentYear !== null) {
        dateSource = 'expectedDate';
        dateValue = payment.expectedDate;
      }
    }
    
    // Skip if no valid year found
    if (!paymentYear || paymentYear !== year) {
      unmatchedPayments.push({
        payment,
        reason: paymentYear === null 
          ? 'No valid date field' 
          : `Year ${paymentYear} doesn't match target year ${year}`
      });
      return;
    }
    
    // Find the booking for this payment
    const booking = bookings.find(b => b.id === payment.bookingId);
    if (!booking) {
      unmatchedPayments.push({ payment, reason: 'Booking not found' });
      return;
    }
    
    // Check if booking has a service type
    if (!booking.serviceTypeId) {
      unmatchedPayments.push({ payment, reason: 'Booking has no serviceTypeId' });
      return;
    }
    
    // Find the service type
    const serviceType = serviceTypes.find(st => st.id === booking.serviceTypeId);
    const serviceTypeName = serviceType?.name || 'Unknown';
    
    // Get or create revenue entry for this service type
    let revenueEntry = revenueByServiceType.get(booking.serviceTypeId);
    if (!revenueEntry) {
      revenueEntry = {
        serviceTypeId: booking.serviceTypeId,
        serviceTypeName,
        totalRevenueCents: 0,
        paymentCount: 0,
        payments: []
      };
      revenueByServiceType.set(booking.serviceTypeId, revenueEntry);
    }
    
    // Add this payment
    const amountCents = payment.amount || payment.amountCents || 0;
    revenueEntry.totalRevenueCents += amountCents;
    revenueEntry.paymentCount += 1;
    revenueEntry.payments.push({
      paymentId: payment.id,
      bookingName: booking.projectName,
      amountCents,
      date: dateValue || 'unknown',
      dateSource: dateSource || 'paymentDate'
    });
  });
  
  // Convert to array and sort by service type name
  const result = Array.from(revenueByServiceType.values())
    .sort((a, b) => a.serviceTypeName.localeCompare(b.serviceTypeName));
  
  // Log results
  console.log(`=== Calculation Results ===`);
  console.log(`Matched ${payments.length - unmatchedPayments.length} payments for year ${year}`);
  console.log(`Unmatched ${unmatchedPayments.length} payments:`, unmatchedPayments.slice(0, 10)); // Only show first 10
  console.log(`Revenue by service type:`, result.map(r => ({
    name: r.serviceTypeName,
    serviceTypeId: r.serviceTypeId,
    total: `$${(r.totalRevenueCents / 100).toFixed(2)}`,
    totalCents: r.totalRevenueCents,
    paymentCount: r.paymentCount,
    payments: r.payments
  })));
  
  // Log unmatched payments that might be January dates
  const unmatchedJanuaryPayments = unmatchedPayments.filter(u => {
    const dateStr = u.payment.paymentDate || u.payment.dueDate || u.payment.expectedDate || '';
    return dateStr.includes('-01-') || dateStr.match(/^\d{4}-01$/);
  });
  
  if (unmatchedJanuaryPayments.length > 0) {
    console.log('=== UNMATCHED JANUARY PAYMENTS (Potential Timezone Issues) ===');
    console.log(`Found ${unmatchedJanuaryPayments.length} unmatched January payments`);
    unmatchedJanuaryPayments.slice(0, 10).forEach((u, idx) => {
      const booking = bookings.find(b => b.id === u.payment.bookingId);
      const serviceType = booking ? serviceTypes.find(st => st.id === booking.serviceTypeId) : null;
      
      // Parse each date field to see what year we get
      const parsedPaymentDateYear = u.payment.paymentDate ? extractYearFromDateString(u.payment.paymentDate) : null;
      const parsedDueDateYear = u.payment.dueDate ? extractYearFromDateString(u.payment.dueDate) : null;
      const parsedExpectedDateYear = u.payment.expectedDate ? extractYearFromDateString(u.payment.expectedDate) : null;
      
      console.log(`Unmatched January Payment ${idx + 1}:`, {
        paymentId: u.payment.id,
        bookingId: u.payment.bookingId,
        bookingName: booking?.projectName || 'NOT FOUND',
        serviceType: serviceType?.name || 'NOT FOUND',
        amount: u.payment.amount || u.payment.amountCents,
        amountDollars: `$${((u.payment.amount || u.payment.amountCents || 0) / 100).toFixed(2)}`,
        paymentDate: u.payment.paymentDate,
        dueDate: u.payment.dueDate,
        expectedDate: u.payment.expectedDate,
        reason: u.reason,
        // Show what year each date field would parse to
        parsedYearFromPaymentDate: parsedPaymentDateYear,
        parsedYearFromDueDate: parsedDueDateYear,
        parsedYearFromExpectedDate: parsedExpectedDateYear,
        // Show which date field would be used
        wouldUsePaymentDate: parsedPaymentDateYear === year,
        wouldUseDueDate: !parsedPaymentDateYear && parsedDueDateYear === year,
        wouldUseExpectedDate: !parsedPaymentDateYear && !parsedDueDateYear && parsedExpectedDateYear === year
      });
      
      // If the reason says wrong year but we parsed it as correct year, that's a bug
      if (u.reason.includes(`Year ${year - 1}`) && (parsedPaymentDateYear === year || parsedDueDateYear === year || parsedExpectedDateYear === year)) {
        console.warn(`⚠️ POTENTIAL BUG: Payment ${u.payment.id} was marked as wrong year but parsing shows correct year!`, {
          reason: u.reason,
          parsedYears: { paymentDate: parsedPaymentDateYear, dueDate: parsedDueDateYear, expectedDate: parsedExpectedDateYear },
          targetYear: year
        });
      }
    });
  }
  
  // Also log a specific check for "Print Sale" if it exists
  const printSaleResult = result.find(r => r.serviceTypeName.toLowerCase().includes('print'));
  if (printSaleResult) {
    console.log('=== PRINT SALE DETAILED BREAKDOWN ===');
    console.log('Print Sale result:', printSaleResult);
    console.log('Print Sale total:', `$${(printSaleResult.totalRevenueCents / 100).toFixed(2)}`);
    console.log('Print Sale payment count:', printSaleResult.paymentCount);
    console.log('Print Sale payments:', printSaleResult.payments);
    
    // Find Print Sale service type to check unmatched payments
    const printSaleServiceType = serviceTypes.find(st => st.name.toLowerCase().includes('print'));
    if (printSaleServiceType) {
      const printSaleBookings = bookings.filter(b => b.serviceTypeId === printSaleServiceType.id);
      const printSaleBookingIds = printSaleBookings.map(b => b.id);
      const printSaleUnmatched = unmatchedPayments.filter(u => 
        printSaleBookingIds.includes(u.payment.bookingId)
      );
      
      console.log('=== PRINT SALE UNMATCHED PAYMENTS ===');
      console.log('Unmatched Print Sale payments:', printSaleUnmatched.length);
      printSaleUnmatched.forEach((u, idx) => {
        console.log(`Unmatched Payment ${idx + 1}:`, {
          paymentId: u.payment.id,
          bookingId: u.payment.bookingId,
          amount: u.payment.amount || u.payment.amountCents,
          amountDollars: `$${((u.payment.amount || u.payment.amountCents || 0) / 100).toFixed(2)}`,
          paymentDate: u.payment.paymentDate,
          dueDate: u.payment.dueDate,
          expectedDate: u.payment.expectedDate,
          reason: u.reason
        });
      });
    }
  }
  
  // Check Events and Associate Weddings specifically
  ['Events', 'Associate Weddings'].forEach(serviceTypeName => {
    const serviceType = serviceTypes.find(st => st.name === serviceTypeName);
    if (serviceType) {
      const resultEntry = result.find(r => r.serviceTypeId === serviceType.id);
      const serviceBookings = bookings.filter(b => b.serviceTypeId === serviceType.id);
      const serviceBookingIds = serviceBookings.map(b => b.id);
      const allServicePayments = payments.filter(p => serviceBookingIds.includes(p.bookingId));
      const unmatchedServicePayments = unmatchedPayments.filter(u => 
        serviceBookingIds.includes(u.payment.bookingId)
      );
      
      console.log(`=== ${serviceTypeName} ANALYSIS ===`);
      console.log('Total bookings:', serviceBookings.length);
      console.log('Total payments for bookings:', allServicePayments.length);
      console.log('Matched payments:', resultEntry?.paymentCount || 0);
      console.log('Unmatched payments:', unmatchedServicePayments.length);
      if (unmatchedServicePayments.length > 0) {
        unmatchedServicePayments.forEach((u, idx) => {
          console.log(`  Unmatched ${idx + 1}:`, {
            paymentId: u.payment.id,
            amount: `$${((u.payment.amount || u.payment.amountCents || 0) / 100).toFixed(2)}`,
            paymentDate: u.payment.paymentDate,
            dueDate: u.payment.dueDate,
            expectedDate: u.payment.expectedDate,
            reason: u.reason
          });
        });
      }
    }
  });
  
  return result;
}

/**
 * Get revenue for a specific service type
 */
export function getRevenueForServiceType(
  serviceTypeId: string,
  revenues: ServiceTypeRevenue[]
): number {
  const revenue = revenues.find(r => r.serviceTypeId === serviceTypeId);
  return revenue?.totalRevenueCents || 0;
}

