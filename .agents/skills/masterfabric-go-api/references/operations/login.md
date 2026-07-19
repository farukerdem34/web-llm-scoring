# POST /api/v1/auth/login

**Resource:** [Auth](../resources/Auth.md)
**Login and receive JWT + refresh token**
**Operation ID:** `login`

## Request Body

**Required:** Yes

**Content Types:** `application/json`

**Schema:** [LoginRequest](../schemas/Login/LoginRequest.md)

## Responses

| Status | Description |
|--------|-------------|
| 200 | Login successful |
| 401 | (reference) |

**Success Response Schema:**

[LoginResponseV2](../schemas/Login/LoginResponseV2.md)

