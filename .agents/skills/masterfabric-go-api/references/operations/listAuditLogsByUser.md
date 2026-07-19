# GET /api/v1/users/{userId}/audit-logs

**Resource:** [Audit](../resources/Audit.md)
**List audit logs for a user**
**Operation ID:** `listAuditLogsByUser`

## Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `userId` | path | string (uuid) | Yes |  |

## Responses

| Status | Description |
|--------|-------------|
| 200 | Audit log list |
| 401 | (reference) |
| 403 | (reference) |

**Success Response Schema:**

Array of [AuditLogEntry](../schemas/Audit/AuditLogEntry.md)

## Security

- **bearerAuth**
