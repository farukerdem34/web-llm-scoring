# GET /health/ready

**Resource:** [Health](../resources/Health.md)
**Readiness check**
**Operation ID:** `readiness`

Checks database and cache connectivity. Returns 200 if all services are healthy.
Use this for Kubernetes readiness probes.


## Responses

| Status | Description |
|--------|-------------|
| 200 | All services healthy |
| 503 | One or more services unhealthy |

**Success Response Schema:**

[HealthResponse](../schemas/Health/HealthResponse.md)

