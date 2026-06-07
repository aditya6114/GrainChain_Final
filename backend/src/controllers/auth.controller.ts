import { Request, Response, NextFunction } from 'express'
import { authService } from '../services/auth.service'

export const authController = {

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body)
      res.status(201).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body)
      res.json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  },
}
