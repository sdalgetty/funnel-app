import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ShareService } from '../services/shareService'

const LoginForm: React.FC = () => {
  // Check if we're in an invitation flow
  const urlParams = new URLSearchParams(window.location.search)
  const urlToken = urlParams.get('token')
  const [invitationEmail, setInvitationEmail] = useState<string | null>(null)
  const [isInvitationFlow, setIsInvitationFlow] = useState(false)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [crm, setCrm] = useState<'none' | 'honeybook' | 'dubsado' | '17hats' | 'studio-ninja' | 'sprout-studio' | 'tave' | 'shootq' | 'pixifi' | 'aisle-planner' | 'planner-pod' | 'other'>('none')
  const [crmOther, setCrmOther] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn, signUp } = useAuth()

  // Check for invitation token and pre-fill email
  useEffect(() => {
    const checkInvitation = async () => {
      // Check URL token first (from invite link)
      let token = urlToken
      
      // If no URL token, check localStorage (from redirect)
      if (!token) {
        token = localStorage.getItem('pendingInvitationToken')
      }
      
      // Only proceed if we have a token
      if (!token) {
        // Clear any stale invitation state
        setIsInvitationFlow(false)
        setInvitationEmail(null)
        return
      }
      
      // Verify the invitation is valid and pending
      try {
        const invitation = await ShareService.findInvitationByToken(token)
        if (invitation && invitation.status === 'pending') {
          // Valid pending invitation - show invitation flow
          setIsInvitationFlow(true)
          setInvitationEmail(invitation.guestEmail)
          setEmail(invitation.guestEmail)
          // For invitations, default to signup if email doesn't exist
          setIsSignUp(true)
        } else {
          // Invitation not found, already accepted, or revoked - clear it
          console.log('Invitation not valid or already processed, clearing token')
          setIsInvitationFlow(false)
          setInvitationEmail(null)
          localStorage.removeItem('pendingInvitationToken')
          // Clean up URL token if present
          if (urlToken) {
            const url = new URL(window.location.href)
            url.searchParams.delete('token')
            window.history.replaceState({}, '', url.pathname + url.search)
          }
        }
      } catch (error) {
        // Error loading invitation - clear it
        console.error('Error loading invitation:', error)
        setIsInvitationFlow(false)
        setInvitationEmail(null)
        localStorage.removeItem('pendingInvitationToken')
      }
    }
    
    checkInvitation()
  }, [urlToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        await signUp(email, password, fullName, companyName, crm, crmOther)
        // Don't show email verification message if we're in invitation flow
        // The invitation acceptance will happen automatically
        if (!isInvitationFlow) {
          setError('Check your email for verification link!')
          setLoading(false)
        }
        // For invitation flow, don't set loading to false - let auth state change handle it
        // This prevents form clearing before redirect
      } else {
        await signIn(email, password)
        // For sign-in, don't set loading to false - let auth state change handle it
        // This prevents form clearing before redirect
      }
    } catch (err: any) {
      // Provide helpful error messages, especially for invitation flows
      if (err.message?.includes('Invalid login credentials') || err.message?.includes('Invalid login')) {
        if (isInvitationFlow && !isSignUp) {
          setError('No account found with this email. Please sign up to accept the invitation.')
          setIsSignUp(true) // Switch to sign up mode
        } else {
          setError('Invalid email or password. Please check your credentials or sign up if you don\'t have an account.')
        }
      } else {
        setError(err.message || 'An error occurred. Please try again.')
      }
      setLoading(false)
    }
    // Note: We don't set loading to false on success - the auth state change
    // will handle the redirect and the component will unmount
  }

  return (
    <div style={{
      maxWidth: '400px',
      margin: '50px auto',
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: 'white'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
        {isInvitationFlow ? 'Accept Invitation' : (isSignUp ? 'Sign Up' : 'Sign In')}
      </h2>
      
      {isInvitationFlow && (
        <div style={{
          padding: '12px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '6px',
          marginBottom: '20px',
          fontSize: '14px',
          color: '#0369a1'
        }}>
          You've been invited to view an analytics account. {isSignUp ? 'Create an account' : 'Sign in'} to accept the invitation.
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {isSignUp && (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Full Name {!isInvitationFlow && <span style={{ color: 'red' }}>*</span>}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={!isInvitationFlow}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Company Name {!isInvitationFlow && <span style={{ color: 'red' }}>*</span>}
                {isInvitationFlow && <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>(Optional)</span>}
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required={!isInvitationFlow}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                CRM System <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>(Optional - enables data import)</span>
              </label>
              <select
                value={crm}
                onChange={(e) => setCrm(e.target.value as typeof crm)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  marginBottom: crm === 'other' ? '8px' : '0'
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
              {crm === 'other' && (
                <input
                  type="text"
                  value={crmOther}
                  onChange={(e) => setCrmOther(e.target.value)}
                  placeholder="Enter CRM name"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    marginTop: '8px',
                    fontSize: '14px'
                  }}
                />
              )}
            </div>
          </>
        )}
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isInvitationFlow && !!invitationEmail}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: isInvitationFlow && invitationEmail ? '#f3f4f6' : 'white'
            }}
          />
          {isInvitationFlow && invitationEmail && (
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              This email address is required to accept the invitation.
            </p>
          )}
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        
        {error && (
          <div style={{
            color: 'red',
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#ffe6e6',
            border: '1px solid #ffcccc',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '15px'
          }}
        >
          {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
        </button>
        
        {!isInvitationFlow && (
          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              style={{
                background: 'none',
                border: 'none',
                color: '#007bff',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        )}
        {isInvitationFlow && !isSignUp && (
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#007bff',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                  fontSize: '14px'
                }}
              >
                Sign up here
              </button>
            </p>
          </div>
        )}
      </form>
    </div>
  )
}

export default LoginForm
