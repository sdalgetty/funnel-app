import { useState, useMemo, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { TrendingUp, DollarSign, Users, Target, BarChart3, Plus, Edit, Trash2 } from 'lucide-react';
import type { AdCampaign, Booking, LeadSource, FunnelData } from './types';

interface AdvertisingProps {
  bookings: Booking[];
  leadSources: LeadSource[];
  funnelData: FunnelData[];
  dataManager?: any;
}

export default function Advertising({ bookings, leadSources, funnelData, dataManager }: AdvertisingProps) {
  const { user } = useAuth();
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>([]);
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

  // Load data from data manager
  useEffect(() => {
    if (dataManager) {
      setAdCampaigns(dataManager.adCampaigns || []);
    }
  }, [dataManager]);

  // Helper functions
  const toUSD = (cents: number) => {
    if (isNaN(cents) || cents === null || cents === undefined) return "$0.00";
    return (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
  };

  const formatNumber = (num: number) => {
    if (isNaN(num) || num === null || num === undefined) return "0";
    return num.toLocaleString();
  };

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
    if (!editingCampaign) return;

    const now = new Date().toISOString();
    const monthYear = `${editingCampaign.year}-${String(editingCampaign.month).padStart(2, '0')}`;
    const adSpendCents = updatedData.spend; // spend is already in cents

    if (editingCampaign.isNew) {
      // Create new campaign using dataManager
      if (dataManager?.createAdCampaign) {
        await dataManager.createAdCampaign({
          leadSourceId: editingCampaign.leadSource.id,
          year: editingCampaign.year,
          month: editingCampaign.month,
          monthYear: monthYear,
          adSpendCents: adSpendCents,
          spend: adSpendCents,
          leadsGenerated: updatedData.leadsGenerated,
          lastUpdated: now
        });
      }
    } else {
      // Update existing campaign using dataManager
      const existingCampaign = adCampaigns.find(campaign => 
        campaign.leadSourceId === editingCampaign.leadSource.id && 
        campaign.year === editingCampaign.year && 
        campaign.month === editingCampaign.month
      );

      if (existingCampaign && dataManager?.updateAdCampaign) {
        await dataManager.updateAdCampaign(existingCampaign.id, {
          adSpendCents: adSpendCents,
          spend: adSpendCents,
          leadsGenerated: updatedData.leadsGenerated
        });
      }
    }

    // Reload data after save
    if (dataManager?.loadAllData) {
      await dataManager.loadAllData();
    }

    handleCloseModal();
  };

  // Calculate metrics for each lead source (only for those with ad campaigns)
  const leadSourceMetrics = useMemo(() => {
    // Get all lead sources that have campaigns
    const leadSourcesWithCampaigns = leadSources.filter(leadSource => {
      return adCampaigns.some(campaign => campaign.leadSourceId === leadSource.id);
    });

    return leadSourcesWithCampaigns.map(leadSource => {
      // Get campaigns for this lead source in current year
      const campaigns = adCampaigns.filter(campaign => 
        campaign.leadSourceId === leadSource.id && campaign.year === currentYear
      );

      // Calculate total ad spend
      const totalAdSpend = campaigns.reduce((sum, campaign) => sum + campaign.spend, 0);

      // Calculate total leads generated
      const totalAdLeads = campaigns.reduce((sum, campaign) => sum + campaign.leadsGenerated, 0);

      // Calculate total booked revenue from this lead source
      const totalBookedFromAds = bookings
        .filter(booking => booking.leadSourceId === leadSource.id)
        .reduce((sum, booking) => sum + booking.revenue, 0);

      // Calculate number of closes from this lead source
      const closesFromAds = bookings.filter(booking => booking.leadSourceId === leadSource.id).length;

      // Calculate total inquiries from funnel data
      const totalInquiries = funnelData
        .filter(month => month.year === currentYear)
        .reduce((sum, month) => sum + month.inquiries, 0);

      // Calculate metrics
      const adSpendROI = totalAdSpend > 0 && totalBookedFromAds > 0 ? (totalBookedFromAds / totalAdSpend) * 100 : null;
      const averageBookingAmount = closesFromAds > 0 ? totalBookedFromAds / closesFromAds : 0;
      const percentOfTotalInquiries = totalInquiries > 0 ? (totalAdLeads / totalInquiries) * 100 : 0;
      const costPerInquiry = totalAdLeads > 0 ? totalAdSpend / totalAdLeads : 0;
      const costPerClose = closesFromAds > 0 ? totalAdSpend / closesFromAds : 0;

      return {
        leadSource,
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
    });
  }, [adCampaigns, bookings, leadSources, funnelData, currentYear]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalAdSpend = leadSourceMetrics.reduce((sum, metric) => sum + metric.totalAdSpend, 0);
    const totalBookedFromAds = leadSourceMetrics.reduce((sum, metric) => sum + metric.totalBookedFromAds, 0);
    const totalAdLeads = leadSourceMetrics.reduce((sum, metric) => sum + metric.totalAdLeads, 0);
    const totalClosesFromAds = leadSourceMetrics.reduce((sum, metric) => sum + metric.closesFromAds, 0);
    const totalInquiries = leadSourceMetrics[0]?.totalInquiries || 0;

    const overallROI = totalAdSpend > 0 && totalBookedFromAds > 0 ? (totalBookedFromAds / totalAdSpend) * 100 : null;
    const overallAverageBooking = totalClosesFromAds > 0 ? totalBookedFromAds / totalClosesFromAds : 0;
    const overallPercentOfInquiries = totalInquiries > 0 ? (totalAdLeads / totalInquiries) * 100 : 0;
    const overallCostPerInquiry = totalAdLeads > 0 ? totalAdSpend / totalAdLeads : 0;
    const overallCostPerClose = totalClosesFromAds > 0 ? totalAdSpend / totalClosesFromAds : 0;

    return {
      totalAdSpend,
      totalBookedFromAds,
      overallROI,
      overallAverageBooking,
      overallPercentOfInquiries,
      overallCostPerInquiry,
      overallCostPerClose,
      totalAdLeads,
      totalClosesFromAds,
      totalInquiries
    };
  }, [leadSourceMetrics]);

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
          Track your paid advertising ROI and performance metrics by Lead Source
        </p>
      </div>

      {/* Monthly Ad Tracking Tables */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#1f2937' }}>
            Monthly Ad Tracking - {currentYear}
          </h2>
          <p style={{ color: '#6b7280', margin: '4px 0 0 0', fontSize: '14px' }}>
            Track your monthly ad spend and leads generated by lead source
          </p>
        </div>
        
        {leadSources.map((leadSource) => {
          // Create array of all 12 months with data or defaults
          const allMonths = Array.from({ length: 12 }, (_, index) => {
            const month = index + 1;
            const existingCampaign = adCampaigns.find(
              campaign => campaign.leadSourceId === leadSource.id && 
                         campaign.year === currentYear && 
                         campaign.month === month
            );
            
            if (existingCampaign) {
              return existingCampaign;
            } else {
              // Create default campaign for missing months
              return {
                id: `default_${leadSource.id}_${currentYear}_${month}`,
                leadSourceId: leadSource.id,
                year: currentYear,
                month: month,
                monthYear: `${currentYear}-${String(month).padStart(2, '0')}`,
                spend: 0,
                adSpendCents: 0,
                leadsGenerated: 0,
                createdAt: new Date().toISOString()
              };
            }
          });
          
          return (
            <div key={leadSource.id} style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#1f2937' }}>
                  {leadSource.name}
                </h3>
              </div>
              
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
                      const monthName = new Date(currentYear, campaign.month - 1).toLocaleString('default', { month: 'long' });
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
                              onClick={() => handleEditCampaign(leadSource, campaign.month, currentYear, campaign.spend, campaign.leadsGenerated, isDefault)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead Source Performance Table - Transposed */}
      {leadSourceMetrics.length > 0 && (
        <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#1f2937' }}>
              Lead Source Performance - {currentYear}
            </h2>
            <p style={{ color: '#6b7280', margin: '4px 0 0 0', fontSize: '14px' }}>
              Performance metrics for lead sources with advertising campaigns
            </p>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', minWidth: '180px' }}>Metric</th>
                  {leadSourceMetrics.map((metric) => (
                    <th key={metric.leadSource.id} style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151', minWidth: '120px' }}>
                      {metric.leadSource.name}
                    </th>
                  ))}
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151', minWidth: '120px', backgroundColor: '#f3f4f6' }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Total Ad Spend Row */}
                <tr style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: 'white' }}>
                  <td style={{ padding: '12px', fontWeight: '500', color: '#1f2937', textAlign: 'left' }}>
                    Total Ad Spend
                  </td>
                  {leadSourceMetrics.map((metric) => (
                    <td key={metric.leadSource.id} style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
                      {toUSD(metric.totalAdSpend)}
                    </td>
                  ))}
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#1f2937', backgroundColor: '#f9fafb' }}>
                    {toUSD(totals.totalAdSpend)}
                  </td>
                </tr>

                {/* Total Booked from Ads Row */}
                <tr style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                  <td style={{ padding: '12px', fontWeight: '500', color: '#1f2937', textAlign: 'left' }}>
                    Total Booked from Ads
                  </td>
                  {leadSourceMetrics.map((metric) => (
                    <td key={metric.leadSource.id} style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
                      {toUSD(metric.totalBookedFromAds)}
                    </td>
                  ))}
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#1f2937', backgroundColor: '#f3f4f6' }}>
                    {toUSD(totals.totalBookedFromAds)}
                  </td>
                </tr>

                {/* Ad Spend ROI Row */}
                <tr style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: 'white' }}>
                  <td style={{ padding: '12px', fontWeight: '500', color: '#1f2937', textAlign: 'left' }}>
                    Ad Spend ROI
                  </td>
                  {leadSourceMetrics.map((metric) => (
                    <td key={metric.leadSource.id} style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
                      {metric.adSpendROI !== null ? `${metric.adSpendROI.toFixed(1)}%` : 'N/A'}
                    </td>
                  ))}
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#1f2937', backgroundColor: '#f9fafb' }}>
                    {totals.overallROI !== null ? `${totals.overallROI.toFixed(1)}%` : 'N/A'}
                  </td>
                </tr>

                {/* Avg Booking Amount Row */}
                <tr style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                  <td style={{ padding: '12px', fontWeight: '500', color: '#1f2937', textAlign: 'left' }}>
                    Avg Booking Amount
                  </td>
                  {leadSourceMetrics.map((metric) => (
                    <td key={metric.leadSource.id} style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
                      {toUSD(metric.averageBookingAmount)}
                    </td>
                  ))}
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#1f2937', backgroundColor: '#f3f4f6' }}>
                    {toUSD(totals.overallAverageBooking)}
                  </td>
                </tr>

                {/* % of Total Inquiries Row */}
                <tr style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: 'white' }}>
                  <td style={{ padding: '12px', fontWeight: '500', color: '#1f2937', textAlign: 'left' }}>
                    % of Total Inquiries
                  </td>
                  {leadSourceMetrics.map((metric) => (
                    <td key={metric.leadSource.id} style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
                      {metric.percentOfTotalInquiries.toFixed(1)}%
                    </td>
                  ))}
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#1f2937', backgroundColor: '#f9fafb' }}>
                    {totals.overallPercentOfInquiries.toFixed(1)}%
                  </td>
                </tr>

                {/* Cost Per Inquiry Row */}
                <tr style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                  <td style={{ padding: '12px', fontWeight: '500', color: '#1f2937', textAlign: 'left' }}>
                    Cost Per Inquiry
                  </td>
                  {leadSourceMetrics.map((metric) => (
                    <td key={metric.leadSource.id} style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
                      {toUSD(metric.costPerInquiry)}
                    </td>
                  ))}
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#1f2937', backgroundColor: '#f3f4f6' }}>
                    {toUSD(totals.overallCostPerInquiry)}
                  </td>
                </tr>

                {/* Cost Per Close Row */}
                <tr style={{ backgroundColor: 'white' }}>
                  <td style={{ padding: '12px', fontWeight: '500', color: '#1f2937', textAlign: 'left' }}>
                    Cost Per Close
                  </td>
                  {leadSourceMetrics.map((metric) => (
                    <td key={metric.leadSource.id} style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
                      {toUSD(metric.costPerClose)}
                    </td>
                  ))}
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#1f2937', backgroundColor: '#f9fafb' }}>
                    {toUSD(totals.overallCostPerClose)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingCampaign && (
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
                <strong>Lead Source:</strong> {editingCampaign.leadSource.name}
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
                <strong>Month:</strong> {new Date(editingCampaign.year, editingCampaign.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </p>
              {(() => {
                const existingCampaign = adCampaigns.find(campaign => 
                  campaign.leadSourceId === editingCampaign.leadSource.id && 
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
  onCancel 
}: { 
  initialData: { spend: number; leadsGenerated: number };
  onSave: (data: { spend: number; leadsGenerated: number }) => void;
  onCancel: () => void;
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
          style={{
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}
          required
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px', textAlign: 'left' }}>
          Leads Generated
        </label>
        <input
          type="number"
          min="0"
          value={formData.leadsGenerated}
          onChange={(e) => handleChange('leadsGenerated', parseInt(e.target.value) || 0)}
          style={{
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
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
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Save
        </button>
      </div>
    </form>
  );
}
