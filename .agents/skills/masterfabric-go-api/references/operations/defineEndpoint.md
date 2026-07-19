# POST /api/v1/organizations/{orgId}/apps/{appId}/endpoints

**Resource:** [Endpoints](../resources/Endpoints.md)
**Define a new API endpoint**
**Operation ID:** `defineEndpoint`

## Request Body

**Required:** Yes

**Content Types:** `application/json`

**Schema:** [DefineEndpointRequest](../schemas/Define/DefineEndpointRequest.md)

## Responses

| Status | Description |
|--------|-------------|
| 201 | Endpoint defined |
| 400 | (reference) |
| 401 | (reference) |
| 403 | (reference) |

**Success Response Schema:**

[EndpointInfo](../schemas/Endpoint/EndpointInfo.md)

## Security

- **bearerAuth**
