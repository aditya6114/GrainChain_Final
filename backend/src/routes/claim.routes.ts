import { Router } from 'express'
import { claimController } from '../controllers/claim.controller'
import { requireAuth, requireRole } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { CreateClaimSchema } from '../types/claim.schema'

// Reading these routes left-to-right tells you the full security story:
//
//   POST /api/claims
//     → requireAuth (must be logged in)
//     → requireRole('recipient') (only recipients can claim)
//     → validate body (must have donation_id as UUID)
//     → controller.create
//
// Every claim route requires auth — there's no public access to claims.

const router = Router()

// POST /api/claims — recipient claims a donation
router.post(
  '/',
  requireAuth,
  requireRole('recipient'),
  validate('body', CreateClaimSchema),
  claimController.create,
)

// GET /api/claims/my — recipient views their own claims
// Note: this route MUST come before /:id, otherwise Express matches "my" as an :id param
router.get(
  '/my',
  requireAuth,
  requireRole('recipient'),
  claimController.getMyClaims,
)

// GET /api/claims/donation/:donationId — donor views claims on their donation
router.get(
  '/donation/:donationId',
  requireAuth,
  requireRole('donor'),
  claimController.getClaimsForDonation,
)

// PATCH /api/claims/:id/confirm — donor confirms a pending claim
router.patch(
  '/:id/confirm',
  requireAuth,
  requireRole('donor'),
  claimController.confirm,
)

// PATCH /api/claims/:id/cancel — recipient or donor cancels a pending claim
// No role restriction — service layer checks if the user is authorized
router.patch(
  '/:id/cancel',
  requireAuth,
  claimController.cancel,
)

export default router
