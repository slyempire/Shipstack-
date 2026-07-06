# Shipstack Production Deployment

This guide takes a fresh server from zero to a running Shipstack stack:
React SPA + Node proxy + Frappe v15 (MariaDB), fronted by nginx, with
nightly database backups.

## Architecture

```
Internet ──► nginx (80/443)
              ├── /            → shipstack-node:3000  (SPA + API proxy)
              ├── /api/*       → shipstack-node:3000  (auth, M-Pesa, eTIMS, ingest)
              └── /socket.io/* → websocket:9000       (Frappe realtime)

shipstack-node ──► backend:8000 (Frappe / bench serve)
backend ──► mariadb, redis-cache, redis-queue, redis-socketio
db-backup ──► nightly mysqldump → ./backups (14-day retention)
```

## Prerequisites

- Docker Engine 24+ and Docker Compose v2 on the host
- A domain with an A record pointing at the server (needed for TLS and the
  M-Pesa callback)
- Safaricom Daraja production credentials (for live payments)
- KRA eTIMS device credentials (for live tax invoices)

## 1. Environment variables

Copy the template and fill it in:

```bash
cp .env.example .env
```

| Variable | Required in prod | Notes |
| --- | --- | --- |
| `DB_ROOT_PASSWORD` | ✅ | MariaDB root password (compose-only, not in .env.example — add it) |
| `SECURITY_SECRET` | ✅ | 32+ chars. Never expose as `VITE_*` |
| `INTERNAL_API_SECRET` | ✅ | Protects internal routes; must differ from `SECURITY_SECRET`. Server refuses to start without it in production |
| `APP_URL` | ✅ | Public origin, e.g. `https://app.example.com` |
| `FRAPPE_BASE_URL` | ✅ (compose sets it) | `http://backend:8000` inside the stack |
| `FRAPPE_SITE` | ✅ | The bench site name created in step 3 |
| `FRAPPE_API_KEY` / `FRAPPE_API_SECRET` | ✅ | API key pair of a Frappe service user (step 3.4) |
| `MPESA_ENV` | ✅ | `production` for live; `sandbox` otherwise |
| `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET` | ✅ for live payments | From the Daraja portal. Without them, production STK Push returns 503 (no simulated fallback in prod) |
| `MPESA_SHORTCODE` / `MPESA_PASSKEY` | ✅ for live payments | Till/Paybill shortcode + Lipa Na M-Pesa passkey |
| `MPESA_CALLBACK_URL` | ✅ for live payments | `https://<domain>/api/mpesa/callback` — must be public HTTPS and registered in the Daraja portal |
| `ETIMS_BASE_URL` / `ETIMS_API_KEY` / `ETIMS_DEVICE_SERIAL` | ✅ for live invoices | KRA eTIMS OSCU/VSCU endpoint + credentials |
| `SENTRY_DSN` | optional | Enables server error monitoring; empty disables it |
| `VITE_SENTRY_DSN` | optional | Browser error monitoring (separate Sentry project). Baked in at build time — set before `npm run build` |
| `BACKUP_S3_*` | recommended | Offsite backup sync to any S3-compatible bucket (see §6) |
| `SENTRY_TRACES_SAMPLE_RATE` | optional | Default `0.1` |
| `GEMINI_API_KEY` | optional | AI features. Server-side only — never `VITE_*` |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | optional | Hot-cache; the server degrades gracefully without it |

Generate secrets:

```bash
openssl rand -hex 32   # run twice: SECURITY_SECRET, INTERNAL_API_SECRET
```

## 2. Build images

```bash
docker build -f Dockerfile.node -t shipstack-node:latest .
docker build -f Dockerfile      -t shipstack-frappe:latest .
```

(CI builds both on every push to `main` as a regression gate; it does not
push them to a registry.)

## 3. First-run: create the Frappe site

Start the data services first:

```bash
docker compose -f docker-compose.production.yml up -d mariadb redis-cache redis-queue redis-socketio
```

### 3.1 Create the site and install the app

```bash
docker compose -f docker-compose.production.yml run --rm backend \
  bench new-site "$FRAPPE_SITE" \
    --db-root-password "$DB_ROOT_PASSWORD" \
    --admin-password '<choose-an-admin-password>' \
    --no-mariadb-socket

docker compose -f docker-compose.production.yml run --rm backend \
  bench --site "$FRAPPE_SITE" install-app shipstack
```

`install-app` runs `shipstack.install.after_install`, which seeds the 10
canonical roles (Shipstack Super Admin, Tenant Admin, Dispatcher, Driver,
Finance Manager, Facility Operator, Client, Fleet Manager, Recruiter,
Analyst).

### 3.2 Run migrations (also after every future deploy)

```bash
docker compose -f docker-compose.production.yml run --rm backend \
  bench --site "$FRAPPE_SITE" migrate
```

This creates/updates all Shipstack doctypes and applies patches, including
`shipstack.patches.add_performance_indexes` (composite indexes on Delivery
Note, Trip, Telemetry Point, Order, Task, Payment).

If the site existed **before** the app's role seeding was added, seed once
manually:

```bash
docker compose -f docker-compose.production.yml run --rm backend \
  bench --site "$FRAPPE_SITE" execute shipstack.install.after_install
```

### 3.3 Outbound email (password resets)

Password reset emails require SMTP. In Frappe Desk (`https://<domain>/app`
as Administrator): **Settings → Email Account** — add an outgoing account
and mark it default.

### 3.4 Service-user API key for the Node proxy

In Frappe Desk, open the **Administrator** (or a dedicated service user)
→ **API Access** → *Generate Keys*. Put the pair in `.env` as
`FRAPPE_API_KEY` / `FRAPPE_API_SECRET`.

## 4. Start the full stack

```bash
docker compose -f docker-compose.production.yml up -d
docker compose -f docker-compose.production.yml ps
curl -fsS http://localhost/api/health
```

## 5. TLS (HTTPS)

`nginx.conf` serves plain HTTP — fine behind an external load balancer that
terminates TLS. For direct exposure, use the bundled `nginx.ssl.conf`:

1. Obtain certificates (certbot webroot flow works with the ACME location
   already present in both configs):
   ```bash
   docker run --rm -v /etc/letsencrypt:/etc/letsencrypt -v certbot-www:/var/www/certbot \
     certbot/certbot certonly --webroot -w /var/www/certbot -d <your-domain>
   ```
2. Edit `nginx.ssl.conf` and replace every `<your-domain>` placeholder.
3. In `docker-compose.production.yml`, swap the nginx volume to
   `nginx.ssl.conf` and mount the cert paths (the commented lines under
   `nginx-proxy.volumes` show exactly what to mount).
4. `docker compose -f docker-compose.production.yml up -d nginx-proxy`

`nginx.ssl.conf` adds HSTS and per-route rate limits (auth 10 r/m,
API 60 r/m, telemetry 150 r/m) on top of the Node proxy's own limiter.

## 6. Backups and restore

The `db-backup` service dumps all databases nightly to `./backups/`
(`shipstack-YYYY-MM-DD.sql.gz`) and deletes dumps older than 14 days.

**Offsite copy (strongly recommended):** the `backup-sync` service syncs
`./backups/` to any S3-compatible bucket every 6 hours. Set the
`BACKUP_S3_*` variables in `.env` (bucket, access key, secret, endpoint —
works with AWS S3, Cloudflare R2, Backblaze B2, or MinIO). Until
`BACKUP_S3_BUCKET` is set, the service idles harmlessly. On-host backups
do not survive a dead disk — do not skip this.

**Rehearse the restore once** before launch: pull a dump from the bucket
onto a scratch machine, restore it, and confirm the app boots against it.
An untested backup is a hope, not a backup.

**Restore:**

```bash
gunzip < backups/shipstack-YYYY-MM-DD.sql.gz | \
  docker compose -f docker-compose.production.yml exec -T mariadb \
  mysql -u root -p"$DB_ROOT_PASSWORD"
docker compose -f docker-compose.production.yml run --rm backend \
  bench --site "$FRAPPE_SITE" migrate
```

Also back up the `sites-data` volume (site config, uploaded files):

```bash
docker run --rm -v shipstack_sites-data:/data -v "$PWD/backups":/out alpine \
  tar czf /out/sites-data-$(date +%F).tar.gz -C /data .
```

Copy `./backups/` off-host (object storage, rsync target) — on-host backups
don't survive a dead disk.

## 7. Deploying updates

```bash
git pull
docker build -f Dockerfile.node -t shipstack-node:latest .
docker build -f Dockerfile      -t shipstack-frappe:latest .
docker compose -f docker-compose.production.yml up -d
docker compose -f docker-compose.production.yml run --rm backend \
  bench --site "$FRAPPE_SITE" migrate        # after ANY doctype/patch change
```

## 8. Post-deploy checklist

- [ ] `curl https://<domain>/api/health` returns 200
- [ ] Log in at `https://<domain>/#/login` with a real Frappe user
- [ ] Frappe Desk reachable at `https://<domain>/app`
- [ ] Realtime: open the dispatch queue, confirm the socket.io connection
      in devtools (`wss://<domain>/socket.io/...`)
- [ ] STK Push sandbox test succeeds and the callback updates the payment
      (Daraja portal must point at `MPESA_CALLBACK_URL`)
- [ ] A dated dump appears in `./backups/` after the first night
- [ ] The same dump appears in the offsite bucket (`docker compose logs backup-sync`)
- [ ] Sentry receives a test event (`SENTRY_DSN` set): trigger any 500 and
      check the project inbox
- [ ] Uptime monitor armed: set the `PRODUCTION_URL` repository variable on
      GitHub so `.github/workflows/uptime.yml` pings `/api/health` every
      15 minutes (or configure a dedicated monitor like UptimeRobot)

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Server exits at boot complaining about env | `INTERNAL_API_SECRET` missing or `SECURITY_SECRET` < 32 chars in production |
| Login works but API calls 401 | `FRAPPE_API_KEY/SECRET` invalid, or the token cache is serving a stale entry (restart shipstack-node) |
| STK Push returns 503 in production | M-Pesa credentials missing — production never simulates payments |
| Payment stuck "awaiting confirmation" | Daraja can't reach `MPESA_CALLBACK_URL` (not public HTTPS, or not registered in the portal) |
| Frontend loads but realtime silent | `websocket` service down, or nginx not proxying `/socket.io/` |
| `bench migrate` fails on a fresh clone | Images stale — rebuild `shipstack-frappe:latest` before migrating |
