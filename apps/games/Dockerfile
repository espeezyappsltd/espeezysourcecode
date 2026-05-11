# ──────────────────────────────────────────────────────────────────────────────
# espeezy-games — Dev Container
# Next.js · Node 24 Alpine · Hot Reload via volume mount · port 3002
# ──────────────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS dev

RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --prefer-offline

# Copy .env.local if it exists (for build-time env vars)
COPY .env.local* ./

EXPOSE 3002

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=development
ENV WATCHPACK_POLLING=true
ENV CHOKIDAR_USEPOLLING=true

CMD ["npm", "run", "dev"]
