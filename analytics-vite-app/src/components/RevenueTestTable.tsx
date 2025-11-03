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

