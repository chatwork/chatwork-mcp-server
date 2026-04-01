FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY src ./src
COPY tsconfig.json ./
RUN npm run build

FROM node:22-bookworm-slim AS runner

WORKDIR /app

COPY --from=builder /app/dist ./dist

CMD ["node", "dist/index.js"]
