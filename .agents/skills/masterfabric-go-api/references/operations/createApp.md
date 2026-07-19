# POST /api/v1/organizations/{orgId}/apps

**Resource:** [Apps](../resources/Apps.md)
**Create an app within an organization**
**Operation ID:** `createApp`

## Request Body

**Required:** Yes

**Content Types:** `application/json`

**Schema:** [CreateAppRequest](../schemas/Create/CreateAppRequest.md)

## Responses

| Status | Description |
|--------|-------------|
| 201 | App created |
| 400 | (reference) |
| 401 | (reference) |
| 403 | (reference) |

**Success Response Schema:**

[AppInfo](../schemas/App/AppInfo.md)

## Security

- **bearerAuth**
