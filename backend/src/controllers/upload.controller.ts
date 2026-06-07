import { Request, Response, NextFunction } from 'express'
import { v4 as uuid } from 'uuid'
import { getUploadUrl } from '../lib/r2'
import type { RequestUploadInput } from '../types/upload.schema'

// ── WHY GENERATE THE KEY SERVER-SIDE? ─────────────────────────
// If the frontend chose the file key, a malicious client could
// overwrite other users' files by guessing/reusing keys.
// By generating a UUID-based key on the server, every upload
// gets a unique, unpredictable path.

export const uploadController = {
  async requestUpload(req: Request, res: Response, next: NextFunction) {
    try {
      const { fileName, contentType, donationId } = req.body as RequestUploadInput
      const userId = req.user!.id

      // Build the R2 key: donations/<donationId>/<uuid>.<ext>
      // Organized by donation so cleanup is easy (delete donation = delete folder)
      const ext = fileName.split('.').pop() || 'jpg'
      const key = `donations/${donationId}/${uuid()}.${ext}`

      const result = await getUploadUrl(key, contentType)

      res.json(result)
    } catch (err) {
      next(err)
    }
  },
}
