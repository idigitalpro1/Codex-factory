# Dev Loop & Production Playbook

## Local Development

### Lifecycle Commands
From repo root (`/Users/Ace/Codex`):
```bash
make down || true
make up
make status
make health
```

### Local URLs
- Frontend: `http://localhost:8090`
- Backend: `http://localhost:8080/api/v1`

### Docker Mode (Local)
```bash
docker compose up -d --build
docker compose ps
docker compose down
```

### Validation Checklist
1. `make down || true`
2. `make up`
3. `make status`
4. `make health`

### Triage
- **Port occupied:** `lsof -nP -iTCP:<port> -sTCP:LISTEN` — if unknown owner, fail fast.
- **Frontend can't reach backend:** Check health endpoint, CORS origins, API fallback order.
- **PID drift:** Regenerate PID files from live listeners via `lsof`.

## Production

### Infrastructure
- **Domain:** https://5280.menu
- **Server:** AWS Lightsail `44.236.197.183` (instance: `mmtkplesk`)
- **Platform:** Plesk (Apache-only mode)
- **SSL:** Let's Encrypt via Plesk
- **Repo on server:** `~/apps/codex-factory`

### Routing
```
HTTPS (443) → Plesk/Apache → reverse proxy:
  /api/*  → Docker backend  (127.0.0.1:8080)
  /*      → Docker frontend (127.0.0.1:8090)
```

### Deploy (Manual)
```bash
ssh lightsail
~/deploy.sh
```

`deploy.sh` does: `git pull` → `docker compose build` → `docker compose up -d` → health check.

### Deploy (Auto)
Push to `main` → CI runs (tests + docker build) → SSH deploy via GitHub Actions.

Requires `LIGHTSAIL_SSH_KEY` secret in GitHub repo settings.

### Server Commands
```bash
# Status
ssh lightsail "sg docker -c 'cd ~/apps/codex-factory && docker compose ps'"

# Logs
ssh lightsail "sg docker -c 'cd ~/apps/codex-factory && docker compose logs -f'"

# Restart (no rebuild)
ssh lightsail "sg docker -c 'cd ~/apps/codex-factory && docker compose restart'"

# Full rebuild
ssh lightsail "~/deploy.sh"

# Backup (runs nightly at 3am UTC)
ssh lightsail "~/backup.sh"
```

### Health Checks
```bash
# From anywhere
curl -sS https://5280.menu/api/v1/health
curl -sS https://5280.menu/api/v1/brands

# From server
curl -sS http://127.0.0.1:8080/api/v1/health
curl -sS http://127.0.0.1:8090 | head -5
```

### Firewall (Lightsail)
| Port | Status | Purpose |
|------|--------|---------|
| 443 | Open | HTTPS |
| 80 | Open | HTTP → HTTPS redirect |
| 8080 | Closed | Backend (internal only) |
| 8090 | Closed | Frontend (internal only) |

### Backups
- Script: `~/backup.sh`
- Schedule: Nightly at 3am UTC (cron)
- Location: `~/backups/app_YYYY-MM-DD_HH-MM.db`
- Retention: 14 days

### Scope Discipline
- Keep changes minimal and focused.
- Do not modify DNS, SSL, or firewall without explicit operator approval.
- Do not create new domains in Plesk.
- Avoid unrelated refactoring during stabilization work.
