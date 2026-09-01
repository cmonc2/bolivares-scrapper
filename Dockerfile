FROM node:22-alpine

WORKDIR /app

RUN corepack enable

# Ensure working directory belongs to node user
RUN chown -R node:node /app

# Switch to non-privileged node user
USER node

# Copy manifests and pnpm 11 settings for layer caching
COPY --chown=node:node package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install

COPY --chown=node:node . .

# Keep container alive and idle with 0% CPU for developer interaction
CMD ["sleep", "infinity"]
