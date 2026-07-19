---
name: masterfabric-go-api
description: Enterprise-grade, multi-tenant, RBAC-driven SaaS backend platform. Domain-driven design with bounded contexts: IAM, Tenant, API Management, Audit, Realtime.. Use when working with the MasterFabric Go API or when the user needs to interact with this API.
license: AGPL-3.0 (https://www.gnu.org/licenses/agpl-3.0.html)
metadata:
  api-version: "0.0.1"
  openapi-version: "3.0.3"
---

# MasterFabric Go API

Enterprise-grade, multi-tenant, RBAC-driven SaaS backend platform. Domain-driven design with bounded contexts: IAM, Tenant, API Management, Audit, Realtime.

## How to Use This Skill

This API documentation is split into multiple files for on-demand loading.

**Directory structure:**
```
references/
├── resources/      # 10 resource index files
├── operations/     # 34 operation detail files
└── schemas/        # 19 schema groups, 24 schema files
```

**Navigation flow:**
1. Find the resource you need in the list below
2. Read `references/resources/<resource>.md` to see available operations
3. Read `references/operations/<operation>.md` for full details
4. If an operation references a schema, read `references/schemas/<prefix>/<schema>.md`

## Base URL

- `http://localhost:8080` - Local development

## Authentication

Supported methods: **bearerAuth**. See `references/authentication.md` for details.

## Resources

- **Endpoints** → `references/resources/Endpoints.md` (7 ops) - API endpoint definition and gateway management
- **Auth** → `references/resources/Auth.md` (6 ops) - User registration, login, token refresh, logout, s
- **Users** → `references/resources/Users.md` (4 ops) - User management and role assignment
- **Organizations** → `references/resources/Organizations.md` (3 ops) - Multi-tenant organization management
- **Apps** → `references/resources/Apps.md` (3 ops) - Application management within organizations
- **API Keys** → `references/resources/API-Keys.md` (3 ops) - API key lifecycle management
- **Workspaces** → `references/resources/Workspaces.md` (3 ops) - Workspace management within organizations
- **Health** → `references/resources/Health.md` (2 ops) - Liveness and readiness probes
- **Audit** → `references/resources/Audit.md` (2 ops) - Audit log queries
- **Realtime** → `references/resources/Realtime.md` (1 ops) - WebSocket real-time connection
