import { donationRepository } from '../repositories/donation.repository'
import { cache } from '../lib/cache'
import { CreateDonationInput, GetNearbyInput, Donation } from '../types/donation.schema'
import { ApiError } from '../utils/api-error'

// The service's job: enforce business rules.
// It knows nothing about HTTP (no req/res).
// It knows nothing about SQL (no queries).
// It only knows: "given this input and these rules, what should happen?"
//
// This separation means you can test ALL business logic without a running
// HTTP server or a real database — just call the service with mock inputs.

export const donationService = {

  async create(input: CreateDonationInput, donorId: string): Promise<Donation> {
    // Business rule: expiry time must be in the future
    if (new Date(input.expiry_time) <= new Date()) {
      throw new ApiError(400, 'INVALID_EXPIRY', 'Expiry time must be in the future')
    }

    // Calculate urgency from expiry_time as a fallback.
    // This runs synchronously so the donation is created with a reasonable urgency
    // before the async AI job has a chance to run.
    // If AI enrichment succeeds later, it overwrites this value.
    const urgency = calculateUrgencyFallback(input.expiry_time)

    // Create the donation in the DB
    const donation = await donationRepository.create(
      { ...input, urgency } as CreateDonationInput & { urgency: Donation['urgency'] },
      donorId,
    )

    // Invalidate ALL geo caches — a new donation means any cached nearby
    // query might be missing this donation. Pattern match deletes all of them.
    await cache.delPattern('donations:geo:*')

    // Enqueue the AI enrichment job asynchronously.
    // We do NOT await this — the donation is already saved and we return immediately.
    // The job runs in the background and updates the donation when it completes.
    // If the job fails, the donation still exists with the fallback urgency.
    //
    // We import the queue lazily here to avoid circular dependency issues.
    // (queue.ts imports services, services import queue — lazy import breaks the cycle)
    try {
      const { aiEnrichmentQueue } = await import('../jobs/queue')
      await aiEnrichmentQueue.add('enrich', {
        donationId: donation.id,
        title:       input.title,
        description: input.description,
        food_type:   input.food_type,
        quantity:    input.quantity,
        expiry_time: input.expiry_time,
      })
    } catch (err) {
      // If queueing fails, log it but don't fail the request.
      // The donation is saved — only enrichment is delayed/missing.
      console.error('Failed to enqueue AI enrichment job:', err)
    }

    return donation
  },

  async findNearby(input: GetNearbyInput): Promise<Donation[]> {
    // Business rule: radius must be reasonable
    if (input.radius_km > 100) {
      throw new ApiError(400, 'RADIUS_TOO_LARGE', 'Radius cannot exceed 100 km')
    }

    // Cache-aside: build a key from rounded coords so nearby requests hit the same cache.
    // Rounding to 2 decimal places (~1.1km precision) groups similar queries together.
    // Without rounding, lat=13.0827 and lat=13.0828 would be separate cache entries.
    const cacheKey = `donations:geo:${input.lat.toFixed(2)}:${input.lng.toFixed(2)}:${input.radius_km}`

    // Step 1: check cache
    const cached = await cache.get<Donation[]>(cacheKey)
    if (cached) return cached

    // Step 2: cache miss — query Postgres
    const donations = await donationRepository.findNearby(input.lat, input.lng, input.radius_km)

    // Step 3: store in cache with 60s TTL
    // 60s means data can be at most 1 minute stale — acceptable for a map view.
    // Shorter TTL = fresher data but more DB hits. Longer = fewer hits but staler.
    await cache.set(cacheKey, donations, 60)

    return donations
  },

  async findById(id: string): Promise<Donation> {
    // Cache individual donation for 30s
    const cacheKey = `donations:${id}`
    const cached = await cache.get<Donation>(cacheKey)
    if (cached) return cached

    const donation = await donationRepository.findById(id)

    if (!donation) {
      throw new ApiError(404, 'DONATION_NOT_FOUND', `Donation ${id} not found`)
    }

    await cache.set(cacheKey, donation, 30)
    return donation
  },

  async updateStatus(
    id: string,
    newStatus: Donation['status'],
    requestingUserId: string,
    requestingUserRole: string,
  ): Promise<Donation> {
    const donation = await donationRepository.findById(id)

    if (!donation) {
      throw new ApiError(404, 'DONATION_NOT_FOUND', `Donation ${id} not found`)
    }

    // Business rule: only the donor who created it can update their donation's status
    // (System operations like expiry cron bypass this by calling the repository directly)
    if (donation.donor_id !== requestingUserId && requestingUserRole !== 'admin') {
      throw new ApiError(403, 'FORBIDDEN', 'You can only update your own donations')
    }

    // Business rule: validate status transitions
    // Can't go backwards: completed → available doesn't make sense
    const validTransitions: Record<Donation['status'], Donation['status'][]> = {
      available:  ['claimed', 'expired'],
      claimed:    ['completed', 'available'],  // available = unclaim
      completed:  [],                           // terminal state
      expired:    [],                           // terminal state
    }

    if (!validTransitions[donation.status].includes(newStatus)) {
      throw new ApiError(
        400,
        'INVALID_STATUS_TRANSITION',
        `Cannot transition from '${donation.status}' to '${newStatus}'`,
      )
    }

    const updated = await donationRepository.updateStatus(id, newStatus)

    // Invalidate caches — status change affects both individual and geo results
    await cache.del(`donations:${id}`)
    await cache.delPattern('donations:geo:*')

    return updated
  },
}

// ── Helpers ───────────────────────────────────────────────────

// Calculates urgency from expiry_time when AI enrichment hasn't run yet.
// Thresholds: < 6h = critical, < 24h = high, < 72h = medium, else = low
// Exported so it can be unit tested independently.
export function calculateUrgencyFallback(expiryTime: string): Donation['urgency'] {
  const hoursUntilExpiry =
    (new Date(expiryTime).getTime() - Date.now()) / (1000 * 60 * 60)

  if (hoursUntilExpiry < 6)  return 'critical'
  if (hoursUntilExpiry < 24) return 'high'
  if (hoursUntilExpiry < 72) return 'medium'
  return 'low'
}
