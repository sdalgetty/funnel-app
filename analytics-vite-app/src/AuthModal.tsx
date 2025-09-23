import React, { useState } from 'react';
import { X, Mail, Lock, User, CreditCard } from 'lucide-react';
import { useAuth } from './AuthContext';
import type { SubscriptionTier } from './types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('free');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      let success = false;
      
      if (mode === 'login') {
        success = await login(email, password);
        if (success) {
          onClose();
          resetForm();
        } else {
          setError('Invalid email or password');
        }
      } else {
        success = await signup(email, password, name, selectedTier);
        if (success) {
          onClose();
          resetForm();
        } else {
          setError('Failed to create account');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
  };

  if (!isOpen) return null;

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
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        width: '100%',
        maxWidth: '400px',
        margin: '20px',
        position: 'relative',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            color: '#6b7280',
          }}
        >
          <X size={20} />
        </button>

        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0', color: '#1f2937' }}>
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
            {mode === 'login' 
              ? 'Sign in to your account to continue' 
              : 'Get started with your analytics dashboard'
            }
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Enter your full name"
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
                placeholder="Enter your password"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: '#374151' }}>
                Choose Plan
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{ flex: 1, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="tier"
                    value="free"
                    checked={selectedTier === 'free'}
                    onChange={(e) => setSelectedTier(e.target.value as SubscriptionTier)}
                    style={{ marginRight: '8px' }}
                  />
                  <div style={{
                    padding: '16px',
                    border: selectedTier === 'free' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                    borderRadius: '8px',
                    textAlign: 'center',
                    backgroundColor: selectedTier === 'free' ? '#eff6ff' : 'white',
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>Free</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Calculator + Funnel</div>
                  </div>
                </label>
                <label style={{ flex: 1, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="tier"
                    value="pro"
                    checked={selectedTier === 'pro'}
                    onChange={(e) => setSelectedTier(e.target.value as SubscriptionTier)}
                    style={{ marginRight: '8px' }}
                  />
                  <div style={{
                    padding: '16px',
                    border: selectedTier === 'pro' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                    borderRadius: '8px',
                    textAlign: 'center',
                    backgroundColor: selectedTier === 'pro' ? '#eff6ff' : 'white',
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>Pro</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>All Features</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              backgroundColor: isSubmitting ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              marginBottom: '16px',
            }}
          >
            {isSubmitting ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>

          <div style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={switchMode}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </form>

        {mode === 'login' && (
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', fontSize: '12px', color: '#6b7280' }}>
            <div style={{ fontWeight: '500', marginBottom: '4px' }}>Demo Accounts:</div>
            <div>Free: demo@example.com / demo123</div>
            <div>Pro: pro@example.com / pro123</div>
            <div>Trial: trial@example.com / trial123</div>
          </div>
        )}
      </div>
    </div>
  );
}
