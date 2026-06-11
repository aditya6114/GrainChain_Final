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

      // Build the R2 key:
      //   donations/<donationId>/<uuid>.<ext>  — when attached to an existing donation
      //   uploads/<userId>/<uuid>.<ext>        — pre-creation upload (donor picks photo
      //                                          before the donation row exists)
      // The uuid segment makes every key unpredictable, so one user can never
      // overwrite another's file even inside the same folder.
      const ext = fileName.split('.').pop() || 'jpg'
      const key = donationId
        ? `donations/${donationId}/${uuid()}.${ext}`
        : `uploads/${userId}/${uuid()}.${ext}`

      const result = await getUploadUrl(key, contentType)

      res.json(result)
    } catch (err) {
      next(err)
    }
  },
}
