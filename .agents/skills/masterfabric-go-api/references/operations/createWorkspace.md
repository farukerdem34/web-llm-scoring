# POST /api/v1/organizations/{orgId}/workspaces

**Resource:** [Workspaces](../resources/Workspaces.md)
**Create a workspace**
**Operation ID:** `createWorkspace`

## Request Body

**Required:** Yes

**Content Types:** `application/json`

**Schema:** [CreateWorkspaceRequest](../schemas/Create/CreateWorkspaceRequest.md)

## Responses

| Status | Description |
|--------|-------------|
| 201 | Workspace created |
| 400 | (reference) |
| 401 | (reference) |
| 403 | (reference) |

**Success Response Schema:**

[WorkspaceInfo](../schemas/Workspace/WorkspaceInfo.md)

## Security

- **bearerAuth**
