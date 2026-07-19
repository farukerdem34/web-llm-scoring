# GET /api/v1/users

**Resource:** [Users](../resources/Users.md)
**List all users**
**Operation ID:** `listUsers`

## Responses

| Status | Description |
|--------|-------------|
| 200 | User list |
| 401 | (reference) |
| 403 | (reference) |

**Success Response Schema:**

Array of [UserInfo](../schemas/User/UserInfo.md)

## Security

- **bearerAuth**
