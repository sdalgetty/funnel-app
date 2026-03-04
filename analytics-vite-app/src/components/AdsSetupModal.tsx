import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { LeadSource } from '../types';

interface AdsSetupModalProps {
  leadSources: LeadSource[];
  onCreateLeadSource: (name: string) => Promise<LeadSource | null>;
  onSetLeadSourceAdSource: (id: string, isAdSource: boolean) => Promise<boolean>;
  onEnableTracking: () => Promise<void>;
  onCancel: () => void;
}

const STEP_1 = 1;
const STEP_2 = 2;
const STEP_3 = 3;

export default function AdsSetupModal({
  leadSources,
  onCreateLeadSource,
  onSetLeadSourceAdSource,
  onEnableTracking,
  onCancel,
}: AdsSetupModalProps) {
  const [step, setStep] = useState(STEP_1);
  const [adSourceIds, setAdSourceIds] = useState<Set<string>>(
    () => new Set(leadSources.filter(ls => ls.isAdSource).map(ls => ls.id))
  );
  const [newLeadSourceName, setNewLeadSourceName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const handleToggleAdSource = (id: string) => {
    setAdSourceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddLeadSource = async () => {
    const name = newLeadSourceName.trim();
    if (!name || isAdding) return;
    setIsAdding(true);
    try {
      const created = await onCreateLeadSource(name);
      if (created) {
        setNewLeadSourceName('');
        setAdSourceIds(prev => new Set([...prev, created.id]));
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      const leadSourceIds = new Set(leadSources.map(ls => ls.id));
      for (const ls of leadSources) {
        await onSetLeadSourceAdSource(ls.id, adSourceIds.has(ls.id));
      }
      // Handle newly created lead sources (in adSourceIds but not yet in leadSources)
      for (const id of adSourceIds) {
        if (!leadSourceIds.has(id)) {
          await onSetLeadSourceAdSource(id, true);
        }
      }
      await onEnableTracking();
    } finally {
      setIsFinishing(false);
    }
  };

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const contentStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    width: '90%',
    maxWidth: '480px',
    maxHeight: '90vh',
    overflow: 'auto',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 600,
    margin: '0 0 16px 0',
    color: '#1f2937',
  };

  const bodyStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: 1.6,
    marginBottom: '24px',
  };

  const buttonRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  };

  const primaryButtonStyle: React.CSSProperties = {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  };

  const secondaryButtonStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '10px 20px',
    fontSize: '14px',
    cursor: 'pointer',
  };

  return (
    <div style={modalStyle} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        {/* Step 1 */}
        {step === STEP_1 && (
          <>
            <h2 style={titleStyle}>Set up Advertising Tracking</h2>
            <p style={bodyStyle}>
              You will enter Ad Leads and Ad Spend in the Funnel.
              <br /><br />
              Bookings from Ads, ROI, and Cost per Booking are calculated from booked sales whose Lead Source is marked as advertising.
            </p>
            <div style={buttonRowStyle}>
              <button style={secondaryButtonStyle} onClick={onCancel}>
                Cancel
              </button>
              <button style={primaryButtonStyle} onClick={() => setStep(STEP_2)}>
                Continue
              </button>
            </div>
          </>
        )}

        {/* Step 2 */}
        {step === STEP_2 && (
          <>
            <h2 style={titleStyle}>How you&apos;ll track ads each month</h2>
            <p style={bodyStyle}>
              Each month you will enter:
              <br /><br />
              <strong>Ad Leads:</strong> the number of inquiries that came from advertising
              <br />
              <strong>Ad Spend:</strong> the amount spent on advertising
              <br /><br />
              These fields will appear in the Funnel table once Advertising Tracking is enabled.
            </p>
            <div style={buttonRowStyle}>
              <button style={secondaryButtonStyle} onClick={() => setStep(STEP_1)}>
                Back
              </button>
              <button style={primaryButtonStyle} onClick={() => setStep(STEP_3)}>
                Continue
              </button>
            </div>
          </>
        )}

        {/* Step 3 */}
        {step === STEP_3 && (
          <>
            <h2 style={titleStyle}>Choose which Lead Sources count as Ads</h2>
            <p style={bodyStyle}>
              Which Lead Sources should count as advertising when a booking is recorded?
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={newLeadSourceName}
                onChange={(e) => setNewLeadSourceName(e.target.value)}
                placeholder="Add new Lead Source"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLeadSource()}
              />
              <button
                onClick={handleAddLeadSource}
                disabled={!newLeadSourceName.trim() || isAdding}
                style={{
                  ...primaryButtonStyle,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  opacity: !newLeadSourceName.trim() || isAdding ? 0.6 : 1,
                }}
              >
                <Plus size={16} />
                Add
              </button>
            </div>

            <div style={{
              maxHeight: '240px',
              overflowY: 'auto',
              marginBottom: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}>
              {leadSources.map((ls) => {
                const isSelected = adSourceIds.has(ls.id);
                return (
                  <div
                    key={ls.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '6px 12px',
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                    }}
                  >
                    <span style={{
                      fontSize: '14px',
                      fontWeight: isSelected ? 600 : 500,
                      color: '#1f2937',
                    }}>
                      {ls.name}
                    </span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', flexShrink: 0 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleAdSource(ls.id)}
                        style={{ width: 16, height: 16, accentColor: '#3b82f6' }}
                      />
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>
                        Ad Source
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>

            <p style={{ ...bodyStyle, marginBottom: '16px', fontSize: '13px', fontStyle: 'italic' }}>
              These settings affect booked sales only. Inquiries are not automatically attributed to advertising.
            </p>

            <div style={buttonRowStyle}>
              <button style={secondaryButtonStyle} onClick={() => setStep(STEP_2)}>
                Back
              </button>
              <button
                style={primaryButtonStyle}
                onClick={handleFinish}
                disabled={isFinishing}
              >
                {isFinishing ? 'Saving...' : 'Finish Setup'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
