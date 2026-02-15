# Deploy Next-Gen Stack to GCP

## Scope
Deploy Flask API and static beta frontend for:
- empire-courier.com
- VillagerMediaGroup.com

## Architecture
- API: Cloud Run (containerized Flask app)
- Frontend: Cloud Storage + Cloud CDN (or Firebase Hosting)
- CI/CD: GitHub Actions with workload identity federation

## Prerequisites
- GCP project created
- `gcloud` CLI authenticated
- Artifact Registry repo created
- Service account with least-privilege deploy roles
- GitHub OIDC configured (no static service account keys)

## Deploy API (Cloud Run)
1. Build container from `backend/`.
2. Push image to Artifact Registry.
3. Deploy with:
   - `--allow-unauthenticated` only if public API is desired
   - environment vars via Cloud Run config, not in source code
4. Verify endpoint:
   - `GET /api/v1/health`

## Deploy Frontend
1. Upload `frontend/beta/` assets to hosting target.
2. Configure cache headers for static assets.
3. Set `API_BASE` to Cloud Run URL via environment-specific config injection.

## Post-Deploy Checks
- Health endpoint returns `status: ok`
- Feed endpoint returns sample list
- Mock AI endpoint responds to POST payload
- No secrets or keys stored in repository
