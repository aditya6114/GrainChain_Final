import { claimService } from '../../services/claim.service'
import { claimRepository } from '../../repositories/claim.repository'
import { donationRepository } from '../../repositories/donation.repository'
import { volunteerRepository } from '../../repositories/volunteer.repository'
import { ApiError } from '../../utils/api-error'

// ── Mocking: What and Why ───────────────────────────────────
//
// jest.mock() replaces real module exports with fake versions.
// When claim.service.ts imports donationRepository, it gets our mock —
// not the real one that talks to Supabase.
//
// Why mock?
//   - Speed: no network calls, tests run in milliseconds
//   - Isolation: we're testing the SERVICE's logic, not the database
//   - Control: we decide what the "database" returns for each test
//   - No setup: no need for a running Supabase/Redis instance
//
// The trade-off: mocks can drift from reality. If you rename a column
// in the DB but not in the mock, tests still pass but the app breaks.
// That's what integration tests catch — we'll write those next.

jest.mock('../../repositories/claim.repository')
jest.mock('../../repositories/donation.repository')
jest.mock('../../repositories/volunteer.repository')
jest.mock('../../lib/cache', () => ({
  cache: { get: jest.fn(), set: jest.fn(), del: jest.fn(), delPattern: jest.fn() },
}))

// Cast mocked modules so TypeScript knows these are jest mocks
const mockDonationRepo = donationRepository as jest.Mocked<typeof donationRepository>
const mockClaimRepo = claimRepository as jest.Mocked<typeof claimRepository>
const mockVolunteerRepo = volunteerRepository as jest.Mocked<typeof volunteerRepository>

// ── Test data factories ─────────────────────────────────────
// Reusable fake data. Keeps tests readable — you only override what matters.

const fakeDonation = (overrides = {}) => ({
  id: 'donation-1',
  donor_id: 'donor-1',
  title: 'Test Food',
  description: null,
  food_type: 'cooked meals',
  quantity: 10,
  quantity_unit: 'servings',
  expiry_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  status: 'available' as const,
  lat: 12.97,
  lng: 80.22,
  location_text: 'Test Location',
  image_url: null,
  urgency: 'medium' as const,
  ai_enriched: false,
  ai_summary: null,
  safe_window_hours: null,
  suggested_recipients: null,
  handling_notes: null,
  created_at: new Date().toISOString(),
  ...overrides,
})

const fakeClaim = (overrides = {}) => ({
  id: 'claim-1',
  donation_id: 'donation-1',
  recipient_id: 'recipient-1',
  status: 'pending' as const,
  claimed_at: new Date().toISOString(),
  ...overrides,
})


describe('claimService.create', () => {

  it('should create a claim on an available donation', async () => {
    // Arrange: set up what the mocked repos return
    mockDonationRepo.findById.mockResolvedValue(fakeDonation())
    mockClaimRepo.findByDonation.mockResolvedValue([])  // no existing claims
    mockClaimRepo.create.mockResolvedValue(fakeClaim())

    // Act: call the service
    const result = await claimService.create('donation-1', 'recipient-1')

    // Assert: check the result and that the right repo methods were called
    expect(result.status).toBe('pending')
    expect(mockClaimRepo.create).toHaveBeenCalledWith('donation-1', 'recipient-1')
  })

  it('should throw DONATION_NOT_FOUND when donation does not exist', async () => {
    mockDonationRepo.findById.mockResolvedValue(null)

    await expect(claimService.create('nonexistent', 'recipient-1'))
      .rejects.toThrow(ApiError)

    await expect(claimService.create('nonexistent', 'recipient-1'))
      .rejects.toMatchObject({ code: 'DONATION_NOT_FOUND' })
  })

  it('should throw DONATION_NOT_AVAILABLE when donation is claimed', async () => {
    mockDonationRepo.findById.mockResolvedValue(fakeDonation({ status: 'claimed' }))

    await expect(claimService.create('donation-1', 'recipient-1'))
      .rejects.toMatchObject({ code: 'DONATION_NOT_AVAILABLE' })
  })

  it('should throw DONATION_NOT_AVAILABLE when donation is expired', async () => {
    mockDonationRepo.findById.mockResolvedValue(fakeDonation({ status: 'expired' }))

    await expect(claimService.create('donation-1', 'recipient-1'))
      .rejects.toMatchObject({ code: 'DONATION_NOT_AVAILABLE' })
  })

  it('should throw CANNOT_CLAIM_OWN when donor tries to claim their own donation', async () => {
    // donor-1 is the donation owner — they shouldn't be able to claim it
    mockDonationRepo.findById.mockResolvedValue(fakeDonation({ donor_id: 'user-1' }))

    await expect(claimService.create('donation-1', 'user-1'))
      .rejects.toMatchObject({ code: 'CANNOT_CLAIM_OWN' })
  })

  it('should throw DONATION_ALREADY_CONFIRMED when another claim is confirmed', async () => {
    mockDonationRepo.findById.mockResolvedValue(fakeDonation())
    mockClaimRepo.findByDonation.mockResolvedValue([
      fakeClaim({ status: 'confirmed', recipient_id: 'other-recipient' }),
    ])

    await expect(claimService.create('donation-1', 'recipient-1'))
      .rejects.toMatchObject({ code: 'DONATION_ALREADY_CONFIRMED' })
  })
})


describe('claimService.confirm', () => {

  it('should confirm a pending claim and update donation status', async () => {
    mockClaimRepo.findById.mockResolvedValue(fakeClaim())
    mockDonationRepo.findById.mockResolvedValue(fakeDonation({ donor_id: 'donor-1' }))
    mockClaimRepo.updateStatus.mockResolvedValue(fakeClaim({ status: 'confirmed' }))
    mockDonationRepo.updateStatus.mockResolvedValue(fakeDonation({ status: 'claimed' }))
    mockClaimRepo.findByDonation.mockResolvedValue([fakeClaim()])  // only this claim
    mockVolunteerRepo.create.mockResolvedValue({} as any)

    const result = await claimService.confirm('claim-1', 'donor-1')

    expect(result.status).toBe('confirmed')
    // Verify donation was marked as claimed
    expect(mockDonationRepo.updateStatus).toHaveBeenCalledWith('donation-1', 'claimed')
    // Verify volunteer task was created
    expect(mockVolunteerRepo.create).toHaveBeenCalledWith('claim-1')
  })

  it('should cancel other pending claims when confirming', async () => {
    const otherClaim = fakeClaim({ id: 'claim-2', recipient_id: 'other', status: 'pending' })

    mockClaimRepo.findById.mockResolvedValue(fakeClaim())
    mockDonationRepo.findById.mockResolvedValue(fakeDonation({ donor_id: 'donor-1' }))
    mockClaimRepo.updateStatus.mockResolvedValue(fakeClaim({ status: 'confirmed' }))
    mockDonationRepo.updateStatus.mockResolvedValue(fakeDonation({ status: 'claimed' }))
    mockClaimRepo.findByDonation.mockResolvedValue([fakeClaim(), otherClaim])
    mockVolunteerRepo.create.mockResolvedValue({} as any)

    await claimService.confirm('claim-1', 'donor-1')

    // The other pending claim should be cancelled
    expect(mockClaimRepo.updateStatus).toHaveBeenCalledWith('claim-2', 'cancelled')
  })

  it('should throw CLAIM_NOT_FOUND when claim does not exist', async () => {
    mockClaimRepo.findById.mockResolvedValue(null)

    await expect(claimService.confirm('nonexistent', 'donor-1'))
      .rejects.toMatchObject({ code: 'CLAIM_NOT_FOUND' })
  })

  it('should throw INVALID_CLAIM_STATUS when claim is not pending', async () => {
    mockClaimRepo.findById.mockResolvedValue(fakeClaim({ status: 'confirmed' }))

    await expect(claimService.confirm('claim-1', 'donor-1'))
      .rejects.toMatchObject({ code: 'INVALID_CLAIM_STATUS' })
  })

  it('should throw FORBIDDEN when non-owner tries to confirm', async () => {
    mockClaimRepo.findById.mockResolvedValue(fakeClaim())
    mockDonationRepo.findById.mockResolvedValue(fakeDonation({ donor_id: 'donor-1' }))

    await expect(claimService.confirm('claim-1', 'some-random-user'))
      .rejects.toMatchObject({ code: 'FORBIDDEN' })
  })
})


describe('claimService.cancel', () => {

  it('should allow recipient to cancel their own pending claim', async () => {
    mockClaimRepo.findById.mockResolvedValue(fakeClaim({ recipient_id: 'recipient-1' }))
    mockClaimRepo.updateStatus.mockResolvedValue(fakeClaim({ status: 'cancelled' }))

    const result = await claimService.cancel('claim-1', 'recipient-1', 'recipient')

    expect(result.status).toBe('cancelled')
  })

  it('should allow donor to cancel a pending claim on their donation', async () => {
    mockClaimRepo.findById.mockResolvedValue(fakeClaim({ recipient_id: 'recipient-1' }))
    mockDonationRepo.findById.mockResolvedValue(fakeDonation({ donor_id: 'donor-1' }))
    mockClaimRepo.updateStatus.mockResolvedValue(fakeClaim({ status: 'cancelled' }))

    const result = await claimService.cancel('claim-1', 'donor-1', 'donor')

    expect(result.status).toBe('cancelled')
  })

  it('should throw FORBIDDEN when random user tries to cancel', async () => {
    mockClaimRepo.findById.mockResolvedValue(fakeClaim({ recipient_id: 'recipient-1' }))
    mockDonationRepo.findById.mockResolvedValue(fakeDonation({ donor_id: 'donor-1' }))

    await expect(claimService.cancel('claim-1', 'random-user', 'recipient'))
      .rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('should throw INVALID_CLAIM_STATUS when claim is not pending', async () => {
    mockClaimRepo.findById.mockResolvedValue(fakeClaim({ status: 'confirmed' }))

    await expect(claimService.cancel('claim-1', 'recipient-1', 'recipient'))
      .rejects.toMatchObject({ code: 'INVALID_CLAIM_STATUS' })
  })
})
