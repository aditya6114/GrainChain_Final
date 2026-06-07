import { Request, Response, NextFunction } from 'express'
import { volunteerService } from '../services/volunteer.service'

export const volunteerController = {

  async getAvailable(_req: Request, res: Response, next: NextFunction) {
    try {
      const tasks = await volunteerService.getAvailable()
      res.json({ success: true, data: tasks })
    } catch (err) {
      next(err)
    }
  },

  async getMyTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const tasks = await volunteerService.getMyTasks(req.user!.id)
      res.json({ success: true, data: tasks })
    } catch (err) {
      next(err)
    }
  },

  async pickup(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await volunteerService.pickup(req.params.id as string, req.user!.id)
      res.json({ success: true, data: task })
    } catch (err) {
      next(err)
    }
  },

  async deliver(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await volunteerService.deliver(req.params.id as string, req.user!.id)
      res.json({ success: true, data: task })
    } catch (err) {
      next(err)
    }
  },
}
