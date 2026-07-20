# GET /health/live

**Resource:** [Health](../resources/Health.md)
**Liveness check**
**Operation ID:** `liveness`

Returns 200 if the server is alive. Use this for Kubernetes liveness probes.


## Responses

| Status | Description |
|--------|-------------|
| 200 | Server is alive |

**Success Response Schema** (inline):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | No |  |

