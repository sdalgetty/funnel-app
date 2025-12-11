import { describe, it, expect } from 'vitest'
import { toUSD, formatDate, formatNumber, formatPercentage, calculatePercentage, formatPhoneNumber } from '../formatters'

describe('formatters', () => {
  describe('toUSD', () => {
    it('should convert cents to USD currency string', () => {
      expect(toUSD(1000)).toBe('$10.00')
      expect(toUSD(5000)).toBe('$50.00')
      expect(toUSD(123456)).toBe('$1,234.56')
    })

    it('should handle zero', () => {
      expect(toUSD(0)).toBe('$0.00')
    })

    it('should handle invalid values', () => {
      expect(toUSD(NaN)).toBe('$0.00')
      expect(toUSD(null as any)).toBe('$0.00')
      expect(toUSD(undefined as any)).toBe('$0.00')
    })
  })

  describe('formatDate', () => {
    it('should format date in short format (MM/DD/YYYY)', () => {
      expect(formatDate('2024-12-15', 'short')).toBe('12/15/2024')
      expect(formatDate('2024-01-05', 'short')).toBe('01/05/2024')
    })

    it('should format date in long format', () => {
      const result = formatDate('2024-12-15', 'long')
      expect(result).toContain('Dec')
      expect(result).toContain('2024')
    })

    it('should handle empty strings', () => {
      expect(formatDate('')).toBe('—')
      expect(formatDate('', 'short')).toBe('—')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers with thousand separators', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1234567)).toBe('1,234,567')
    })

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0')
    })

    it('should handle invalid values', () => {
      expect(formatNumber(NaN)).toBe('0')
      expect(formatNumber(null as any)).toBe('0')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentage with one decimal', () => {
      expect(formatPercentage(45.5)).toBe('45.5%')
      expect(formatPercentage(100)).toBe('100.0%')
    })
  })

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(50, 100)).toBe(50)
      expect(calculatePercentage(25, 100)).toBe(25)
    })

    it('should handle division by zero', () => {
      expect(calculatePercentage(50, 0)).toBe(0)
    })

    it('should handle invalid values', () => {
      expect(calculatePercentage(NaN, 100)).toBe(0)
      expect(calculatePercentage(50, NaN)).toBe(0)
    })
  })

  describe('formatPhoneNumber', () => {
    it('should format phone number with dashes', () => {
      expect(formatPhoneNumber('703-927-1516')).toBe('703-927-1516')
    })

    it('should format phone number without dashes', () => {
      expect(formatPhoneNumber('7039271516')).toBe('703-927-1516')
    })

    it('should format phone number with parentheses', () => {
      expect(formatPhoneNumber('(703) 927-1516')).toBe('703-927-1516')
      expect(formatPhoneNumber('(703)927-1516')).toBe('703-927-1516')
    })

    it('should format phone number with dots', () => {
      expect(formatPhoneNumber('703.927.1516')).toBe('703-927-1516')
    })

    it('should format phone number with country code', () => {
      expect(formatPhoneNumber('+1 703 927 1516')).toBe('703-927-1516')
      expect(formatPhoneNumber('17039271516')).toBe('703-927-1516')
    })

    it('should handle empty or null values', () => {
      expect(formatPhoneNumber('')).toBe('')
      expect(formatPhoneNumber(null)).toBe('')
      expect(formatPhoneNumber(undefined)).toBe('')
    })

    it('should return original if invalid format', () => {
      expect(formatPhoneNumber('123')).toBe('123')
      expect(formatPhoneNumber('12345')).toBe('12345')
      expect(formatPhoneNumber('abc')).toBe('abc')
    })
  })
})



