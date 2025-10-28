/**
 * Design System Constants
 * 
 * Centralized design tokens for consistent styling across the application.
 * Update these values to theme the entire app.
 */

import { CSSProperties } from 'react';

// ============================================================================
// COLORS
// ============================================================================

export const COLORS = {
  // Primary (Blue)
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  primaryDarker: '#1d4ed8',
  primaryLight: '#60a5fa',
  primaryLighter: '#93c5fd',
  
  // Secondary (Gray)
  secondary: '#6b7280',
  secondaryDark: '#4b5563',
  secondaryLight: '#9ca3af',
  
  // Success (Green)
  success: '#10b981',
  successLight: '#34d399',
  successDark: '#059669',
  
  // Warning (Yellow/Amber)
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  warningDark: '#d97706',
  
  // Danger (Red)
  danger: '#dc2626',
  dangerLight: '#ef4444',
  dangerDark: '#b91c1c',
  
  // Neutral/Gray Scale
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  
  // Backgrounds
  bgPrimary: '#ffffff',
  bgSecondary: '#f9fafb',
  bgTertiary: '#f3f4f6',
  
  // Borders
  borderLight: '#e5e7eb',
  borderMedium: '#d1d5db',
  borderDark: '#9ca3af',
  
  // Text
  textPrimary: '#1f2937',
  textSecondary: '#374151',
  textTertiary: '#6b7280',
  textMuted: '#9ca3af',
  
  // Special
  accent: '#8b5cf6', // Purple
  info: '#0ea5e9', // Sky blue
};

// ============================================================================
// SPACING
// ============================================================================

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  base: '16px',
  lg: '20px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const TYPOGRAPHY = {
  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '28px',
    '4xl': '32px',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.2',
    normal: '1.5',
    relaxed: '1.6',
    loose: '1.8',
  },
};

// ============================================================================
// LAYOUT
// ============================================================================

export const LAYOUT = {
  maxWidth: {
    content: '1200px',
    wide: '1400px',
    narrow: '800px',
  },
  borderRadius: {
    sm: '4px',
    base: '6px',
    md: '8px',
    lg: '12px',
  },
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1280px',
  },
};

// ============================================================================
// SHADOWS
// ============================================================================

export const SHADOWS = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px rgba(0, 0, 0, 0.1)',
  md: '0 2px 4px rgba(0, 0, 0, 0.1)',
  lg: '0 4px 6px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  
  // Colored shadows for specific uses
  primaryShadow: '0 2px 4px rgba(37, 99, 235, 0.3)',
  primaryShadowHover: '0 4px 6px rgba(37, 99, 235, 0.4)',
  blueShadow: '0 1px 3px rgba(59, 130, 246, 0.3)',
};

// ============================================================================
// BUTTON STYLES
// ============================================================================

export const BUTTON_STYLES = {
  /**
   * Primary action button (e.g., Add Booking, Create Model)
   */
  primary: {
    background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primaryDarker} 100%)`,
    color: 'white',
    border: 'none',
    borderRadius: LAYOUT.borderRadius.md,
    padding: '12px 18px',
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.sm,
    boxShadow: SHADOWS.primaryShadow,
    transition: 'all 0.2s',
  } as CSSProperties,

  /**
   * Secondary action button (e.g., Manage Settings)
   */
  secondary: {
    backgroundColor: 'white',
    color: COLORS.textSecondary,
    border: `2px solid ${COLORS.borderMedium}`,
    borderRadius: LAYOUT.borderRadius.md,
    padding: '10px 16px',
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.sm,
    transition: 'all 0.2s',
  } as CSSProperties,

  /**
   * Navigation button - active state
   */
  navActive: {
    padding: '10px 18px',
    borderRadius: LAYOUT.borderRadius.md,
    border: `2px solid ${COLORS.primary}`,
    backgroundColor: COLORS.primary,
    color: 'white',
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.sm,
    transition: 'all 0.2s',
    boxShadow: SHADOWS.blueShadow,
  } as CSSProperties,

  /**
   * Navigation button - inactive state
   */
  navInactive: {
    padding: '10px 18px',
    borderRadius: LAYOUT.borderRadius.md,
    border: `2px solid ${COLORS.borderLight}`,
    backgroundColor: 'white',
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.sm,
    transition: 'all 0.2s',
    boxShadow: SHADOWS.sm,
  } as CSSProperties,

  /**
   * Danger/Delete button
   */
  danger: {
    backgroundColor: COLORS.danger,
    color: 'white',
    border: 'none',
    borderRadius: LAYOUT.borderRadius.base,
    padding: '10px 16px',
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    cursor: 'pointer',
  } as CSSProperties,

  /**
   * Cancel/Neutral button
   */
  neutral: {
    backgroundColor: COLORS.gray100,
    color: COLORS.textSecondary,
    border: 'none',
    borderRadius: LAYOUT.borderRadius.base,
    padding: '10px 16px',
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    cursor: 'pointer',
  } as CSSProperties,
};

// ============================================================================
// COMMON COMPONENT STYLES
// ============================================================================

export const COMPONENT_STYLES = {
  /**
   * Card/Panel container
   */
  card: {
    backgroundColor: 'white',
    borderRadius: LAYOUT.borderRadius.lg,
    border: `1px solid ${COLORS.borderLight}`,
    boxShadow: SHADOWS.base,
  } as CSSProperties,

  /**
   * Modal overlay
   */
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  } as CSSProperties,

  /**
   * Modal content
   */
  modalContent: {
    backgroundColor: 'white',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.xl,
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: SHADOWS.xl,
  } as CSSProperties,

  /**
   * Form input
   */
  input: {
    width: '100%',
    padding: `${SPACING.sm} ${SPACING.md}`,
    border: `1px solid ${COLORS.borderMedium}`,
    borderRadius: LAYOUT.borderRadius.base,
    fontSize: TYPOGRAPHY.fontSize.base,
    boxSizing: 'border-box' as const,
  } as CSSProperties,

  /**
   * Form label
   */
  label: {
    display: 'block',
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.xs,
    textAlign: 'left' as const,
  } as CSSProperties,

  /**
   * Table header cell
   */
  tableHeader: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: COLORS.textTertiary,
    padding: `${SPACING.md} ${SPACING.base}`,
  } as CSSProperties,

  /**
   * Table data cell
   */
  tableCell: {
    padding: `${SPACING.md} ${SPACING.base}`,
    verticalAlign: 'top' as const,
  } as CSSProperties,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get hover style for secondary buttons
 */
export function getSecondaryButtonHover() {
  return {
    borderColor: COLORS.borderDark,
    backgroundColor: COLORS.gray50,
  };
}

/**
 * Get hover style for nav buttons (inactive)
 */
export function getNavButtonHover() {
  return {
    borderColor: COLORS.borderDark,
    backgroundColor: COLORS.gray50,
  };
}

/**
 * Get hover style for primary action buttons
 */
export function getPrimaryButtonHover() {
  return {
    transform: 'translateY(-1px)',
    boxShadow: SHADOWS.primaryShadowHover,
  };
}

/**
 * Get default style for primary action buttons
 */
export function getPrimaryButtonDefault() {
  return {
    transform: 'translateY(0)',
    boxShadow: SHADOWS.primaryShadow,
  };
}

