import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { 
  User, 
  Mail, 
  Lock, 
  CreditCard, 
  Settings, 
  HelpCircle, 
  Shield, 
  Crown,
  Calendar,
  Bell,
  Globe,
  Trash2,
  Download,
  MessageSquare,
  Star,
  ChevronRight,
  Edit,
  Save,
  X
} from 'lucide-react';

type ProfileSection = 'account' | 'subscription' | 'billing' | 'privacy' | 'support';

export default function UserProfile() {
  const { user, upgradeToPro, downgradeToFree } = useAuth();
  const [activeSection, setActiveSection] = useState<ProfileSection>('account');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    companyName: user?.companyName || '',
    email: user?.email || '',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    notifications: {
      email: true,
      push: false,
      marketing: false
    }
  });

  if (!user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Please log in to access your profile.</p>
      </div>
    );
  }

  const handleSave = () => {
    // In a real app, this would update the user profile via API
    console.log('Saving profile data:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      companyName: user.companyName || '',
      email: user.email,
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      notifications: {
        email: true,
        push: false,
        marketing: false
      }
    });
    setIsEditing(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSubscriptionStatusColor = () => {
    if (user.subscriptionTier === 'pro') {
      return user.subscriptionStatus === 'trial' ? '#f59e0b' : '#10b981';
    }
    return '#6b7280';
  };

  const getSubscriptionStatusText = () => {
    if (user.subscriptionTier === 'pro') {
      if (user.subscriptionStatus === 'trial' && user.trialEndsAt) {
        const daysLeft = Math.ceil((user.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return `Trial (${daysLeft} days left)`;
      }
      return 'Active';
    }
    return 'Free Plan';
  };

  const sections = [
    { id: 'account' as ProfileSection, label: 'Account', icon: User },
    { id: 'subscription' as ProfileSection, label: 'Subscription', icon: Crown },
    { id: 'billing' as ProfileSection, label: 'Billing', icon: CreditCard },
    { id: 'privacy' as ProfileSection, label: 'Privacy', icon: Shield },
    { id: 'support' as ProfileSection, label: 'Support', icon: HelpCircle },
  ];

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Sidebar Navigation */}
      <div style={{
        width: '280px',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
        padding: '24px 0',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto'
      }}>
        <div style={{ padding: '0 24px 24px' }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            margin: '0 0 8px 0',
            color: '#1f2937',
            textAlign: 'left'
          }}>
            Account Settings
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            margin: 0,
            textAlign: 'left'
          }}>
            Manage your account and preferences
          </p>
        </div>

        <nav style={{ padding: '0 16px' }}>
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                border: 'none',
                backgroundColor: activeSection === id ? '#f3f4f6' : 'transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeSection === id ? '500' : '400',
                color: activeSection === id ? '#1f2937' : '#6b7280',
                marginBottom: '4px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (activeSection !== id) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <Icon size={18} />
              {label}
              <ChevronRight 
                size={16} 
                style={{ 
                  marginLeft: 'auto',
                  opacity: activeSection === id ? 1 : 0.5
                }} 
              />
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '24px' }}>
        <div style={{
          maxWidth: '800px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                margin: '0 0 4px 0',
                color: '#1f2937',
                textAlign: 'left'
              }}>
                {sections.find(s => s.id === activeSection)?.label}
              </h2>
              <p style={{ 
                fontSize: '14px', 
                color: '#6b7280', 
                margin: 0,
                textAlign: 'left'
              }}>
                {activeSection === 'account' && 'Manage your personal information and account settings'}
                {activeSection === 'subscription' && 'View and manage your subscription plan'}
                {activeSection === 'billing' && 'Manage your billing information and payment methods'}
                {activeSection === 'privacy' && 'Control your privacy settings and data preferences'}
                {activeSection === 'support' && 'Get help and contact support'}
              </p>
            </div>
            {activeSection === 'account' && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: isEditing ? '#ef4444' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {isEditing ? <X size={16} /> : <Edit size={16} />}
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            )}
          </div>

          {/* Content */}
          <div style={{ padding: '24px' }}>
            {activeSection === 'account' && (
              <AccountSection 
                user={user}
                formData={formData}
                setFormData={setFormData}
                isEditing={isEditing}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            )}

            {activeSection === 'subscription' && (
              <SubscriptionSection 
                user={user}
                onUpgrade={upgradeToPro}
                onDowngrade={downgradeToFree}
              />
            )}

            {activeSection === 'billing' && (
              <BillingSection user={user} />
            )}

            {activeSection === 'privacy' && (
              <PrivacySection user={user} />
            )}

            {activeSection === 'support' && (
              <SupportSection user={user} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Account Section Component
function AccountSection({ 
  user, 
  formData, 
  setFormData, 
  isEditing, 
  onSave, 
  onCancel 
}: {
  user: any;
  formData: any;
  setFormData: (data: any) => void;
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Profile Information */}
      <div>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          margin: '0 0 16px 0',
          color: '#1f2937',
          textAlign: 'left'
        }}>
          Profile Information
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '6px',
              textAlign: 'left'
            }}>
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  textAlign: 'left'
                }}
              />
            ) : (
              <div style={{
                padding: '10px 12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#374151',
                textAlign: 'left'
              }}>
                {user.name}
              </div>
            )}
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '6px',
              textAlign: 'left'
            }}>
              Company Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  textAlign: 'left'
                }}
              />
            ) : (
              <div style={{
                padding: '10px 12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#374151',
                textAlign: 'left'
              }}>
                {user.companyName || 'Not set'}
              </div>
            )}
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '6px',
              textAlign: 'left'
            }}>
              Email Address
            </label>
            {isEditing ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  textAlign: 'left'
                }}
              />
            ) : (
              <div style={{
                padding: '10px 12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textAlign: 'left'
              }}>
                <Mail size={16} color="#6b7280" />
                {user.email}
              </div>
            )}
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '6px',
              textAlign: 'left'
            }}>
              Account Created
            </label>
            <div style={{
              padding: '10px 12px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textAlign: 'left'
            }}>
              <Calendar size={16} color="#6b7280" />
              {user.createdAt ? user.createdAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Unknown'}
            </div>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          margin: '0 0 16px 0',
          color: '#1f2937',
          textAlign: 'left'
        }}>
          Security
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151',
              width: 'fit-content'
            }}
          >
            <Lock size={16} />
            Change Password
          </button>
        </div>
      </div>

      {/* Preferences Section */}
      <div>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          margin: '0 0 16px 0',
          color: '#1f2937',
          textAlign: 'left'
        }}>
          Preferences
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '6px',
              textAlign: 'left'
            }}>
              Timezone
            </label>
            {isEditing ? (
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  textAlign: 'left'
                }}
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
              </select>
            ) : (
              <div style={{
                padding: '10px 12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textAlign: 'left'
              }}>
                <Globe size={16} color="#6b7280" />
                Eastern Time (ET)
              </div>
            )}
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '6px',
              textAlign: 'left'
            }}>
              Date Format
            </label>
            {isEditing ? (
              <select
                value={formData.dateFormat}
                onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  textAlign: 'left'
                }}
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            ) : (
              <div style={{
                padding: '10px 12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#374151',
                textAlign: 'left'
              }}>
                MM/DD/YYYY
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save/Cancel Buttons */}
      {isEditing && (
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          paddingTop: '16px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={onSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <Save size={16} />
            Save Changes
          </button>
          <button
            onClick={onCancel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// Subscription Section Component
function SubscriptionSection({ user, onUpgrade, onDowngrade }: {
  user: any;
  onUpgrade: () => void;
  onDowngrade: () => void;
}) {
  const getSubscriptionStatusColor = () => {
    if (user.subscriptionTier === 'pro') {
      return user.subscriptionStatus === 'trial' ? '#f59e0b' : '#10b981';
    }
    return '#6b7280';
  };

  const getSubscriptionStatusText = () => {
    if (user.subscriptionTier === 'pro') {
      if (user.subscriptionStatus === 'trial' && user.trialEndsAt) {
        const daysLeft = Math.ceil((user.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return `Trial (${daysLeft} days left)`;
      }
      return 'Active';
    }
    return 'Free Plan';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Current Plan */}
      <div>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          margin: '0 0 16px 0',
          color: '#1f2937',
          textAlign: 'left'
        }}>
          Current Plan
        </h3>
        
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          backgroundColor: user.subscriptionTier === 'pro' ? '#fef3c7' : '#f9fafb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Crown 
              size={24} 
              color={user.subscriptionTier === 'pro' ? '#f59e0b' : '#6b7280'} 
            />
            <div>
              <h4 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                margin: '0 0 4px 0',
                color: '#1f2937'
              }}>
                {user.subscriptionTier === 'pro' ? 'Pro Plan' : 'Free Plan'}
              </h4>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: getSubscriptionStatusColor()
                }} />
                <span style={{
                  fontSize: '14px',
                  color: getSubscriptionStatusColor(),
                  fontWeight: '500'
                }}>
                  {getSubscriptionStatusText()}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ fontSize: '14px', color: '#374151' }}>
                {user.subscriptionTier === 'pro' ? 'Unlimited' : 'Limited'} Sales Tracking
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ fontSize: '14px', color: '#374151' }}>
                {user.subscriptionTier === 'pro' ? 'Advanced' : 'Basic'} Analytics
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: user.subscriptionTier === 'pro' ? '#10b981' : '#ef4444' }} />
              <span style={{ fontSize: '14px', color: '#374151' }}>
                {user.subscriptionTier === 'pro' ? 'Priority' : 'Standard'} Support
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {user.subscriptionTier === 'free' ? (
              <button
                onClick={onUpgrade}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Upgrade to Pro
              </button>
            ) : (
              <button
                onClick={onDowngrade}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Downgrade to Free
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      {user.subscriptionTier === 'pro' && (
        <div>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            margin: '0 0 16px 0',
            color: '#1f2937',
            textAlign: 'left'
          }}>
            Feature Settings
          </h3>
          
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ 
                  fontSize: '16px', 
                  fontWeight: '500', 
                  margin: '0 0 4px 0',
                  color: '#1f2937'
                }}>
                  Advertising Tracking
                </h4>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6b7280', 
                  margin: 0 
                }}>
                  Track your paid advertising performance and ROI
                </p>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: '#10b981',
                color: 'white',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                Enabled
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trial Information */}
      {user.subscriptionTier === 'pro' && user.subscriptionStatus === 'trial' && user.trialEndsAt && (
        <div style={{
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          padding: '16px',
          backgroundColor: '#fffbeb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Calendar size={16} color="#f59e0b" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#92400e' }}>
              Trial Period
            </span>
          </div>
          <p style={{ fontSize: '14px', color: '#92400e', margin: '0 0 12px 0' }}>
            Your trial ends on {user.trialEndsAt ? user.trialEndsAt.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'Unknown'}
          </p>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Subscribe Now
          </button>
        </div>
      )}
    </div>
  );
}

// Billing Section Component
function BillingSection({ user }: { user: any }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          margin: '0 0 16px 0',
          color: '#1f2937',
          textAlign: 'left'
        }}>
          Payment Methods
        </h3>
        
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <CreditCard size={20} color="#6b7280" />
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              No payment methods on file
            </span>
          </div>
          <button
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
            Add Payment Method
          </button>
        </div>
      </div>

      <div>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          margin: '0 0 16px 0',
          color: '#1f2937',
          textAlign: 'left'
        }}>
          Billing History
        </h3>
        
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CreditCard size={20} color="#6b7280" />
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              No billing history available
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Privacy Section Component
function PrivacySection({ user }: { user: any }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          margin: '0 0 16px 0',
          color: '#1f2937',
          textAlign: 'left'
        }}>
          Data Management
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151',
              width: 'fit-content'
            }}
          >
            <Download size={16} />
            Download My Data
          </button>
        </div>
      </div>

      <div>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          margin: '0 0 16px 0',
          color: '#1f2937',
          textAlign: 'left'
        }}>
          Account Deletion
        </h3>
        
        <div style={{
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '16px',
          backgroundColor: '#fef2f2'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Trash2 size={16} color="#ef4444" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#dc2626' }}>
              Danger Zone
            </span>
          </div>
          <p style={{ fontSize: '14px', color: '#dc2626', margin: '0 0 12px 0' }}>
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

// Support Section Component
function SupportSection({ user }: { user: any }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          margin: '0 0 16px 0',
          color: '#1f2937',
          textAlign: 'left'
        }}>
          Get Help
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151',
              width: 'fit-content'
            }}
          >
            <MessageSquare size={16} />
            Contact Support
          </button>
          
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151',
              width: 'fit-content'
            }}
          >
            <HelpCircle size={16} />
            View Documentation
          </button>
          
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151',
              width: 'fit-content'
            }}
          >
            <Star size={16} />
            Submit Feature Request
          </button>
        </div>
      </div>

      <div>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          margin: '0 0 16px 0',
          color: '#1f2937',
          textAlign: 'left'
        }}>
          About
        </h3>
        
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Version</span>
              <span style={{ fontSize: '14px', color: '#374151' }}>1.0.0</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Last Updated</span>
              <span style={{ fontSize: '14px', color: '#374151' }}>
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
