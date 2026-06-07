import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { RequestUploadSchema } from '../types/upload.schema'
import { uploadController } from '../controllers/upload.controller'

const router = Router()

// POST /api/uploads/request
// Auth required — any logged-in user can request an upload URL.
// The presigned URL is scoped to a specific key and content type,
// so even if leaked, it can only upload one file to one location.
router.post(
  '/request',
  requireAuth,
  validate('body', RequestUploadSchema),
  uploadController.requestUpload,
)

export default router
