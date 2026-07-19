# POST /api/v1/auth/refresh

**Resource:** [Auth](../resources/Auth.md)
**Refresh access token using refresh token cookie**
**Operation ID:** `refreshToken`

## Responses

| Status | Description |
|--------|-------------|
| 200 | Token refreshed |
| 401 | (reference) |

**Success Response Schema:**

[RefreshResponse](../schemas/Refresh/RefreshResponse.md)

