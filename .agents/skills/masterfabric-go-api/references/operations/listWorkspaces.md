# GET /api/v1/organizations/{orgId}/workspaces

**Resource:** [Workspaces](../resources/Workspaces.md)
**List workspaces in an organization**
**Operation ID:** `listWorkspaces`

## Responses

| Status | Description |
|--------|-------------|
| 200 | Workspace list |
| 401 | (reference) |
| 403 | (reference) |

**Success Response Schema:**

Array of [WorkspaceInfo](../schemas/Workspace/WorkspaceInfo.md)

## Security

- **bearerAuth**
