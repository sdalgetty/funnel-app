import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validateRequired,
  validatePositiveNumber,
  validateDate,
  validatePercentage,
  combineValidationResults,
  validatePhone,
  validateWebsite,
} from '../validation'

describe('validation', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com').isValid).toBe(true)
      expect(validateEmail('user.name@domain.co.uk').isValid).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('not-an-email').isValid).toBe(false)
      expect(validateEmail('missing@domain').isValid).toBe(false)
      expect(validateEmail('@domain.com').isValid).toBe(false)
    })

    it('should require email to be provided', () => {
      expect(validateEmail('').isValid).toBe(false)
      expect(validateEmail('   ').isValid).toBe(false)
    })
  })

  describe('validateRequired', () => {
    it('should validate non-empty values', () => {
      expect(validateRequired('value', 'Field').isValid).toBe(true)
      expect(validateRequired(123, 'Field').isValid).toBe(true)
    })

    it('should reject empty values', () => {
      expect(validateRequired('', 'Field').isValid).toBe(false)
      expect(validateRequired(null, 'Field').isValid).toBe(false)
      expect(validateRequired(undefined, 'Field').isValid).toBe(false)
    })
  })

  describe('validatePositiveNumber', () => {
    it('should validate positive numbers', () => {
      expect(validatePositiveNumber(100, 'Field').isValid).toBe(true)
      expect(validatePositiveNumber('100', 'Field').isValid).toBe(true)
    })

    it('should reject negative numbers', () => {
      expect(validatePositiveNumber(-10, 'Field').isValid).toBe(false)
      expect(validatePositiveNumber('-10', 'Field').isValid).toBe(false)
    })

    it('should reject non-numeric values', () => {
      expect(validatePositiveNumber('abc', 'Field').isValid).toBe(false)
      expect(validatePositiveNumber(NaN, 'Field').isValid).toBe(false)
    })
  })

  describe('validateDate', () => {
    it('should validate correct date format', () => {
      expect(validateDate('2024-12-15', 'Date').isValid).toBe(true)
      expect(validateDate('2024-01-01', 'Date').isValid).toBe(true)
    })

    it('should reject invalid date formats', () => {
      expect(validateDate('12/15/2024', 'Date').isValid).toBe(false)
      expect(validateDate('2024-13-45', 'Date').isValid).toBe(false)
      expect(validateDate('invalid', 'Date').isValid).toBe(false)
    })
  })

  describe('validatePercentage', () => {
    it('should validate percentages in range 0-100', () => {
      expect(validatePercentage(50, 'Field').isValid).toBe(true)
      expect(validatePercentage(0, 'Field').isValid).toBe(true)
      expect(validatePercentage(100, 'Field').isValid).toBe(true)
    })

    it('should reject out-of-range percentages', () => {
      expect(validatePercentage(-1, 'Field').isValid).toBe(false)
      expect(validatePercentage(101, 'Field').isValid).toBe(false)
    })
  })

  describe('combineValidationResults', () => {
    it('should combine multiple validation results', () => {
      const result1 = validateEmail('test@example.com')
      const result2 = validateRequired('value', 'Field')
      const combined = combineValidationResults(result1, result2)
      
      expect(combined.isValid).toBe(true)
      expect(combined.errors).toHaveLength(0)
    })

    it('should collect all errors from invalid results', () => {
      const result1 = validateEmail('invalid')
      const result2 = validateRequired('', 'Field')
      const combined = combineValidationResults(result1, result2)
      
      expect(combined.isValid).toBe(false)
      expect(combined.errors.length).toBeGreaterThan(0)
    })
  })

  describe('validatePhone', () => {
    it('should validate correct phone number formats', () => {
      expect(validatePhone('703-927-1516').isValid).toBe(true)
      expect(validatePhone('7039271516').isValid).toBe(true)
      expect(validatePhone('(703) 927-1516').isValid).toBe(true)
      expect(validatePhone('703.927.1516').isValid).toBe(true)
      expect(validatePhone('+1 703 927 1516').isValid).toBe(true)
      expect(validatePhone('17039271516').isValid).toBe(true)
    })

    it('should accept empty phone numbers (optional field)', () => {
      expect(validatePhone('').isValid).toBe(true)
      expect(validatePhone(null).isValid).toBe(true)
      expect(validatePhone(undefined).isValid).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123').isValid).toBe(false)
      expect(validatePhone('12345').isValid).toBe(false)
      expect(validatePhone('abc').isValid).toBe(false)
      expect(validatePhone('703-927').isValid).toBe(false)
      expect(validatePhone('70392715165').isValid).toBe(false) // 11 digits without country code
    })

    it('should provide helpful error messages', () => {
      const result = validatePhone('123')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Phone number must be 10 digits (e.g., 703-927-1516)')
    })
  })

  describe('validateWebsite', () => {
    it('should validate correct website URLs', () => {
      expect(validateWebsite('example.com').isValid).toBe(true)
      expect(validateWebsite('https://example.com').isValid).toBe(true)
      expect(validateWebsite('http://example.com').isValid).toBe(true)
      expect(validateWebsite('www.example.com').isValid).toBe(true)
      expect(validateWebsite('subdomain.example.com').isValid).toBe(true)
      expect(validateWebsite('example.co.uk').isValid).toBe(true)
    })

    it('should accept empty website URLs (optional field)', () => {
      expect(validateWebsite('').isValid).toBe(true)
      expect(validateWebsite(null).isValid).toBe(true)
      expect(validateWebsite(undefined).isValid).toBe(true)
    })

    it('should reject invalid website URLs', () => {
      expect(validateWebsite('not a url').isValid).toBe(false)
      expect(validateWebsite('example').isValid).toBe(false)
      expect(validateWebsite('example.').isValid).toBe(false)
      expect(validateWebsite('.com').isValid).toBe(false)
    })

    it('should provide helpful error messages', () => {
      const result = validateWebsite('not a url')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Please enter a valid website URL (e.g., example.com or https://example.com)')
    })
  })
})



