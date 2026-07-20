# POST /api/v1/auth/logout

**Resource:** [Authentication](../resources/Authentication.md)
**Logout**
**Operation ID:** `logout`

Revokes the current refresh token and clears the cookie.
Requires valid JWT in Authorization header.


## Responses

| Status | Description |
|--------|-------------|
| 204 | Logged out successfully |
| 401 | Not authenticated |

## Security

- **bearerAuth**
