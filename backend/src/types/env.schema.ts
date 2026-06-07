import { z } from 'zod'

// Zod validates every environment variable at startup.
// If anything is missing or wrong type, the process exits with a clear message
// before serving a single request. Better than a cryptic crash at runtime.
const envSchema = z.object({
  NODE_ENV:                z.enum(['development', 'production', 'test']).default('development'),
  PORT:                    z.string().default('4000').transform(Number),

  // Supabase
  SUPABASE_URL:            z.string().url(),
  SUPABASE_ANON_KEY:       z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),  // bypasses RLS — admin only

  // Redis (Upstash)
  REDIS_URL:               z.string().min(1),

  // Google Gemini — optional until Day 8
  GEMINI_API_KEY:          z.string().optional(),

  // Cloudflare R2 (S3-compatible object storage)
  R2_ACCOUNT_ID:           z.string().min(1),
  R2_ACCESS_KEY_ID:        z.string().min(1),
  R2_SECRET_ACCESS_KEY:    z.string().min(1),
  R2_BUCKET_NAME:          z.string().min(1),
  R2_PUBLIC_URL:           z.string().url(),   // public bucket URL for reading uploaded files

  // CORS — which frontend is allowed to call this API
  FRONTEND_URL:            z.string().url(),
})

// parse() throws if validation fails — that's intentional
// We call this once at startup and export the typed result
export const env = envSchema.parse(process.env)

// TypeScript type inferred from the schema — use this everywhere instead of process.env
export type Env = z.infer<typeof envSchema>
