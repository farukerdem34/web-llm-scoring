# GET /api/v1/organizations/{orgId}/apps

**Resource:** [Apps](../resources/Apps.md)
**List apps in an organization**
**Operation ID:** `listApps`

## Responses

| Status | Description |
|--------|-------------|
| 200 | App list |
| 401 | (reference) |
| 403 | (reference) |

**Success Response Schema:**

Array of [AppInfo](../schemas/App/AppInfo.md)

## Security

- **bearerAuth**
