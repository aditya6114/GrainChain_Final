import { z } from 'zod'

// Allowed MIME types — only images for now.
// Could expand to PDFs for receipts, etc.
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
] as const

// Max file size: 5MB (validated client-side too, but defense in depth)
export const MAX_FILE_SIZE = 5 * 1024 * 1024

export const RequestUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.enum(ALLOWED_TYPES, {
    errorMap: () => ({ message: `Allowed types: ${ALLOWED_TYPES.join(', ')}` }),
  }),
  // Which donation this image is for (so we can organize files in R2).
  // Optional because the upload happens BEFORE the donation is created:
  // the donor picks a photo, we upload it, then send image_url with the
  // create-donation request. Without a donationId, files are scoped to
  // the uploading user instead.
  donationId: z.string().uuid().optional(),
})

export type RequestUploadInput = z.infer<typeof RequestUploadSchema>
