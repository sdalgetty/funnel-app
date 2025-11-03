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
  console.log('First 3 payments:', payments.slice(0, 3).map(p => ({
    id: p.id,
    amount: p.amount || p.amountCents,
    paymentDate: p.paymentDate,
    dueDate: p.dueDate,
    expectedDate: p.expectedDate,
    bookingId: p.bookingId
  })));

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
      try {
        const d = new Date(payment.paymentDate);
        if (!isNaN(d.getTime())) {
          paymentYear = d.getFullYear();
          dateSource = 'paymentDate';
          dateValue = payment.paymentDate;
        }
      } catch (e) {
        console.warn(`Error parsing paymentDate for payment ${payment.id}:`, payment.paymentDate);
      }
    }
    
    // Try dueDate if paymentDate didn't work
    if (!paymentYear && payment.dueDate) {
      try {
        const d = new Date(payment.dueDate);
        if (!isNaN(d.getTime())) {
          paymentYear = d.getFullYear();
          dateSource = 'dueDate';
          dateValue = payment.dueDate;
        }
      } catch (e) {
        console.warn(`Error parsing dueDate for payment ${payment.id}:`, payment.dueDate);
      }
    }
    
    // Try expectedDate if neither paymentDate nor dueDate worked
    // expectedDate might be in YYYY-MM format
    if (!paymentYear && payment.expectedDate) {
      if (payment.expectedDate.match(/^\d{4}-\d{2}$/)) {
        // It's YYYY-MM format, extract year
        paymentYear = parseInt(payment.expectedDate.split('-')[0]);
        dateSource = 'expectedDate';
        dateValue = payment.expectedDate;
      } else {
        try {
          const d = new Date(payment.expectedDate);
          if (!isNaN(d.getTime())) {
            paymentYear = d.getFullYear();
            dateSource = 'expectedDate';
            dateValue = payment.expectedDate;
          }
        } catch (e) {
          console.warn(`Error parsing expectedDate for payment ${payment.id}:`, payment.expectedDate);
        }
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
  
  // Also log a specific check for "Print Sale" if it exists
  const printSaleResult = result.find(r => r.serviceTypeName.toLowerCase().includes('print'));
  if (printSaleResult) {
    console.log('=== PRINT SALE DETAILED BREAKDOWN ===');
    console.log('Print Sale result:', printSaleResult);
    console.log('Print Sale total:', `$${(printSaleResult.totalRevenueCents / 100).toFixed(2)}`);
    console.log('Print Sale payments:', printSaleResult.payments);
  }
  
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

