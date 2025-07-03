# ---------- STAGE 1: Build ----------
FROM node:22.17.0-alpine AS builder

WORKDIR /app

COPY apps/backend/package*.json ./
RUN npm install

COPY apps/backend .
RUN npm run build

# ---------- STAGE 2: Run ----------
FROM node:22.17.0-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN npm install --only=production

CMD ["node", "dist/main"]