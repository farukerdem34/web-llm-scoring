# GET /api/v1/auth/sessions

**Resource:** [Authentication](../resources/Authentication.md)
**List active sessions**
**Operation ID:** `listSessions`

Returns a list of active sessions/devices for the current user.
Requires valid JWT in Authorization header.


## Responses

| Status | Description |
|--------|-------------|
| 200 | Sessions list |
| 401 | Not authenticated |

**Success Response Schema:**

[SessionsResponse](../schemas/Sessions/SessionsResponse.md)

## Security

- **bearerAuth**
