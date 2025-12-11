import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShareService } from '../services/shareService';
import { CheckCircle, XCircle, Loader, Mail } from 'lucide-react';

export default function AcceptInvitation() {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'checking' | 'success' | 'error' | 'needs-auth'>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [invitationToken, setInvitationToken] = useState<string | null>(null);

  useEffect(() => {
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    let token = urlParams.get('token');
    
    // If no token in URL, check localStorage (user might have come from login page)
    if (!token) {
      token = localStorage.getItem('pendingInvitationToken');
    }
    
    if (!token) {
      setStatus('error');
      setErrorMessage('No invitation token found');
      return;
    }

    setInvitationToken(token);

    // If user is already logged in, try to accept immediately
    if (user && !authLoading) {
      acceptInvitation(token);
    } else if (!authLoading) {
      // User is not logged in
      setStatus('needs-auth');
    }
  }, [user, authLoading]);

  const acceptInvitation = async (token: string) => {
    if (!user) {
      setStatus('needs-auth');
      return;
    }

    setStatus('loading');

    try {
      const invitation = await ShareService.findInvitationByToken(token);
      
      if (!invitation) {
        setStatus('error');
        setErrorMessage('Invalid or expired invitation');
        return;
      }

      // Check if email matches
      if (invitation.guestEmail.toLowerCase() !== user.email?.toLowerCase()) {
        setStatus('error');
        setErrorMessage(
          `This invitation was sent to ${invitation.guestEmail}, but you're logged in as ${user.email}. ` +
          'Please log out and sign in with the correct email address.'
        );
        return;
      }

      // Accept the invitation
      await ShareService.acceptInvitation(token, user.id);
      
      // Clear the token from localStorage
      localStorage.removeItem('pendingInvitationToken');
      
      setStatus('success');
      
      // Redirect to app after a short delay
      setTimeout(() => {
        // Use window.location.replace to prevent back button issues
        window.location.replace('/');
      }, 2000);
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to accept invitation');
    }
  };

  if (status === 'checking') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        backgroundColor: '#f5f5f5'
      }}>
        <Loader size={32} className="animate-spin" style={{ color: '#3b82f6', marginBottom: '16px' }} />
        <p style={{ fontSize: '16px', color: '#6b7280' }}>Checking invitation...</p>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        backgroundColor: '#f5f5f5'
      }}>
        <Loader size={32} className="animate-spin" style={{ color: '#3b82f6', marginBottom: '16px' }} />
        <p style={{ fontSize: '16px', color: '#6b7280' }}>Accepting invitation...</p>
      </div>
    );
  }

  if (status === 'needs-auth') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <Mail size={48} style={{ color: '#3b82f6', marginBottom: '16px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
            Accept Invitation
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px' }}>
            You've been invited to view someone's analytics account. Please sign in or create an account to accept the invitation.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => {
                // Store token in localStorage so we can accept after login
                if (invitationToken) {
                  localStorage.setItem('pendingInvitationToken', invitationToken);
                }
                // Redirect to root - LoginForm will detect the token and handle it
                window.location.href = '/';
              }}
              style={{
                flex: 1,
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#3b82f6',
                color: 'white',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Sign In / Sign Up
            </button>
            <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', margin: 0 }}>
              The invitation will be automatically accepted after you sign in or create an account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '16px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
            Invitation Accepted!
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px' }}>
            You now have view-only access to this account. Redirecting to the dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '24px',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <XCircle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
          Unable to Accept Invitation
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px' }}>
          {errorMessage || 'An error occurred while processing your invitation.'}
        </p>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#3b82f6',
            color: 'white',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

