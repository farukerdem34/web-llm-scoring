# Auth

User registration, login, token refresh, logout, sessions

## Operations

| Method | Path | Summary | Details |
|--------|------|---------|----------|
| POST | `/api/v1/auth/register` | Register a new user | [View](../operations/register.md) |
| POST | `/api/v1/auth/login` | Login and receive JWT + refresh token | [View](../operations/login.md) |
| POST | `/api/v1/auth/refresh` | Refresh access token using refresh token cookie | [View](../operations/refreshToken.md) |
| POST | `/api/v1/auth/logout` | Logout current session | [View](../operations/logout.md) |
| POST | `/api/v1/auth/logout-all` | Logout all sessions | [View](../operations/logoutAll.md) |
| GET | `/api/v1/auth/sessions` | List active sessions | [View](../operations/listSessions.md) |
