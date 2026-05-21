# GuardianDash backend — Node.js + Express + SQLite
# Multi-stage build keeps the image small (~120MB).

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN apk add --no-cache python3 make g++ \
 && npm ci --omit=dev \
 && apk del python3 make g++

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json server.js db.js auth.js ./
# SQLite DB lives in the working dir. On Render's free tier this is
# ephemeral storage — data persists between requests but is reset on a
# container restart (i.e. on each deploy). Upgrade to a paid plan and
# mount a disk if you need persistence across deploys.
EXPOSE 4000
CMD ["node", "server.js"]
