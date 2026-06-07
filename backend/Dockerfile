# ============================================================
# STAGE 1: Builder
# Purpose: Install ALL dependencies (including dev) and compile
# TypeScript. This stage is thrown away after we extract /dist.
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (separate layer = cached if unchanged)
# Docker caches each layer. If package.json didn't change,
# `npm ci` is skipped entirely on rebuild — saves minutes.
COPY package.json package-lock.json ./

# npm ci (clean install) is better than npm install for containers:
#   - Deletes existing node_modules first (clean slate)
#   - Installs exact versions from lockfile (reproducible)
#   - Fails if lockfile is out of sync with package.json
RUN npm ci

# Copy source code AFTER npm ci (so code changes don't bust the dep cache)
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript → JavaScript in /app/dist
RUN npm run build


# ============================================================
# STAGE 2: Runner (production)
# Purpose: Minimal image with only compiled JS + production deps.
# No TypeScript, no dev tools, no source code.
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set production mode — Express uses this to:
#   - Disable stack traces in error responses
#   - Enable view caching
#   - Reduce logging verbosity
ENV NODE_ENV=production

# Only install production dependencies (no dev deps like jest, tsx, etc.)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Don't run as root — security best practice.
# If the app is compromised, the attacker has limited permissions.
USER node

# Document the port (doesn't actually expose it — docker-compose does that)
EXPOSE 4000

# Start the compiled JavaScript directly with Node
# (not tsx, not ts-node — those are dev tools)
CMD ["node", "dist/index.js"]
