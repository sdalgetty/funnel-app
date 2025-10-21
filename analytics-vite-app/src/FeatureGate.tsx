import React, { ReactNode, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Lock, Crown, X } from 'lucide-react';

interface FeatureGateProps {
  feature: 'sales' | 'forecast' | 'dataIntegration' | 'advertising';
  children: ReactNode;
  fallback?: ReactNode;
}

export default function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { user, features } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const hasAccess = () => {
    switch (feature) {
      case 'sales':
        return features.canAccessSales;
      case 'forecast':
        return features.canAccessForecast;
      case 'dataIntegration':
        return features.canUseDataIntegration;
      case 'advertising':
        return features.advertising;
      default:
        return false;
    }
  };

  const getFeatureName = () => {
    switch (feature) {
      case 'sales':
        return 'Sales Management';
      case 'forecast':
        return 'Forecast Analytics';
      case 'dataIntegration':
        return 'Data Integration';
      case 'advertising':
        return 'Advertising Tracking';
      default:
        return 'Feature';
    }
  };

  if (hasAccess()) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      border: '2px dashed #d1d5db',
      margin: '20px 0',
    }}>
      <div style={{
        backgroundColor: '#fef3c7',
        borderRadius: '50%',
        width: '64px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
      }}>
        <Crown size={24} color="#f59e0b" />
      </div>
      
      <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0', color: '#1f2937' }}>
        {getFeatureName()} - Pro Feature
      </h3>
      
      <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px 0', maxWidth: '300px' }}>
        {feature === 'sales' && 'Access the full Sales management system with booking and payment tracking.'}
        {feature === 'forecast' && 'Create forecast models and analyze trends with advanced analytics.'}
        {feature === 'dataIntegration' && 'Enable automatic data sync between all views for seamless workflow.'}
        {feature === 'advertising' && 'Track your paid advertising performance, ROI, and lead generation metrics.'}
      </p>
      
      <button
        onClick={() => setShowUpgradeModal(true)}
        style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 24px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Crown size={16} />
        Upgrade to Pro
      </button>

      {/* Upgrade Confirmation Modal */}
      {showUpgradeModal && (
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
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Crown size={28} color="white" />
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#1f2937', textAlign: 'left' }}>
                    Upgrade to Pro
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0', textAlign: 'left' }}>
                    Unlock {getFeatureName()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ 
              backgroundColor: '#fef3c7', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '24px',
              borderLeft: '4px solid #f59e0b'
            }}>
              <p style={{ color: '#92400e', margin: 0, fontSize: '14px', textAlign: 'left', lineHeight: '1.6' }}>
                {feature === 'sales' && 'Get full access to Sales management with booking and payment tracking, revenue analytics, and more.'}
                {feature === 'forecast' && 'Create unlimited forecast models, analyze trends with advanced analytics, and plan for growth.'}
                {feature === 'dataIntegration' && 'Enable automatic data sync between all views for a seamless workflow and real-time updates.'}
                {feature === 'advertising' && 'Track your paid advertising performance, calculate ROI, monitor lead generation, and optimize your ad spend.'}
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0', color: '#1f2937', textAlign: 'left' }}>
                Pro Features Include:
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '14px', lineHeight: '1.8' }}>
                <li>Unlimited bookings and payments</li>
                <li>Advanced forecast modeling</li>
                <li>Advertising ROI tracking</li>
                <li>Priority support</li>
                <li>Data export capabilities</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowUpgradeModal(false)}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  // In a real app, this would redirect to billing
                  alert('Upgrade functionality will be implemented with your billing system');
                  setShowUpgradeModal(false);
                }}
                style={{
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Crown size={16} />
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Component for showing upgrade prompts in navigation
export function UpgradePrompt({ feature }: { feature: 'sales' | 'forecast' | 'dataIntegration' | 'advertising' }) {
  const { user } = useAuth();

  if (!user || user.subscriptionTier === 'pro') {
    return null;
  }

  const getFeatureName = () => {
    switch (feature) {
      case 'sales':
        return 'Sales';
      case 'forecast':
        return 'Forecast';
      case 'dataIntegration':
        return 'Data Integration';
      case 'advertising':
        return 'Advertising';
      default:
        return 'Feature';
    }
  };

  return (
    <div style={{
      backgroundColor: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: '8px',
      padding: '12px',
      margin: '8px 0',
      fontSize: '12px',
      color: '#1e40af',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      <Lock size={14} />
      <span>
        <strong>{getFeatureName()}</strong> requires Pro subscription
      </span>
    </div>
  );
}
