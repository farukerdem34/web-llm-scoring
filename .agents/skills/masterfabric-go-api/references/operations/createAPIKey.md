# POST /api/v1/organizations/{orgId}/apps/{appId}/keys

**Resource:** [API Keys](../resources/API-Keys.md)
**Create an API key for an app**
**Operation ID:** `createAPIKey`

## Request Body

**Required:** Yes

**Content Types:** `application/json`

**Schema:** [CreateAPIKeyRequest](../schemas/Create/CreateAPIKeyRequest.md)

## Responses

| Status | Description |
|--------|-------------|
| 201 | API key created (raw key returned only once) |
| 400 | (reference) |
| 401 | (reference) |
| 403 | (reference) |

**Success Response Schema:**

[APIKeyResponse](../schemas/APIKeyResponse/APIKeyResponse.md)

## Security

- **bearerAuth**
