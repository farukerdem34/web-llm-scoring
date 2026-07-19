# GET /api/v1/organizations/{orgId}/apps/{appId}

**Resource:** [Apps](../resources/Apps.md)
**Get an app by ID**
**Operation ID:** `getApp`

## Responses

| Status | Description |
|--------|-------------|
| 200 | App details |
| 401 | (reference) |
| 403 | (reference) |
| 404 | (reference) |

**Success Response Schema:**

[AppInfo](../schemas/App/AppInfo.md)

## Security

- **bearerAuth**
