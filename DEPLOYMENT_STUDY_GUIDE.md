# Deployment & CI/CD Error Study Guide

This document walks through every error we hit during containerization, CI setup, and deployment — with the exact logs, what they mean, and how we fixed them.

---

## Error 1: WebSocket Missing in CI Tests

### The Log
```
FAIL src/__tests__/unit/claim.service.test.ts
  ● Test suite failed to run

    Node.js 20 detected without native WebSocket support.

    Suggested solution: For Node.js < 22, install "ws" package and provide it via the transport option:
    import ws from "ws"
    new RealtimeClient(url, { transport: ws })

    > 17 | export const supabaseAdmin = createClient(
         |                                          ^
```

### What Happened
- GitHub Actions CI ran our Jest tests using Node.js 20
- When tests import services → repositories → `supabase.ts`, the Supabase SDK initializes a `RealtimeClient`
- `RealtimeClient` needs a WebSocket implementation
- Node.js 20 does NOT have native WebSocket (it was added in Node 22)
- So the SDK threw an error before any test code could even run

### Why It Worked Locally
Your local machine has Node 22 installed, which has native WebSocket built-in.

### How We Read the Log
1. `Test suite failed to run` — tests didn't fail, they couldn't even START
2. `Node.js 20 detected without native WebSocket support` — tells us the exact version mismatch
3. The stack trace shows: `supabase.ts:17` → `createClient()` → `RealtimeClient` → crash
4. Import chain: `test file → service → repository → supabase.ts` — the crash happens at the bottom of the import chain

### The Fix
Upgraded CI from Node 20 to Node 22 in `.github/workflows/ci.yml`:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 22   # was 20
```

---

## Error 2: Merge Conflict Markers in JSON

### The Log
```
Module not found: SyntaxError: D:\learning\grain_chain_final\package.json 
(directory description file): SyntaxError: Expected double-quoted property 
name in JSON at position 1440 (line 41 column 1)
```

### What the File Looked Like
```json
    "@radix-ui/react-tooltip": "1.1.6",
<<<<<<< HEAD
    "@react-google-maps/api": "^2.20.6",
    "@supabase/supabase-js": "^2.39.7",
=======
    "@supabase/ssr": "^0.6.1",
    "@supabase/supabase-js": "^2.51.0",
>>>>>>> 2378217a1e7df370738ad941e8b3afad32c4b971
```

### What Happened
- We had an in-progress `git merge` that was never resolved
- Git inserted conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) into the files
- These markers are NOT valid JSON — the JSON parser chokes on them
- Next.js reads `package.json` at build time and crashes

### How We Read the Log
1. `SyntaxError` — it's a parsing error, not a logic error
2. `Expected double-quoted property name` — JSON found something that isn't a valid key
3. `at position 1440 (line 41 column 1)` — tells us exactly where to look
4. Line 41 was `<<<<<<< HEAD` — immediately obvious it's a merge conflict

### The Fix
1. Ran `git merge --abort` to cancel the stuck merge
2. Manually rewrote `package.json` and `.gitignore` without conflict markers
3. Did a clean `npm install` to regenerate `package-lock.json`

### Lesson
**Always check `git status`** before editing files. If it says "You have unmerged paths", resolve conflicts first. Conflict markers in any non-text file (JSON, YAML, etc.) will cause parse failures.

---

## Error 3: Docker COPY File Not Found

### The Log
```
#11 ERROR: failed to calculate checksum of ref: "/tailwind.config.ts": not found
------
 > [builder  5/11] COPY next.config.mjs tsconfig.json tailwind.config.ts postcss.config.mjs ./:
------
ERROR: failed to build: failed to solve: failed to compute cache key
```

### What Happened
- The Dockerfile had `COPY tailwind.config.ts ./`
- But the actual file on disk was `tailwind.config.js` (JavaScript, not TypeScript)
- Docker cannot COPY a file that doesn't exist — build fails

### How We Read the Log
1. `failed to calculate checksum of ref: "/tailwind.config.ts": not found` — Docker is looking for this file and can't find it
2. The line number `[builder 5/11]` tells us which Dockerfile step failed
3. The full COPY command is shown — easy to spot which file is wrong

### The Fix
Changed the Dockerfile:
```dockerfile
COPY next.config.mjs tsconfig.json tailwind.config.js postcss.config.mjs ./
#                                              ^^^ .js not .ts
```

### Lesson
**Docker COPY is literal** — it doesn't glob or guess. If you rename a file, you must update every Dockerfile that references it. Use `ls` to verify file names before writing COPY commands.

---

## Error 4: Railway Security Scan Blocking Deploy

### The Log
```
SECURITY VULNERABILITIES DETECTED

Railway cannot proceed with deployment due to security vulnerabilities.

Found 1 vulnerable package(s):
  next@15.2.4
      Severity: CRITICAL
      - CVE-2025-66478 (CRITICAL)
      - CVE-2025-55184 (HIGH)
```

### What Happened
- Railway scans your entire repository for known CVEs before deploying
- Our root `package.json` had `next@15.2.4` which has critical security vulnerabilities
- Railway refused to deploy even though we set root directory to `backend/`
- Railway's scanner is repo-wide, not scoped to the root directory setting

### How We Read the Log
1. `SECURITY VULNERABILITIES DETECTED` — clear blocker
2. `next@15.2.4` and `Severity: CRITICAL` — tells us exactly which package
3. `Upgrade to 15.2.8` — tells us the minimum safe version

### The Fix
Upgraded Next.js: `npm install next@15` → installed 15.5.19 (latest patch).

### Lesson
**Keep dependencies updated**, especially frameworks like Next.js that are frequently targeted. Railway and similar platforms enforce security gates that block deploys for critical CVEs.

---

## Error 5: WebSocket Crash on Railway (Runtime)

### The Log
```
/app/node_modules/@supabase/realtime-js/dist/main/lib/websocket-factory.js:103
        throw new Error(errorMessage);
        ^
Error: Node.js 20 detected without native WebSocket support.

    at Object.<anonymous> (/app/dist/lib/supabase.js:18:56)
Node.js v20.20.2
```

### What Happened
- Same root cause as Error 1, but now at RUNTIME in production
- Our `backend/Dockerfile` uses `FROM node:20-alpine`
- The compiled app runs on Node 20 inside the Docker container
- Supabase SDK crashes on startup when it tries to create the RealtimeClient

### Why CI Passed But Deploy Failed
CI uses Node 22 (we fixed that). But the Docker image still uses Node 20. Different environments, same bug.

### The Fix
Installed the `ws` package and told Supabase to use it:

```typescript
// backend/src/lib/supabase.ts
import ws from 'ws'

export const supabaseAdmin = createClient(url, key, {
  realtime: {
    transport: ws as any,  // provide WebSocket implementation for Node 20
  },
})
```

### Why `as any`?
TypeScript's type for `transport` expects the browser's `WebSocket` interface. The `ws` package's type signature is slightly different (it accepts more argument types). At runtime they're compatible, but TypeScript complains. `as any` silences the type checker for this known-safe cast.

### Alternative Fix
Could have changed the Dockerfile to `FROM node:22-alpine` instead. We chose to keep Node 20 and add `ws` because:
- Node 20 is LTS (Long Term Support) — more stable for production
- Node 22 just became LTS recently, some packages might not fully support it yet

### Lesson
**Your Docker base image defines your runtime environment** — it's separate from your local machine and CI. All three can have different Node versions. Test with the same version you deploy with.

---

## Error 6: Zod Validation — Invalid FRONTEND_URL

### The Log
```
ZodError: [
  {
    "validation": "url",
    "code": "invalid_string",
    "message": "Invalid url",
    "path": ["FRONTEND_URL"]
  }
]
    at ZodObject.parse (/app/dist/types/env.schema.js:30:25)
```

### What Happened
- Our `env.schema.ts` validates every environment variable at startup using Zod
- `FRONTEND_URL` is defined as `z.string().url()` — it must be a valid URL
- In Railway's Variables, it was either:
  - Empty/missing
  - Set to something like `example.com` (missing `https://`)
  - Set to `https://example` (not a valid URL format)

### How We Read the Log
1. `ZodError` — environment validation failed
2. `"path": ["FRONTEND_URL"]` — which specific variable failed
3. `"validation": "url"` — it's not a valid URL format
4. `env.schema.js:30` — the parse() call that validates on startup

### The Fix
Set `FRONTEND_URL` in Railway's Variables to a full, valid URL:
```
https://grainchain-final.vercel.app
```

### Why This Pattern Is Good
Zod validation at startup is a **fail-fast** pattern. Instead of the app starting and then crashing 2 hours later when it first tries to use `FRONTEND_URL` in a CORS check, it crashes IMMEDIATELY with a clear message telling you exactly what's wrong. This saves hours of debugging in production.

### Lesson
When Zod says `invalid_string` with `validation: "url"`:
- Must start with `http://` or `https://`
- Must be a syntactically valid URL
- Cannot be empty
- Cannot have spaces

---

## Error 7: TypeScript Type Mismatch with `ws`

### The Log (during local type-check)
```
src/lib/supabase.ts(27,7): error TS2322: Type 'typeof WebSocket' is not 
assignable to type 'WebSocketLikeConstructor'.
  Types of parameters 'address' and 'address' are incompatible.
    Type 'string | URL' is not assignable to type 'null'.
```

### What Happened
- We imported `ws` and passed it as `transport: ws`
- TypeScript sees that `ws.WebSocket` constructor accepts `(address: string | URL, ...)`
- But Supabase's `WebSocketLikeConstructor` type expects a different signature
- TypeScript refuses to compile because the types don't exactly match

### How We Read the Log
1. `TS2322: Type ... is not assignable to type` — classic TypeScript assignability error
2. `'address' and 'address' are incompatible` — the constructor parameter types differ
3. This is a type-level issue only — at runtime, `ws` works perfectly fine with Supabase

### The Fix
```typescript
transport: ws as any,  // known-safe at runtime, types just don't align perfectly
```

### When Is `as any` Acceptable?
- When you KNOW it works at runtime (ws is explicitly recommended by Supabase)
- When the type mismatch is due to library type definitions being too strict
- When the alternative (writing a wrapper type) adds complexity for no benefit
- **NOT acceptable** when you're silencing a real bug

---

## Summary: How to Read Error Logs

| Pattern in Log | What It Means |
|----------------|---------------|
| `Module not found` | Import path is wrong or file doesn't exist |
| `SyntaxError: Expected...` | File has invalid syntax (conflict markers, typos) |
| `throw new Error(...)` + stack trace | Runtime crash — read the message first, then trace the file path |
| `ZodError` with path | Environment variable validation failed — check the named var |
| `TS2322: Type ... not assignable` | TypeScript type mismatch — may or may not be a real bug |
| `failed to calculate checksum` | Docker can't find a file you're trying to COPY |
| `SECURITY VULNERABILITIES` | Platform blocking deploy due to known CVEs |
| Stack trace bottom → top | Bottom is where crash happened, top is what called it |

### General Debugging Approach
1. **Read the error message first** (not the stack trace)
2. **Find the file and line number** in the stack trace
3. **Ask: did this work before?** If yes, what changed?
4. **Check the environment** — local vs CI vs Docker vs production can all differ
5. **Google the exact error message** if unfamiliar
