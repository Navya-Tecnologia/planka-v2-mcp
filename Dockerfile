FROM node:22.12-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

# Set environment variables to avoid prompts
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true

# Copy the entire project
COPY . /app

WORKDIR /app

# Use --force to skip prompts
RUN pnpm install --force

# Build the project
RUN npm run build

FROM node:22.12-alpine AS release

# Install pnpm
RUN npm install -g pnpm

# Set environment variables to avoid prompts
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-lock.yaml

ENV NODE_ENV=production

WORKDIR /app

# Create directory for attachments
RUN mkdir -p /app/attachments

# Use --force to skip prompts
RUN pnpm install --prod --force --ignore-scripts

# Set ownership to node user
RUN chown -R node:node /app

# Define volume for attachments
VOLUME ["/app/attachments"]

# Run as non-root user
USER node

ENTRYPOINT ["node", "dist/index.js"] 