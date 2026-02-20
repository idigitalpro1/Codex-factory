# Source Of Truth

## Project
Next-Gen Digital Factory monorepo for:
- empire-courier.com
- VillagerMediaGroup.com

## Production
- **Domain:** `https://5280.menu`
- **Server:** AWS Lightsail `44.236.197.183` (instance: `mmtkplesk`)
- **Platform:** Plesk (Apache on port 443, system nginx INACTIVE, SSL via Let's Encrypt)

### Routing
```
HTTPS (443) → Plesk/Apache → reverse proxy:
  /api/*  → Docker backend  (127.0.0.1:8080)
  /*      → Docker frontend (127.0.0.1:8090)

HTTP (80) → 301 redirect to HTTPS
```

### Ports (Lightsail Firewall)
| Port | Status | Purpose |
|------|--------|---------|
| 443  | Open   | HTTPS (production traffic) |
| 80   | Open   | HTTP redirect to HTTPS |
| 8080 | Closed | Backend (internal only) |
| 8090 | Closed | Frontend (internal only) |

### Production Endpoints
- Health: `https://5280.menu/api/v1/health`
- Brands: `https://5280.menu/api/v1/brands`
- Feed: `https://5280.menu/api/v1/feed/articles`
- Admin: `https://5280.menu/api/v1/admin/articles`
- Frontend: `https://5280.menu`

### Stack
- **Backend:** Flask + SQLAlchemy + SQLite (`backend/data/app.db`)
- **Frontend:** Static HTML/JS/CSS served by nginx (Alpine)
- **Containers:** Docker Compose at `~/apps/codex-factory` on server
- **SSL:** Managed by Plesk (Let's Encrypt)
- **Proxy config:** `/var/www/vhosts/system/5280.menu/conf/vhost_ssl.conf`

### Admin Auth (Apache Basic Auth)
`/api/v1/admin/*` is protected by HTTP Basic Auth at the Apache layer.
- **htpasswd file:** `/etc/apache2/.htpasswd_codex_admin` (owner: `root:www-data` 640)
- **Username:** `codexadmin`
- **Password:** `_g7tUQwtZg1FZstcpddRie8O`
- Hash format: apr1 (`$apr1$...`)
- To call admin API: `curl -u codexadmin:_g7tUQwtZg1FZstcpddRie8O https://5280.menu/api/v1/admin/articles`

> **NOTE:** htpasswd must live in `/etc/apache2/` (not `conf/`). The Plesk `conf/` dir has inaccessible parent paths at Apache worker runtime despite correct Unix perms.

### Deploy (on server)
```bash
cd ~/apps/codex-factory
git pull --ff-only
docker compose build --no-cache
docker compose up -d
docker compose ps
curl -sS http://127.0.0.1:8080/api/v1/health
```

## Canonical Local Runtime
- Backend API: `http://localhost:8080`
- Backend Health: `http://localhost:8080/api/v1/health`
- Backend Brands: `http://localhost:8080/api/v1/brands`
- Backend Brand Detail: `http://localhost:8080/api/v1/brands/<slug>`
- Backend Feed: `http://localhost:8080/api/v1/feed/articles`
- Backend Admin: `http://localhost:8080/api/v1/admin/articles`
- Backend Mock AI: `http://localhost:8080/api/v1/ai/mock`
- Frontend Beta: `http://localhost:8090`

## Brand Registry
Brands are defined in `backend/app/services/brand_registry.py`.
Each brand has: slug, name, site_domain, tagline, primary_color, logo_text, enabled.

```bash
# List all brands with metadata + counts
curl -sS http://localhost:8080/api/v1/brands

# Get single brand config
curl -sS http://localhost:8080/api/v1/brands/empire-courier
```

## Canonical Commands
From repo root (`/Users/Ace/Codex`):
```bash
make down || true
make up
make status
make health
```

## Process/Listener Rules
- PID files:
  - `.run/backend.pid`
  - `.run/frontend.pid`
- PID values must represent real listeners on configured ports.
- Listener checks use `lsof -tiTCP:<port> -sTCP:LISTEN`.
- Port ownership conflicts should fail fast instead of silently reusing unknown processes.

## Security Rules
- No secrets in repository.
- No hardcoded credentials.
- Use environment variables and cloud identity/OIDC for deployment.

## Version Timeline
```
v1-local-stable       — Native stack freeze
v2-ci-aligned         — Docker + CI gates
v3-product-slice      — Public feed + admin write path
v4-sqlite-persistence — SQLite persistence
v5-admin-ui           — Frontend admin panel
v6-brand-identity     — Brand registry + metadata + themed UI
Production Live       — 5280.menu SSL reverse proxy (Lightsail/Plesk)
```
