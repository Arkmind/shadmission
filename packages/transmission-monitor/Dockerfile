FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install runtime dependencies for better-sqlite3
RUN apk add --no-cache libstdc++

COPY --from=builder /app/package.json ./
RUN apk add --no-cache python3 make g++ && \
    npm install --omit=dev && \
    apk del python3 make g++

COPY --from=builder /app/dist ./dist

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Volume for persistent database storage
VOLUME ["/app/data"]

ENV DATA_DIR=/app/data
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/index.js"]
