# GET /api/v1/organizations/{orgId}/apps/{appId}/endpoints

**Resource:** [Endpoints](../resources/Endpoints.md)
**List endpoints for an app**
**Operation ID:** `listEndpoints`

## Responses

| Status | Description |
|--------|-------------|
| 200 | Endpoint list |
| 401 | (reference) |
| 403 | (reference) |

**Success Response Schema:**

Array of [EndpointInfo](../schemas/Endpoint/EndpointInfo.md)

## Security

- **bearerAuth**
