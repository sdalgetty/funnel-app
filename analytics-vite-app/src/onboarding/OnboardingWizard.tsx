import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UnifiedDataService } from '../services/unifiedDataService';
import { InfoTooltip } from '../components/InfoTooltip';
import AdsSetupModal from '../components/AdsSetupModal';
import type { ServiceType, LeadSource } from '../types';
import { Sparkles, Target, Briefcase, Users, Megaphone, ChevronRight, ChevronLeft, Plus } from 'lucide-react';

const TOTAL_STEPS = 5;
const STEPS = [
  { id: 0, title: 'Welcome', icon: Sparkles },
  { id: 1, title: 'Goals', icon: Target },
  { id: 2, title: 'Service Types', icon: Briefcase },
  { id: 3, title: 'Lead Sources', icon: Users },
  { id: 4, title: 'Advertising', icon: Megaphone },
] as const;

const SERVICE_TYPE_QUICK_ADD = [
  'Wedding Photo & Video',
  'Wedding Video',
  'Wedding Photo',
  'Album and Print Sales',
  'Elopement',
  'Event',
  'Portraits',
  'Mini Sessions',
  'Full Service Planning',
  'Month-of Planning',
];

const LEAD_SOURCE_PREPOPULATE = [
  'Instagram',
  'Google',
  'Client Referral',
  'Venue Referral',
  'Planner Referral',
];

const LEAD_SOURCE_QUICK_ADD = [
  'TikTok',
  'Pinterest',
  'Facebook',
  'Meta Ads',
  'Google Ads',
  'Returning Client',
  'Photographer Referral',
  'Vendor Referral',
  'ChatGPT',
];

export default function OnboardingWizard() {
  const { user, updateProfile } = useAuth();
  const userId = user?.id;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Step 1: Goals (mirrors Goals page: Bookings ($) and Cash only)
  const [bookingsRevenueGoal, setBookingsRevenueGoal] = useState(0);
  const [cashGoal, setCashGoal] = useState(0);
  const [inquiryToCall, setInquiryToCall] = useState(40);
  const [callToBooking, setCallToBooking] = useState(40);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Step 2: Service Types
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [selectedServiceTypeIds, setSelectedServiceTypeIds] = useState<Set<string>>(new Set());
  const [newServiceTypeName, setNewServiceTypeName] = useState('');

  // Step 3: Lead Sources
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [selectedLeadSourceIds, setSelectedLeadSourceIds] = useState<Set<string>>(new Set());
  const [newLeadSourceName, setNewLeadSourceName] = useState('');

  // Step 4: Advertising
  const [usesAds, setUsesAds] = useState<boolean | null>(null);
  const [isAdsSetupModalOpen, setIsAdsSetupModalOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Load saved step from profile (0=welcome, 1-4=content steps)
  useEffect(() => {
    const savedStep = user?.onboardingStep ?? 0;
    setStep(Math.min(Math.max(savedStep, 0), 4));
  }, [user?.onboardingStep]);

  // Load goals
  const loadGoals = useCallback(async () => {
    if (!userId) return;
    try {
      const goals = await UnifiedDataService.getCalculatorGoals(userId);
      if (goals) {
        setBookingsRevenueGoal(Math.round((goals.bookingsRevenueGoal ?? 0) / 100));
        setCashGoal(Math.round((goals.cashGoal ?? 0) / 100)); // DB stores cents, display dollars
        setInquiryToCall(goals.inquiryToCall ?? 40);
        setCallToBooking(goals.callToBooking ?? 40);
      }
    } catch (e) {
      console.error('Error loading goals:', e);
    }
  }, [userId]);

  // Load service types and lead sources
  const loadServiceTypesAndLeadSources = useCallback(async () => {
    if (!userId) return;
    try {
      let st = await UnifiedDataService.getServiceTypes(userId);
      let ls = await UnifiedDataService.getLeadSources(userId);

      // Prepopulate: ensure Wedding exists for service types
      const hasWedding = st.some(s => s.name.toLowerCase() === 'wedding');
      if (!hasWedding) {
        const created = await UnifiedDataService.createServiceType(userId, 'Wedding', true);
        if (created) st = [...st, created];
      }

      // Prepopulate: ensure lead source defaults exist
      const existingLsNames = new Set(ls.map(l => l.name.toLowerCase()));
      for (const name of LEAD_SOURCE_PREPOPULATE) {
        if (!existingLsNames.has(name.toLowerCase())) {
          const created = await UnifiedDataService.createLeadSource(userId, name);
          if (created) {
            ls = [...ls, created];
            existingLsNames.add(name.toLowerCase());
          }
        }
      }

      setServiceTypes(st);
      setLeadSources(ls);

      // Select Wedding and prepopulate lead sources by default
      const stIds = new Set<string>();
      const wedding = st.find(s => s.name.toLowerCase() === 'wedding');
      if (wedding) stIds.add(wedding.id);

      const lsIds = new Set<string>();
      for (const l of ls) {
        if (LEAD_SOURCE_PREPOPULATE.some(p => p.toLowerCase() === l.name.toLowerCase())) {
          lsIds.add(l.id);
        }
      }

      setSelectedServiceTypeIds(stIds);
      setSelectedLeadSourceIds(lsIds);
    } catch (e) {
      console.error('Error loading service types/lead sources:', e);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      await loadGoals();
      if (cancelled) return;
      await loadServiceTypesAndLeadSources();
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [userId, loadGoals, loadServiceTypesAndLeadSources]);

  const saveStep = async (nextStep: number) => {
    if (!userId) return;
    setSaving(true);
    setValidationError(null);
    try {
      await updateProfile({ onboardingStep: nextStep });
    } catch (e) {
      console.error('Error saving step:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleStartSetup = () => {
    saveStep(1);
    setStep(1);
  };

  const handleContinueGoals = async () => {
    if (bookingsRevenueGoal <= 0 || cashGoal <= 0) {
      setValidationError('Bookings ($) Goal and Cash Goal must be greater than 0.');
      return;
    }
    let cancelled = false;
    setSaving(true);
    setValidationError(null);
    try {
      await UnifiedDataService.saveCalculatorGoals(userId!, {
        bookingsGoal: 0, // Not collected in onboarding; user sets on Goals page
        inquiryToCall,
        callToBooking,
        bookingsRevenueGoal: bookingsRevenueGoal * 100,
        cashGoal: cashGoal * 100, // DB stores cents
      });
      if (cancelled) return;
      await saveStep(2);
      if (!cancelled) setStep(2);
    } catch (e) {
      console.error('Error saving goals:', e);
      setValidationError('Failed to save goals. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleContinueServiceTypes = async () => {
    if (selectedServiceTypeIds.size < 1) {
      setValidationError('Please select at least one service type.');
      return;
    }
    setValidationError(null);
    await saveStep(3);
    setStep(3);
  };

  const handleContinueLeadSources = async () => {
    if (selectedLeadSourceIds.size < 1) {
      setValidationError('Please select at least one lead source.');
      return;
    }
    setValidationError(null);
    await saveStep(4);
    setStep(4);
  };

  const handleAddServiceType = async (name: string) => {
    if (!userId || !name.trim()) return;
    const created = await UnifiedDataService.createServiceType(userId, name.trim(), false);
    if (created) {
      setServiceTypes(prev => [...prev, created]);
      setSelectedServiceTypeIds(prev => new Set([...prev, created.id]));
    }
  };

  const handleToggleServiceType = (id: string) => {
    setSelectedServiceTypeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddLeadSource = async (name: string) => {
    if (!userId || !name.trim()) return;
    const created = await UnifiedDataService.createLeadSource(userId, name.trim());
    if (created) {
      setLeadSources(prev => [...prev, created]);
      setSelectedLeadSourceIds(prev => new Set([...prev, created.id]));
    }
  };

  const handleToggleLeadSource = (id: string) => {
    setSelectedLeadSourceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdsSetupComplete = async () => {
    try {
      await updateProfile({ adsTrackingEnabled: true, adsSetupCompleted: true });
      setIsAdsSetupModalOpen(false);
      await handleFinish();
    } catch (e) {
      console.error('Error enabling ads:', e);
    }
  };

  const handleFinish = async () => {
    if (!userId) return;
    setIsFinishing(true);
    setValidationError(null);
    try {
      await updateProfile({
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      });
      window.history.replaceState({}, '', '/');
      window.location.reload();
    } catch (e) {
      console.error('Error finishing onboarding:', e);
      setValidationError('Failed to complete setup. Please try again.');
    } finally {
      setIsFinishing(false);
    }
  };

  const handleAdvertisingYes = () => {
    setUsesAds(true);
    setIsAdsSetupModalOpen(true);
  };

  const handleAdvertisingNo = () => {
    setUsesAds(false);
  };

  const handleBack = () => {
    const prev = Math.max(0, step - 1);
    setStep(prev);
    saveStep(prev);
    setValidationError(null);
  };

  const handleNavToStep = (targetStep: number) => {
    setStep(targetStep);
    saveStep(targetStep);
    setValidationError(null);
  };

  const handleToggleServiceTypeFunnelTracking = async (id: string) => {
    const st = serviceTypes.find(s => s.id === id);
    if (!st || !userId) return;
    const nextValue = !st.tracksInFunnel;
    const success = await UnifiedDataService.updateServiceTypeFunnelTracking(userId, id, nextValue);
    if (success) {
      setServiceTypes(prev => prev.map(s => s.id === id ? { ...s, tracksInFunnel: nextValue } : s));
    }
  };

  if (!userId) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>Please log in to continue.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '16px',
        color: '#6b7280',
      }}>
        Loading...
      </div>
    );
  }

  const progressPct = ((step + 1) / TOTAL_STEPS) * 100;

  const handleSkip = () => {
    sessionStorage.setItem('onboarding_skipped', 'true');
    window.history.replaceState({}, '', '/');
    window.location.reload();
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Progress bar at top */}
      <div style={{
        padding: '16px 24px',
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
            Step {step + 1} of {TOTAL_STEPS}
          </span>
          <button
            type="button"
            onClick={handleSkip}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: '13px',
              color: '#6b7280',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Skip for now
          </button>
        </div>
        <div style={{
          height: '6px',
          backgroundColor: '#e5e7eb',
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progressPct}%`,
            height: '100%',
            backgroundColor: '#3b82f6',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(200px, 240px) 1fr',
        flex: 1,
        maxWidth: '900px',
        margin: '0 auto',
        width: '100%',
        gap: 0,
      }}>
        {/* Left: Step nav */}
        <div style={{
          padding: '24px 16px',
          backgroundColor: 'white',
          borderRight: isMobile ? 'none' : '1px solid #e5e7eb',
          borderBottom: isMobile ? '1px solid #e5e7eb' : 'none',
          display: isMobile ? 'flex' : 'block',
          flexWrap: 'wrap',
          gap: '8px',
          justifyContent: isMobile ? 'center' : 'flex-start',
        }}>
          {STEPS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleNavToStep(s.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                marginBottom: '4px',
                width: '100%',
                textAlign: 'left',
                border: 'none',
                background: step === s.id ? '#eff6ff' : 'transparent',
                color: step === s.id ? '#1d4ed8' : step > s.id ? '#059669' : '#6b7280',
                fontWeight: step === s.id ? 600 : 500,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <s.icon size={18} />
              {s.title}
            </button>
          ))}
        </div>

        {/* Right: Step content - scrolls when content overflows */}
        <div style={{
          padding: isMobile ? '24px 20px' : '32px 40px',
          backgroundColor: 'white',
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0,
        }}>
          {validationError && (
            <div style={{
              padding: '12px 16px',
              marginBottom: '16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#b91c1c',
              fontSize: '14px',
            }}>
              {validationError}
            </div>
          )}

          {step === 0 && (
            <>
              <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 16px 0', color: '#1f2937' }}>
                Welcome! Let&apos;s set up your business
              </h2>
              <p style={{ fontSize: '16px', color: '#4b5563', margin: '0 0 20px 0', lineHeight: 1.6 }}>
                This quick setup will configure how your business works inside the app so we can generate insights for you.
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 12px 0', lineHeight: 1.6 }}>
                You&apos;ll set:
              </p>
              <ul style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px 0', paddingLeft: '24px', lineHeight: 1.8 }}>
                <li>Your revenue and booking goals</li>
                <li>The types of services you sell</li>
                <li>Where your clients come from</li>
                <li>Whether you track advertising performance</li>
              </ul>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 32px 0', lineHeight: 1.6 }}>
                This only takes about 2 minutes, and you can change everything later.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleStartSetup}
                  style={{
                    padding: '12px 28px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Start Setup
                </button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0', color: '#1f2937' }}>
                Set your annual goals
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0', lineHeight: 1.5 }}>
                Set your revenue targets for the year.
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                Bookings ($) tracks what you sell. Cash tracks what you collect.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', minWidth: 0, alignItems: 'start' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                    Bookings ($) Goal
                    <InfoTooltip
                      content={
                        <>
                          This is the total value of contracts you plan to sign this year.
                          <br /><br />
                          It reflects revenue secured, regardless of when payments are collected.
                        </>
                      }
                    />
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={bookingsRevenueGoal || ''}
                    onChange={(e) => setBookingsRevenueGoal(parseInt(e.target.value, 10) || 0)}
                    placeholder="e.g., 125000"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
                    Total value of contracts signed this year.
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280', lineHeight: 1.5, fontStyle: 'italic' }}>
                    Example: 10 weddings × $5,000 = $50,000.
                  </p>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                    Cash Goal ($)
                    <InfoTooltip
                      content={
                        <>
                          This is the total amount of money you plan to collect this year.
                          <br /><br />
                          It includes payments from prior-year contracts and deposits for future-year work.
                        </>
                      }
                    />
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={cashGoal || ''}
                    onChange={(e) => setCashGoal(parseInt(e.target.value, 10) || 0)}
                    placeholder="e.g., 150000"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
                    Total payments expected this year — even from last year&apos;s bookings.
                  </p>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: '14px',
                      color: '#3b82f6',
                      cursor: 'pointer',
                      fontWeight: '500',
                    }}
                  >
                    {showAdvanced ? '−' : '+'} Advanced conversion rates
                  </button>
                  {showAdvanced && (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                          Inquiry → Call Taken %
                          <InfoTooltip
                            content={
                              <>
                                The percentage of inquiries that schedule a call with you.
                                <br /><br />
                                For example, if 100 people inquire and 40 book a call, your rate is 40%.
                                <br /><br />
                                Not sure what your rates are? Start with our placeholder and you can refine the number in the Goals section later.
                              </>
                            }
                          />
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={inquiryToCall}
                          onChange={(e) => setInquiryToCall(parseInt(e.target.value, 10) || 0)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                          Call → Booking Rate %
                          <InfoTooltip
                            content={
                              <>
                                The percentage of calls that turn into signed bookings.
                                <br /><br />
                                For example, if you have 20 calls and 8 clients book, your rate is 40%.
                                <br /><br />
                                Not sure what your rates are? Start with our placeholder and you can refine the number in the Goals section later.
                              </>
                            }
                          />
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={callToBooking}
                          onChange={(e) => setCallToBooking(parseInt(e.target.value, 10) || 0)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '32px' }}>
                <button
                  onClick={handleBack}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
                <button
                  onClick={handleContinueGoals}
                  disabled={saving}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {saving ? 'Saving...' : 'Continue'}
                  <ChevronRight size={18} />
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0', color: '#1f2937' }}>
                Add Service Types
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0', lineHeight: 1.5 }}>
                Service Types categorize the types of bookings you sell.
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0', lineHeight: 1.5 }}>
                They help track how many bookings you receive for each type of service.
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                Pick from the list below or add your own.
              </p>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input
                  type="text"
                  value={newServiceTypeName}
                  onChange={(e) => setNewServiceTypeName(e.target.value)}
                  placeholder="Add new service type"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newServiceTypeName.trim()) {
                        handleAddServiceType(newServiceTypeName);
                        setNewServiceTypeName('');
                      }
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newServiceTypeName.trim()) {
                      handleAddServiceType(newServiceTypeName);
                      setNewServiceTypeName('');
                    }
                  }}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Quick add:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {SERVICE_TYPE_QUICK_ADD.map((name) => {
                    const exists = serviceTypes.some(s => s.name.toLowerCase() === name.toLowerCase());
                    const selected = serviceTypes.find(s => s.name.toLowerCase() === name.toLowerCase());
                    const isSelected = selected && selectedServiceTypeIds.has(selected.id);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={async () => {
                          if (exists && selected) {
                            handleToggleServiceType(selected.id);
                          } else if (!exists) {
                            await handleAddServiceType(name);
                          }
                        }}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '6px',
                          border: `1px solid ${isSelected ? '#3b82f6' : '#d1d5db'}`,
                          backgroundColor: isSelected ? '#eff6ff' : 'white',
                          color: isSelected ? '#1d4ed8' : '#374151',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                marginBottom: '24px',
                overflow: 'hidden',
              }}>
                {serviceTypes.map((st) => (
                  <div
                    key={st.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '12px 16px',
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor: selectedServiceTypeIds.has(st.id) ? '#eff6ff' : 'transparent',
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={selectedServiceTypeIds.has(st.id)}
                        onChange={() => handleToggleServiceType(st.id)}
                        style={{ width: 18, height: 18, accentColor: '#3b82f6' }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{st.name}</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', flexShrink: 0 }}>
                      <input
                        type="checkbox"
                        checked={st.tracksInFunnel}
                        onChange={() => handleToggleServiceTypeFunnelTracking(st.id)}
                        style={{ width: 16, height: 16, accentColor: '#3b82f6' }}
                      />
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Track in Funnel</span>
                      <InfoTooltip content="Include this service type when calculating Bookings (Qty) and funnel conversion metrics. Uncheck for high-volume services like portraits or mini sessions that you don't want in your main funnel." />
                    </label>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '24px' }}>
                <button
                  onClick={handleBack}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
                <button
                  onClick={handleContinueServiceTypes}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  Continue
                  <ChevronRight size={18} />
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0', color: '#1f2937' }}>
                Add Lead Sources
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0', lineHeight: 1.5 }}>
                Lead Sources track where your bookings come from.
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0', lineHeight: 1.5 }}>
                This helps you understand which marketing channels are actually generating revenue.
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                Pick from the list below or add your own.
              </p>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input
                  type="text"
                  value={newLeadSourceName}
                  onChange={(e) => setNewLeadSourceName(e.target.value)}
                  placeholder="Add new lead source"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newLeadSourceName.trim()) {
                        handleAddLeadSource(newLeadSourceName);
                        setNewLeadSourceName('');
                      }
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newLeadSourceName.trim()) {
                      handleAddLeadSource(newLeadSourceName);
                      setNewLeadSourceName('');
                    }
                  }}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Quick add:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {LEAD_SOURCE_QUICK_ADD.map((name) => {
                    const exists = leadSources.some(s => s.name.toLowerCase() === name.toLowerCase());
                    const selected = leadSources.find(s => s.name.toLowerCase() === name.toLowerCase());
                    const isSelected = selected && selectedLeadSourceIds.has(selected.id);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={async () => {
                          if (exists && selected) {
                            handleToggleLeadSource(selected.id);
                          } else if (!exists) {
                            await handleAddLeadSource(name);
                          }
                        }}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '6px',
                          border: `1px solid ${isSelected ? '#3b82f6' : '#d1d5db'}`,
                          backgroundColor: isSelected ? '#eff6ff' : 'white',
                          color: isSelected ? '#1d4ed8' : '#374151',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                marginBottom: '24px',
                overflow: 'hidden',
              }}>
                {leadSources.map((ls) => (
                  <label
                    key={ls.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                      backgroundColor: selectedLeadSourceIds.has(ls.id) ? '#eff6ff' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedLeadSourceIds.has(ls.id)}
                      onChange={() => handleToggleLeadSource(ls.id)}
                      style={{ width: 18, height: 18, accentColor: '#3b82f6' }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{ls.name}</span>
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '24px' }}>
                <button
                  onClick={handleBack}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
                <button
                  onClick={handleContinueLeadSources}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  Continue
                  <ChevronRight size={18} />
                </button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0', color: '#1f2937' }}>
                Advertising Tracking
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                Do you use paid advertising like Meta Ads or Google Ads?
              </p>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button
                  onClick={handleAdvertisingYes}
                  style={{
                    padding: '14px 24px',
                    borderRadius: '8px',
                    border: `2px solid ${usesAds === true ? '#3b82f6' : '#d1d5db'}`,
                    backgroundColor: usesAds === true ? '#eff6ff' : 'white',
                    color: usesAds === true ? '#1d4ed8' : '#374151',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    flex: 1,
                  }}
                >
                  Yes
                </button>
                <button
                  onClick={handleAdvertisingNo}
                  style={{
                    padding: '14px 24px',
                    borderRadius: '8px',
                    border: `2px solid ${usesAds === false ? '#3b82f6' : '#d1d5db'}`,
                    backgroundColor: usesAds === false ? '#eff6ff' : 'white',
                    color: usesAds === false ? '#1d4ed8' : '#374151',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    flex: 1,
                  }}
                >
                  No
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '24px' }}>
                <button
                  onClick={handleBack}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
                <button
                  onClick={async () => {
                    if (usesAds === true && !user?.adsSetupCompleted) {
                      setIsAdsSetupModalOpen(true);
                      return;
                    }
                    if (usesAds === false) {
                      await updateProfile({ adsTrackingEnabled: false });
                    }
                    await handleFinish();
                  }}
                  disabled={isFinishing}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isFinishing ? 'not-allowed' : 'pointer',
                    opacity: isFinishing ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {isFinishing ? 'Finishing...' : 'Finish Setup'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {isAdsSetupModalOpen && (
        <AdsSetupModal
          leadSources={leadSources}
          onCreateLeadSource={async (name) => {
            const created = await UnifiedDataService.createLeadSource(userId!, name);
            if (created) {
              setLeadSources(prev => [...prev, created]);
              return created;
            }
            return null;
          }}
          onSetLeadSourceAdSource={async (id, isAdSource) => {
            await UnifiedDataService.setLeadSourceAdSource(userId!, id, isAdSource);
            setLeadSources(prev => prev.map(ls => ls.id === id ? { ...ls, isAdSource } : ls));
            return true;
          }}
          onEnableTracking={handleAdsSetupComplete}
          onCancel={() => setIsAdsSetupModalOpen(false)}
        />
      )}
    </div>
  );
}
