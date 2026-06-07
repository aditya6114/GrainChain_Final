import { claimRepository } from '../repositories/claim.repository'
import { donationRepository } from '../repositories/donation.repository'
import { volunteerRepository } from '../repositories/volunteer.repository'
import { Claim } from '../types/claim.schema'
import { ApiError } from '../utils/api-error'
import { cache } from '../lib/cache'

// Business rules for claims — this is the core transaction of the platform.
//
// The claim lifecycle:
//   1. Recipient creates a claim on an available donation → status = 'pending'
//   2. Donor confirms the claim → status = 'confirmed', donation → 'claimed'
//      → a volunteer_task is auto-created (we'll add this when building volunteer routes)
//   3. Either party can cancel a pending claim → status = 'cancelled'
//
// Rules enforced here (not in the repository):
//   - Can only claim 'available' donations
//   - Can't claim a donation that already has a confirmed claim
//   - Can't claim your own donation
//   - Only the donation's donor can confirm a claim
//   - Only pending claims can be confirmed or cancelled

export const claimService = {

  // ── CREATE CLAIM ────────────────────────────────────────────
  async create(donationId: string, recipientId: string): Promise<Claim> {
    // Step 1: Does the donation exist?
    const donation = await donationRepository.findById(donationId)
    if (!donation) {
      throw new ApiError(404, 'DONATION_NOT_FOUND', 'Donation not found')
    }

    // Step 2: Is it still available?
    // Can't claim something that's already claimed, completed, or expired
    if (donation.status !== 'available') {
      throw new ApiError(400, 'DONATION_NOT_AVAILABLE',
        `Donation is '${donation.status}', only 'available' donations can be claimed`)
    }

    // Step 3: Donor can't claim their own donation
    // The DB's RLS policy also prevents this, but we check here too because:
    //   a) Defense in depth — if RLS is misconfigured, this catches it
    //   b) Better error message than a generic DB error
    if (donation.donor_id === recipientId) {
      throw new ApiError(403, 'CANNOT_CLAIM_OWN', 'You cannot claim your own donation')
    }

    // Step 4: Does this donation already have a confirmed claim?
    // Multiple pending claims are fine (like bidding), but only one can be confirmed.
    const existingClaims = await claimRepository.findByDonation(donationId)
    const hasConfirmed = existingClaims.some(c => c.status === 'confirmed')
    if (hasConfirmed) {
      throw new ApiError(409, 'DONATION_ALREADY_CONFIRMED',
        'This donation already has a confirmed claim')
    }

    // Step 5: Create the claim (repo handles duplicate check via unique constraint)
    return claimRepository.create(donationId, recipientId)
  },

  // ── CONFIRM CLAIM ───────────────────────────────────────────
  // Only the donor who owns the donation can confirm
  async confirm(claimId: string, userId: string): Promise<Claim> {
    const claim = await claimRepository.findById(claimId)
    if (!claim) {
      throw new ApiError(404, 'CLAIM_NOT_FOUND', 'Claim not found')
    }

    // Only pending claims can be confirmed
    if (claim.status !== 'pending') {
      throw new ApiError(400, 'INVALID_CLAIM_STATUS',
        `Cannot confirm a '${claim.status}' claim, must be 'pending'`)
    }

    // Verify the confirming user is the donation's donor
    const donation = await donationRepository.findById(claim.donation_id)
    if (!donation) {
      throw new ApiError(404, 'DONATION_NOT_FOUND', 'Donation not found')
    }
    if (donation.donor_id !== userId) {
      throw new ApiError(403, 'FORBIDDEN', 'Only the donation owner can confirm claims')
    }

    // Confirm the claim
    const confirmed = await claimRepository.updateStatus(claimId, 'confirmed')

    // Flip the donation to 'claimed' — it's no longer available to others
    await donationRepository.updateStatus(claim.donation_id, 'claimed')

    // Cancel all OTHER pending claims on this donation
    // (only one claim can be confirmed — the rest are out of luck)
    const allClaims = await claimRepository.findByDonation(claim.donation_id)
    for (const c of allClaims) {
      if (c.id !== claimId && c.status === 'pending') {
        await claimRepository.updateStatus(c.id, 'cancelled')
      }
    }

    // Invalidate caches — donation status changed
    await cache.del(`donations:${claim.donation_id}`)
    await cache.delPattern('donations:geo:*')

    // Auto-create a volunteer task — a volunteer can now pick this up for delivery
    await volunteerRepository.create(claimId)

    return confirmed
  },

  // ── CANCEL CLAIM ────────────────────────────────────────────
  // Recipient can cancel their own pending claim
  // Donor can cancel any pending claim on their donation
  async cancel(claimId: string, userId: string, userRole: string): Promise<Claim> {
    const claim = await claimRepository.findById(claimId)
    if (!claim) {
      throw new ApiError(404, 'CLAIM_NOT_FOUND', 'Claim not found')
    }

    if (claim.status !== 'pending') {
      throw new ApiError(400, 'INVALID_CLAIM_STATUS',
        `Cannot cancel a '${claim.status}' claim, must be 'pending'`)
    }

    // Authorization: either the recipient who made the claim, or the donor who owns the donation
    const isRecipient = claim.recipient_id === userId
    let isDonor = false

    if (!isRecipient) {
      const donation = await donationRepository.findById(claim.donation_id)
      isDonor = donation?.donor_id === userId
    }

    if (!isRecipient && !isDonor) {
      throw new ApiError(403, 'FORBIDDEN', 'You can only cancel your own claims or claims on your donations')
    }

    return claimRepository.updateStatus(claimId, 'cancelled')
  },

  // ── GET MY CLAIMS ───────────────────────────────────────────
  async getMyClams(recipientId: string): Promise<Claim[]> {
    return claimRepository.findByRecipient(recipientId)
  },

  // ── GET CLAIMS FOR DONATION ─────────────────────────────────
  // Donor views all claims on their donation (to decide which to confirm)
  async getClaimsForDonation(donationId: string, userId: string): Promise<Claim[]> {
    // Verify the user is the donor
    const donation = await donationRepository.findById(donationId)
    if (!donation) {
      throw new ApiError(404, 'DONATION_NOT_FOUND', 'Donation not found')
    }
    if (donation.donor_id !== userId) {
      throw new ApiError(403, 'FORBIDDEN', 'Only the donation owner can view claims')
    }

    return claimRepository.findByDonation(donationId)
  },
}
