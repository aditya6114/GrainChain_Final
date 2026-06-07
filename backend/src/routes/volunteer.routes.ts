import { Router } from 'express'
import { volunteerController } from '../controllers/volunteer.controller'
import { requireAuth, requireRole } from '../middleware/auth.middleware'

// All volunteer routes require auth + volunteer role.
// No Zod validation needed — these endpoints have no request body.
// Task IDs come from URL params, volunteer ID from the JWT.

const router = Router()

// GET /api/volunteer/tasks — browse available (pending, unassigned) tasks
router.get(
  '/tasks',
  requireAuth,
  requireRole('volunteer'),
  volunteerController.getAvailable,
)

// GET /api/volunteer/tasks/my — volunteer's assigned tasks
// Must come before /:id to avoid "my" matching as an :id
router.get(
  '/tasks/my',
  requireAuth,
  requireRole('volunteer'),
  volunteerController.getMyTasks,
)

// PATCH /api/volunteer/tasks/:id/pickup — volunteer picks up a task
router.patch(
  '/tasks/:id/pickup',
  requireAuth,
  requireRole('volunteer'),
  volunteerController.pickup,
)

// PATCH /api/volunteer/tasks/:id/deliver — volunteer marks delivery done
router.patch(
  '/tasks/:id/deliver',
  requireAuth,
  requireRole('volunteer'),
  volunteerController.deliver,
)

export default router
