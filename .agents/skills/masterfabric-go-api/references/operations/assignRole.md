# POST /api/v1/roles/assign

**Resource:** [Users](../resources/Users.md)
**Assign a role to a user**
**Operation ID:** `assignRole`

## Request Body

**Required:** Yes

**Content Types:** `application/json`

**Schema:** [AssignRoleRequest](../schemas/Assign/AssignRoleRequest.md)

## Responses

| Status | Description |
|--------|-------------|
| 204 | Role assigned |
| 400 | (reference) |
| 401 | (reference) |
| 403 | (reference) |

## Security

- **bearerAuth**
