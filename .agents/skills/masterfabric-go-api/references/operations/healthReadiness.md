# GET /health/ready

**Resource:** [Health](../resources/Health.md)
**Readiness probe**
**Operation ID:** `healthReadiness`

Checks database and cache connectivity.

## Responses

| Status | Description |
|--------|-------------|
| 200 | All services healthy |
| 503 | One or more services unhealthy |

**Success Response Schema:**

[HealthResponse](../schemas/Health/HealthResponse.md)

