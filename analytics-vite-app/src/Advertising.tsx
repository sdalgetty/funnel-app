import { useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { TrendingUp, DollarSign, Users, Target, BarChart3, Plus, Edit, Trash2 } from 'lucide-react';

// Types
interface AdSource {
  id: string;
  name: string;
  platform: string; // "Instagram", "Google", "Facebook", etc.
  isActive: boolean;
  createdAt: string;
}

interface AdCampaign {
  id: string;
  adSourceId: string;
  year: number;
  month: number;
  spend: number; // in cents
  leadsGenerated: number;
  createdAt: string;
  lastUpdated?: string;
}

interface AdvertisingProps {
  bookings: any[];
  leadSources: any[];
  funnelData: any[];
}

// Mock data
const mockAdSources: AdSource[] = [
  { id: 'ads_instagram', name: 'Instagram Ads', platform: 'Instagram', isActive: true, createdAt: '2025-01-01' },
  { id: 'ads_google', name: 'Google Ads', platform: 'Google', isActive: true, createdAt: '2025-01-01' },
];

const mockAdCampaigns: AdCampaign[] = [
  { id: 'ac_1', adSourceId: 'ads_instagram', year: 2025, month: 1, spend: 200000, leadsGenerated: 15, createdAt: '2025-01-01', lastUpdated: '2025-01-15T10:30:00Z' },
  { id: 'ac_2', adSourceId: 'ads_instagram', year: 2025, month: 2, spend: 250000, leadsGenerated: 18, createdAt: '2025-02-01', lastUpdated: '2025-02-10T14:20:00Z' },
  { id: 'ac_3', adSourceId: 'ads_instagram', year: 2025, month: 3, spend: 300000, leadsGenerated: 22, createdAt: '2025-03-01', lastUpdated: '2025-03-05T09:15:00Z' },
  { id: 'ac_4', adSourceId: 'ads_google', year: 2025, month: 1, spend: 150000, leadsGenerated: 12, createdAt: '2025-01-01', lastUpdated: '2025-01-20T16:45:00Z' },
  { id: 'ac_5', adSourceId: 'ads_google', year: 2025, month: 2, spend: 180000, leadsGenerated: 14, createdAt: '2025-02-01', lastUpdated: '2025-02-12T11:30:00Z' },
];

export default function Advertising({ bookings, leadSources, funnelData }: AdvertisingProps) {
  const { user } = useAuth();
  const [adSources, setAdSources] = useState<AdSource[]>(mockAdSources);
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>(mockAdCampaigns);
  const [showAdSources, setShowAdSources] = useState(false);
  const [showAddCampaign, setShowAddCampaign] = useState(false);
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

      // Find matching lead sources (simple name matching)
      const matchingLeadSources = leadSources.filter(ls => 
        ls.name.toLowerCase().includes(adSource.platform.toLowerCase())
      );

      // Calculate total booked revenue from ads
      const totalBookedFromAds = bookings
        .filter(booking => matchingLeadSources.some(ls => ls.id === booking.leadSourceId))
        .reduce((sum, booking) => sum + booking.revenue, 0);

      // Calculate number of closes from ads
      const closesFromAds = bookings
        .filter(booking => matchingLeadSources.some(ls => ls.id === booking.leadSourceId))
        .length;

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
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#1f2937' }}>
            Advertising Performance
          </h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowAdSources(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Edit size={16} />
              Manage Ad Sources
            </button>
            <button
              onClick={() => setShowAddCampaign(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={16} />
              Add Campaign
            </button>
          </div>
        </div>
        <p style={{ color: '#6b7280', margin: 0, fontSize: '16px' }}>
          Track your paid advertising ROI and performance metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
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

      {/* Ad Source Performance Table */}
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
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Ad Source</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Total Ad Spend</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Total Booked from Ads</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Ad Spend ROI</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Avg Booking Amount</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>% of Total Inquiries</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Cost Per Inquiry</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Cost Per Close</th>
              </tr>
            </thead>
            <tbody>
              {adSourceMetrics.map((metric, index) => (
                <tr key={metric.adSource.id} style={{ 
                  borderBottom: '1px solid #f3f4f6',
                  backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                }}>
                  <td style={{ padding: '12px', fontWeight: '500', color: '#1f2937', textAlign: 'left' }}>
                    {metric.adSource.name}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
                    {toUSD(metric.totalAdSpend)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
                    {toUSD(metric.totalBookedFromAds)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
                    {metric.adSpendROI !== null ? `${metric.adSpendROI.toFixed(1)}%` : 'N/A'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
                    {toUSD(metric.averageBookingAmount)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
                    {metric.percentOfTotalInquiries.toFixed(1)}%
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
                    {toUSD(metric.costPerInquiry)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#1f2937' }}>
                    {toUSD(metric.costPerClose)}
                  </td>
                </tr>
              ))}
              
              {/* Totals Row */}
              <tr style={{ backgroundColor: '#f9fafb', borderTop: '2px solid #e5e7eb' }}>
                <td style={{ padding: '12px', fontWeight: '600', color: '#1f2937' }}>Total</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#1f2937' }}>
                  {toUSD(totals.totalAdSpend)}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#1f2937' }}>
                  {toUSD(totals.totalBookedFromAds)}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#1f2937' }}>
                  {totals.overallROI !== null ? `${totals.overallROI.toFixed(1)}%` : 'N/A'}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#1f2937' }}>
                  {toUSD(totals.overallAverageBooking)}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#1f2937' }}>
                  {totals.overallPercentOfInquiries.toFixed(1)}%
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#1f2937' }}>
                  {toUSD(totals.overallCostPerInquiry)}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#1f2937' }}>
                  {toUSD(totals.overallCostPerClose)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Placeholder for modals */}
      {showAdSources && (
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
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: '#1f2937' }}>
              Manage Ad Sources
            </h3>
            <p style={{ color: '#6b7280', margin: '0 0 16px 0' }}>
              Ad source management functionality will be implemented here.
            </p>
            <button
              onClick={() => setShowAdSources(false)}
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
              Close
            </button>
          </div>
        </div>
      )}

      {showAddCampaign && (
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
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: '#1f2937' }}>
              Add Campaign
            </h3>
            <p style={{ color: '#6b7280', margin: '0 0 16px 0' }}>
              Campaign creation functionality will be implemented here.
            </p>
            <button
              onClick={() => setShowAddCampaign(false)}
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
              Close
            </button>
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
