FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json tsconfig.json ./

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy source files
COPY common ./common
COPY operations ./operations
COPY tools ./tools
COPY transport ./transport
COPY index.ts ./

# Build TypeScript to dist/
RUN npm run build

# -----------------------------------------------------------
FROM node:22-alpine AS release

ENV NODE_ENV=production \
    MCP_TRANSPORT=sse \
    PORT=3000 \
    HOST=0.0.0.0

WORKDIR /app

# Copy package manifests and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled artifacts from builder
COPY --from=builder /app/dist ./dist

# Create directory for attachments with node user permissions
RUN mkdir -p /app/attachments && chown -R node:node /app

VOLUME ["/app/attachments"]

EXPOSE 3000

USER node

ENTRYPOINT ["node", "dist/index.js"]