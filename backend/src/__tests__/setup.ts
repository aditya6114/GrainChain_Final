// This file runs BEFORE any test file is loaded.
// It sets fake environment variables so Zod validation passes.
//
// Why is this needed?
// Even in unit tests where we mock the database, the import chain still
// triggers: test → service → repository → supabase.ts → env.schema.ts
// env.schema.ts calls envSchema.parse(process.env) at module load time.
// Without these vars, Zod throws before our test code even runs.
//
// These are fake values — they never reach a real Supabase or Redis instance
// because we mock the repositories before any real calls happen.

process.env.SUPABASE_URL = 'https://fake-project.supabase.co'
process.env.SUPABASE_ANON_KEY = 'fake-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-service-role-key'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.FRONTEND_URL = 'http://localhost:3000'
process.env.R2_ACCOUNT_ID = 'fake-account-id'
process.env.R2_ACCESS_KEY_ID = 'fake-access-key'
process.env.R2_SECRET_ACCESS_KEY = 'fake-secret-key'
process.env.R2_BUCKET_NAME = 'fake-bucket'
process.env.R2_PUBLIC_URL = 'https://fake.r2.dev'
process.env.NODE_ENV = 'test'
