/**
 * Formatting Utilities
 * 
 * Common formatting functions used throughout the application.
 * Centralizing these ensures consistent formatting and reduces code duplication.
 */

// ============================================================================
// CURRENCY FORMATTING
// ============================================================================

/**
 * Convert cents to USD currency string
 * @param cents - Amount in cents
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function toUSD(cents: number): string {
  if (isNaN(cents) || cents === null || cents === undefined) {
    return "$0.00";
  }
  return (cents / 100).toLocaleString(undefined, { 
    style: "currency", 
    currency: "USD" 
  });
}

/**
 * Convert USD string to cents
 * @param usd - Dollar amount as number or string
 * @returns Amount in cents
 */
export function toCents(usd: number | string): number {
  const amount = typeof usd === 'string' ? parseFloat(usd) : usd;
  if (isNaN(amount)) return 0;
  return Math.round(amount * 100);
}

// ============================================================================
// NUMBER FORMATTING
// ============================================================================

/**
 * Format number with thousand separators
 * @param num - Number to format
 * @returns Formatted number string (e.g., "1,234")
 */
export function formatNumber(num: number): string {
  if (isNaN(num) || num === null || num === undefined) {
    return "0";
  }
  return num.toLocaleString();
}

/**
 * Format percentage with one decimal place
 * @param value - Percentage value (0-100)
 * @returns Formatted percentage string (e.g., "45.5%")
 */
export function formatPercentage(value: number): string {
  if (isNaN(value) || value === null || value === undefined) {
    return "0.0%";
  }
  return `${value.toFixed(1)}%`;
}

/**
 * Format ROI percentage or return N/A if invalid
 * @param roi - ROI value or null
 * @returns Formatted ROI or "N/A"
 */
export function formatROI(roi: number | null): string {
  if (roi === null || isNaN(roi)) {
    return "N/A";
  }
  return `${roi.toFixed(1)}%`;
}

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Format ISO date string to readable format
 * @param dateString - ISO date string
 * @returns Formatted date (e.g., "Jan 15, 2025")
 */
export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Format ISO datetime string to readable format
 * @param dateString - ISO datetime string
 * @returns Formatted datetime (e.g., "Jan 15, 2025, 2:30 PM")
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Get month name from month number
 * @param month - Month number (1-12)
 * @returns Month name (e.g., "January")
 */
export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
}

/**
 * Get short month name from month number
 * @param month - Month number (1-12)
 * @returns Short month name (e.g., "Jan")
 */
export function getMonthNameShort(month: number): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return months[month - 1] || 'Unknown';
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if a value is a valid positive number
 */
export function isValidPositiveNumber(value: any): boolean {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
}

/**
 * Check if a date string is valid
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// ============================================================================
// CALCULATION HELPERS
// ============================================================================

/**
 * Calculate percentage safely (handles division by zero)
 * @param numerator - Top number
 * @param denominator - Bottom number
 * @returns Percentage (0-100) or 0 if invalid
 */
export function calculatePercentage(numerator: number, denominator: number): number {
  if (denominator === 0 || isNaN(numerator) || isNaN(denominator)) {
    return 0;
  }
  return (numerator / denominator) * 100;
}

/**
 * Calculate ROI (Return on Investment)
 * @param revenue - Revenue in cents
 * @param cost - Cost in cents
 * @returns ROI percentage or null if invalid
 */
export function calculateROI(revenue: number, cost: number): number | null {
  if (cost === 0 || revenue === 0 || isNaN(revenue) || isNaN(cost)) {
    return null;
  }
  return (revenue / cost) * 100;
}

/**
 * Calculate average safely
 * @param total - Total amount
 * @param count - Number of items
 * @returns Average or 0 if invalid
 */
export function calculateAverage(total: number, count: number): number {
  if (count === 0 || isNaN(total) || isNaN(count)) {
    return 0;
  }
  return total / count;
}

