# POST /api/v1/auth/refresh

**Resource:** [Authentication](../resources/Authentication.md)
**Refresh access token**
**Operation ID:** `refresh`

Rotates the refresh token and returns a new access token.
The refresh token is sent via HttpOnly cookie (not in request body).

**Token Rotation:**
- Old refresh token is revoked
- New refresh token is set in cookie
- New access token is returned in response body

**Replay Detection:**
- If a reused (already rotated) token is detected, all sessions for the
  user are revoked for security.


## Responses

| Status | Description |
|--------|-------------|
| 200 | Token refreshed successfully |
| 401 | Missing or invalid refresh token |

**Success Response Schema:**

[RefreshResponse](../schemas/Refresh/RefreshResponse.md)

