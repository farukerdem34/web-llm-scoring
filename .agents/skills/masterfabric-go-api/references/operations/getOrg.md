# GET /api/v1/organizations/{orgId}

**Resource:** [Organizations](../resources/Organizations.md)
**Get an organization by ID**
**Operation ID:** `getOrg`

## Responses

| Status | Description |
|--------|-------------|
| 200 | Organization details |
| 401 | (reference) |
| 403 | (reference) |
| 404 | (reference) |

**Success Response Schema:**

[OrgInfo](../schemas/Org/OrgInfo.md)

## Security

- **bearerAuth**
