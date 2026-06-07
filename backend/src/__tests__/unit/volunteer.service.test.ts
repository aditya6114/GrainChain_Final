import { volunteerService } from '../../services/volunteer.service'
import { volunteerRepository } from '../../repositories/volunteer.repository'
import { claimRepository } from '../../repositories/claim.repository'
import { donationRepository } from '../../repositories/donation.repository'
import { ApiError } from '../../utils/api-error'

jest.mock('../../repositories/volunteer.repository')
jest.mock('../../repositories/claim.repository')
jest.mock('../../repositories/donation.repository')
jest.mock('../../lib/cache', () => ({
  cache: { get: jest.fn(), set: jest.fn(), del: jest.fn(), delPattern: jest.fn() },
}))

const mockVolunteerRepo = volunteerRepository as jest.Mocked<typeof volunteerRepository>
const mockClaimRepo = claimRepository as jest.Mocked<typeof claimRepository>
const mockDonationRepo = donationRepository as jest.Mocked<typeof donationRepository>

const fakeTask = (overrides = {}) => ({
  id: 'task-1',
  claim_id: 'claim-1',
  volunteer_id: null as string | null,
  status: 'pending' as const,
  pickup_at: null,
  delivered_at: null,
  created_at: new Date().toISOString(),
  ...overrides,
})


describe('volunteerService.pickup', () => {

  it('should assign volunteer to a pending unassigned task', async () => {
    mockVolunteerRepo.findById.mockResolvedValue(fakeTask())
    mockVolunteerRepo.pickup.mockResolvedValue(
      fakeTask({ volunteer_id: 'vol-1', status: 'in_progress', pickup_at: new Date().toISOString() })
    )

    const result = await volunteerService.pickup('task-1', 'vol-1')

    expect(result.status).toBe('in_progress')
    expect(result.volunteer_id).toBe('vol-1')
    expect(mockVolunteerRepo.pickup).toHaveBeenCalledWith('task-1', 'vol-1')
  })

  it('should throw TASK_NOT_FOUND when task does not exist', async () => {
    mockVolunteerRepo.findById.mockResolvedValue(null)

    await expect(volunteerService.pickup('nonexistent', 'vol-1'))
      .rejects.toMatchObject({ code: 'TASK_NOT_FOUND' })
  })

  it('should throw TASK_NOT_PENDING when task is already in progress', async () => {
    mockVolunteerRepo.findById.mockResolvedValue(fakeTask({ status: 'in_progress' }))

    await expect(volunteerService.pickup('task-1', 'vol-1'))
      .rejects.toMatchObject({ code: 'TASK_NOT_PENDING' })
  })

  it('should throw TASK_ALREADY_ASSIGNED when another volunteer has it', async () => {
    mockVolunteerRepo.findById.mockResolvedValue(
      fakeTask({ volunteer_id: 'other-volunteer' })
    )

    await expect(volunteerService.pickup('task-1', 'vol-1'))
      .rejects.toMatchObject({ code: 'TASK_ALREADY_ASSIGNED' })
  })
})


describe('volunteerService.deliver', () => {

  it('should mark task as completed and flip donation to completed', async () => {
    mockVolunteerRepo.findById.mockResolvedValue(
      fakeTask({ status: 'in_progress', volunteer_id: 'vol-1' })
    )
    mockVolunteerRepo.deliver.mockResolvedValue(
      fakeTask({ status: 'completed', delivered_at: new Date().toISOString() })
    )
    mockClaimRepo.findById.mockResolvedValue({
      id: 'claim-1',
      donation_id: 'donation-1',
      recipient_id: 'recipient-1',
      status: 'confirmed',
      claimed_at: new Date().toISOString(),
    })
    mockDonationRepo.updateStatus.mockResolvedValue({} as any)

    const result = await volunteerService.deliver('task-1', 'vol-1')

    expect(result.status).toBe('completed')
    // Verify the donation was flipped to completed
    expect(mockDonationRepo.updateStatus).toHaveBeenCalledWith('donation-1', 'completed')
  })

  it('should throw TASK_NOT_IN_PROGRESS when task is pending', async () => {
    mockVolunteerRepo.findById.mockResolvedValue(fakeTask({ status: 'pending' }))

    await expect(volunteerService.deliver('task-1', 'vol-1'))
      .rejects.toMatchObject({ code: 'TASK_NOT_IN_PROGRESS' })
  })

  it('should throw FORBIDDEN when different volunteer tries to deliver', async () => {
    mockVolunteerRepo.findById.mockResolvedValue(
      fakeTask({ status: 'in_progress', volunteer_id: 'vol-1' })
    )

    await expect(volunteerService.deliver('task-1', 'vol-IMPOSTER'))
      .rejects.toMatchObject({ code: 'FORBIDDEN' })
  })
})
