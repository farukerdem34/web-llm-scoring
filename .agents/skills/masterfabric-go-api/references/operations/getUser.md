# GET /api/v1/users/{id}

**Resource:** [Users](../resources/Users.md)
**Get a user by ID**
**Operation ID:** `getUser`

## Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `id` | path | string (uuid) | Yes |  |

## Responses

| Status | Description |
|--------|-------------|
| 200 | User details |
| 401 | (reference) |
| 403 | (reference) |
| 404 | (reference) |

**Success Response Schema:**

[UserInfo](../schemas/User/UserInfo.md)

## Security

- **bearerAuth**
