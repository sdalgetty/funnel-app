// ============================================================================
// APPLICATION CONSTANTS
// ============================================================================

/**
 * Timeout constants (in milliseconds)
 */
export const TIMEOUTS = {
  IMPERSONATION_INACTIVITY: 30 * 60 * 1000, // 30 minutes
  SESSION_REFRESH: 5 * 60 * 1000, // 5 minutes
  API_REQUEST: 30 * 1000, // 30 seconds
} as const;

/**
 * Data limits
 */
export const LIMITS = {
  ADMIN_ACCESS_LOGS_DEFAULT: 100,
  IMPERSONATION_SESSIONS_DEFAULT: 50,
  SEARCH_RESULTS_DEFAULT: 50,
  BOOKINGS_PER_PAGE: 50,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

/**
 * Main application constants
 */
export const APP_CONSTANTS = {
  APP_NAME: 'FNNL App',
  DEFAULT_CURRENCY: 'USD',
  IMPERSONATION_TIMEOUT_MS: TIMEOUTS.IMPERSONATION_INACTIVITY,
  // UI related
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
  },
  COLORS: {
    PRIMARY: '#3b82f6',
    SECONDARY: '#6b7280',
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
  },
  SPACING: {
    SMALL: '8px',
    MEDIUM: '16px',
    LARGE: '24px',
  },
  // Data limits
  LIMITS,
  // Other limits/configs
  MAX_DATA_RETENTION_MONTHS_FREE: 12,
  MAX_DATA_RETENTION_MONTHS_PRO: -1, // Unlimited
};

/**
 * Color constants
 */
export const COLORS = {
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  secondary: '#f3f4f6',
  secondaryDark: '#e5e7eb',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  white: '#ffffff',
  black: '#000000',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
} as const;

/**
 * Breakpoint constants (in pixels)
 */
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
  wide: 1536,
} as const;

/**
 * Border radius constants
 */
export const BORDER_RADIUS = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
} as const;

/**
 * Spacing constants
 */
export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
} as const;

/**
 * Common style objects
 */
export const COMMON_STYLES = {
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  button: {
    primary: {
      padding: `${SPACING.sm} ${SPACING.lg}`,
      borderRadius: BORDER_RADIUS.md,
      border: 'none',
      backgroundColor: COLORS.primary,
      color: COLORS.white,
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    secondary: {
      padding: `${SPACING.sm} ${SPACING.lg}`,
      borderRadius: BORDER_RADIUS.md,
      border: 'none',
      backgroundColor: COLORS.secondary,
      color: COLORS.gray[700],
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
  },
} as const;

