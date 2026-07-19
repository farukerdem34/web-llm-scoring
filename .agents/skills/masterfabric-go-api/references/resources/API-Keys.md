# API Keys

API key lifecycle management

## Operations

| Method | Path | Summary | Details |
|--------|------|---------|----------|
| GET | `/api/v1/organizations/{orgId}/apps/{appId}/keys` | List API keys for an app | [View](../operations/listAPIKeys.md) |
| POST | `/api/v1/organizations/{orgId}/apps/{appId}/keys` | Create an API key for an app | [View](../operations/createAPIKey.md) |
| DELETE | `/api/v1/organizations/{orgId}/apps/{appId}/keys/{keyId}` | Revoke an API key | [View](../operations/revokeAPIKey.md) |
