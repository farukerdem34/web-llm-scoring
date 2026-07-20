# POST /api/v1/auth/logout-all

**Resource:** [Authentication](../resources/Authentication.md)
**Logout from all devices**
**Operation ID:** `logoutAll`

Revokes all refresh tokens for the current user across all devices.
Requires valid JWT in Authorization header.


## Responses

| Status | Description |
|--------|-------------|
| 204 | All sessions terminated |
| 401 | Not authenticated |

## Security

- **bearerAuth**
