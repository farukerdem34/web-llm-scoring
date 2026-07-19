# EndpointInfo

**Type:** object

## Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (uuid) | No |  |
| `app_id` | string (uuid) | No |  |
| `method` | enum: GET, POST, PUT... | No |  |
| `path` | string | No |  |
| `version` | string | No |  |
| `backend_service` | string | No |  |
| `backend_action` | string | No |  |
| `schema` | object | No |  |
| `audit_level` | string | No |  |
| `pii_masking` | boolean | No |  |
| `event_after` | string | No |  |
| `status` | string | No |  |
| `created_at` | string (date-time) | No |  |

