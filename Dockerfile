# Stage 1: Build the SPA
FROM node:22-alpine AS spa-builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Stage 2: Create Custom Frappe Image
FROM frappe/frappe-worker:v15.22.0

USER root
# Install git for bench get-app compatibility
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Copy the built custom app from Stage 1
COPY --chown=frappe:frappe --from=spa-builder /app/shipstack_frappe /tmp/shipstack

# Initialize a git repo in /tmp/shipstack so bench get-app can fetch it
RUN cd /tmp/shipstack && \
    git init && \
    git config --global user.email "docker@build.local" && \
    git config --global user.name "Docker Build" && \
    git add . && \
    git commit -m "Initial commit"

USER frappe
# Install the custom app into the bench
RUN cd /home/frappe/frappe-bench && \
    bench get-app --resolve-deps /tmp/shipstack && \
    bench build --app shipstack
