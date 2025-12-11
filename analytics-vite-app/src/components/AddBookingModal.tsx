import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { ServiceType, LeadSource, Booking, Payment } from '../types';
import { toUSD } from '../utils/formatters';

interface AddBookingModalProps {
  serviceTypes: ServiceType[];
  leadSources: LeadSource[];
  onAdd: (booking: Omit<Booking, 'id' | 'createdAt'>) => Promise<Booking | null> | void;
  onClose: () => void;
  dataManager?: any;
  isViewOnly?: boolean;
}

/**
 * Modal component for adding a new booking
 * 
 * Allows users to create a new booking with project details, service type,
 * lead source, dates, and revenue. Optionally supports scheduled payments.
 */
export function AddBookingModal({ 
  serviceTypes, 
  leadSources, 
  onAdd, 
  onClose, 
  dataManager, 
  isViewOnly = false 
}: AddBookingModalProps) {
  const [formData, setFormData] = useState({
    projectName: '',
    serviceTypeId: '',
    leadSourceId: '',
    dateInquired: '',
    dateBooked: '',
    projectDate: '',
    bookedRevenue: '',
  });
  const [scheduledPayments, setScheduledPayments] = useState<Omit<Payment, 'id'>[]>([]);

  const handleAddPayment = () => {
    const newPayment: Omit<Payment, 'id'> = {
      bookingId: '',
      amount: 0,
      amountCents: 0,
      paymentDate: undefined,
      dueDate: undefined,
      status: 'pending',
      memo: '',
      expectedDate: undefined,
      isExpected: true,
      paidAt: null
    };
    setScheduledPayments([...scheduledPayments, newPayment]);
  };

  const handleRemovePayment = (index: number) => {
    setScheduledPayments(scheduledPayments.filter((_, i) => i !== index));
  };

  const handleUpdatePayment = (index: number, updates: Partial<Payment>) => {
    const payment = scheduledPayments[index];
    const updatedPayment = { ...payment, ...updates };
    const newPayments = [...scheduledPayments];
    newPayments[index] = updatedPayment;
    setScheduledPayments(newPayments);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectName || !formData.serviceTypeId || !formData.leadSourceId || !formData.bookedRevenue) {
      alert('Please fill in all required fields');
      return;
    }

    const selectedServiceType = serviceTypes.find(st => st.id === formData.serviceTypeId);
    if (selectedServiceType?.tracksInFunnel && !formData.dateBooked) {
      alert('Date Booked is required for service types that are tracked in the Funnel. Please enter a booking date or uncheck "Track in Funnel" for this service type.');
      return;
    }

    const newBooking = {
      projectName: formData.projectName,
      serviceTypeId: formData.serviceTypeId,
      leadSourceId: formData.leadSourceId,
      dateInquired: formData.dateInquired || undefined,
      dateBooked: formData.dateBooked || undefined,
      projectDate: formData.projectDate || undefined,
      bookedRevenue: Math.round(parseFloat(formData.bookedRevenue) * 100),
    };

    const createdBooking = await onAdd(newBooking);
    
    if (createdBooking && createdBooking.id && scheduledPayments.length > 0 && dataManager?.createPayment) {
      for (const payment of scheduledPayments) {
        if (payment.amount > 0 || payment.expectedDate) {
          await dataManager.createPayment({
            bookingId: createdBooking.id,
            amount: payment.amount || 0,
            amountCents: payment.amount || 0,
            paymentDate: payment.expectedDate,
            dueDate: payment.expectedDate,
            status: 'pending',
            isExpected: true,
            paidAt: null,
            expectedDate: payment.expectedDate,
            memo: '',
            paymentMethod: ''
          });
        }
      }
    }

    onClose();
  };

  return (
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
        width: '95%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Add New Booking</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Project Name */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Project Name *
            </label>
            <input
              type="text"
              value={formData.projectName}
              onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
              required
              disabled={isViewOnly}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                opacity: isViewOnly ? 0.5 : 1
              }}
            />
          </div>

          {/* Service Type */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Service Type *
            </label>
            <select
              value={formData.serviceTypeId}
              onChange={(e) => setFormData({ ...formData, serviceTypeId: e.target.value })}
              required
              disabled={isViewOnly}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                opacity: isViewOnly ? 0.5 : 1
              }}
            >
              <option value="">Select a service type</option>
              {serviceTypes.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>

          {/* Lead Source */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Lead Source *
            </label>
            <select
              value={formData.leadSourceId}
              onChange={(e) => setFormData({ ...formData, leadSourceId: e.target.value })}
              required
              disabled={isViewOnly}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                opacity: isViewOnly ? 0.5 : 1
              }}
            >
              <option value="">Select a lead source</option>
              {leadSources.map(ls => (
                <option key={ls.id} value={ls.id}>{ls.name}</option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                Date Inquired
              </label>
              <input
                type="date"
                value={formData.dateInquired}
                onChange={(e) => setFormData({ ...formData, dateInquired: e.target.value })}
                disabled={isViewOnly}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  opacity: isViewOnly ? 0.5 : 1
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                Date Booked
              </label>
              <input
                type="date"
                value={formData.dateBooked}
                onChange={(e) => setFormData({ ...formData, dateBooked: e.target.value })}
                disabled={isViewOnly}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  opacity: isViewOnly ? 0.5 : 1
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                Project Date
              </label>
              <input
                type="date"
                value={formData.projectDate}
                onChange={(e) => setFormData({ ...formData, projectDate: e.target.value })}
                disabled={isViewOnly}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  opacity: isViewOnly ? 0.5 : 1
                }}
              />
            </div>
          </div>

          {/* Revenue */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Booked Revenue ($) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.bookedRevenue}
              onChange={(e) => setFormData({ ...formData, bookedRevenue: e.target.value })}
              required
              disabled={isViewOnly}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                opacity: isViewOnly ? 0.5 : 1
              }}
            />
          </div>

          {/* Scheduled Payments */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500' }}>Scheduled Payments</label>
              {!isViewOnly && (
                <button
                  type="button"
                  onClick={handleAddPayment}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  + Add Payment
                </button>
              )}
            </div>
            {scheduledPayments.map((payment, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={payment.amount ? (payment.amount / 100).toFixed(2) : ''}
                  onChange={(e) => handleUpdatePayment(index, { 
                    amount: Math.round(parseFloat(e.target.value || '0') * 100),
                    amountCents: Math.round(parseFloat(e.target.value || '0') * 100)
                  })}
                  disabled={isViewOnly}
                  style={{ flex: 1, padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
                />
                <input
                  type="date"
                  value={payment.expectedDate || ''}
                  onChange={(e) => handleUpdatePayment(index, { expectedDate: e.target.value })}
                  disabled={isViewOnly}
                  style={{ flex: 1, padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
                />
                {!isViewOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemovePayment(index)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isViewOnly}
              style={{
                padding: '10px 20px',
                backgroundColor: isViewOnly ? '#e5e7eb' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isViewOnly ? 'not-allowed' : 'pointer',
                opacity: isViewOnly ? 0.5 : 1
              }}
            >
              Create Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




