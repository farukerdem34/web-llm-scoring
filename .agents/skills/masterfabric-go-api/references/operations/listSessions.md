# GET /api/v1/auth/sessions

**Resource:** [Auth](../resources/Auth.md)
**List active sessions**
**Operation ID:** `listSessions`

## Responses

| Status | Description |
|--------|-------------|
| 200 | Session list |
| 401 | (reference) |

**Success Response Schema:**

[SessionsResponse](../schemas/Sessions/SessionsResponse.md)

## Security

- **bearerAuth**
