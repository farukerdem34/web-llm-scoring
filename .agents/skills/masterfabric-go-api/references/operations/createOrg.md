# POST /api/v1/organizations

**Resource:** [Organizations](../resources/Organizations.md)
**Create an organization**
**Operation ID:** `createOrg`

## Request Body

**Required:** Yes

**Content Types:** `application/json`

**Schema:** [CreateOrgRequest](../schemas/Create/CreateOrgRequest.md)

## Responses

| Status | Description |
|--------|-------------|
| 201 | Organization created |
| 400 | (reference) |
| 401 | (reference) |
| 403 | (reference) |

**Success Response Schema:**

[OrgInfo](../schemas/Org/OrgInfo.md)

## Security

- **bearerAuth**
