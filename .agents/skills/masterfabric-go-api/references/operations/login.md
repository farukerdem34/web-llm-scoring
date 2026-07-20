# POST /api/v1/auth/login

**Resource:** [Authentication](../resources/Authentication.md)
**Login**
**Operation ID:** `login`

Authenticates a user and returns an access token. A refresh token is set
as an HttpOnly cookie for token rotation.

**Cookie Security:**
- Production (Secure=true): SameSite=None, Secure, HttpOnly
- Development (Secure=false): SameSite=Strict, HttpOnly


## Request Body

**Required:** Yes

**Content Types:** `application/json`

**Schema:** [LoginRequest](../schemas/Login/LoginRequest.md)

## Responses

| Status | Description |
|--------|-------------|
| 200 | Login successful |
| 400 | Validation error |
| 401 | Invalid credentials |

**Success Response Schema:**

[LoginResponse](../schemas/Login/LoginResponse.md)

