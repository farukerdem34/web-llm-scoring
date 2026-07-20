# POST /api/v1/auth/register

**Resource:** [Authentication](../resources/Authentication.md)
**Register a new user**
**Operation ID:** `register`

Creates a new user account. Returns the created user information.


## Request Body

**Required:** Yes

**Content Types:** `application/json`

**Schema:** [RegisterRequest](../schemas/Register/RegisterRequest.md)

## Responses

| Status | Description |
|--------|-------------|
| 201 | User created successfully |
| 400 | Validation error |
| 409 | Email already exists |

**Success Response Schema:**

[UserInfo](../schemas/User/UserInfo.md)

