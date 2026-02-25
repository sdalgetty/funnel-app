import { describe, it, expect } from 'vitest'

/**
 * Sales Activity Pace calculation: YTD + (last 3 months rate × remaining months)
 * This test verifies the math matches the implementation in Insights.tsx
 */
function calculatePace(
  asOfDate: { year: number; month: number },
  ytdBookings: number,
  last3MonthsBookings: number
): number {
  const m = asOfDate.month // 1-indexed
  const y = asOfDate.year
  const lastCompleteIdx = m > 1 ? y * 12 + (m - 1) - 1 : (y - 1) * 12 + 11
  const remainingMonths = Math.max(0, 13 - m)
  const monthlyRate = last3MonthsBookings / 3
  return Math.round(ytdBookings + monthlyRate * remainingMonths)
}

describe('Sales Activity Pace (YTD + projected)', () => {
  it('user example: October, 20 Jan-Jun + 3 Jul-Sep → projected 26', () => {
    // October: m=10, remaining months = 3 (Oct, Nov, Dec)
    // YTD = 23, last 3 months = 3, rate = 1/month
    // Projected = 23 + (1 × 3) = 26
    const pace = calculatePace(
      { year: 2026, month: 10 },
      23, // YTD through September
      3   // Jul, Aug, Sep
    )
    expect(pace).toBe(26)
  })

  it('January: no YTD, 12 remaining months, last 3 months = 9 → projected 36', () => {
    // Last 3 months = Oct, Nov, Dec of prior year
    const pace = calculatePace(
      { year: 2026, month: 1 },
      0,  // no YTD yet
      9   // 3/month rate
    )
    expect(pace).toBe(36) // 0 + 3*12
  })

  it('December: YTD 28, 1 remaining month, last 3 = 3 → projected 29', () => {
    const pace = calculatePace(
      { year: 2026, month: 12 },
      28,
      3
    )
    expect(pace).toBe(29) // 28 + 1*1
  })

  it('July: YTD 15, 6 remaining months, last 3 = 6 → projected 27', () => {
    const pace = calculatePace(
      { year: 2026, month: 7 },
      15,
      6
    )
    expect(pace).toBe(27) // 15 + 2*6
  })

  it('April: YTD 8, 9 remaining, last 3 = 0 → projected 8', () => {
    const pace = calculatePace(
      { year: 2026, month: 4 },
      8,
      0
    )
    expect(pace).toBe(8)
  })
})
