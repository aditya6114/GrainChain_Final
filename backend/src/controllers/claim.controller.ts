import { Request, Response, NextFunction } from 'express'
import { claimService } from '../services/claim.service'

// Same pattern as donation.controller.ts:
// - Read from req (body, params, user)
// - Call service with plain data
// - Send response
// No business logic here — that's the service's job.

export const claimController = {

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const claim = await claimService.create(req.body.donation_id, req.user!.id)
      res.status(201).json({ success: true, data: claim })
    } catch (err) {
      next(err)
    }
  },

  async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const claim = await claimService.confirm(req.params.id as string, req.user!.id)
      res.json({ success: true, data: claim })
    } catch (err) {
      next(err)
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const claim = await claimService.cancel(req.params.id as string, req.user!.id, req.user!.role)
      res.json({ success: true, data: claim })
    } catch (err) {
      next(err)
    }
  },

  async getMyClaims(req: Request, res: Response, next: NextFunction) {
    try {
      const claims = await claimService.getMyClams(req.user!.id)
      res.json({ success: true, data: claims })
    } catch (err) {
      next(err)
    }
  },

  async getClaimsForDonation(req: Request, res: Response, next: NextFunction) {
    try {
      const claims = await claimService.getClaimsForDonation(req.params.donationId as string, req.user!.id)
      res.json({ success: true, data: claims })
    } catch (err) {
      next(err)
    }
  },
}
