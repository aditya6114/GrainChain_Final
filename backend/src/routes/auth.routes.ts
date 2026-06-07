import { Router } from 'express'
import { authController } from '../controllers/auth.controller'
import { validate } from '../middleware/validate.middleware'
import { RegisterSchema, LoginSchema } from '../types/auth.schema'

const router = Router()

// POST /api/auth/register — no auth required (you're creating an account)
router.post('/register', validate('body', RegisterSchema), authController.register)

// POST /api/auth/login — no auth required
router.post('/login', validate('body', LoginSchema), authController.login)

export default router
