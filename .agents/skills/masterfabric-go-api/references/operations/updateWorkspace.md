# PUT /api/v1/organizations/{orgId}/workspaces/{workspaceId}

**Resource:** [Workspaces](../resources/Workspaces.md)
**Update a workspace**
**Operation ID:** `updateWorkspace`

## Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `workspaceId` | path | string (uuid) | Yes |  |

## Request Body

**Required:** Yes

**Content Types:** `application/json`

**Schema:** [UpdateWorkspaceRequest](../schemas/Update/UpdateWorkspaceRequest.md)

## Responses

| Status | Description |
|--------|-------------|
| 200 | Workspace updated |
| 400 | (reference) |
| 401 | (reference) |
| 403 | (reference) |

**Success Response Schema:**

[WorkspaceInfo](../schemas/Workspace/WorkspaceInfo.md)

## Security

- **bearerAuth**
