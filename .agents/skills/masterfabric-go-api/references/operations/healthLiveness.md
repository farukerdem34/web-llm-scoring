# GET /health/live

**Resource:** [Health](../resources/Health.md)
**Liveness probe**
**Operation ID:** `healthLiveness`

Returns 200 if the server is alive.

## Responses

| Status | Description |
|--------|-------------|
| 200 | Server is alive |

**Success Response Schema** (inline):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | No |  |

