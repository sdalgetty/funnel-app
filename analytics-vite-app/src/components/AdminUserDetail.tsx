import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminService, UserProfile } from '../services/adminService';
import { ArrowLeft, Mail, Building, Calendar, CreditCard, UserCog, Phone, Globe, User } from 'lucide-react';
import { pageContainerStyle, cardStyle } from '../utils/styling';

interface AdminUserDetailProps {
  user: UserProfile;
  onBack: () => void;
  onImpersonate: (userId: string) => void;
}

export default function AdminUserDetail({ user, onBack, onImpersonate }: AdminUserDetailProps) {
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin) return;
    
    // Log the view action
    AdminService.logAction('view_user', user.id, {
      user_email: user.email,
      user_name: user.full_name || user.email,
    });
  }, [user.id, isAdmin]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div style={pageContainerStyle}>
      {/* Header */}
      <div style={{ ...cardStyle, marginBottom: '24px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#374151',
            cursor: 'pointer',
            marginBottom: '16px'
          }}
        >
          <ArrowLeft size={16} />
          Back to Users
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: '#1f2937' }}>
              {user.full_name || 'No name'}
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
                <Mail size={16} />
                {user.email}
              </div>
              {(user.first_name || user.last_name) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
                  <User size={16} />
                  {user.first_name || ''} {user.last_name || ''}
                </div>
              )}
              {user.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
                  <Phone size={16} />
                  {user.phone}
                </div>
              )}
              {user.website && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
                  <Globe size={16} />
                  <a href={user.website.startsWith('http') ? user.website : `https://${user.website}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                    {user.website}
                  </a>
                </div>
              )}
              {user.company_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
                  <Building size={16} />
                  {user.company_name}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
                <Calendar size={16} />
                Joined: {new Date(user.created_at).toLocaleDateString()}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
                <CreditCard size={16} />
                {user.subscription_tier || 'free'} - {user.subscription_status || 'active'}
              </div>
            </div>
          </div>
          <button
            onClick={() => onImpersonate(user.id)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <UserCog size={18} />
            Impersonate User
          </button>
        </div>
      </div>

      {/* Note */}
      <div style={{
        backgroundColor: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        color: '#92400e'
      }}>
        <strong>Note:</strong> Click "Impersonate User" to view and edit this user's data. All actions will be logged.
      </div>
    </div>
  );
}

