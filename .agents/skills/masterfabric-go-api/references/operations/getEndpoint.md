# GET /api/v1/organizations/{orgId}/apps/{appId}/endpoints/{endpointId}

**Resource:** [Endpoints](../resources/Endpoints.md)
**Get an endpoint by ID**
**Operation ID:** `getEndpoint`

## Responses

| Status | Description |
|--------|-------------|
| 200 | Endpoint details |
| 401 | (reference) |
| 403 | (reference) |
| 404 | (reference) |

**Success Response Schema:**

[EndpointInfo](../schemas/Endpoint/EndpointInfo.md)

## Security

- **bearerAuth**
