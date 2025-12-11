// ============================================================================
// STYLING UTILITIES
// ============================================================================

import { COLORS, BORDER_RADIUS, SPACING } from '../constants/app';

/**
 * Common card style used throughout the application
 */
export const cardStyle = {
  backgroundColor: COLORS.white,
  borderRadius: BORDER_RADIUS.xl,
  padding: SPACING.xl,
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
} as const;

/**
 * Card style with border
 */
export const cardWithBorderStyle = {
  ...cardStyle,
  border: `1px solid ${COLORS.gray[200]}`,
} as const;

/**
 * Primary button style
 */
export const primaryButtonStyle = {
  padding: `${SPACING.sm} ${SPACING.lg}`,
  borderRadius: BORDER_RADIUS.md,
  border: 'none',
  backgroundColor: COLORS.primary,
  color: COLORS.white,
  fontSize: '14px',
  fontWeight: '500' as const,
  cursor: 'pointer' as const,
  transition: 'all 0.2s',
} as const;

/**
 * Secondary button style
 */
export const secondaryButtonStyle = {
  padding: `${SPACING.sm} ${SPACING.lg}`,
  borderRadius: BORDER_RADIUS.md,
  border: `1px solid ${COLORS.gray[300]}`,
  backgroundColor: COLORS.secondary,
  color: COLORS.gray[700],
  fontSize: '14px',
  fontWeight: '500' as const,
  cursor: 'pointer' as const,
  transition: 'all 0.2s',
} as const;

/**
 * Disabled button style
 */
export const disabledButtonStyle = {
  opacity: 0.5,
  cursor: 'not-allowed' as const,
  backgroundColor: COLORS.gray[200],
  color: COLORS.gray[500],
} as const;

/**
 * Get disabled button style merged with base style
 */
export function getDisabledButtonStyle(baseStyle: React.CSSProperties): React.CSSProperties {
  return {
    ...baseStyle,
    ...disabledButtonStyle,
  };
}

/**
 * Input field style
 */
export const inputStyle = {
  width: '100%',
  padding: SPACING.sm,
  border: `1px solid ${COLORS.gray[300]}`,
  borderRadius: BORDER_RADIUS.md,
  fontSize: '14px',
  boxSizing: 'border-box' as const,
} as const;

/**
 * Label style
 */
export const labelStyle = {
  display: 'block' as const,
  fontSize: '14px',
  fontWeight: '500' as const,
  marginBottom: SPACING.xs,
  color: COLORS.gray[700],
} as const;

/**
 * Section container style
 */
export const sectionStyle = {
  marginBottom: SPACING.xl,
  ...cardStyle,
} as const;

/**
 * Page container style
 */
export const pageContainerStyle = {
  minHeight: '100vh',
  backgroundColor: COLORS.gray[50],
  color: COLORS.gray[900],
  padding: SPACING.xl,
} as const;




