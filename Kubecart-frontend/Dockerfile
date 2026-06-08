# ── Stage 1: Build the React app ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN CI=false npm run build

# ── Stage 2: Serve via nginx ───────────────────────────────────────────────────
FROM nginx:1.25-alpine AS production

# Create a non-root user/group for nginx to run as
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy the React build output
COPY --from=builder /app/build /usr/share/nginx/html

# Copy our custom nginx reverse-proxy config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove the default nginx.conf pid directive pointing to /var/run/nginx.pid
# and redirect it to /tmp/nginx.pid so non-root can write it
RUN sed -i 's|/var/run/nginx.pid|/tmp/nginx.pid|g' /etc/nginx/nginx.conf

# Give the non-root user ownership of all nginx runtime directories
RUN chown -R appuser:appgroup \
        /usr/share/nginx/html \
        /var/cache/nginx \
        /var/log/nginx \
        /etc/nginx/conf.d && \
    touch /tmp/nginx.pid && \
    chown appuser:appgroup /tmp/nginx.pid

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
