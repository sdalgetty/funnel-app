import { useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { TrendingUp, DollarSign, Users, Target, BarChart3, Plus, Edit, Trash2 } from 'lucide-react';
import type { AdSource, AdCampaign, Booking, LeadSource, FunnelData } from './types';
import { MOCK_AD_SOURCES, MOCK_AD_CAMPAIGNS } from './data/mockData';

interface AdvertisingProps {
  bookings: Booking[];
  leadSources: LeadSource[];
  funnelData: FunnelData[];
}

export default function Advertising({ bookings, leadSources, funnelData }: AdvertisingProps) {
  const { user } = useAuth();
  const [adSources, setAdSources] = useState<AdSource[]>(MOCK_AD_SOURCES);
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>(MOCK_AD_CAMPAIGNS);
  const [showAdSources, setShowAdSources] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<{
    adSource: AdSource;
    month: number;
    year: number;
    spend: number;
    leadsGenerated: number;
    isNew: boolean;
  } | null>(null);

  const currentYear = new Date().getFullYear();

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
  const handleEditCampaign = (adSource: AdSource, month: number, year: number, spend: number, leadsGenerated: number, isNew: boolean) => {
    setEditingCampaign({
      adSource,
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

  const handleSaveCampaign = (updatedData: { spend: number; leadsGenerated: number }) => {
    if (!editingCampaign) return;

    const now = new Date().toISOString();

    if (editingCampaign.isNew) {
      // Create new campaign
      const newCampaign: AdCampaign = {
        id: `ac_${Date.now()}`,
        adSourceId: editingCampaign.adSource.id,
        year: editingCampaign.year,
        month: editingCampaign.month,
        spend: updatedData.spend,
        leadsGenerated: updatedData.leadsGenerated,
        createdAt: now,
        lastUpdated: now
      };
      setAdCampaigns(prev => [...prev, newCampaign]);
    } else {
      // Update existing campaign
      setAdCampaigns(prev => prev.map(campaign => {
        if (campaign.adSourceId === editingCampaign.adSource.id && 
            campaign.year === editingCampaign.year && 
            campaign.month === editingCampaign.month) {
          return {
            ...campaign,
            spend: updatedData.spend,
            leadsGenerated: updatedData.leadsGenerated,
            lastUpdated: now
          };
        }
        return campaign;
      }));
    }

    handleCloseModal();
  };

  // Calculate metrics for each ad source
  const adSourceMetrics = useMemo(() => {
    return adSources.map(adSource => {
      // Get campaigns for this ad source in current year
      const campaigns = adCampaigns.filter(campaign => 
        campaign.adSourceId === adSource.id && campaign.year === currentYear
      );

      // Calculate total ad spend
      const totalAdSpend = campaigns.reduce((sum, campaign) => sum + campaign.spend, 0);

      // Calculate total leads generated
      const totalAdLeads = campaigns.reduce((sum, campaign) => sum + campaign.leadsGenerated, 0);

      // Find the matching lead source using direct reference
      const matchingLeadSource = leadSources.find(ls => ls.id === adSource.leadSourceId);

      // Calculate total booked revenue from ads
      const totalBookedFromAds = matchingLeadSource
        ? bookings
            .filter(booking => booking.leadSourceId === matchingLeadSource.id)
            .reduce((sum, booking) => sum + booking.revenue, 0)
        : 0;

      // Calculate number of closes from ads
      const closesFromAds = matchingLeadSource
        ? bookings.filter(booking => booking.leadSourceId === matchingLeadSource.id).length
        : 0;

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
        adSource,
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
  }, [adSources, adCampaigns, bookings, leadSources, funnelData, currentYear]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalAdSpend = adSourceMetrics.reduce((sum, metric) => sum + metric.totalAdSpend, 0);
    const totalBookedFromAds = adSourceMetrics.reduce((sum, metric) => sum + metric.totalBookedFromAds, 0);
    const totalAdLeads = adSourceMetrics.reduce((sum, metric) => sum + metric.totalAdLeads, 0);
    const totalClosesFromAds = adSourceMetrics.reduce((sum, metric) => sum + metric.closesFromAds, 0);
    const totalInquiries = adSourceMetrics[0]?.totalInquiries || 0;

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
  }, [adSourceMetrics]);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#1f2937' }}>
            Advertising Performance
          </h1>
          <button
            onClick={() => setShowAdSources(true)}
            style={{
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(37, 99, 235, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(37, 99, 235, 0.3)';
            }}
          >
            <Edit size={16} />
            Manage Ad Sources
          </button>
        </div>
        <p style={{ color: '#6b7280', margin: 0, fontSize: '16px' }}>
          Track your paid advertising ROI and performance metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <DollarSign size={20} color="#3b82f6" />
            <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: '#374151' }}>Total Ad Spend</h3>
          </div>
          <p style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#1f2937' }}>
            {toUSD(totals.totalAdSpend)}
          </p>
        </div>

        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <TrendingUp size={20} color="#10b981" />
            <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: '#374151' }}>Total Booked from Ads</h3>
          </div>
          <p style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#1f2937' }}>
            {toUSD(totals.totalBookedFromAds)}
          </p>
        </div>

        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <BarChart3 size={20} color="#f59e0b" />
            <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: '#374151' }}>Ad Spend ROI</h3>
          </div>
          <p style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#1f2937' }}>
            {totals.overallROI !== null ? `${totals.overallROI.toFixed(1)}%` : 'N/A'}
          </p>
        </div>

        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Target size={20} color="#8b5cf6" />
            <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: '#374151' }}>Cost Per Close</h3>
          </div>
          <p style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#1f2937' }}>
            {toUSD(totals.overallCostPerClose)}
          </p>
        </div>
      </div>

      {/* Monthly Ad Tracking Tables */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#1f2937' }}>
            Monthly Ad Tracking - {currentYear}
          </h2>
          <p style={{ color: '#6b7280', margin: '4px 0 0 0', fontSize: '14px' }}>
            Track your monthly ad spend and leads generated by ad source
          </p>
        </div>
        
        {adSources.map((adSource) => {
          // Create array of all 12 months with data or defaults
          const allMonths = Array.from({ length: 12 }, (_, index) => {
            const month = index + 1;
            const existingCampaign = adCampaigns.find(
              campaign => campaign.adSourceId === adSource.id && 
                         campaign.year === currentYear && 
                         campaign.month === month
            );
            
            if (existingCampaign) {
              return existingCampaign;
            } else {
              // Create default campaign for missing months
              return {
                id: `default_${adSource.id}_${currentYear}_${month}`,
                adSourceId: adSource.id,
                year: currentYear,
                month: month,
                spend: 0,
                leadsGenerated: 0,
                createdAt: new Date().toISOString()
              };
            }
          });
          
          return (
            <div key={adSource.id} style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#1f2937' }}>
                  {adSource.name}
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
                              onClick={() => handleEditCampaign(adSource, campaign.month, currentYear, campaign.spend, campaign.leadsGenerated, isDefault)}
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

      {/* Ad Source Performance Table - Transposed */}
      <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#1f2937' }}>
            Ad Source Performance - {currentYear}
          </h2>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', minWidth: '180px' }}>Metric</th>
                {adSourceMetrics.map((metric) => (
                  <th key={metric.adSource.id} style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151', minWidth: '120px' }}>
                    {metric.adSource.name}
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
                {adSourceMetrics.map((metric) => (
                  <td key={metric.adSource.id} style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
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
                {adSourceMetrics.map((metric) => (
                  <td key={metric.adSource.id} style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
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
                {adSourceMetrics.map((metric) => (
                  <td key={metric.adSource.id} style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
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
                {adSourceMetrics.map((metric) => (
                  <td key={metric.adSource.id} style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
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
                {adSourceMetrics.map((metric) => (
                  <td key={metric.adSource.id} style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
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
                {adSourceMetrics.map((metric) => (
                  <td key={metric.adSource.id} style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
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
                {adSourceMetrics.map((metric) => (
                  <td key={metric.adSource.id} style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
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

      {/* Manage Ad Sources Modal */}
      {showAdSources && (
        <ManageAdSourcesModal
          adSources={adSources}
          leadSources={leadSources}
          onClose={() => setShowAdSources(false)}
          onAddAdSource={(newAdSource) => {
            setAdSources(prev => [...prev, newAdSource]);
          }}
          onUpdateAdSource={(updatedAdSource) => {
            setAdSources(prev => prev.map(source => 
              source.id === updatedAdSource.id ? updatedAdSource : source
            ));
          }}
          onDeleteAdSource={(adSourceId) => {
            setAdSources(prev => prev.filter(source => source.id !== adSourceId));
            // Also remove all campaigns associated with this ad source
            setAdCampaigns(prev => prev.filter(campaign => campaign.adSourceId !== adSourceId));
          }}
        />
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
                <strong>Ad Source:</strong> {editingCampaign.adSource.name}
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
                <strong>Month:</strong> {new Date(editingCampaign.year, editingCampaign.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </p>
              {(() => {
                const existingCampaign = adCampaigns.find(campaign => 
                  campaign.adSourceId === editingCampaign.adSource.id && 
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

// Manage Ad Sources Modal Component
function ManageAdSourcesModal({
  adSources,
  leadSources,
  onClose,
  onAddAdSource,
  onUpdateAdSource,
  onDeleteAdSource
}: {
  adSources: AdSource[];
  leadSources: any[];
  onClose: () => void;
  onAddAdSource: (adSource: AdSource) => void;
  onUpdateAdSource: (adSource: AdSource) => void;
  onDeleteAdSource: (adSourceId: string) => void;
}) {
  const [newAdSourceName, setNewAdSourceName] = useState('');
  const [newLeadSourceId, setNewLeadSourceId] = useState('');
  const [editingAdSource, setEditingAdSource] = useState<AdSource | null>(null);
  const [editName, setEditName] = useState('');
  const [editLeadSourceId, setEditLeadSourceId] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);

  const handleAddAdSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdSourceName.trim() || !newLeadSourceId) return;

    const newAdSource: AdSource = {
      id: `ads_${Date.now()}`,
      name: newAdSourceName.trim(),
      leadSourceId: newLeadSourceId,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    onAddAdSource(newAdSource);
    setNewAdSourceName('');
    setNewLeadSourceId('');
  };

  const handleStartEdit = (adSource: AdSource) => {
    setEditingAdSource(adSource);
    setEditName(adSource.name);
    setEditLeadSourceId(adSource.leadSourceId);
  };

  const handleSaveEdit = () => {
    if (!editingAdSource || !editName.trim() || !editLeadSourceId) return;

    const updatedAdSource: AdSource = {
      ...editingAdSource,
      name: editName.trim(),
      leadSourceId: editLeadSourceId
    };

    onUpdateAdSource(updatedAdSource);
    setEditingAdSource(null);
    setEditName('');
    setEditLeadSourceId('');
  };

  const handleCancelEdit = () => {
    setEditingAdSource(null);
    setEditName('');
    setEditLeadSourceId('');
  };

  const handleDelete = (adSource: AdSource) => {
    setDeleteConfirmation({ id: adSource.id, name: adSource.name });
  };

  const confirmDelete = () => {
    if (deleteConfirmation) {
      onDeleteAdSource(deleteConfirmation.id);
      setDeleteConfirmation(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  return (
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
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#1f2937', textAlign: 'left' }}>
            Manage Ad Sources
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: '14px', textAlign: 'left' }}>
          Add, edit, or remove advertising sources. Each ad source tracks campaigns and their performance.
        </p>

        {/* Add New Ad Source Form */}
        <form onSubmit={handleAddAdSource} style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0', color: '#1f2937', textAlign: 'left' }}>
            Add New Ad Source
          </h4>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px', textAlign: 'left' }}>
              Ad Source Name *
            </label>
            <input
              type="text"
              value={newAdSourceName}
              onChange={(e) => setNewAdSourceName(e.target.value)}
              placeholder="e.g., Facebook Ads"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px', textAlign: 'left' }}>
              Lead Source *
            </label>
            <select
              value={newLeadSourceId}
              onChange={(e) => setNewLeadSourceId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                backgroundColor: 'white'
              }}
              required
            >
              <option value="">Select a lead source...</option>
              {leadSources.map((ls) => (
                <option key={ls.id} value={ls.id}>
                  {ls.name}
                </option>
              ))}
            </select>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0', textAlign: 'left' }}>
              This links the ad source to a lead source for accurate ROI tracking
            </p>
          </div>
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <Plus size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Add Ad Source
          </button>
        </form>

        {/* Existing Ad Sources List */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0', color: '#1f2937', textAlign: 'left' }}>
            Existing Ad Sources
          </h4>
          {adSources.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'left', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
              No ad sources yet. Add your first ad source above.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {adSources.map((adSource) => (
                <div
                  key={adSource.id}
                  style={{
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    backgroundColor: 'white'
                  }}
                >
                  {editingAdSource?.id === adSource.id ? (
                    // Edit Mode
                    <div>
                      <div style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px', textAlign: 'left' }}>
                          Ad Source Name
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '13px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px', textAlign: 'left' }}>
                          Lead Source
                        </label>
                        <select
                          value={editLeadSourceId}
                          onChange={(e) => setEditLeadSourceId(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                            backgroundColor: 'white'
                          }}
                        >
                          <option value="">Select a lead source...</option>
                          {leadSources.map((ls) => (
                            <option key={ls.id} value={ls.id}>
                              {ls.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={handleSaveEdit}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: '500', color: '#1f2937', fontSize: '14px' }}>
                          {adSource.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                          Lead Source: {leadSources.find(ls => ls.id === adSource.leadSourceId)?.name || 'Unknown'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleStartEdit(adSource)}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Edit size={12} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(adSource)}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmation && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Trash2 size={24} color="#dc2626" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#1f2937', textAlign: 'left' }}>
                  Delete Ad Source
                </h3>
              </div>
              
              <p style={{ color: '#374151', margin: '0 0 8px 0', fontSize: '14px', textAlign: 'left', lineHeight: '1.5' }}>
                Are you sure you want to delete <strong>{deleteConfirmation.name}</strong>?
              </p>
              
              <p style={{ color: '#dc2626', margin: '0 0 20px 0', fontSize: '13px', textAlign: 'left', lineHeight: '1.5', backgroundColor: '#fee2e2', padding: '12px', borderRadius: '6px' }}>
                <strong>Warning:</strong> All associated campaign data and monthly tracking will be permanently deleted. This action cannot be undone.
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={cancelDelete}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Delete Ad Source
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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
