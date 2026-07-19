# GET /api/v1/organizations/{orgId}/audit-logs

**Resource:** [Audit](../resources/Audit.md)
**List audit logs for an organization**
**Operation ID:** `listAuditLogsByOrg`

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
