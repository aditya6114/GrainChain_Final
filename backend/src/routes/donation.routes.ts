import { Router } from 'express'
import { donationController } from '../controllers/donation.controller'
import { requireAuth, requireRole } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import {
  CreateDonationSchema,
  GetNearbyDonationsSchema,
  UpdateDonationStatusSchema,
} from '../types/donation.schema'

// Routes define three things only:
//   1. The HTTP method + path
//   2. The middleware chain (in order)
//   3. Which controller handles it
//
// Reading a route left-to-right tells you the complete security and
// validation story for that endpoint — no need to dig into other files.

const router = Router()

// GET /api/donations?lat=&lng=&radius_km=
// Public — anyone (even unauthenticated) can browse available donations
router.get(
  '/',
  validate('query', GetNearbyDonationsSchema),
  donationController.findNearby,
)

// GET /api/donations/:id
// Public — anyone can view a specific donation
router.get(
  '/:id',
  donationController.findById,
)

// POST /api/donations
// Auth required, donor role required
// Middleware runs left to right: auth check → role check → body validation → controller
router.post(
  '/',
  requireAuth,
  requireRole('donor'),
  validate('body', CreateDonationSchema),
  donationController.create,
)

// PATCH /api/donations/:id/status
// Auth required — service layer checks ownership
router.patch(
  '/:id/status',
  requireAuth,
  validate('body', UpdateDonationStatusSchema),
  donationController.updateStatus,
)

export default router
