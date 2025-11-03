/**
 * Revenue Test Table Component
 * 
 * A standalone table to test and verify the revenue calculation service
 * Shows Service Type and Actual $ for the current year
 */

import React from 'react';
import { calculateCurrentYearRevenueByServiceType } from '../services/revenueCalculationService';
import type { ServiceType, Booking, Payment } from '../types';

interface RevenueTestTableProps {
  payments: Payment[];
  bookings: Booking[];
  serviceTypes: ServiceType[];
}

export default function RevenueTestTable({ payments, bookings, serviceTypes }: RevenueTestTableProps) {
  const currentYear = new Date().getFullYear();
  
  // Debug: Log all Print Sale related data before calculation
  console.log('=== REVENUE TEST TABLE DEBUG ===');
  console.log('Current year:', currentYear);
  console.log('Total payments:', payments.length);
  console.log('Total bookings:', bookings.length);
  console.log('Total service types:', serviceTypes.length);
  
  // Find Print Sale service type
  const printSaleServiceType = serviceTypes.find(st => st.name.toLowerCase().includes('print'));
  if (printSaleServiceType) {
    console.log('Print Sale service type found:', printSaleServiceType);
    
    // Find all bookings for Print Sale
    const printSaleBookings = bookings.filter(b => b.serviceTypeId === printSaleServiceType.id);
    console.log('Print Sale bookings:', printSaleBookings.length, printSaleBookings.map(b => ({
      id: b.id,
      projectName: b.projectName,
      bookedRevenue: b.bookedRevenue
    })));
    
    // Find all payments for Print Sale bookings
    const printSaleBookingIds = printSaleBookings.map(b => b.id);
    const printSalePayments = payments.filter(p => printSaleBookingIds.includes(p.bookingId));
    console.log('Print Sale payments:', printSalePayments.length, printSalePayments.map(p => ({
      id: p.id,
      bookingId: p.bookingId,
      amount: p.amount,
      amountCents: p.amountCents,
      amountDollars: `$${((p.amount || p.amountCents || 0) / 100).toFixed(2)}`,
      paymentDate: p.paymentDate,
      dueDate: p.dueDate,
      expectedDate: p.expectedDate,
      paidAt: p.paidAt,
      status: p.status
    })));
    
    // Calculate what the total should be - check both amount and amountCents
    const expectedTotalAmount = printSalePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const expectedTotalCents = printSalePayments.reduce((sum, p) => sum + (p.amountCents || 0), 0);
    const expectedTotalEither = printSalePayments.reduce((sum, p) => sum + (p.amount || p.amountCents || 0), 0);
    
    console.log('Expected Print Sale total calculations:');
    console.log('  Using amount field only:', expectedTotalAmount, `$${(expectedTotalAmount / 100).toFixed(2)}`);
    console.log('  Using amountCents field only:', expectedTotalCents, `$${(expectedTotalCents / 100).toFixed(2)}`);
    console.log('  Using amount || amountCents:', expectedTotalEither, `$${(expectedTotalEither / 100).toFixed(2)}`);
    
    // Also check each payment individually
    printSalePayments.forEach((p, idx) => {
      console.log(`  Payment ${idx + 1}:`, {
        amount: p.amount,
        amountCents: p.amountCents,
        amountDollars: `$${((p.amount || p.amountCents || 0) / 100).toFixed(2)}`,
        bookingId: p.bookingId
      });
    });
  }
  
  // Calculate revenue using the dedicated service
  const revenueResults = calculateCurrentYearRevenueByServiceType(
    payments,
    bookings,
    serviceTypes,
    currentYear
  );

  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '12px', 
      padding: '24px',
      border: '2px solid #3b82f6',
      marginTop: '24px'
    }}>
      <h3 style={{ 
        fontSize: '18px', 
        fontWeight: '600', 
        marginBottom: '16px',
        color: '#1f2937'
      }}>
        Revenue Test Table (Current Year: {currentYear})
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ 
              backgroundColor: '#f5f5f5',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <th style={{ 
                textAlign: 'left', 
                padding: '12px',
                fontWeight: '600',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#666'
              }}>
                Service Type
              </th>
              <th style={{ 
                textAlign: 'right', 
                padding: '12px',
                fontWeight: '600',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#666'
              }}>
                Actual $
              </th>
              <th style={{ 
                textAlign: 'right', 
                padding: '12px',
                fontWeight: '600',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#666'
              }}>
                Payment Count
              </th>
            </tr>
          </thead>
          <tbody>
            {revenueResults.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ 
                  padding: '24px', 
                  textAlign: 'center', 
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  No revenue data found for {currentYear}
                </td>
              </tr>
            ) : (
              revenueResults.map((result, index) => (
                <tr 
                  key={result.serviceTypeId}
                  style={{ 
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                  }}
                >
                  <td style={{ padding: '12px', fontWeight: '500' }}>
                    {result.serviceTypeName}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#059669'
                  }}>
                    ${(result.totalRevenueCents / 100).toLocaleString('en-US', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'right',
                    color: '#666'
                  }}>
                    {result.paymentCount}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {revenueResults.length > 0 && (
            <tfoot>
              <tr style={{ 
                backgroundColor: '#f5f5f5',
                borderTop: '2px solid #e5e7eb',
                fontWeight: '600'
              }}>
                <td style={{ padding: '12px' }}>Total</td>
                <td style={{ 
                  padding: '12px', 
                  textAlign: 'right',
                  color: '#059669'
                }}>
                  ${(revenueResults.reduce((sum, r) => sum + r.totalRevenueCents, 0) / 100).toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </td>
                <td style={{ 
                  padding: '12px', 
                  textAlign: 'right'
                }}>
                  {revenueResults.reduce((sum, r) => sum + r.paymentCount, 0)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <div style={{ 
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#f0f9ff',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#1e40af'
      }}>
        <strong>Note:</strong> This table shows Payment Schedule revenue (scheduled payments) for {currentYear}, not booking revenue.
        Calculations are performed by the dedicated revenue calculation service.
      </div>
    </div>
  );
}

