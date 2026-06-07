# ============================================================
# STAGE 1: Dependencies
# Separate stage for deps so they're cached independently.
# ============================================================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

# --legacy-peer-deps needed because some shadcn/radix packages
# have peer dependency conflicts with React 19
RUN npm ci --legacy-peer-deps


# ============================================================
# STAGE 2: Builder
# Compiles the Next.js app into standalone output.
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./

# Copy all source files needed for the build
COPY next.config.mjs tsconfig.json tailwind.config.js postcss.config.mjs ./
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY public ./public

# next build with standalone output produces:
#   .next/standalone/  — self-contained server (includes its own node_modules)
#   .next/static/      — CSS, JS bundles (needs to be served separately)
#   public/            — static assets (landing.html, images, etc.)
RUN npm run build


# ============================================================
# STAGE 3: Runner (production)
# Minimal image — only the standalone output + static files.
# No source code, no full node_modules, no build tools.
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# Next.js collects anonymous telemetry — disable in production containers
ENV NEXT_TELEMETRY_DISABLED=1

# Copy the standalone server (includes a minimal node_modules)
COPY --from=builder /app/.next/standalone ./

# Copy static assets that the standalone server doesn't bundle:
#   - .next/static: compiled CSS/JS chunks
#   - public: landing.html, images, favicons
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Don't run as root
USER node

EXPOSE 3000

# The standalone output creates a server.js at the root
# This replaces `next start` — no next CLI needed
CMD ["node", "server.js"]
