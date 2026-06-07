import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '../types/env.schema'

// ── WHY S3Client FOR CLOUDFLARE R2? ───────────────────────────
// R2 implements the S3 API protocol. Instead of building a new SDK,
// Cloudflare made R2 speak the same language as S3. So we use the
// AWS SDK but point it at Cloudflare's endpoint.
//
// The only differences from real S3:
//   1. Custom endpoint URL (your Cloudflare account)
//   2. Region is always "auto" (R2 auto-routes to nearest datacenter)

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
})

// ── PRESIGNED UPLOAD URL ──────────────────────────────────────
// Generates a temporary URL that lets the frontend upload a file
// directly to R2 — the file never touches our Express server.
//
// How it works:
//   1. Backend creates a PutObjectCommand with the target key + content type
//   2. Signs it with our R2 credentials → produces a URL with a signature query param
//   3. Frontend uses this URL to PUT the file → R2 verifies the signature
//   4. URL expires after 10 minutes (expiresIn: 600)
//
// Security: the frontend never sees our R2 credentials.
// The signature only allows uploading to that specific key with that content type.

export async function getUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 600 }) // 10 minutes

  return {
    uploadUrl,                                  // frontend PUTs the file here
    fileUrl: `${env.R2_PUBLIC_URL}/${key}`,     // permanent public URL after upload
    key,                                        // stored in DB to reference the file
  }
}

// ── DELETE FILE ───────────────────────────────────────────────
// Used when a donation is deleted or an image is replaced.
export async function deleteFile(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  })
  await r2.send(command)
}
