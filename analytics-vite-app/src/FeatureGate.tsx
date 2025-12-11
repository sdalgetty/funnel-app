import React, { ReactNode } from 'react';

interface FeatureGateProps {
  feature: 'sales' | 'forecast' | 'dataIntegration' | 'advertising';
  children: ReactNode;
  fallback?: ReactNode;
}

export default function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  // All users now have Pro access - FeatureGate is now a pass-through component
  // Kept for potential future use if we need to re-enable feature gating
  // If fallback is provided and we need to restrict access in the future, use it
  if (fallback) {
    return <>{children}</>; // Still render children since all users have access
  }
  
  // Always render children since all users have Pro access
  return <>{children}</>;
}

// Component for showing upgrade prompts in navigation
// Deprecated - all users now have Pro access, so this always returns null
export function UpgradePrompt({ feature }: { feature: 'sales' | 'forecast' | 'dataIntegration' | 'advertising' }) {
  // All users have Pro access now, so no upgrade prompts needed
  return null;

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
