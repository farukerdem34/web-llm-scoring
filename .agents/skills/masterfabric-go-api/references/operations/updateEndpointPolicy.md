# PUT /api/v1/organizations/{orgId}/apps/{appId}/endpoints/{endpointId}/policy

**Resource:** [Endpoints](../resources/Endpoints.md)
**Update endpoint policy**
**Operation ID:** `updateEndpointPolicy`

## Request Body

**Required:** Yes

**Content Types:** `application/json`

**Schema:** [UpdatePolicyRequest](../schemas/Update/UpdatePolicyRequest.md)

## Responses

| Status | Description |
|--------|-------------|
| 200 | Policy updated |
| 400 | (reference) |
| 401 | (reference) |
| 403 | (reference) |

**Success Response Schema:**

[PolicyInfo](../schemas/Policy/PolicyInfo.md)

## Security

- **bearerAuth**
