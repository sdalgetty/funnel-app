import { useState, useMemo, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { TrendingUp, DollarSign, Users, Target, BarChart3, Plus, Edit, Trash2 } from 'lucide-react';
import type { AdCampaign, Booking, LeadSource, FunnelData } from './types';

interface AdvertisingProps {
  bookings: Booking[];
  leadSources: LeadSource[];
  funnelData: FunnelData[];
  dataManager?: any;
  navigationAction?: { page: string; action?: string; month?: { year: number; month: number } } | null;
  isViewOnly?: boolean;
}

export default function Advertising({ bookings, leadSources, funnelData, dataManager, navigationAction, isViewOnly = false }: AdvertisingProps) {
  const { user } = useAuth();
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>([]);
  const [selectedLeadSourceId, setSelectedLeadSourceId] = useState<string>('');
  const [userManuallySelected, setUserManuallySelected] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<{
    leadSource: LeadSource;
    month: number;
    year: number;
    spend: number;
    leadsGenerated: number;
    isNew: boolean;
  } | null>(null);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Generate years from upcoming year back 5 years for new users
  const generateAvailableYears = () => {
    const years = [];
    const upcomingYear = currentYear + 1;
    // Include upcoming year, current year, and 5 previous years
    years.push(upcomingYear); // Add upcoming year first
    for (let i = 0; i < 6; i++) { // Current year + 5 previous years
      years.push(currentYear - i);
    }
    return years.sort((a, b) => b - a); // Sort descending (upcoming year first)
  };
  
  const availableYears = generateAvailableYears();

  // Handle navigation action to open edit modal for specific month
  useEffect(() => {
    if (navigationAction?.action === 'edit-month' && navigationAction.month && leadSources.length > 0 && adCampaigns.length >= 0) {
      const { year, month } = navigationAction.month
      setSelectedYear(year)
      
      // Check if there are any campaigns for the current year
      const currentYearCampaigns = adCampaigns.filter(c => 
        c.year === currentYear && 
        !c.id.startsWith('default_')
      )
      
      // If no campaigns for current year, just navigate to the page (don't open modal)
      if (currentYearCampaigns.length === 0) {
        console.log('No advertising data for current year, navigating to page only')
        return
      }
      
      // Find the last edited lead source for the current year
      const campaignsByLeadSource = new Map<string, AdCampaign[]>()
      currentYearCampaigns.forEach(campaign => {
        const existing = campaignsByLeadSource.get(campaign.leadSourceId) || []
        campaignsByLeadSource.set(campaign.leadSourceId, [...existing, campaign])
      })
      
      // Find the lead source with the most recent lastUpdated date
      let lastEditedLeadSourceId = ''
      let mostRecentDate = new Date(0) // Epoch
      
      campaignsByLeadSource.forEach((campaigns, leadSourceId) => {
        const latestCampaign = campaigns.reduce((latest, current) => {
          const currentDate = current.lastUpdated ? new Date(current.lastUpdated) : new Date(0)
          const latestDate = latest.lastUpdated ? new Date(latest.lastUpdated) : new Date(0)
          return currentDate > latestDate ? current : latest
        })
        
        const latestDate = latestCampaign.lastUpdated ? new Date(latestCampaign.lastUpdated) : new Date(0)
        if (latestDate > mostRecentDate) {
          mostRecentDate = latestDate
          lastEditedLeadSourceId = leadSourceId
        }
      })
      
      // Fallback to first lead source if no lastUpdated dates found
      const targetLeadSourceId = lastEditedLeadSourceId || leadSources[0].id
      const targetLeadSource = leadSources.find(ls => ls.id === targetLeadSourceId) || leadSources[0]
      
      const monthYear = `${year}-${String(month).padStart(2, '0')}`
      const existingCampaign = adCampaigns.find(c => 
        c.monthYear === monthYear && 
        c.leadSourceId === targetLeadSourceId
      )
      
      setSelectedLeadSourceId(targetLeadSourceId)
      setUserManuallySelected(true)
      
      if (existingCampaign) {
        setEditingCampaign({
          leadSource: targetLeadSource,
          month: month,
          year: year,
          spend: existingCampaign.adSpendCents,
          leadsGenerated: existingCampaign.leadsGenerated,
          isNew: false
        })
      } else {
        setEditingCampaign({
          leadSource: targetLeadSource,
          month: month,
          year: year,
          spend: 0,
          leadsGenerated: 0,
          isNew: true
        })
      }
      setIsEditModalOpen(true)
    }
  }, [navigationAction, leadSources, adCampaigns, currentYear])

  // Load data from data manager
  useEffect(() => {
    if (dataManager) {
      setAdCampaigns(dataManager.adCampaigns || []);
    }
  }, [dataManager?.adCampaigns]);

  // Auto-select the lead source based on existing campaigns (only on initial load or data change, not user selection)
  useEffect(() => {
    if (leadSources.length === 0) return;
    
    // Don't auto-select if user has manually selected a lead source
    if (userManuallySelected) {
      console.log('Skipping auto-select - user has manually selected:', selectedLeadSourceId);
      return;
    }

    // Find lead sources that have campaigns (only real campaigns, not defaults)
    const campaignsByLeadSource = new Map<string, AdCampaign[]>();
    
    adCampaigns.forEach(campaign => {
      if (!campaign.id.startsWith('default_')) { // Only real campaigns
        const existing = campaignsByLeadSource.get(campaign.leadSourceId) || [];
        campaignsByLeadSource.set(campaign.leadSourceId, [...existing, campaign]);
      }
    });

    console.log('Auto-select lead source:', {
      selectedLeadSourceId,
      userManuallySelected,
      campaignsByLeadSource: Array.from(campaignsByLeadSource.entries()).map(([id, campaigns]) => ({
        leadSourceId: id,
        leadSourceName: leadSources.find(ls => ls.id === id)?.name,
        campaignCount: campaigns.length
      })),
      totalAdCampaigns: adCampaigns.length
    });

    // If we have campaigns, find the best lead source
    if (campaignsByLeadSource.size > 0) {
      let bestLeadSourceId = '';
      let bestScore = -1;

      campaignsByLeadSource.forEach((campaigns, leadSourceId) => {
        // Prioritize current year campaigns
        const currentYearCampaigns = campaigns.filter(c => c.year === currentYear);
        const recentCampaigns = currentYearCampaigns.length > 0 ? currentYearCampaigns : campaigns;
        
        // Score based on number of campaigns and most recent year
        const score = recentCampaigns.length * 1000 + (recentCampaigns[0]?.year || 0);
        
        if (score > bestScore) {
          bestScore = score;
          bestLeadSourceId = leadSourceId;
        }
      });

      if (bestLeadSourceId) {
        // Only update if nothing is selected yet
        if (!selectedLeadSourceId || selectedLeadSourceId !== bestLeadSourceId) {
          const leadSourceName = leadSources.find(ls => ls.id === bestLeadSourceId)?.name;
          console.log('Auto-selecting lead source:', leadSourceName, bestLeadSourceId);
          setSelectedLeadSourceId(bestLeadSourceId);
          return;
        }
      }
    }

    // Fallback: select first lead source only if no campaigns exist and nothing is selected
    if (!selectedLeadSourceId && adCampaigns.filter(c => !c.id.startsWith('default_')).length === 0) {
      console.log('No campaigns found, selecting first lead source');
      setSelectedLeadSourceId(leadSources[0].id);
    }
  }, [leadSources, adCampaigns, currentYear, userManuallySelected]);

  // Helper functions
  const toUSD = (cents: number) => {
    if (isNaN(cents) || cents === null || cents === undefined) return "$0.00";
    return (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
  };

  const formatNumber = (num: number) => {
    if (isNaN(num) || num === null || num === undefined) return "0";
    return num.toLocaleString();
  };

  // Get the selected lead source
  const selectedLeadSource = leadSources.find(ls => ls.id === selectedLeadSourceId);

  // Handler functions
  const handleEditCampaign = (leadSource: LeadSource, month: number, year: number, spend: number, leadsGenerated: number, isNew: boolean) => {
    setEditingCampaign({
      leadSource,
      month,
      year,
      spend,
      leadsGenerated,
      isNew
    });
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingCampaign(null);
  };

  const handleSaveCampaign = async (updatedData: { spend: number; leadsGenerated: number }) => {
    if (!editingCampaign || !selectedLeadSource) return;

    const now = new Date().toISOString();
    const monthYear = `${editingCampaign.year}-${String(editingCampaign.month).padStart(2, '0')}`;
    const adSpendCents = updatedData.spend; // spend is already in cents

    // Check if campaign already exists (by looking for non-default ID)
    const existingCampaign = adCampaigns.find(campaign => 
      campaign.leadSourceId === selectedLeadSource.id && 
      campaign.year === editingCampaign.year && 
      campaign.month === editingCampaign.month &&
      !campaign.id.startsWith('default_') // Only real campaigns from database
    );

    if (existingCampaign) {
      // Update existing campaign
      if (dataManager?.updateAdCampaign) {
        const success = await dataManager.updateAdCampaign(existingCampaign.id, {
          adSpendCents: adSpendCents,
          spend: adSpendCents,
          leadsGenerated: updatedData.leadsGenerated
        });
        if (!success) {
          console.error('Failed to update ad campaign');
          return;
        }
      }
    } else {
      // Create new campaign
      if (dataManager?.createAdCampaign) {
        const newCampaign = await dataManager.createAdCampaign({
          leadSourceId: selectedLeadSource.id,
        year: editingCampaign.year,
        month: editingCampaign.month,
          monthYear: monthYear,
          adSpendCents: adSpendCents,
          spend: adSpendCents,
        leadsGenerated: updatedData.leadsGenerated,
        lastUpdated: now
        });
        if (!newCampaign) {
          console.error('Failed to create ad campaign');
          return;
        }
      }
    }

    // Reload data after save to ensure we have the latest from database
    if (dataManager?.loadAllData) {
      await dataManager.loadAllData();
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    handleCloseModal();
  };

  // Get campaigns for the selected lead source and selected year
  const campaignsForSelectedLeadSource = useMemo(() => {
    if (!selectedLeadSourceId) return [];
    return adCampaigns.filter(campaign => 
      campaign.leadSourceId === selectedLeadSourceId && 
      campaign.year === selectedYear
    );
  }, [adCampaigns, selectedLeadSourceId, selectedYear]);

  // Create array of all 12 months with data or defaults
  const allMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const existingCampaign = campaignsForSelectedLeadSource.find(
        campaign => campaign.month === month
      );
      
      if (existingCampaign) {
        return existingCampaign;
      } else {
        // Create default campaign for missing months
        return {
          id: `default_${selectedLeadSourceId}_${selectedYear}_${month}`,
          leadSourceId: selectedLeadSourceId,
          year: selectedYear,
          month: month,
          monthYear: `${selectedYear}-${String(month).padStart(2, '0')}`,
          spend: 0,
          adSpendCents: 0,
          leadsGenerated: 0,
          createdAt: new Date().toISOString()
        };
      }
    });
  }, [campaignsForSelectedLeadSource, selectedLeadSourceId, selectedYear]);

  // Calculate metrics for the selected lead source
  const metrics = useMemo(() => {
    if (!selectedLeadSource) {
      return null;
    }

    // Get campaigns for selected lead source in current year
    const campaigns = campaignsForSelectedLeadSource;

      // Calculate total ad spend
      const totalAdSpend = campaigns.reduce((sum, campaign) => sum + campaign.spend, 0);

      // Calculate total leads generated
      const totalAdLeads = campaigns.reduce((sum, campaign) => sum + campaign.leadsGenerated, 0);

    // Calculate total booked revenue from this lead source
    const totalBookedFromAds = bookings
      .filter(booking => booking.leadSourceId === selectedLeadSource.id)
      .reduce((sum, booking) => sum + booking.revenue, 0);

    // Calculate number of closes from this lead source
    const closesFromAds = bookings.filter(booking => booking.leadSourceId === selectedLeadSource.id).length;

      // Calculate total inquiries from funnel data
      const totalInquiries = funnelData
        .filter(month => month.year === selectedYear)
        .reduce((sum, month) => sum + month.inquiries, 0);

      // Calculate metrics
      const adSpendROI = totalAdSpend > 0 && totalBookedFromAds > 0 ? (totalBookedFromAds / totalAdSpend) * 100 : null;
      const averageBookingAmount = closesFromAds > 0 ? totalBookedFromAds / closesFromAds : 0;
      const percentOfTotalInquiries = totalInquiries > 0 ? (totalAdLeads / totalInquiries) * 100 : 0;
      const costPerInquiry = totalAdLeads > 0 ? totalAdSpend / totalAdLeads : 0;
      const costPerClose = closesFromAds > 0 ? totalAdSpend / closesFromAds : 0;

      return {
        totalAdSpend,
        totalBookedFromAds,
        adSpendROI,
        averageBookingAmount,
        percentOfTotalInquiries,
        costPerInquiry,
        costPerClose,
        totalAdLeads,
        closesFromAds,
        totalInquiries
      };
  }, [campaignsForSelectedLeadSource, bookings, selectedLeadSource, funnelData, selectedYear]);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#1f2937' }}>
            Advertising Performance
          </h1>
        </div>
        <p style={{ color: '#6b7280', margin: 0, fontSize: '16px' }}>
          Track your paid advertising ROI and performance metrics
        </p>
      </div>

      {/* Lead Source Selector */}
      {leadSources.length > 0 && (
        <div style={{ marginBottom: '24px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px', textAlign: 'left' }}>
            Lead Source
          </label>
          <select
            value={selectedLeadSourceId}
            onChange={(e) => {
              setSelectedLeadSourceId(e.target.value);
              setUserManuallySelected(true);
              console.log('User manually selected lead source:', e.target.value);
            }}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            {leadSources.map((ls) => (
              <option key={ls.id} value={ls.id}>
                {ls.name}
              </option>
            ))}
          </select>
          <p style={{ color: '#6b7280', margin: '8px 0 0 0', fontSize: '13px', textAlign: 'left' }}>
            Select the lead source to track advertising for.
          </p>
        </div>
      )}

      {/* Year Selector */}
      <div style={{ marginBottom: '32px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '500', 
          marginBottom: '6px' 
        }}>
          Select Year
        </label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          style={{
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            backgroundColor: 'white',
            minWidth: '120px'
          }}
        >
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Monthly Ad Tracking Table */}
      {selectedLeadSource && (
      <div style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#1f2937' }}>
            Monthly Ad Tracking - {selectedYear}
          </h2>
          <p style={{ color: '#6b7280', margin: '4px 0 0 0', fontSize: '14px' }}>
              Track your monthly ad spend and leads generated for <strong>{selectedLeadSource.name}</strong>
          </p>
        </div>
        
          <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Month</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Ad Spend</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Leads Generated</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allMonths.map((campaign, index) => {
                      const monthName = new Date(selectedYear, campaign.month - 1).toLocaleString('default', { month: 'long' });
                      const isDefault = campaign.id.startsWith('default_');
                      return (
                        <tr key={campaign.id} style={{ 
                          borderBottom: '1px solid #f3f4f6',
                          backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                        }}>
                          <td style={{ padding: '12px', color: '#1f2937', textAlign: 'left' }}>
                            {monthName}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', color: isDefault ? '#9ca3af' : '#1f2937' }}>
                            {toUSD(campaign.spend)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', color: isDefault ? '#9ca3af' : '#1f2937' }}>
                            {formatNumber(campaign.leadsGenerated)}
                          </td>
                          <td style={{ padding: '12px', color: '#1f2937', textAlign: 'left' }}>
                            <button
                            onClick={() => !isViewOnly && handleEditCampaign(selectedLeadSource, campaign.month, selectedYear, campaign.spend, campaign.leadsGenerated, isDefault)}
                            disabled={isViewOnly}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: isViewOnly ? '#e5e7eb' : '#3b82f6',
                                color: isViewOnly ? '#9ca3af' : 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: isViewOnly ? 'not-allowed' : 'pointer',
                                opacity: isViewOnly ? 0.5 : 1
                              }}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  {/* Sum Row */}
                  {(() => {
                    // Only count real campaigns (not defaults) and use same logic as Insights
                    const realCampaigns = allMonths.filter(c => !c.id.startsWith('default_'));
                    const totalAdSpend = realCampaigns.reduce((sum, campaign) => {
                      const spend = campaign.spend ?? campaign.adSpendCents ?? 0;
                      return sum + spend;
                    }, 0);
                    const totalLeads = realCampaigns.reduce((sum, campaign) => sum + campaign.leadsGenerated, 0);
                    return (
                      <tr style={{ 
                        borderTop: '2px solid #d1d5db',
                        backgroundColor: '#f9fafb',
                        fontWeight: '600'
                      }}>
                        <td style={{ padding: '12px', color: '#1f2937', textAlign: 'left', fontWeight: '600' }}>
                  Total
                </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#1f2937', fontWeight: '600' }}>
                          {toUSD(totalAdSpend)}
                  </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#1f2937', fontWeight: '600' }}>
                          {formatNumber(totalLeads)}
                </td>
                        <td style={{ padding: '12px', color: '#1f2937', textAlign: 'left' }}></td>
              </tr>
                    );
                  })()}
            </tbody>
          </table>
        </div>
      </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingCampaign && selectedLeadSource && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '400px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#1f2937', textAlign: 'left' }}>
                Edit Campaign Data
              </h3>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
                <strong>Lead Source:</strong> {selectedLeadSource.name}
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
                <strong>Month:</strong> {new Date(editingCampaign.year, editingCampaign.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </p>
              {(() => {
                const existingCampaign = adCampaigns.find(campaign => 
                  campaign.leadSourceId === selectedLeadSource.id && 
                  campaign.year === editingCampaign.year && 
                  campaign.month === editingCampaign.month
                );
                if (existingCampaign?.lastUpdated) {
                  return (
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 16px 0' }}>
                      <strong>Last updated:</strong> {new Date(existingCampaign.lastUpdated).toLocaleString()}
                    </p>
                  );
                }
                return null;
              })()}
            </div>

            <EditCampaignForm
              initialData={{
                spend: editingCampaign.spend,
                leadsGenerated: editingCampaign.leadsGenerated
              }}
              onSave={handleSaveCampaign}
              onCancel={handleCloseModal}
              isViewOnly={isViewOnly}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Edit Campaign Form Component
function EditCampaignForm({ 
  initialData, 
  onSave, 
  onCancel,
  isViewOnly = false
}: { 
  initialData: { spend: number; leadsGenerated: number };
  onSave: (data: { spend: number; leadsGenerated: number }) => void;
  onCancel: () => void;
  isViewOnly?: boolean;
}) {
  const [formData, setFormData] = useState({
    spend: initialData.spend / 100, // Convert from cents to dollars for display
    leadsGenerated: initialData.leadsGenerated
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert dollars back to cents
    const spendInCents = Math.round(formData.spend * 100);
    
    onSave({
      spend: spendInCents,
      leadsGenerated: formData.leadsGenerated
    });
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px', textAlign: 'left' }}>
          Ad Spend ($)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.spend}
          onChange={(e) => handleChange('spend', parseFloat(e.target.value) || 0)}
          disabled={isViewOnly}
          style={{
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: isViewOnly ? '#f3f4f6' : 'white',
            cursor: isViewOnly ? 'not-allowed' : 'text'
          }}
          required
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px', textAlign: 'left' }}>
          Leads Generated
        </label>
        <input
          type="number"
          min="0"
          value={formData.leadsGenerated}
          onChange={(e) => handleChange('leadsGenerated', parseInt(e.target.value) || 0)}
          disabled={isViewOnly}
          style={{
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: isViewOnly ? '#f3f4f6' : 'white',
            cursor: isViewOnly ? 'not-allowed' : 'text'
          }}
          required
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isViewOnly}
          style={{
            padding: '8px 16px',
            backgroundColor: isViewOnly ? '#e5e7eb' : '#3b82f6',
            color: isViewOnly ? '#9ca3af' : 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: isViewOnly ? 'not-allowed' : 'pointer',
            opacity: isViewOnly ? 0.5 : 1
          }}
        >
          Save
        </button>
      </div>
    </form>
  );
}
