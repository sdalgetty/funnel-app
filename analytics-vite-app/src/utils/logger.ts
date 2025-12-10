// ============================================================================
// LOGGER UTILITY
// ============================================================================

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

/**
 * Logger utility that conditionally logs based on environment
 * Errors are always logged, debug logs only in development
 */
export const logger = {
  /**
   * Log informational messages (development only)
   */
  log: (...args: unknown[]): void => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log error messages (always logged)
   * In production, should send to error tracking service
   */
  error: (...args: unknown[]): void => {
    console.error(...args);
    
    // Note: Error tracking integration pending - add Sentry/LogRocket when ready
    // See: https://github.com/your-org/funnel-app/issues/XXX (create issue when implementing)
    if (isProd) {
      // Example: Sentry.captureException(args[0]);
    }
  },

  /**
   * Log warning messages (development only)
   */
  warn: (...args: unknown[]): void => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Log debug messages (development only)
   */
  debug: (...args: unknown[]): void => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log grouped debug messages (development only)
   */
  group: (label: string, ...args: unknown[]): void => {
    if (isDev) {
      console.group(label);
      console.log(...args);
      console.groupEnd();
    }
  },
};

