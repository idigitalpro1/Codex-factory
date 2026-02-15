# Deploy Next-Gen Stack to Azure

## Scope
Deploy Flask API and static beta frontend for:
- empire-courier.com
- VillagerMediaGroup.com

## Architecture
- API: Azure Container Apps (Flask container)
- Frontend: Azure Static Web Apps or Blob Storage static website
- CI/CD: GitHub Actions with OpenID Connect (federated credentials)

## Prerequisites
- Azure subscription and resource group
- `az` CLI authenticated
- Azure Container Registry (ACR)
- Federated identity credential from GitHub to Azure AD app/service principal

## Deploy API (Container Apps)
1. Build and tag backend container.
2. Push image to ACR.
3. Deploy or update Container App revision.
4. Configure application settings through Azure environment variables.
5. Validate:
   - `GET /api/v1/health`

## Deploy Frontend
1. Publish `frontend/beta/` to Static Web Apps or Blob static site.
2. Set API base URL per environment.
3. Enable HTTPS and custom domains.

## Post-Deploy Checks
- API endpoints are reachable
- Frontend loads and can call `/health`, `/feed/articles`, `/ai/mock`
- Repository remains secret-free and key-free
