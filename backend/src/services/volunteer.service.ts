import { volunteerRepository } from '../repositories/volunteer.repository'
import { claimRepository } from '../repositories/claim.repository'
import { donationRepository } from '../repositories/donation.repository'
import { VolunteerTask } from '../types/volunteer.schema'
import { ApiError } from '../utils/api-error'
import { cache } from '../lib/cache'

// Volunteer task lifecycle:
//
//   1. Task auto-created when donor confirms a claim (pending, volunteer_id = null)
//   2. Volunteer browses available tasks and picks one up → in_progress
//   3. Volunteer delivers the food → completed, donation → completed
//
// Rules:
//   - Only pending tasks with no volunteer can be picked up
//   - Only the assigned volunteer can mark delivery
//   - Delivery flips the parent donation to 'completed' (end of lifecycle)

export const volunteerService = {

  // ── GET AVAILABLE TASKS ─────────────────────────────────────
  // All pending unassigned tasks — volunteer browses these
  async getAvailable(): Promise<VolunteerTask[]> {
    return volunteerRepository.findAvailable()
  },

  // ── GET MY TASKS ────────────────────────────────────────────
  async getMyTasks(volunteerId: string): Promise<VolunteerTask[]> {
    return volunteerRepository.findByVolunteer(volunteerId)
  },

  // ── PICKUP ──────────────────────────────────────────────────
  // Volunteer claims a task — assigns themselves and sets in_progress
  async pickup(taskId: string, volunteerId: string): Promise<VolunteerTask> {
    const task = await volunteerRepository.findById(taskId)
    if (!task) {
      throw new ApiError(404, 'TASK_NOT_FOUND', 'Volunteer task not found')
    }

    // Can only pick up pending, unassigned tasks
    if (task.status !== 'pending') {
      throw new ApiError(400, 'TASK_NOT_PENDING',
        `Task is '${task.status}', only 'pending' tasks can be picked up`)
    }
    if (task.volunteer_id !== null) {
      throw new ApiError(409, 'TASK_ALREADY_ASSIGNED',
        'This task has already been picked up by another volunteer')
    }

    return volunteerRepository.pickup(taskId, volunteerId)
  },

  // ── DELIVER ─────────────────────────────────────────────────
  // Volunteer marks delivery complete — this ends the entire donation lifecycle
  async deliver(taskId: string, volunteerId: string): Promise<VolunteerTask> {
    const task = await volunteerRepository.findById(taskId)
    if (!task) {
      throw new ApiError(404, 'TASK_NOT_FOUND', 'Volunteer task not found')
    }

    if (task.status !== 'in_progress') {
      throw new ApiError(400, 'TASK_NOT_IN_PROGRESS',
        `Task is '${task.status}', only 'in_progress' tasks can be marked delivered`)
    }

    // Only the assigned volunteer can deliver
    if (task.volunteer_id !== volunteerId) {
      throw new ApiError(403, 'FORBIDDEN', 'Only the assigned volunteer can mark delivery')
    }

    const delivered = await volunteerRepository.deliver(taskId)

    // Flip the donation to 'completed' — full lifecycle done
    // We need to go: task → claim → donation to find the donation_id
    const claim = await claimRepository.findById(task.claim_id)
    if (claim) {
      await donationRepository.updateStatus(claim.donation_id, 'completed')
      // Invalidate caches
      await cache.del(`donations:${claim.donation_id}`)
      await cache.delPattern('donations:geo:*')
    }

    return delivered
  },
}
