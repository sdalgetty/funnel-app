// ============================================================================
// INPUT VALIDATION UTILITIES
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Please enter a valid email address');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate required field
 */
export function validateRequired(value: string | number | null | undefined, fieldName: string): ValidationResult {
  const errors: string[] = [];
  
  if (value === null || value === undefined || value === '') {
    errors.push(`${fieldName} is required`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate number (positive)
 */
export function validatePositiveNumber(value: string | number | null | undefined, fieldName: string): ValidationResult {
  const errors: string[] = [];
  
  if (value === null || value === undefined || value === '') {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    errors.push(`${fieldName} must be a number`);
  } else if (num < 0) {
    errors.push(`${fieldName} must be a positive number`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate number (non-negative, allows zero)
 */
export function validateNonNegativeNumber(value: string | number | null | undefined, fieldName: string): ValidationResult {
  const errors: string[] = [];
  
  if (value === null || value === undefined || value === '') {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    errors.push(`${fieldName} must be a number`);
  } else if (num < 0) {
    errors.push(`${fieldName} cannot be negative`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function validateDate(date: string | null | undefined, fieldName: string): ValidationResult {
  const errors: string[] = [];
  
  if (!date || date.trim().length === 0) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    errors.push(`${fieldName} must be in YYYY-MM-DD format`);
    return { isValid: false, errors };
  }
  
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    errors.push(`${fieldName} is not a valid date`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate percentage (0-100)
 */
export function validatePercentage(value: string | number | null | undefined, fieldName: string): ValidationResult {
  const errors: string[] = [];
  
  if (value === null || value === undefined || value === '') {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    errors.push(`${fieldName} must be a number`);
  } else if (num < 0 || num > 100) {
    errors.push(`${fieldName} must be between 0 and 100`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string | null | undefined,
  fieldName: string,
  minLength?: number,
  maxLength?: number
): ValidationResult {
  const errors: string[] = [];
  
  if (value === null || value === undefined) {
    value = '';
  }
  
  if (minLength !== undefined && value.length < minLength) {
    errors.push(`${fieldName} must be at least ${minLength} characters`);
  }
  
  if (maxLength !== undefined && value.length > maxLength) {
    errors.push(`${fieldName} must be no more than ${maxLength} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate UUID format
 */
export function validateUUID(value: string | null | undefined, fieldName: string): ValidationResult {
  const errors: string[] = [];
  
  if (!value || value.trim().length === 0) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    errors.push(`${fieldName} must be a valid UUID`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate phone number format
 * Accepts various formats but normalizes to XXX-XXX-XXXX
 */
export function validatePhone(phone: string | null | undefined): ValidationResult {
  const errors: string[] = [];
  
  // Phone is optional, so empty/null is valid
  if (!phone || phone.trim().length === 0) {
    return { isValid: true, errors: [] };
  }

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');

  // Handle US phone numbers (10 digits) or with country code (11 digits starting with 1)
  let cleaned = digitsOnly;
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    cleaned = digitsOnly.substring(1); // Remove leading 1
  }

  // Must be exactly 10 digits
  if (cleaned.length !== 10) {
    errors.push('Phone number must be 10 digits (e.g., 703-927-1516)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate website URL format
 * Accepts URLs with or without http/https protocol
 */
export function validateWebsite(website: string | null | undefined): ValidationResult {
  const errors: string[] = [];
  
  // Website is optional, so empty/null is valid
  if (!website || website.trim().length === 0) {
    return { isValid: true, errors: [] };
  }

  const trimmed = website.trim();

  // Basic URL validation - must start with http://, https://, or be a valid domain
  const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
  const domainPattern = /^([\da-z\.-]+)\.([a-z\.]{2,6})$/i;

  if (!urlPattern.test(trimmed) && !domainPattern.test(trimmed)) {
    errors.push('Please enter a valid website URL (e.g., example.com or https://example.com)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Combine multiple validation results
 */
export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap(r => r.errors);
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}



