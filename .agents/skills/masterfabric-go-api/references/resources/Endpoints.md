# Endpoints

API endpoint definition and gateway management

## Operations

| Method | Path | Summary | Details |
|--------|------|---------|----------|
| GET | `/api/v1/organizations/{orgId}/apps/{appId}/endpoints` | List endpoints for an app | [View](../operations/listEndpoints.md) |
| POST | `/api/v1/organizations/{orgId}/apps/{appId}/endpoints` | Define a new API endpoint | [View](../operations/defineEndpoint.md) |
| GET | `/api/v1/organizations/{orgId}/apps/{appId}/endpoints/{endpointId}` | Get an endpoint by ID | [View](../operations/getEndpoint.md) |
| POST | `/api/v1/organizations/{orgId}/apps/{appId}/endpoints/{endpointId}/retire` | Retire an endpoint | [View](../operations/retireEndpoint.md) |
| POST | `/api/v1/organizations/{orgId}/apps/{appId}/endpoints/{endpointId}/activate` | Activate an endpoint | [View](../operations/activateEndpoint.md) |
| GET | `/api/v1/organizations/{orgId}/apps/{appId}/endpoints/{endpointId}/policy` | Get endpoint policy | [View](../operations/getEndpointPolicy.md) |
| PUT | `/api/v1/organizations/{orgId}/apps/{appId}/endpoints/{endpointId}/policy` | Update endpoint policy | [View](../operations/updateEndpointPolicy.md) |
