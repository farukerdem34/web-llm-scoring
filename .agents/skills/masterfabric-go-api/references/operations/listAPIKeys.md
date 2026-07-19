# GET /api/v1/organizations/{orgId}/apps/{appId}/keys

**Resource:** [API Keys](../resources/API-Keys.md)
**List API keys for an app**
**Operation ID:** `listAPIKeys`

## Responses

| Status | Description |
|--------|-------------|
| 200 | API key list |
| 401 | (reference) |
| 403 | (reference) |

**Success Response Schema:**

Array of [APIKeyResponse](../schemas/APIKeyResponse/APIKeyResponse.md)

## Security

- **bearerAuth**
