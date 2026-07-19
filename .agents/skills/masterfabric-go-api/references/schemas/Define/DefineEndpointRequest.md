# DefineEndpointRequest

**Type:** object

## Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `method` | enum: GET, POST, PUT... | Yes |  |
| `path` | string | Yes |  |
| `version` | string | No |  |
| `backend_service` | string | Yes |  |
| `backend_action` | string | Yes |  |
| `schema` | object | No | Optional JSON schema for request validation |
| `audit_level` | string | No |  |
| `pii_masking` | boolean | No |  |
| `event_after` | string | No |  |

