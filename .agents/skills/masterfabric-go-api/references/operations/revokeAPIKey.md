# DELETE /api/v1/organizations/{orgId}/apps/{appId}/keys/{keyId}

**Resource:** [API Keys](../resources/API-Keys.md)
**Revoke an API key**
**Operation ID:** `revokeAPIKey`

## Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `keyId` | path | string (uuid) | Yes |  |

## Responses

| Status | Description |
|--------|-------------|
| 204 | API key revoked |
| 401 | (reference) |
| 403 | (reference) |
| 404 | (reference) |

## Security

- **bearerAuth**
