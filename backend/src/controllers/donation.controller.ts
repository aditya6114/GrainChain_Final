import { Request, Response, NextFunction } from 'express'
import { donationService } from '../services/donation.service'

// The controller's only job: translate between HTTP and the service layer.
// - Read from req (body, params, query, user)
// - Call the service with plain data (no req/res passed down)
// - Send the response
//
// No business rules here. No database queries.
// If you find yourself writing an if/else for a business reason here, move it to the service.

export const donationController = {

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      // req.body is already validated by Zod middleware (validate('body', CreateDonationSchema))
      // req.user is attached by requireAuth middleware
      const donation = await donationService.create(req.body, req.user!.id)
      res.status(201).json({ success: true, data: donation })
    } catch (err) {
      next(err)  // pass to global error handler
    }
  },

  async findNearby(req: Request, res: Response, next: NextFunction) {
    try {
      // req.query is validated + transformed by Zod (strings coerced to numbers)
      const donations = await donationService.findNearby(req.query as any)
      res.json({ success: true, data: donations })
    } catch (err) {
      next(err)
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const donation = await donationService.findById(req.params.id as string)
      res.json({ success: true, data: donation })
    } catch (err) {
      next(err)
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const donation = await donationService.updateStatus(
        req.params.id as string,
        req.body.status,
        req.user!.id,
        req.user!.role,
      )
      res.json({ success: true, data: donation })
    } catch (err) {
      next(err)
    }
  },
}
