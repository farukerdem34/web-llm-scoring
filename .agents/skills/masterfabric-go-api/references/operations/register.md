# POST /api/v1/auth/register

**Resource:** [Auth](../resources/Auth.md)
**Register a new user**
**Operation ID:** `register`

## Request Body

**Required:** Yes

**Content Types:** `application/json`

**Schema:** [RegisterRequest](../schemas/Register/RegisterRequest.md)

## Responses

| Status | Description |
|--------|-------------|
| 201 | User created |
| 400 | (reference) |
| 409 | (reference) |

**Success Response Schema:**

[UserInfo](../schemas/User/UserInfo.md)

