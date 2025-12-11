import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { ShareService, type AccountShare } from './services/shareService';
import { formatPhoneNumber } from './utils/formatters';
import { validatePhone, validateWebsite } from './utils/validation';
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
  X,
  Share2,
  UserPlus,
  XCircle,
  CheckCircle,
  Clock,
  Phone
} from 'lucide-react';

type ProfileSection = 'account' | 'subscription' | 'billing' | 'privacy' | 'support' | 'sharing';

export default function UserProfile() {
  const { user, upgradeToPro, downgradeToFree, updateProfile } = useAuth();
  const [activeSection, setActiveSection] = useState<ProfileSection>('account');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    name: user?.name || '',
    companyName: user?.companyName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    website: user?.website || '',
    crm: user?.crm || 'none',
    crmOther: user?.crmOther || '',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    notifications: {
      email: true,
      push: false,
      marketing: false
    }
  });
  const [validationErrors, setValidationErrors] = useState<{
    phone?: string[];
    website?: string[];
  }>({});

  // Update formData when user changes
  React.useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        name: user.name || '',
        companyName: user.companyName || '',
        email: user.email || '',
        phone: user.phone || '',
        website: user.website || '',
        crm: user.crm || 'none',
        crmOther: user.crmOther || '',
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        notifications: {
          email: true,
          push: false,
          marketing: false
        }
      });
    }
  }, [user]);

  if (!user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Please log in to access your profile.</p>
      </div>
    );
  }

  const handleSave = async () => {
    // Validate phone and website
    const phoneValidation = validatePhone(formData.phone);
    const websiteValidation = validateWebsite(formData.website);
    
    const errors: { phone?: string[]; website?: string[] } = {};
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.errors;
    }
    if (!websiteValidation.isValid) {
      errors.website = websiteValidation.errors;
    }

    // If there are validation errors, show them and don't save
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Clear validation errors
    setValidationErrors({});

    try {
      // Format phone number before saving
      const formattedPhone = formData.phone ? formatPhoneNumber(formData.phone) : '';
      
      // Update the user profile with the form data
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: formData.name, // Keep full_name for backwards compatibility
        companyName: formData.companyName,
        email: formData.email,
        phone: formattedPhone,
        website: formData.website?.trim() || '',
        crm: formData.crm,
        crmOther: formData.crm === 'other' ? formData.crmOther?.trim() : undefined,
        // Note: timezone, dateFormat, and notifications would be stored separately in a real app
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      name: user.name,
      companyName: user.companyName || '',
      email: user.email,
      phone: user.phone || '',
      website: user.website || '',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      notifications: {
        email: true,
        push: false,
        marketing: false
      }
    });
    setValidationErrors({});
    setIsEditing(false);
  };

  const handlePhoneBlur = () => {
    // Format phone number when user leaves the field
    if (formData.phone) {
      const formatted = formatPhoneNumber(formData.phone);
      if (formatted && formatted !== formData.phone) {
        setFormData({ ...formData, phone: formatted });
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // All users now have Pro access - simplified status
  const getSubscriptionStatusColor = () => {
    return '#10b981'; // Always active/green for Pro
  };

  const getSubscriptionStatusText = () => {
    return 'Active'; // All users have active Pro access
  };

  const sections = [
    { id: 'account' as ProfileSection, label: 'Account', icon: User },
    { id: 'subscription' as ProfileSection, label: 'Subscription', icon: Crown },
    { id: 'billing' as ProfileSection, label: 'Billing', icon: CreditCard },
    { id: 'sharing' as ProfileSection, label: 'Account Sharing', icon: Share2 },
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
                {activeSection === 'sharing' && 'Share your account with guests for view-only access'}
                {activeSection === 'privacy' && 'Control your privacy settings and data preferences'}
                {activeSection === 'support' && 'Get help and contact support'}
              </p>
            </div>
            {activeSection === 'account' && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
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
                      onClick={handleCancel}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
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
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
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
                    <Edit size={16} />
                    Edit
                  </button>
                )}
              </div>
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
                validationErrors={validationErrors}
                setValidationErrors={setValidationErrors}
                handlePhoneBlur={handlePhoneBlur}
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

            {activeSection === 'sharing' && (
              <SharingSection user={user} />
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
  onCancel,
  validationErrors,
  setValidationErrors,
  handlePhoneBlur
}: {
  user: any;
  formData: any;
  setFormData: (data: any) => void;
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
  validationErrors: { phone?: string[]; website?: string[] };
  setValidationErrors: (errors: { phone?: string[]; website?: string[] }) => void;
  handlePhoneBlur: () => void;
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
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ minWidth: 0, boxSizing: 'border-box' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '6px',
              textAlign: 'left'
            }}>
                First Name
            </label>
            {isEditing ? (
              <input
                type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  textAlign: 'left',
                  boxSizing: 'border-box'
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
                  {user.firstName || 'Not set'}
              </div>
            )}
            </div>

            <div style={{ minWidth: 0, boxSizing: 'border-box' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151',
                marginBottom: '6px',
                textAlign: 'left'
              }}>
                Last Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
                  {user.lastName || 'Not set'}
                </div>
              )}
            </div>
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
                  textAlign: 'left',
                  boxSizing: 'border-box'
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
                  textAlign: 'left',
                  boxSizing: 'border-box'
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
              Phone Number
            </label>
            {isEditing ? (
              <div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    // Clear validation error when user types
                    if (validationErrors.phone) {
                      setValidationErrors({ ...validationErrors, phone: undefined });
                    }
                  }}
                  onBlur={handlePhoneBlur}
                  placeholder="703-927-1516 or (703) 927-1516"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: validationErrors.phone ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    textAlign: 'left',
                    boxSizing: 'border-box'
                  }}
                />
                {validationErrors.phone && validationErrors.phone.length > 0 && (
                  <div style={{ 
                    marginTop: '4px', 
                    fontSize: '12px', 
                    color: '#ef4444' 
                  }}>
                    {validationErrors.phone[0]}
                  </div>
                )}
              </div>
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
                <Phone size={16} color="#6b7280" />
                {user.phone ? formatPhoneNumber(user.phone) || user.phone : 'Not set'}
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
              Website
            </label>
            {isEditing ? (
              <div>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => {
                    setFormData({ ...formData, website: e.target.value });
                    // Clear validation error when user types
                    if (validationErrors.website) {
                      setValidationErrors({ ...validationErrors, website: undefined });
                    }
                  }}
                  placeholder="example.com or https://example.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: validationErrors.website ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    textAlign: 'left',
                    boxSizing: 'border-box'
                  }}
                />
                {validationErrors.website && validationErrors.website.length > 0 && (
                  <div style={{ 
                    marginTop: '4px', 
                    fontSize: '12px', 
                    color: '#ef4444' 
                  }}>
                    {validationErrors.website[0]}
                  </div>
                )}
              </div>
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
                {user.website ? (
                  <a href={user.website.startsWith('http') ? user.website : `https://${user.website}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                    {user.website}
                  </a>
                ) : 'Not set'}
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
              CRM System
            </label>
            {isEditing ? (
              <div>
                <select
                  value={formData.crm}
                  onChange={(e) => setFormData({ ...formData, crm: e.target.value as typeof formData.crm, crmOther: e.target.value === 'other' ? formData.crmOther : '' })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    textAlign: 'left',
                    boxSizing: 'border-box',
                    marginBottom: formData.crm === 'other' ? '8px' : '0'
                  }}
                >
                  <option value="none">None / Manual Entry</option>
                  <option value="honeybook">Honeybook</option>
                  <option value="dubsado">Dubsado</option>
                  <option value="17hats">17hats</option>
                  <option value="studio-ninja">Studio Ninja</option>
                  <option value="sprout-studio">Sprout Studio</option>
                  <option value="tave">Táve</option>
                  <option value="shootq">ShootQ</option>
                  <option value="pixifi">Pixifi</option>
                  <option value="aisle-planner">Aisle Planner</option>
                  <option value="planner-pod">Planner Pod</option>
                  <option value="other">Other</option>
                </select>
                {formData.crm === 'other' && (
                  <input
                    type="text"
                    value={formData.crmOther}
                    onChange={(e) => setFormData({ ...formData, crmOther: e.target.value })}
                    placeholder="Enter CRM name"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      textAlign: 'left',
                      boxSizing: 'border-box',
                      marginTop: '8px'
                    }}
                  />
                )}
              </div>
            ) : (
              <div style={{
                padding: '10px 12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#374151',
                textAlign: 'left'
              }}>
                {user.crm === 'honeybook' ? 'Honeybook' :
                 user.crm === 'dubsado' ? 'Dubsado' :
                 user.crm === '17hats' ? '17hats' :
                 user.crm === 'studio-ninja' ? 'Studio Ninja' :
                 user.crm === 'sprout-studio' ? 'Sprout Studio' :
                 user.crm === 'tave' ? 'Táve' :
                 user.crm === 'shootq' ? 'ShootQ' :
                 user.crm === 'pixifi' ? 'Pixifi' :
                 user.crm === 'aisle-planner' ? 'Aisle Planner' :
                 user.crm === 'planner-pod' ? 'Planner Pod' :
                 user.crm === 'other' ? (user.crmOther || 'Other') :
                 'None / Manual Entry'}
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
                  textAlign: 'left',
                  boxSizing: 'border-box'
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
                  textAlign: 'left',
                  boxSizing: 'border-box'
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

      {/* Save/Cancel Buttons at Bottom */}
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
              padding: '8px 16px',
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
              padding: '8px 16px',
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
          backgroundColor: '#fef3c7' // Pro styling for all users
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Crown 
              size={24} 
              color="#f59e0b" 
            />
            <div>
              <h4 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                margin: '0 0 4px 0',
                color: '#1f2937'
              }}>
                Pro Plan
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
                Unlimited Sales Tracking
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ fontSize: '14px', color: '#374151' }}>
                Advanced Analytics
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ fontSize: '14px', color: '#374151' }}>
                Priority Support
              </span>
            </div>
          </div>

          {/* Subscription management removed - all users have Pro access */}
        </div>
      </div>

      {/* Feature Toggles - All users have Pro features */}
      {(
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

      {/* Trial Information - Deprecated (all users have Pro) */}
      {false && (
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

// Sharing Section Component
function SharingSection({ user }: { user: any }) {
  const [shares, setShares] = useState<AccountShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadShares();
  }, [user]);

  const loadShares = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const ownerShares = await ShareService.getOwnerShares(user.id);
      setShares(ownerShares);
    } catch (err: any) {
      console.error('Error loading shares:', err);
      setError('Failed to load shares');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !user?.id) return;

    setInviting(true);
    setError(null);
    setSuccess(null);

    try {
      // Check if there's already a pending invitation
      const existing = await ShareService.getPendingInvitation(
        user.id,
        inviteEmail.trim()
      );

      if (existing) {
        // Show existing invitation link
        setSuccess(
          `An invitation was already sent. Here's the link: ${existing.invitationLink}`
        );
        // Copy to clipboard if possible
        if (navigator.clipboard) {
          navigator.clipboard.writeText(existing.invitationLink);
          setSuccess(
            `Invitation link copied to clipboard! Link: ${existing.invitationLink}`
          );
        }
        await loadShares();
        return;
      }

      const { share, invitationLink } = await ShareService.inviteGuest(
        user.id,
        inviteEmail.trim()
      );

      // Send invitation email (placeholder)
      await ShareService.sendInvitationEmail(
        inviteEmail.trim(),
        user.name || user.email,
        invitationLink
      );

      setSuccess(`Invitation sent to ${inviteEmail.trim()}. Link: ${invitationLink}`);
      // Copy to clipboard if possible
      if (navigator.clipboard) {
        navigator.clipboard.writeText(invitationLink);
        setSuccess(
          `Invitation link copied to clipboard! Link: ${invitationLink}`
        );
      }
      setInviteEmail('');
      await loadShares();
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRevoke = async (shareId: string) => {
    if (!user?.id) return;
    if (!confirm('Are you sure you want to revoke access for this guest?')) return;

    try {
      await ShareService.revokeShare(user.id, shareId);
      setSuccess('Access revoked successfully');
      await loadShares();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke access');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle size={16} style={{ color: '#10b981' }} />;
      case 'pending':
        return <Clock size={16} style={{ color: '#f59e0b' }} />;
      case 'revoked':
        return <XCircle size={16} style={{ color: '#ef4444' }} />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Active';
      case 'pending':
        return 'Pending';
      case 'revoked':
        return 'Revoked';
      default:
        return status;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Invite Guest Section */}
      <div>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          margin: '0 0 8px 0',
          color: '#1f2937'
        }}>
          Invite a Guest
        </h3>
        <p style={{ 
          fontSize: '14px', 
          color: '#6b7280', 
          margin: '0 0 16px 0'
        }}>
          Share your account with a coach or mentor. They'll receive an email invitation and can view your data in read-only mode.
        </p>

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            marginBottom: '16px',
            color: '#991b1b',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '12px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '6px',
            marginBottom: '16px',
            color: '#166534',
            fontSize: '14px'
          }}>
            {success}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="email"
            placeholder="Enter guest email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleInvite()}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={handleInvite}
            disabled={!inviteEmail.trim() || inviting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: inviting ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: inviting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <UserPlus size={16} />
            {inviting ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </div>

      {/* Active Shares Section */}
      <div>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          margin: '0 0 16px 0',
          color: '#1f2937'
        }}>
          Shared Accounts
        </h3>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
            Loading...
          </div>
        ) : shares.length === 0 ? (
          <div style={{
            padding: '24px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <Share2 size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
            <p style={{ margin: 0 }}>No shared accounts yet. Invite a guest to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {shares.map((share) => {
              const appUrl = window.location.origin;
              const invitationLink = share.invitationToken 
                ? `${appUrl}/accept-invite?token=${share.invitationToken}`
                : null;

              return (
                <div
                  key={share.id}
                  style={{
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        {getStatusIcon(share.status)}
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                          {share.guestEmail}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6b7280' }}>
                        <span>Status: {getStatusText(share.status)}</span>
                        <span>Role: {share.role}</span>
                        {share.acceptedAt && (
                          <span>Accepted: {new Date(share.acceptedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    {share.status === 'accepted' && (
                      <button
                        onClick={() => handleRevoke(share.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          backgroundColor: 'white',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: '#ef4444',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <XCircle size={14} />
                        Revoke
                      </button>
                    )}
                  </div>
                  {share.status === 'pending' && invitationLink && (
                    <div style={{
                      padding: '12px',
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}>
                      <div style={{ marginBottom: '8px', color: '#6b7280', fontWeight: '500' }}>
                        Invitation Link:
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center'
                      }}>
                        <input
                          type="text"
                          value={invitationLink}
                          readOnly
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            backgroundColor: '#f9fafb'
                          }}
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(invitationLink);
                            setSuccess('Invitation link copied to clipboard!');
                            setTimeout(() => setSuccess(null), 3000);
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
