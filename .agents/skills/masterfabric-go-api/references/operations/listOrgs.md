# GET /api/v1/organizations

**Resource:** [Organizations](../resources/Organizations.md)
**List organizations**
**Operation ID:** `listOrgs`

## Responses

| Status | Description |
|--------|-------------|
| 200 | Organization list |
| 401 | (reference) |
| 403 | (reference) |

**Success Response Schema:**

Array of [OrgInfo](../schemas/Org/OrgInfo.md)

## Security

- **bearerAuth**
