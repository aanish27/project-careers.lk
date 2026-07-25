# RBAC Architecture

Companion to [`rbac-new-module-guide.md`](./rbac-new-module-guide.md) (the step-by-step guide for wiring a new module into this system). This document explains what exists, why it's shaped this way, and where the real authorization decision actually happens.

## 1. High-level picture

```
                     packages/lib/permissions/index.ts
                     (code — the source of truth)
                              │
                              │ seeded into
                              ▼
┌─────────────┐        ┌──────────────┐        ┌────────────────┐
│  AdminUser  │───────▶│ RoleAssignment│◀───────│      Role      │
│ (admin_users)│  1:N   │ (user_roles) │  N:1   │                │
└─────────────┘        └──────────────┘        └────────┬───────┘
                                                          │ N:1
                                                          ▼
                                                 ┌──────────────────┐
                                                 │  RolePermission   │
                                                 │ (role_permissions)│
                                                 └────────┬──────────┘
                                                          │ N:1
                                                          ▼
                                                 ┌──────────────────┐
                                                 │    Permission     │
                                                 └──────────────────┘
```

**The core idea:** a user never holds a permission directly. Permissions are granted to a **role**; users hold **roles**. Changing what a role can do changes it for everyone who holds that role, immediately (modulo the cache TTL — see §5). This is the same shape as the old `UserRole` enum conceptually (`SUPER_ADMIN` / `ADMIN`), except roles are now database rows an admin can create, rename, and re-scope, instead of two hardcoded values baked into the schema.

## 2. Why this shape

The previous system had two problems this replaces:

1. **Coarse-grained.** `SUPER_ADMIN` and `ADMIN` were the only two roles that could ever exist — adding a "can view users but not edit companies" role meant a schema migration, not an admin action.
2. **No admin-facing management.** There was no endpoint to create a user with a role, change someone's role, or see who could do what — only a public self-registration flow that always defaulted to `ADMIN`.

The permission registry (`packages/lib/permissions/index.ts`) is deliberately **code, not data**: a permission that no route actually checks is meaningless, and routes are defined in code. The `permissions` table is a synced _projection_ of that file — permissions are never created through the API (see [`PermissionsController`](../apps/api/src/modules/rbac/permissions.controller.ts), which is read-only by design).

## 3. Components and responsibilities

| Component                                        | Lives in                                                                                                                                                                                                                                                                                                             | Responsibility                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Permission registry                              | [`packages/lib/permissions/index.ts`](../packages/lib/permissions/index.ts)                                                                                                                                                                                                                                          | `PERMISSION_DESCRIPTIONS` (key → human description), `PermissionKey` type, `PERMISSIONS` constants, `SUPER_ADMIN_ROLE_SLUG`. The only place a permission is _defined_. Published as `@careerslk/lib`.                                                                                                  |
| Shared entity shapes                             | [`packages/types/rbac-entities/index.ts`](../packages/types/rbac-entities/index.ts)                                                                                                                                                                                                                                  | `AdminUser`, `Role`, `PermissionCatalogEntry`, `PermissionGroup` — the wire shapes both API and web agree on. Published as `@careerslk/types`.                                                                                                                                                         |
| `PrincipalService`                               | [`apps/api/src/modules/rbac/principal.service.ts`](../apps/api/src/modules/rbac/principal.service.ts)                                                                                                                                                                                                                | Resolves a user's effective permission set: the **union** of permissions across every role they hold. One query, not N+1.                                                                                                                                                                              |
| `PrincipalCache` (`PRINCIPAL_CACHE`)             | [`principal-cache.service.ts`](../apps/api/src/modules/rbac/principal-cache.service.ts)                                                                                                                                                                                                                              | In-memory, 30s TTL, so the common case (every authenticated request) costs no DB query. Mutations call `invalidate(userId)` / `invalidateAll()` directly, so on a single instance a change is felt immediately — the TTL is only the bound for a multi-instance deployment that hasn't been built yet. |
| `RbacPolicyService`                              | [`rbac-policy.service.ts`](../apps/api/src/modules/rbac/rbac-policy.service.ts)                                                                                                                                                                                                                                      | **The security-critical file.** Every privilege-escalation rule lives here, not scattered across services — see §6.                                                                                                                                                                                    |
| `PermissionsGuard`                               | [`apps/api/src/common/guards/permissions.guard.ts`](../apps/api/src/common/guards/permissions.guard.ts)                                                                                                                                                                                                              | Reads `request.user` (an `AuthenticatedPrincipal`), checks it against `@RequirePermissions`/`@RequireAnyPermission`/`@Authenticated`/`@Public` metadata. **Fails closed**: a route with no declared policy is denied and logged.                                                                       |
| `ScopedRoutePolicyAuditService`                  | [`scoped-route-policy-audit.service.ts`](../apps/api/src/common/services/scoped-route-policy-audit.service.ts)                                                                                                                                                                                                       | Boot-time check: refuses to start the app if any route on a `PermissionsGuard`-scoped controller has no access decorator. Moves the "forgot to decorate a route" bug from a runtime 403 to a startup crash.                                                                                            |
| `AuditService`                                   | [`apps/api/src/modules/audit/audit.service.ts`](../apps/api/src/modules/audit/audit.service.ts)                                                                                                                                                                                                                      | Writes an `AuditLog` row (who, what, before/after) for every RBAC mutation, inside the same DB transaction as the change.                                                                                                                                                                              |
| `<Can>` / `useAuth()`                            | [`apps/web/src/dashboard/components/can.tsx`](../apps/web/src/dashboard/components/can.tsx), [`use-auth.ts`](../apps/web/src/dashboard/hooks/use-auth.ts)                                                                                                                                                            | Frontend presentation gating. **Not a security boundary** — see §7.                                                                                                                                                                                                                                    |
| `resyncSessionAction()`                          | [`apps/web/src/dashboard/lib/session-actions.ts`](../apps/web/src/dashboard/lib/session-actions.ts)                                                                                                                                                                                                                  | Re-reads `/auth/me` and rewrites the session cookie after a mutation that could change the _acting_ user's own permissions (e.g. editing a role they hold).                                                                                                                                            |
| `requirePermission()` / `requireAnyPermission()` | [`apps/web/src/dashboard/lib/session.ts`](../apps/web/src/dashboard/lib/session.ts)                                                                                                                                                                                                                                  | Server Component page guard — calls Next's `notFound()` (not a redirect) when the session is valid but lacks the permission. See §7.                                                                                                                                                                   |
| Sidebar permission filtering                     | [`icon-sidebar-links.ts`](../apps/web/src/dashboard/config/icon-sidebar-links.ts), [`sidebar-links.ts`](../apps/web/src/dashboard/config/sidebar-links.ts), [`icon-sidebar.tsx`](../apps/web/src/dashboard/components/icon-sidebar.tsx), [`sidebar-menu.tsx`](../apps/web/src/dashboard/components/sidebar-menu.tsx) | Nav entries carry an optional `permission?: PermissionKey`; `useAuth().can()` filters them out client-side, and a sub-menu section whose items are all filtered disappears rather than showing an empty header.                                                                                        |

## 4. Sequence: an authenticated request

```
Browser          Next.js BFF proxy       NestJS: JwtAuthGuard      JwtStrategy        PrincipalCache/Service     PermissionsGuard        Controller
  │                    │                        │                     │                     │                        │                      │
  │  GET /admin/users  │                        │                     │                     │                        │                      │
  │───────────────────▶│                        │                     │                     │                        │                      │
  │                    │  Bearer <accessToken>   │                     │                     │                        │                      │
  │                    │───────────────────────▶│                     │                     │                        │                      │
  │                    │                        │  verify JWT,        │                     │                        │                      │
  │                    │                        │  extract { sub }     │                     │                        │                      │
  │                    │                        │────────────────────▶│                     │                        │                      │
  │                    │                        │                     │  cache.get(sub)      │                        │                      │
  │                    │                        │                     │────────────────────▶│                        │                      │
  │                    │                        │                     │                     │  cache miss? query DB:  │                      │
  │                    │                        │                     │                     │  user → roleAssignments │                      │
  │                    │                        │                     │                     │  → role → permissions   │                      │
  │                    │                        │                     │◀────────────────────│                        │                      │
  │                    │                        │                     │  AuthenticatedPrincipal                     │                      │
  │                    │                        │                     │  { userId, isActive, roleSlugs,             │                      │
  │                    │                        │                     │    permissions, isSuperAdmin }              │                      │
  │                    │                        │◀────────────────────│                     │                        │                      │
  │                    │                        │  request.user = principal (reject if !isActive) │                  │                      │
  │                    │                        │─────────────────────────────────────────────────────────────────▶│                      │
  │                    │                        │                     │                     │                        │  isSuperAdmin? allow. │
  │                    │                        │                     │                     │                        │  else check           │
  │                    │                        │                     │                     │                        │  @RequirePermissions   │
  │                    │                        │                     │                     │                        │  against principal.    │
  │                    │                        │                     │                     │                        │  permissions set       │
  │                    │                        │                     │                     │                        │───────────────────────▶│
  │                    │                        │                     │                     │                        │                      │  handler runs
  │◀────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────│
```

Two things worth noting:

- **Permissions are never embedded in the JWT.** The token only carries `{ sub, email }`. Permissions are resolved server-side, per request, via the cache — so a role/permission change takes effect on the _next_ request (bounded by the 30s cache TTL), not "whenever the token happens to expire" (which, before this, was up to 15 minutes).
- `PermissionsGuard` is applied **per-controller** via `@UseGuards(PermissionsGuard)` (see [`admin-users.controller.ts`](../apps/api/src/modules/admin-users/admin-users.controller.ts), [`roles.controller.ts`](../apps/api/src/modules/rbac/roles.controller.ts), [`permissions.controller.ts`](../apps/api/src/modules/rbac/permissions.controller.ts)), **not globally**. Controllers that don't opt in (Companies, Jobs, etc. as of this writing) are unaffected — see [`rbac-new-module-guide.md`](./rbac-new-module-guide.md) for why, and how to change that for a given module.

## 5. Sequence: super admin creates a user and assigns a role

```
Admin UI                  AdminUsersController        AdminUserManagementService      RbacPolicyService        AuditService        PrincipalCache
   │                              │                              │                          │                     │                     │
   │  POST /admin/users            │                              │                          │                     │                     │
   │  { email, password,           │                              │                          │                     │                     │
   │    firstName, lastName,       │                              │                          │                     │                     │
   │    roleIds: [3] }             │                              │                          │                     │                     │
   │───────────────────────────▶│                              │                          │                     │                     │
   │                              │  @RequirePermissions(USERS_CREATE) — checked by PermissionsGuard before handler runs │             │
   │                              │  create(actor, dto, auditCtx) │                          │                     │                     │
   │                              │─────────────────────────────▶│                          │                     │                     │
   │                              │                              │  assertCanAssignRoles(     │                     │                     │
   │                              │                              │    actor, [3])              │                     │                     │
   │                              │                              │─────────────────────────▶│                     │                     │
   │                              │                              │                          │  role 3 = super_admin? │                   │
   │                              │                              │                          │  actor.isSuperAdmin?   │                   │
   │                              │                              │                          │  neither → 403          │                   │
   │                              │                              │                          │  else → ok               │                   │
   │                              │                              │◀─────────────────────────│                     │                     │
   │                              │                              │  bcrypt-hash password,      │                     │                     │
   │                              │                              │  prisma.$transaction:        │                     │                     │
   │                              │                              │    create AdminUser +        │                     │                     │
   │                              │                              │    RoleAssignment rows        │                     │                     │
   │                              │                              │────────────────────────────────────────────────▶│                     │
   │                              │                              │                          │                     │  record(USER_CREATED, │
   │                              │                              │                          │                     │   before/after)         │
   │                              │◀─────────────────────────────│                          │                     │◀────────────────────│
   │◀───────────────────────────│  201 { id, email, roles: [...] } │                          │                     │                     │
```

Assigning roles to an _existing_ user (`PUT /admin/users/:id/roles`) goes through the same `RbacPolicyService`, plus two rules that only apply there: `assertNotSelf` (you cannot change your own roles — closes the self-promotion path) and `assertNotLastSuperAdmin` (checked only if the target currently holds `super_admin` and the new role list would drop it).

## 6. The escalation rules (`RbacPolicyService`)

This is the single most important file in the system — every rule lives here rather than in individual services, so a new endpoint can't quietly skip one.

| Rule                                                              | Method                      | Closes                                                                                                                                                                              |
| ----------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No self-modification of roles/active-status                       | `assertNotSelf`             | An admin promoting/protecting themselves, or locking themselves out by accident                                                                                                     |
| Cannot grant a permission you don't hold                          | `assertCanGrantPermissions` | A holder of `roles.permissions.assign` making their own role (or any role) a super-admin-equivalent by granting it everything                                                       |
| System roles are immutable                                        | `assertRoleIsMutable`       | Renaming/deleting/re-permissioning `super_admin` — its slug is what `PermissionsGuard` checks for the bypass, so its identity must be stable                                        |
| Assigning `super_admin` requires already being `super_admin`      | `assertCanAssignRoles`      | Minting a new super admin without being one — the one escalation `assertCanGrantPermissions` alone wouldn't catch, since _assigning_ an existing role isn't _granting_ a permission |
| The last active super admin cannot be demoted/deactivated/deleted | `assertNotLastSuperAdmin`   | Reaching a state where nobody can administer the system                                                                                                                             |

All five are enforced **on every mutation path that touches them** — [`admin-user-management.service.ts`](../apps/api/src/modules/admin-users/admin-user-management.service.ts) and [`roles.service.ts`](../apps/api/src/modules/rbac/roles.service.ts) both call into `RbacPolicyService` rather than re-implementing checks locally.

## 7. Where the real security boundary is

Same principle as the auth architecture doc ([`admin-auth-architecture.md`](./admin-auth-architecture.md) §7), applied to permissions instead of the session cookie:

| Check          | Where                                                                                                                  | What it proves                                                                                     | What happens if bypassed                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Optimistic** | `<Can>`, `useAuth().can(...)`, sidebar filtering, `requirePermission()`'s 404                                          | "The session cookie's cached permission snapshot includes this key"                                | User briefly sees a button/nav item they can't actually use — clicking it 403s      |
| **Real**       | `PermissionsGuard` on every RBAC-scoped controller, re-deriving the principal from the DB (via cache) on every request | "This exact user, right now, according to the database, holds this permission (or is super admin)" | This is the actual authorization decision — nothing in the frontend can override it |

Concretely: the session cookie's `permissions` array is a **snapshot taken at login** (or last resync). If someone else revokes a permission from a role you hold, your cookie still shows the old permission list until you log in again, refresh, or a resync-triggering mutation happens — but your _next API call_ is checked against the live DB state via `PermissionsGuard`, not the cookie. The frontend being stale-permissive for a few minutes is a UX inconvenience (a button that 403s when clicked); the frontend being stale-_restrictive_ is merely annoying (a button that's missing until next login). Neither is a security hole, because the backend never trusts the cookie's permission list for anything.

This is also why `resyncSessionAction()` exists (§3) — it's an optimization to shrink that staleness window for the specific case where you just changed your _own_ effective permissions, not a correctness requirement.

**Direct navigation to a page you lack permission for.** `requirePermission()`/`requireAnyPermission()` (called at the top of pages like `apps/web/src/app/admin/(dashboard)/users/page.tsx`) render Next's `notFound()` rather than redirecting to `/admin/login` or back to the dashboard. This is deliberate: a redirect confirms to whoever's poking at the URL that the route exists but is off-limits; a 404 gives no signal either way. `apps/web/src/app/admin/(dashboard)/not-found.tsx` supplies the styled 404 (kept inside the dashboard shell — sidebar/topbar still render, since the `(dashboard)/layout.tsx` above it doesn't itself throw). This only covers pages that actually call `requirePermission`/`requireAnyPermission` — it doesn't retroactively protect a page that doesn't call it (see [`rbac-new-module-guide.md`](./rbac-new-module-guide.md) §1 Step 5).

## 8. Audit logging

Every mutation in `admin-user-management.service.ts` and `roles.service.ts` calls `AuditService.record()` **inside the same Prisma transaction** as the change it describes — so a rolled-back mutation never leaves behind a log entry claiming it happened. Each row (`AuditLog` — table, not model name, see schema) captures:

- `actorUserId` / `actorEmail` — who (nullable + denormalized, so the row survives the actor's own account being deleted later)
- `action` — a string from `AUDIT_ACTIONS` in [`audit.constant.ts`](../apps/api/src/modules/audit/audit.constant.ts) (e.g. `user.roles.changed`, `role.permissions.changed`)
- `entityType` / `entityId` — what was changed
- `oldValue` / `newValue` — JSON snapshots, so the log answers "what actually changed," not just "something changed"

There is currently no UI surfaced for reading this table (the `/admin/users/logs` nav placeholder is commented out in [`sidebar-links.ts`](../apps/web/src/dashboard/config/sidebar-links.ts) pending a viewer page) — it's write-only infrastructure today, queryable directly against the DB.

## 9. Known limitations (deliberate, not oversights)

- **No instant multi-instance cache invalidation.** `PrincipalCache` is in-memory per process. On a single instance, `invalidate()` calls make changes immediate; on multiple instances, another instance's cached copy of a changed user's permissions can lag up to 30s. Swapping the `PRINCIPAL_CACHE` provider for a Redis-backed implementation (see the `PRINCIPAL_CACHE` DI token) is the documented upgrade path — no guard, strategy, or service code would need to change.
- **No `securityVersion` / forced token revocation.** Deactivating a user is enforced immediately at `JwtStrategy` (it checks `isActive` on every request), but a role/permission _downgrade_ for an active user only takes effect once their cached principal expires or is invalidated — there's no JWT-embedded version counter forcing instant re-validation. This was an explicit scope cut when the system was built (see the plan's judgment call #8) — a legitimate follow-up, not a gap that was missed.
- **`PermissionsGuard` is opt-in per controller, not global.** See [`rbac-new-module-guide.md`](./rbac-new-module-guide.md) for what this means when adding a new module, and how to bring an existing ungated controller (Companies, Jobs, etc.) under RBAC.

## 10. `packages/lib` exists to keep logic (and Node-only code) out of the browser bundle

The shared workspace is split into two packages with a deliberate line between them:

| Package          | Holds                                                                                                                                                                                            | Published as                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `packages/types` | Pure type/constant definitions only: `constants/`, `enums/` (incl. deprecated `UserRole`), `rbac-entities/` (`AdminUser`, `Role`, `PermissionCatalogEntry`, `PermissionGroup`), `scraper-types/` | `@careerslk/types`                                 |
| `packages/lib`   | Actual logic/data: the permission registry (`permissions/`) and the Node-only SSRF guard (`utils/ssrf.ts`)                                                                                       | `@careerslk/lib` (+ `@careerslk/lib/ssrf` subpath) |

`packages/lib` itself has **two build entries**, for the same reason the old `packages/types` split existed: `index.ts` (client-safe — just the permission registry) and `ssrf.ts` (`assertNotSsrf`, needs `node:dns`/`node:url`, used only by `CompaniesService` and the scraper's `playwright.service.ts`). These are published as separate subpaths — `@careerslk/lib` and `@careerslk/lib/ssrf` — so a client component importing `PERMISSIONS` never pulls in the Node-only code.

This split exists _because of_ RBAC: before this feature, no client component imported a **runtime value** from the shared types package (only types, which get elided from the bundle at compile time). `<Can permission={PERMISSIONS.USERS_CREATE}>` and friends import `PERMISSIONS` as an actual object, which pulls in the whole barrel at runtime — and the first time that barrel also re-exported the SSRF helper, it broke the browser build (`Cannot find module 'node:dns'`). Moving the registry into its own package (rather than just its own build entry within `types`) makes the type-vs-logic boundary structural, not just a build-config detail someone could accidentally undo by adding one `export *` line to the wrong file.

`packages/types` depends on `packages/lib` (for `PermissionKey`, used in `rbac-entities`), never the other way — `lib` has no dependency on `types`, so there's no cycle.

**The rule going forward:**

- Anything added to `packages/types` must be a pure type or constant — no functions, no runtime logic, nothing importing Node builtins.
- Anything added to `packages/lib/index.ts` (or files it re-exports) must be safe to run in a browser, same as before.
- A Node-only utility shared between `apps/api` and `apps/scrapper` gets its own entry in `packages/lib` (see `ssrf.ts` for the pattern) and its own `exports` subpath in `packages/lib/package.json` + `tsdown.config.ts` — never folded into `packages/lib/index.ts`, and never put in `packages/types` at all.
