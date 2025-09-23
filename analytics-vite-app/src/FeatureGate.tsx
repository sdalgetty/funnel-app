import React, { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Lock, Crown } from 'lucide-react';

interface FeatureGateProps {
  feature: 'sales' | 'forecast' | 'dataIntegration';
  children: ReactNode;
  fallback?: ReactNode;
}

export default function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { user, features } = useAuth();

  const hasAccess = () => {
    switch (feature) {
      case 'sales':
        return features.canAccessSales;
      case 'forecast':
        return features.canAccessForecast;
      case 'dataIntegration':
        return features.canUseDataIntegration;
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
      </p>
      
      <button
        onClick={() => {
          // This will be handled by the parent component
          if (window.confirm('Upgrade to Pro to access this feature?')) {
            // In a real app, this would redirect to billing
            alert('Upgrade functionality will be implemented with your billing system');
          }
        }}
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
    </div>
  );
}

// Component for showing upgrade prompts in navigation
export function UpgradePrompt({ feature }: { feature: 'sales' | 'forecast' | 'dataIntegration' }) {
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
