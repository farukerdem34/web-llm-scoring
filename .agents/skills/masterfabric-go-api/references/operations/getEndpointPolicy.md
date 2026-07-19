# GET /api/v1/organizations/{orgId}/apps/{appId}/endpoints/{endpointId}/policy

**Resource:** [Endpoints](../resources/Endpoints.md)
**Get endpoint policy**
**Operation ID:** `getEndpointPolicy`

## Responses

| Status | Description |
|--------|-------------|
| 200 | Policy details |
| 401 | (reference) |
| 403 | (reference) |
| 404 | (reference) |

**Success Response Schema:**

[PolicyInfo](../schemas/Policy/PolicyInfo.md)

## Security

- **bearerAuth**
