# GET /api/v1/me

**Resource:** [Users](../resources/Users.md)
**Get current user profile**
**Operation ID:** `getMe`

## Responses

| Status | Description |
|--------|-------------|
| 200 | Current user |
| 401 | (reference) |

**Success Response Schema:**

[UserInfo](../schemas/User/UserInfo.md)

## Security

- **bearerAuth**
