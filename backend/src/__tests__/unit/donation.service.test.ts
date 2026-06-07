import { calculateUrgencyFallback } from '../../services/donation.service'

// ── Unit Tests for Donation Service ─────────────────────────
//
// Unit tests verify LOGIC in isolation.
// calculateUrgencyFallback is a pure function — no DB, no Redis, no HTTP.
// Give it input, check the output. The simplest kind of test.
//
// Test naming convention: describe('what') → it('should behavior when condition')
// This reads like a spec: "calculateUrgencyFallback should return critical when < 6 hours"

describe('calculateUrgencyFallback', () => {

  // Helper: create an ISO date string X hours from now
  const hoursFromNow = (hours: number): string =>
    new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()

  it('should return "critical" when expiry is less than 6 hours away', () => {
    expect(calculateUrgencyFallback(hoursFromNow(2))).toBe('critical')
    expect(calculateUrgencyFallback(hoursFromNow(5))).toBe('critical')
    expect(calculateUrgencyFallback(hoursFromNow(0.5))).toBe('critical')
  })

  it('should return "high" when expiry is 6-24 hours away', () => {
    expect(calculateUrgencyFallback(hoursFromNow(7))).toBe('high')
    expect(calculateUrgencyFallback(hoursFromNow(12))).toBe('high')
    expect(calculateUrgencyFallback(hoursFromNow(23))).toBe('high')
  })

  it('should return "medium" when expiry is 24-72 hours away', () => {
    expect(calculateUrgencyFallback(hoursFromNow(25))).toBe('medium')
    expect(calculateUrgencyFallback(hoursFromNow(48))).toBe('medium')
    expect(calculateUrgencyFallback(hoursFromNow(71))).toBe('medium')
  })

  it('should return "low" when expiry is more than 72 hours away', () => {
    expect(calculateUrgencyFallback(hoursFromNow(73))).toBe('low')
    expect(calculateUrgencyFallback(hoursFromNow(168))).toBe('low') // 1 week
  })

  // Edge case: what about boundary values?
  it('should handle exact boundary at 6 hours', () => {
    // At exactly 6h, it should be "high" (the < 6 check is strict)
    // We add a tiny buffer because test execution takes milliseconds
    expect(calculateUrgencyFallback(hoursFromNow(6.01))).toBe('high')
  })

  it('should return "critical" when expiry is in the past', () => {
    // Already expired food — most urgent possible
    expect(calculateUrgencyFallback(hoursFromNow(-1))).toBe('critical')
  })
})
