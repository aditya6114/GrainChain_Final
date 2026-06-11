# GrainChain

A full-stack food donation and redistribution platform that connects donors, recipients, and volunteers to reduce food waste. Donors list surplus food, recipients browse and claim nearby donations via a live map, and volunteers handle pickup and delivery logistics.

**Live:** [grain-chain-final.vercel.app](https://grain-chain-final.vercel.app)

---

## Architecture

```
Frontend (Next.js / Vercel)
    │
    ├── lib/api.ts ──► Express API (Railway)
    │                       │
    │                       ├── Supabase Postgres (PostGIS)
    │                       ├── Upstash Redis (cache + job queue)
    │                       ├── BullMQ Workers ──► Google Gemini AI
    │                       └── Cloudflare R2 (file storage)
    │
    └── Supabase Auth (JWT)
```

The backend follows a **4-layer architecture**: Routes → Controllers → Services → Repositories, with strict separation of concerns — services handle business logic, repositories handle data access, controllers handle HTTP.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Map | Leaflet.js, OpenStreetMap, Nominatim geocoding |
| Backend | Express.js, TypeScript, Zod validation |
| Database | Supabase (PostgreSQL + PostGIS) |
| Caching | Upstash Redis, cache-aside pattern |
| Job Queue | BullMQ (AI enrichment, expiry cron) |
| AI | Google Gemini 2.0 Flash (food safety analysis) |
| Storage | Cloudflare R2 (S3-compatible, presigned uploads) |
| Auth | Supabase Auth, JWT, role-based access control |
| Security | Helmet, CORS, rate limiting (Redis-backed) |
| Deployment | Vercel (frontend), Railway (backend), Docker |

## Features

### Donor Portal (`/donor`)
- Create food donation listings with title, description, food type, quantity, expiry time, and location
- Location autocomplete via Nominatim geocoding
- View claims on your donations, confirm or cancel them
- AI-powered enrichment: each donation is analyzed by Gemini for urgency, safe consumption window, handling notes, and suggested recipients

### Recipient Portal (`/recipient`)
- Browse nearby donations with geo-based search (PostGIS)
- Claim available donations
- Track your active claims

### Volunteer Portal (`/volunteer`)
- Browse available pickup/delivery tasks (auto-created when a claim is confirmed)
- Accept tasks, mark pickup and delivery complete
- Full lifecycle: donation → claim → volunteer task → delivered

### Live Map (`/map`)
- Interactive Leaflet map with color-coded markers by urgency (critical/high/medium/low)
- Click-to-claim popups with donation details
- Browser geolocation and search controls
- Urgency legend

### Backend Infrastructure
- **Cache-aside pattern** — geo queries cached for 60s, individual donations for 30s, with automatic invalidation on state changes
- **BullMQ job queue** — AI enrichment runs asynchronously with 3 retries and exponential backoff; fallback urgency calculation if AI fails
- **Expiry cron job** — hourly check marks stale donations as expired
- **Rate limiting** — 100 req/15min general, 10 req/15min for auth (Redis-backed, distributed-safe)
- **Health check endpoint** — verifies DB and Redis connectivity for deployment monitoring

## Database Schema

4 tables with PostGIS enabled:

- **users** — id, email, role (donor/recipient/volunteer/admin), name
- **donations** — id, donor_id, title, description, food_type, quantity, expiry_time, location (geography), status, AI enrichment fields (urgency, ai_summary, safe_window_hours, handling_notes, suggested_recipients)
- **claims** — id, donation_id, recipient_id, status, timestamps
- **volunteer_tasks** — id, claim_id, volunteer_id, status, timestamps

Key constraints:
- Partial unique index on claims: only one confirmed claim per donation
- GIST index on donation location for geo queries
- RLS policies on all tables
- `get_nearby_donations()` Postgres function for radius search via `.rpc()`

## API Endpoints

```
Auth
  POST   /api/auth/register          Register with role
  POST   /api/auth/login             Login, returns JWT

Donations
  POST   /api/donations              Create donation (donor, auth required)
  GET    /api/donations?lat&lng&radius_km   Find nearby (public)
  GET    /api/donations/:id          Get by ID (public)
  PATCH  /api/donations/:id/status   Update status (owner only)

Claims
  POST   /api/claims                 Claim a donation (recipient)
  GET    /api/claims/my              My claims (recipient)
  GET    /api/claims/donation/:id    Claims on a donation (donor)
  PATCH  /api/claims/:id/confirm     Confirm claim (donor) — cascades: cancels other claims, creates volunteer task
  PATCH  /api/claims/:id/cancel      Cancel claim

Volunteers
  GET    /api/volunteer/tasks        Available tasks
  GET    /api/volunteer/tasks/my     My tasks
  PATCH  /api/volunteer/tasks/:id/pickup   Mark picked up
  PATCH  /api/volunteer/tasks/:id/deliver  Mark delivered — completes donation lifecycle

Uploads
  POST   /api/uploads/request        Get presigned upload URL (auth required)

Admin
  GET    /admin/queues               Bull Board job queue dashboard

Health
  GET    /health                     DB + Redis connectivity check
```

## Project Structure

```
├── app/                          # Next.js frontend
│   ├── auth/login/               # Login page
│   ├── auth/register/            # Registration page
│   ├── donor/                    # Donor dashboard
│   ├── recipient/                # Recipient dashboard
│   ├── volunteer/                # Volunteer dashboard
│   └── map/                      # Interactive map
├── lib/
│   ├── api.ts                    # Centralized API client (all backend calls)
│   └── supabaseClient.ts         # Supabase browser client
├── components/ui/                # shadcn/ui components
├── public/
│   └── landing.html              # Editorial landing page
├── backend/
│   └── src/
│       ├── index.ts              # Express app entry point
│       ├── routes/               # Route definitions (7 modules)
│       ├── controllers/          # HTTP layer (req/res handling)
│       ├── services/             # Business logic layer
│       ├── repositories/         # Data access layer (Supabase queries)
│       ├── middleware/           # Auth, rate limit, logger, error handler
│       ├── jobs/                 # BullMQ queues (AI enrichment, expiry cron)
│       ├── lib/                  # Supabase, Redis, cache, Gemini clients
│       ├── types/                # Zod schemas (env, auth, donation, claim, volunteer)
│       ├── utils/                # ApiError class
│       └── __tests__/            # Jest unit tests (28 tests)
├── supabase/migrations/          # 5 SQL migration files
├── Dockerfile                    # Frontend container (multi-stage, standalone)
├── backend/Dockerfile            # Backend container (multi-stage)
└── docker-compose.yml            # Full stack orchestration with health checks
```

## Getting Started

### Prerequisites
- Node.js 20+
- npm

### Local Development

1. **Clone and install:**
   ```sh
   git clone https://github.com/aditya6114/GrainChain_Final.git
   cd GrainChain_Final
   npm install
   cd backend && npm install && cd ..
   ```

2. **Configure environment variables:**

   Root `.env`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

   `backend/.env`:
   ```
   NODE_ENV=development
   PORT=4000
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   REDIS_URL=your_upstash_redis_url
   GEMINI_API_KEY=your_gemini_key        # optional
   R2_ACCOUNT_ID=your_r2_account_id
   R2_ACCESS_KEY_ID=your_r2_access_key
   R2_SECRET_ACCESS_KEY=your_r2_secret
   R2_BUCKET_NAME=your_bucket_name
   R2_PUBLIC_URL=your_r2_public_url
   FRONTEND_URL=http://localhost:3000
   ```

3. **Run both services:**
   ```sh
   # Terminal 1 — backend
   cd backend && npm run dev

   # Terminal 2 — frontend
   npm run dev
   ```

   Or use Docker:
   ```sh
   docker-compose up
   ```

4. **Open** [http://localhost:3000](http://localhost:3000)

### Running Tests
```sh
cd backend && npm test
```

## Deployment

- **Frontend:** Vercel (auto-deploys from `main`, set `NEXT_PUBLIC_*` env vars in Vercel dashboard)
- **Backend:** Railway (set all `backend/.env` vars in Railway service settings)
- **Docker:** Both services have multi-stage Dockerfiles optimized for production (non-root user, layer caching, standalone builds)

## License

MIT
