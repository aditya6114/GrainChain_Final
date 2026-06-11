# GrainChain — Feature Explanations & Interview Prep

This document explains every feature in the project: what it does, how it was built, how the pieces integrate, and the interview questions you should expect about each one. Read this before any interview where you present this project.

---

## Table of Contents

1. [The 30-Second Pitch](#the-30-second-pitch)
2. [System Architecture](#1-system-architecture)
3. [4-Layer Backend Architecture](#2-4-layer-backend-architecture)
4. [Authentication & Authorization](#3-authentication--authorization)
5. [Database Design (PostGIS, RLS, Indexes)](#4-database-design)
6. [Geo Search (Nearby Donations)](#5-geo-search--nearby-donations)
7. [Redis Caching (Cache-Aside Pattern)](#6-redis-caching--cache-aside-pattern)
8. [BullMQ Job Queue + AI Enrichment](#7-bullmq-job-queue--ai-enrichment)
9. [Claims & Volunteer Task Lifecycle](#8-claims--volunteer-task-lifecycle)
10. [Rate Limiting](#9-rate-limiting)
11. [Photo Uploads (R2 Presigned URLs)](#10-photo-uploads--presigned-urls)
12. [Real-Time Donation Feed](#11-real-time-donation-feed)
13. [Interactive Map (Leaflet)](#12-interactive-map-leaflet)
14. [Docker Containerization](#13-docker-containerization)
15. [Testing Strategy](#14-testing-strategy)
16. [Deployment & Production Issues (War Stories)](#15-deployment--production-war-stories)
17. [Cross-Cutting Interview Questions](#16-cross-cutting-interview-questions)

---

## The 30-Second Pitch

> "GrainChain is a food redistribution platform connecting donors with surplus food to recipients and volunteers. I built it as a full-stack system: a Next.js frontend, an Express/TypeScript API with a strict 4-layer architecture, PostgreSQL with PostGIS for geo queries, Redis for caching and job queues, AI enrichment of donations via Gemini, real-time updates over WebSockets, and direct-to-cloud file uploads with presigned URLs. It's containerized with Docker and deployed on Vercel and Railway."

The key thing interviewers care about: **you can explain WHY you made each choice, not just WHAT you used.**

---

## 1. System Architecture

```
Browser (Next.js on Vercel)
    │
    ├─ lib/api.ts ──HTTP/JSON──► Express API (Railway)
    │                                │
    │                                ├─► Supabase Postgres (PostGIS)
    │                                ├─► Upstash Redis (cache + BullMQ queues)
    │                                ├─► Google Gemini (AI enrichment, async)
    │                                └─► Cloudflare R2 (presigned URL generation)
    │
    ├─ Supabase Realtime ──WebSocket──► live donation feed (reads only)
    └─ Presigned PUT ──direct──► Cloudflare R2 (file bytes never touch Express)
```

**The design principle:** all *writes* go through Express (auth, validation, business rules in one place). Two *read/transfer* paths bypass it deliberately:
- **Realtime notifications** come straight from Supabase over WebSocket — Express doesn't need to fan out events.
- **File bytes** go straight to R2 — Express only signs the permission slip.

### Expected questions

**Q: Why a separate Express backend instead of Next.js API routes?**
> Three reasons. First, separation of concerns — the API can be scaled, deployed, and monitored independently of the frontend. Second, long-lived processes: BullMQ workers and cron jobs need a persistent Node process, which serverless Next.js API routes don't provide (they're stateless functions that spin down). Third, it demonstrates real-world architecture — most companies have separate API services.

**Q: Why Supabase instead of raw Postgres?**
> Supabase gives me managed Postgres with three things I'd otherwise build myself: authentication (JWT issuance, password hashing), Row Level Security tooling, and Realtime (WAL-based change broadcasting). I still write real SQL migrations and use PostGIS directly — it's not an abstraction that hides the database.

**Q: What's the single point of failure here?**
> The Express API — if it goes down, all writes stop. Mitigations: it's stateless (all state in Postgres/Redis), so I can run multiple instances behind a load balancer. The Redis-backed rate limiter was specifically chosen over in-memory so counts stay correct when horizontally scaled.

---

## 2. 4-Layer Backend Architecture

Every backend feature is a vertical slice through four layers:

```
Route       → URL + middleware chain. No logic.
Controller  → HTTP translation: req/res, status codes. No business rules.
Service     → Business rules. No HTTP, no SQL. Pure logic.
Repository  → Database queries. No business rules.
```

Example for donations: `donation.routes.ts` → `donation.controller.ts` → `donation.service.ts` → `donation.repository.ts`.

**Why this matters:** the service layer knows nothing about HTTP or SQL, so I can unit test ALL business logic with mocked repositories — no running server, no test database. That's how the 28 Jest tests run in ~10 seconds.

### Expected questions

**Q: Isn't this over-engineering for a small app?**
> For the current size, arguably. But the payoff was immediate in testing: I test business rules (claim validation, status transitions, urgency calculation) without any infrastructure. And when I changed caching behavior, I touched exactly one file. The layers cost little to write and make every change localized.

**Q: How do you handle errors across layers?**
> A custom `ApiError` class carries an HTTP status, machine-readable code, and message (`throw new ApiError(403, 'FORBIDDEN', '...')`). Services throw it; a single global error-handler middleware at the end of the chain converts it to a JSON response. Unknown errors become generic 500s so internals never leak to clients.

**Q: Where does validation happen?**
> At the boundary, with Zod. Every route has a `validate()` middleware that parses the request body/query against a schema before the controller runs. Inside the system, data is already typed and trusted. Env vars get the same treatment — a Zod schema validates them at startup so a missing variable fails fast with a clear message instead of a cryptic runtime crash.

---

## 3. Authentication & Authorization

**Flow:**
1. `POST /api/auth/register` — backend creates the user in Supabase Auth (which handles password hashing) with `role` stored in user metadata, plus a row in our `users` table.
2. `POST /api/auth/login` — Supabase Auth verifies credentials, returns a JWT. Frontend stores it in localStorage.
3. Every protected request sends `Authorization: Bearer <token>`. The `requireAuth` middleware verifies it via `supabase.auth.getUser(token)` and attaches the user to `req.user`.
4. `requireRole('donor')` middleware gates role-specific routes.

**A real bug I fixed:** initially I used one Supabase client for both admin operations and auth verification. Logging in a user contaminated the admin client's session — subsequent admin queries ran as that user and failed RLS checks. Fix: two separate clients (`supabaseAdmin` with the service role key, `supabaseAuth` for token operations).

### Expected questions

**Q: JWT in localStorage — isn't that vulnerable to XSS?**
> Yes, that's the known trade-off. localStorage is readable by any script on the page, so an XSS vulnerability leaks tokens. The more secure alternative is httpOnly cookies, which JS can't read — but they require CSRF protection and same-site configuration. For this project I chose localStorage for simplicity and mitigated XSS at the source: React escapes output by default, and I don't use `dangerouslySetInnerHTML`. In a production banking app I'd use httpOnly cookies.

**Q: How does the server know the JWT is valid?**
> The JWT is signed by Supabase with a secret key. `supabase.auth.getUser(token)` verifies the signature and expiry. An attacker can read a JWT's contents (it's just base64) but can't forge one without the signing key.

**Q: What's the difference between authentication and authorization in your app?**
> Authentication = "who are you" — the JWT proves identity (`requireAuth`). Authorization = "what can you do" — enforced in three places: role middleware (`requireRole('donor')`), service-layer ownership checks (only the donor who created a donation can update it), and database RLS policies as a final safety net.

---

## 4. Database Design

Four tables: `users`, `donations`, `claims`, `volunteer_tasks`. Highlights:

- **UUID primary keys** — safe to generate client-side, no information leakage (serial IDs reveal "there are 847 donations"), required by Supabase Auth.
- **CHECK constraints** on status/role/urgency columns — invalid states rejected at the DB level even if app code has a bug.
- **Partial unique index**: `CREATE UNIQUE INDEX ... ON claims(donation_id) WHERE status = 'confirmed'` — the database itself guarantees only ONE confirmed claim per donation, even under race conditions.
- **GIST index** on the PostGIS `location` column — geo queries don't full-scan.
- **Composite index** on `(status, expiry_time)` — the expiry cron's exact query pattern.
- **Row Level Security** on all tables — even if someone got the anon key, they can only read what policies allow.

### Expected questions

**Q: Why store location three ways (lat, lng, geography)?**
> Different access patterns. `lat`/`lng` as plain doubles are cheap to read and exactly what the map frontend needs. The `GEOGRAPHY(POINT)` column powers accurate distance queries (`ST_DWithin` accounts for Earth's curvature). `location_text` is the human-readable address. Storage is cheap; recomputing geography from lat/lng on every query is not.

**Q: How do you prevent two recipients confirming the same donation simultaneously?**
> Defense in depth. The service checks status before confirming, but two concurrent requests could both pass that check (TOCTOU race). The real guarantee is the partial unique index — if two transactions try to insert/update to a confirmed claim on the same donation, the second one violates the index and fails at commit. The database is the last line of defense because it's the only component that sees all concurrent transactions.

**Q: Explain RLS like I've never used Supabase.**
> Row Level Security is Postgres-native row filtering. You enable it on a table (which blocks all access), then write policies — SQL predicates evaluated per row, per query. E.g. our donations SELECT policy is `status = 'available' OR donor_id = auth.uid()`: anyone sees available donations, donors also see their own regardless of status. It runs in the database, so it applies to every access path — including Supabase Realtime broadcasts.

**Q: Your backend uses the service role key which bypasses RLS. Why have RLS at all?**
> The Express backend enforces authorization in code after verifying the JWT, so it doesn't need RLS. RLS protects the *other* paths: the frontend's direct Supabase connection (used for Realtime), and any leaked anon key. It's a safety net, not the primary mechanism.

---

## 5. Geo Search — Nearby Donations

`GET /api/donations?lat=12.97&lng=80.22&radius_km=10`

Supabase's JS client can't express `ST_DWithin`, so I wrote a Postgres function and call it via RPC:

```sql
CREATE FUNCTION get_nearby_donations(p_lat float, p_lng float, p_radius_m float)
RETURNS SETOF donations AS $$
  SELECT * FROM donations
  WHERE status = 'available'
    AND ST_DWithin(location, ST_MakePoint(p_lng, p_lat)::geography, p_radius_m)
  ORDER BY expiry_time ASC;
$$ LANGUAGE sql;
```

```ts
// repository
await supabaseAdmin.rpc('get_nearby_donations', { p_lat, p_lng, p_radius_m: radiusKm * 1000 })
```

### Expected questions

**Q: Why not just filter by lat/lng bounding box in the app?**
> A bounding box is a square, not a circle — corners are √2 farther than the radius. And degrees of longitude shrink toward the poles, so a fixed-degree box is wrong everywhere except the equator. `ST_DWithin` on a geography type computes true great-circle distance, and the GIST index makes it fast (index prunes candidates, exact distance check on the survivors).

**Q: What's the gotcha with PostGIS points?**
> `ST_MakePoint(x, y)` takes **longitude first** — (x, y) = (lng, lat), opposite of how humans say "lat/lng". Get it backwards and your donations end up in the ocean. I have a comment on that line for a reason.

---

## 6. Redis Caching — Cache-Aside Pattern

**Pattern:** check cache → on miss, query DB → store result with TTL → return.

```
donations:geo:13.08:80.22:10   → nearby results, 60s TTL
donations:<id>                 → single donation, 30s TTL
```

Two deliberate design details:

1. **Coordinate rounding.** Cache keys round lat/lng to 2 decimals (~1.1 km). Without it, `lat=13.0827` and `13.0828` are different keys and the hit rate collapses. Rounding groups nearby users onto the same cache entry.
2. **Pattern invalidation.** When any donation is created or changes status, all geo caches might be stale, so we delete `donations:geo:*` — using `SCAN` (incremental, non-blocking) instead of `KEYS` (blocks Redis while scanning the whole keyspace).

### Expected questions

**Q: Why cache-aside and not write-through?**
> Cache-aside is simplest and tolerates cache failure — if Redis dies, reads fall through to Postgres and the app stays up (degraded, not down). Write-through couples every write to the cache and doesn't fit our read pattern: geo queries are keyed by *searcher location*, which the writer doesn't know.

**Q: What about stale data?**
> Two mechanisms. TTL caps staleness at 60s for geo queries — acceptable for a map view. Explicit invalidation handles the cases that matter: status changes delete both the individual key and the geo pattern, so a claimed donation disappears promptly.

**Q: What's a cache stampede, and are you vulnerable?**
> When a hot key expires, many concurrent requests all miss and hammer the DB simultaneously. At my scale it's a non-issue, but the fix would be request coalescing (only one request recomputes, others wait) or probabilistic early refresh.

---

## 7. BullMQ Job Queue + AI Enrichment

**The problem:** when a donation is created, we want Gemini to analyze it (urgency, safe consumption window, handling notes). That call takes 1–3 seconds and can fail. Doing it inside the HTTP request means slow responses and user-facing AI failures.

**The solution:** the create endpoint saves the donation with a *fallback urgency* (computed from expiry time), enqueues an `ai-enrichment` job, and returns immediately. A BullMQ worker processes the job in the background: calls Gemini, parses the JSON response, updates the donation. Config: 3 retries with exponential backoff (2s → 4s → 8s); on final failure, the fallback values stay.

There's a second queue, `expiry-check`, running hourly via cron pattern to flip stale donations to `expired`.

Bull Board at `/admin/queues` gives a UI showing queued/active/completed/failed jobs.

### Expected questions

**Q: Why a queue instead of just `await`ing Gemini in the request handler?**
> Latency, reliability, and decoupling. The user gets a 201 in ~200ms instead of 3s. If Gemini is down, the queue retries automatically with backoff — the user never sees an error because the donation already exists with reasonable fallback data. And queue depth gives natural backpressure if AI calls pile up.

**Q: What happens if the server crashes mid-job?**
> Jobs are persisted in Redis, not in process memory. BullMQ tracks active jobs with a lock; if a worker dies, the lock expires and the job becomes available for reprocessing. That's the core argument for a queue over `setTimeout`.

**Q: Is your AI job idempotent? Why does that matter?**
> Yes — it computes enrichment and UPDATEs the donation row. Running it twice produces the same end state. It matters because retries and crash-recovery mean a job can run more than once; non-idempotent jobs (e.g. "send an email") need dedup keys.

**Q: How do you handle the AI returning garbage?**
> Three layers: prompt engineering (explicit JSON schema in the prompt, "return ONLY valid JSON"), `JSON.parse` in a try/catch, and field validation (`if (!parsed.urgency || !parsed.ai_summary) throw`). Any failure counts as a job failure → retry → eventually fallback. The system never trusts the model blindly.

---

## 8. Claims & Volunteer Task Lifecycle

The full donation lifecycle, with cascading state transitions:

```
Donation: available ──► claimed ──► completed
                  └──► expired (cron)

1. Recipient claims          → claim status: pending
2. Donor confirms            → claim: confirmed
                               ├─ all OTHER pending claims auto-cancelled
                               ├─ donation flips to 'claimed'
                               └─ volunteer_task auto-created (pending)
3. Volunteer picks up task   → task: in_progress, pickup_at set
4. Volunteer delivers        → task: completed, delivered_at set
                               └─ donation flips to 'completed'
```

Status transitions are validated with an explicit state machine in the service:

```ts
const validTransitions = {
  available: ['claimed', 'expired'],
  claimed:   ['completed', 'available'],
  completed: [],   // terminal
  expired:   [],   // terminal
}
```

### Expected questions

**Q: The confirm-claim operation does 3 writes. What if one fails halfway?**
> Honest answer: right now those are sequential Supabase calls, not a single transaction — a crash between them could leave inconsistent state (e.g. claim confirmed but no volunteer task). The proper fix is a Postgres function wrapping all three in one transaction, called via RPC. I know exactly where the gap is and how to close it — it's the kind of thing I'd fix before real traffic.

*(This is a GOOD interview answer — knowing your system's weaknesses beats pretending it's perfect.)*

**Q: Why an explicit transition map instead of if/else?**
> It makes invalid states unrepresentable and self-documenting. Adding a new status forces you to define exactly which transitions are legal. `completed → available` is impossible by construction, not by remembering to write a guard.

---

## 9. Rate Limiting

Two limiters using `express-rate-limit` with a Redis store:
- **General**: 100 requests / 15 min / IP on all API routes.
- **Auth**: 10 requests / 15 min / IP on login/register — brute-force protection.

### Expected questions

**Q: Why Redis-backed instead of in-memory?**
> In-memory counters are per-process. With 3 instances behind a load balancer, a client gets 3× the limit because each instance counts independently. Redis makes the count global across instances. Since Redis was already there for caching and queues, it cost nothing extra.

**Q: Why stricter limits on auth?**
> Auth endpoints are the #1 target for credential stuffing. 10 attempts per 15 minutes is plenty for a human who mistyped a password but useless for an attacker iterating a password list. Failed logins are also more expensive to process (password hashing), so they're a DoS vector.

**Q: Rate limiting by IP — what are the weaknesses?**
> Shared IPs (university NAT, corporate proxies) can hit limits from legitimate aggregate traffic, and attackers rotate IPs through proxies. Better systems combine IP limits with per-account limits and device fingerprinting. IP limiting is the right first layer, not the whole answer.

---

## 10. Photo Uploads — Presigned URLs

**The naive approach** — POST the file to Express, Express forwards to storage — wastes backend bandwidth and memory on every upload, doubles transfer time, and turns the API into a file proxy.

**The presigned URL pattern:**

```
1. Frontend → Express:  POST /api/uploads/request  {fileName, contentType}
              (requireAuth + Zod validation: only image MIME types)
2. Express → R2 SDK:    sign a PutObjectCommand for a server-generated key
3. Express → Frontend:  { uploadUrl (expires in 10 min), fileUrl, key }
4. Frontend → R2:       PUT the file bytes DIRECTLY to uploadUrl
5. Frontend → Express:  POST /api/donations  { ..., image_url: fileUrl }
```

Security decisions:
- **Server generates the key** (`uploads/<userId>/<uuid>.<ext>`). If clients chose keys, a malicious client could overwrite other users' files.
- **Signature scopes the permission**: that one key, that content type, 10-minute expiry. A leaked URL can upload exactly one file to one location.
- **Credentials never leave the server** — the frontend only sees the signed URL.
- **The chicken-and-egg fix**: uploads happen *before* the donation exists (donor picks photo → upload → create donation with `image_url`), so `donationId` is optional in the request schema and pre-creation uploads are scoped to the user's folder instead.

Integration points: `backend/src/lib/r2.ts` (S3 client + signing), `upload.controller.ts` (key generation), `lib/api.ts` `uploadsApi` (two-step client flow), `app/donor/page.tsx` (file picker → upload → create).

### Expected questions

**Q: Walk me through what a presigned URL actually is.**
> It's a regular URL with a cryptographic signature in the query string. The server uses its secret credentials to sign a description of one specific operation — "PUT to this bucket, this key, this content type, valid until this time." R2 verifies the signature on receipt. It's a capability token: possession grants exactly that one operation, nothing else.

**Q: Why Cloudflare R2 over AWS S3?**
> R2 implements the S3 API (I literally use the AWS SDK pointed at a Cloudflare endpoint), so the code is portable. The decisive difference: R2 has zero egress fees, while S3 charges for every download — for a public image-serving use case, egress is the dominant cost.

**Q: How do you prevent someone uploading a 5GB file or malware?**
> Content type is allowlisted (JPEG/PNG/WebP/HEIC) both in Zod validation and baked into the signature — R2 rejects mismatches. Size is checked client-side (5MB) — honest answer: a hostile client could bypass that since the presigned PUT doesn't enforce length; the production fix is `ContentLength` conditions in the signature or a post-upload verification job. Malware scanning would be a background job processing new uploads.

**Q: What happens to orphaned uploads (user uploads a photo, never creates the donation)?**
> They accumulate in `uploads/<userId>/`. Cleanup strategy: a scheduled job listing objects older than 24h that aren't referenced by any donation's `image_url`. R2 also supports lifecycle rules to auto-expire objects under a prefix. Known trade-off of upload-before-create, and worth mentioning proactively in interviews.

---

## 11. Real-Time Donation Feed

**What it does:** when a donor creates a donation, it appears on every open map and recipient browse page *instantly* — no refresh, no polling. Claimed/expired donations vanish live, and AI enrichment results (urgency color, summary) update markers in place.

**How it works (the full pipeline):**

```
Donor submits → Express validates → INSERT into Postgres
   → Postgres writes the change to its WAL (write-ahead log)
   → Supabase Realtime tails the WAL
   → checks RLS: which subscribers may SELECT this row?
   → pushes the row over WebSocket to allowed subscribers
   → useRealtimeDonations hook fires onInsert
   → React state updates → new pin drops on the map
```

**Key architectural insight:** writes still go through Express (auth, validation, business rules, cache invalidation) — only the *notification* path bypasses it. We get realtime UX without exposing writes to the browser or building our own WebSocket server.

**What had to be built:**
1. **Migration 006**: `ALTER PUBLICATION supabase_realtime ADD TABLE donations` (tables aren't broadcast by default) and `REPLICA IDENTITY FULL` (so UPDATE events carry the full row, not just changed columns — the frontend needs `status` + `lat`/`lng` to decide whether to add/remove a marker).
2. **`lib/useRealtimeDonations.ts`**: a React hook that subscribes once, exposes `onInsert`/`onUpdate` callbacks, and cleans up the channel on unmount. Includes a haversine `distanceKm()` helper because the feed broadcasts ALL new donations — radius filtering is client-side.
3. **Consumers** (map page, recipient page): filter events against the user's current search area and merge into React state.

**Two subtle React problems solved in the hook/consumers:**
- **Stale closures.** The subscription is created once, but callbacks need *current* search params. Solution: a ref (`searchRef.current = {lat, lng, radius}`) updated every render — the callback reads the ref, not captured state.
- **Subscription churn.** If the effect depended on the callbacks, every parent re-render would tear down and recreate the WebSocket. Solution: store handlers in a ref (`handlersRef`), subscribe with an empty dependency array.

### Expected questions

**Q: Why WebSockets over polling? Quantify it.**
> Polling every 5s = 720 requests/hour/user, almost all returning nothing new, each one hitting my rate limiter and cache. With WebSockets, traffic is proportional to actual *events*, not connected users × polling rate, and latency drops from avg 2.5s to ~100ms. The trade-off is holding open connections — which Supabase manages for me.

**Q: Why Supabase Realtime instead of Socket.io on your Express server?**
> Socket.io would mean managing connection state, rooms, and horizontal scaling (sticky sessions or a Redis adapter) myself, plus emitting events from every code path that writes donations. The WAL-based approach gets events from the *database*, so any write — API, cron job flipping a donation to expired, even manual SQL — broadcasts automatically. The expiry cron removing markers live came for free.

**Q: How does security work when the browser connects directly to the database's event stream?**
> RLS applies to Realtime. Supabase evaluates each subscriber's SELECT policies per event — our policy allows everyone to see `status='available'` rows, so public inserts broadcast widely, but a donation flipped to claimed stops being visible. The browser also only holds the anon key, which can't write anything RLS doesn't allow (and all our writes happen server-side anyway).

**Q: What happens when the WebSocket disconnects (user's wifi blips)?**
> The client auto-reconnects, but events during the gap are missed — Realtime is a live stream, not a replayable log. The page's initial fetch on load covers the cold-start case; for full correctness you'd refetch on reconnect (`channel.on('system', ...)` reconnect handler triggering a refresh). Honest gap, easy fix, worth mentioning.

**Q: Will this scale to 100k concurrent subscribers?**
> Supabase Realtime fans out per-event RLS checks, which gets expensive at scale. The scalable evolution: broadcast to coarse channels (e.g. geohash-bucketed regions, `donations:geo:tdr1`) so clients only subscribe to their area, or move fan-out to a dedicated pub/sub layer. For this project's scale, per-table subscription with client-side filtering is the right simplicity trade-off.

---

## 12. Interactive Map (Leaflet)

`/map` renders donations as **pin-style markers color-coded by urgency** (red=critical → green=low), with popups showing the photo, details, AI summary, and a claim button for recipients. Geolocation centers the map on the user; search controls adjust lat/lng/radius.

**Implementation details that come up in interviews:**

- **SSR problem:** Leaflet accesses `window` at import time, which crashes Next.js server rendering. Fix: `dynamic(() => import('./map-component'), { ssr: false })` — the map component only ever loads in the browser.
- **Marker icons under bundlers:** Leaflet's default marker PNGs resolve to broken paths under webpack/Next. Instead of patching asset paths, I use `L.divIcon` with an **inline SVG pin** — which also lets me color pins per-urgency without shipping one image per color.
- **`iconAnchor` matters:** `[14, 38]` puts the pin's *tip* on the coordinate instead of the image's top-left corner. Without it, markers drift as you zoom.
- **Icon reuse:** `useMemo` builds 4 icon objects (one per urgency) shared by all markers, instead of one per donation.

### Expected questions

**Q: Why Leaflet over Google Maps?**
> No API key, no billing account, no usage caps — Leaflet + OpenStreetMap tiles are fully open. Leaflet is also tiny (~42KB) and the React wrapper (react-leaflet) integrates cleanly. Google Maps wins if you need Street View, traffic, or their geocoder — I use Nominatim (OSM's geocoder) for address autocomplete instead.

**Q: How would you handle 10,000 markers?**
> Marker clustering (`leaflet.markercluster`) — nearby pins collapse into count bubbles at low zoom. Beyond that: only fetch donations for the visible viewport (the geo query already supports this) and refetch on map move, rather than loading everything.

---

## 13. Docker Containerization

Both services have multi-stage Dockerfiles, orchestrated by docker-compose:

- **Frontend**: deps → builder → runner stages. Next.js `output: "standalone"` produces a self-contained `server.js` — final image ~80MB instead of 1GB+ (no node_modules, no build tooling).
- **Backend**: builder compiles TypeScript → runner installs *production deps only* and copies `dist/`.
- **Both** run as the non-root `node` user.
- **Compose** starts the backend first and waits for its `/health` check (which verifies DB + Redis connectivity) before starting the frontend.

### Expected questions

**Q: Explain multi-stage builds and why they matter.**
> Each `FROM` starts a new stage; the final image only contains what the last stage copies in. Build stages need TypeScript, dev dependencies, the whole toolchain — the runtime needs none of it. Smaller images mean faster deploys, less attack surface, and lower storage cost.

**Q: Why does copying package.json before the source code matter?**
> Docker caches layers. Dependencies change rarely; source changes constantly. By copying `package.json` + running `npm ci` *before* copying source, the expensive install layer stays cached across rebuilds — a code change rebuilds in seconds instead of minutes.

**Q: You containerized but deployed to Vercel/Railway from source. Why?**
> Cost and fit. Vercel is purpose-built for Next.js (edge CDN, preview deploys, zero config) and Railway builds from source on its free tier. The containers are for local dev parity (`docker-compose up` = whole stack) and portability — if I moved to ECS or Cloud Run tomorrow, the images are ready. Containerizing and *where* you deploy are separate decisions.

---

## 14. Testing Strategy

28 Jest unit tests covering the service layer: donation business rules (urgency calculation, expiry validation, status transitions), claim logic (double-claim prevention, ownership checks, confirmation cascades), and volunteer task transitions.

**The architecture enables the testing:** services depend on repositories as plain objects, so tests mock the repository (`jest.mock`) and exercise pure business logic — no database, no HTTP server, ~10 second suite.

### Expected questions

**Q: You only have unit tests. What's missing?**
> Integration tests (Supertest hitting real routes with a test database) to catch wiring bugs — middleware order, serialization, RLS interactions — that unit tests can't see. And one E2E happy path (register → donate → claim → confirm → deliver). I'd structure it as the classic pyramid: many unit, fewer integration, a few E2E. Honest answer: it's on the roadmap; unit tests gave the most coverage-per-hour for the business logic where most of my bugs actually were.

**Q: How do you test code that depends on the current time?**
> The urgency calculator takes `expiry_time` and compares against `Date.now()`. Tests construct expiry times relative to now (`Date.now() + 5 * 3600 * 1000` for "5 hours from now"). For stricter determinism, `jest.useFakeTimers()` pins the clock.

---

## 15. Deployment & Production War Stories

These debugging stories are interview GOLD — "tell me about a hard bug" is a guaranteed question.

### Story 1: "Deployed with no errors, but nothing works"
Both services deployed green, but every backend call failed. Three stacked root causes:
1. `NEXT_PUBLIC_API_URL` wasn't set in Vercel → the client bundle baked in the fallback `http://localhost:4000` → browsers were calling the *user's own machine*.
2. Backend CORS only allowed `http://localhost:3000` → even correct calls would've been rejected.
3. Frontend and backend pointed at *different Supabase projects* (stale env from an earlier iteration).

**Lessons:** `NEXT_PUBLIC_*` vars are baked at *build time* — changing them requires a rebuild, not a restart. "Deploys green" only means the build succeeded, not that the system works. Env config is part of the system and deserves the same review as code.

### Story 2: The 500,000 Redis commands mystery
Upstash free tier (500k commands/month) exhausted in days, with near-zero users, taking the whole API down (rate limiter middleware hit Redis on *every* request → every request 500'd).

Breakdown of the burn: BullMQ workers poll Redis continuously even when idle (~300k+/month for two queues), Railway's health checks every 30s hit the rate limiter + a Redis PING (~250k/month combined). Actual user traffic: negligible.

**Lessons:** infrastructure overhead can dwarf workload — measure per-component command consumption before picking a tier. Background pollers are invisible until metered. Also a dependency-failure-mode lesson: a *rate limiter* outage shouldn't take down the API — it should fail open (skip limiting) rather than fail closed (500 everything).

### Story 3: Session contamination bug
(See [Auth section](#3-authentication--authorization) — one shared Supabase client meant logging a user in changed the *admin* client's auth state. Fixed by separating clients. Lesson: SDKs with internal state need careful instance management.)

---

## 16. Cross-Cutting Interview Questions

**Q: Walk me through what happens when a donor creates a donation with a photo.**
> *(This tests if you understand your own system end-to-end. Practice saying this out loud.)*
> 1. Donor fills the form, picks a photo. On submit, the frontend asks Express for a presigned upload URL (JWT verified, MIME type validated).
> 2. Browser PUTs the file directly to Cloudflare R2 — bytes never touch our server.
> 3. Frontend POSTs the donation with the photo's public URL. Express validates with Zod, the service checks expiry is in the future and computes fallback urgency, the repository inserts the row with a PostGIS point built from lat/lng.
> 4. The service invalidates all geo caches (`SCAN` + delete `donations:geo:*`) and enqueues an AI enrichment job, then returns 201 — total ~200ms.
> 5. Postgres's WAL change flows through Supabase Realtime → every subscribed map/browse page gets the row over WebSocket → a pin drops live, filtered client-side by each user's search radius.
> 6. Seconds later the BullMQ worker calls Gemini, validates the JSON, updates the row → another Realtime UPDATE event → the pin's urgency color and AI summary refresh in place. If Gemini fails 3 times, fallback values stand.

**Q: What would you change for 100× scale?**
> In order of necessity: (1) move BullMQ workers to separate processes so API and job load scale independently; (2) wrap the claim-confirmation cascade in a DB transaction; (3) viewport-based map loading + marker clustering; (4) geohash-bucketed realtime channels instead of one global feed; (5) read replicas for geo queries; (6) make the rate limiter fail open and add per-account limits. The 4-layer architecture means most of these are localized changes.

**Q: What are you most proud of / what would you do differently?**
> Proud of: the async enrichment pipeline — queue, retries, fallback, live updates — because it handles failure gracefully at every step. Differently: I'd set up integration tests and a staging environment *before* deploying, not after. Both deployment war stories would have been caught by one smoke test hitting the deployed stack.

**Q: Why these technologies? Weren't simpler options available?**
> Honest framing that interviewers respect: this is a learning-driven project — I chose production patterns (queues, caching, presigned uploads, realtime) deliberately to learn them on a system I fully control. Each one solves a real problem in the app, but yes — a CRUD app with polling would "work". The point was to build the version that survives real traffic, and to understand the trade-offs first-hand.

---

## Quick-Reference: Where Everything Lives

| Feature | Backend | Frontend |
|---|---|---|
| Auth | `routes/auth.routes.ts`, `middleware/auth.middleware.ts` | `app/auth/*`, `lib/api.ts` (token mgmt) |
| Donations + geo | `services/donation.service.ts`, `migrations/...geo_function.sql` | `app/map/page.tsx`, `app/donor/page.tsx` |
| Caching | `lib/cache.ts`, `lib/redis.ts` | — |
| AI enrichment | `jobs/queue.ts`, `lib/gemini.ts` | (results shown in popups/cards) |
| Expiry cron | `jobs/expiry-check.job.ts` | — |
| Claims/volunteer | `services/claim.service.ts`, `services/volunteer.service.ts` | `app/recipient/page.tsx`, `app/volunteer/page.tsx` |
| Rate limiting | `middleware/rate-limit.middleware.ts` | — |
| Photo uploads | `lib/r2.ts`, `controllers/upload.controller.ts` | `app/donor/page.tsx`, `lib/api.ts` (uploadsApi) |
| Realtime feed | `migrations/...enable_realtime.sql` | `lib/useRealtimeDonations.ts`, map + recipient pages |
| Map | — | `app/map/map-component.tsx` |
| Docker | `backend/Dockerfile` | `Dockerfile`, `docker-compose.yml` |
| Tests | `src/__tests__/unit/*` | — |
