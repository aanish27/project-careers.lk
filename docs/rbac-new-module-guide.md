# Wiring a new module into RBAC

Companion to [`rbac-architecture.md`](./rbac-architecture.md) (read that first if you haven't — this doc assumes you know what a `PermissionKey`, `PermissionsGuard`, and `RbacPolicyService` are). This is the checklist for adding permission checks to a module, whether it's brand new or an existing controller (Companies, Jobs, etc.) that's currently only gated by "any authenticated user."

## Which scenario are you in?

- **New module, doesn't exist yet** → follow §1 in full.
- **Existing controller, currently ungated** (no `RolesGuard`/`PermissionsGuard` at all — e.g. `CompaniesController`, `JobsController` as of this writing) → follow §1 but skip creating a new Nest module; you're editing files that already exist. Read §3 first — this changes who can access the module today.

## 1. Steps

### Step 1 — Add permission keys to the registry

Edit [`packages/types/permissions.ts`](../packages/types/permissions.ts). Add one entry per distinct action to `PERMISSION_DESCRIPTIONS`, using the `module.resource.action` (or `module.action`) key format:

```ts
export const PERMISSION_DESCRIPTIONS = {
  // ...existing entries...

  'companies.read': 'View companies',
  'companies.create': 'Add new companies',
  'companies.update': 'Edit company details',
  'companies.delete': 'Remove companies',
} as const;
```

Then add the matching `SCREAMING_SNAKE` constant to `PERMISSIONS`:

```ts
export const PERMISSIONS = {
  // ...existing entries...

  COMPANIES_READ: 'companies.read',
  COMPANIES_CREATE: 'companies.create',
  COMPANIES_UPDATE: 'companies.update',
  COMPANIES_DELETE: 'companies.delete',
} as const satisfies Record<string, PermissionKey>;
```

**Skip this if you don't need per-action granularity** — you can also `@RequirePermissions(PERMISSIONS.COMPANIES_READ)` on every route in a controller and call it done; the AND/OR combinators (`@RequireAnyPermission`) exist for finer cases but aren't mandatory.

There's a compile-time check right below `PERMISSIONS` in that file — if you add a description but forget the constant, the build fails with a message naming the missing key. That's intentional; don't work around it.

Build the package so the API and web pick up the new keys:

```
pnpm --filter @careerslk/types build
```

`permissions.ts` is part of `packages/types/index.ts`'s barrel, which gets bundled straight into the browser (see architecture doc §10) — don't import anything Node-only (`node:dns`, `fs`, etc.) into it or anything it re-exports, even transitively. If you need a server-only helper alongside your new permissions, give it its own entry/subpath instead, following `ssrf.ts`'s pattern.

### Step 2 — Apply the guard to the controller

If the controller is brand new, scaffold it the same way [`roles.controller.ts`](../apps/api/src/modules/rbac/roles.controller.ts) is built. If it already exists (e.g. `CompaniesController`), edit it in place:

```ts
import { PERMISSIONS } from '@careerslk/types';
import { RequirePermissions } from '@/common/decorators/rbac.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';

@Controller('companies')
@UseGuards(PermissionsGuard)   // ← add this
export class CompaniesController {
  @Get()
  @RequirePermissions(PERMISSIONS.COMPANIES_READ)   // ← add this to every handler
  findAll() { ... }

  @Post()
  @RequirePermissions(PERMISSIONS.COMPANIES_CREATE)
  create() { ... }

  // ...
}
```

**Every handler on a `@UseGuards(PermissionsGuard)` controller must have exactly one of:** `@Public()`, `@Authenticated()`, `@RequirePermissions(...)`, or `@RequireAnyPermission(...)`. There is no default-allow. If you add `@UseGuards(PermissionsGuard)` to a controller and miss a route, the app **will not boot** — [`ScopedRoutePolicyAuditService`](../apps/api/src/common/services/scoped-route-policy-audit.service.ts) throws at startup naming the exact undecorated handler. This is deliberate; it's cheaper to fix at boot than to discover in production that a route was silently open.

If you only need "any logged-in user, no specific permission" for a route (rare — most things should have a real permission), use `@Authenticated()` instead of inventing a permission for it.

### Step 3 — Wire up the module (new modules only)

If this is a new Nest module (not an edit to an existing one), give it what it needs to actually enforce anything:

```ts
@Module({
  imports: [RbacModule], // for RbacPolicyService / PRINCIPAL_CACHE, if this module has mutations with escalation-style rules
  controllers: [YourController],
  providers: [YourService],
})
export class YourModule {}
```

Most modules don't need `RbacPolicyService` at all — that's specific to _managing access itself_ (users, roles). A plain CRUD module just needs the guard + decorators from Steps 1–2; skip importing `RbacModule` unless your mutations need something like "can't grant a permission you don't hold" logic, which is unlikely outside the RBAC module itself.

Register the module/routes in [`app.module.ts`](../apps/api/src/app.module.ts) the same way existing modules are — nothing RBAC-specific here, just normal Nest wiring.

**⚠️ If you're adding your module to the `RouterModule.register([...])` tree** (the `{ path: 'admin', children: [...] }` config, used to nest routes under `/admin`), be aware that NestJS's `RouterModule` stores exactly **one** path prefix per module class — it's a `Reflect.defineMetadata(MODULE_PATH, path, moduleCtor)` call internally, keyed by the module, last write wins. Two concrete bugs this caused during the initial RBAC build:

1. **Reusing the same module under two different `path` entries.** `RbacModule` was briefly registered once as `{path: 'roles', module: RbacModule}` and again as `{path: 'permissions', module: RbacModule}` (it hosts both `RolesController` and `PermissionsController`). The second entry silently overwrote the first for _all_ of that module's controllers — the real (broken) route ended up being `/admin/permissions/roles`, not `/admin/roles`. **Fix:** give a module hosting multiple controllers exactly one router entry with `path: ''`, and let each controller's own `@Controller(...)` decorator supply its segment.
2. **Double-prefixing.** The `path` in a `RouterModule` child entry is a prefix stacked _in front of_ whatever the controller's own `@Controller()` decorator already declares — it does not replace it. `{path: 'users', module: AdminUsersModule}` combined with `AdminUsersController`'s `@Controller('users')` produced `/admin/users/users`, not `/admin/users`. **Fix:** same as above — use `path: ''` in the `RouterModule` entry and let the controller's decorator be the only source of that segment, unless you deliberately want a prefix distinct from the controller's own path.

Rule of thumb: after touching `app.module.ts`'s `RouterModule.register(...)`, restart the API and check the boot log — Nest logs `Mapped {/admin/whatever, GET} route` for every route. Confirm the paths are what you expect before assuming the wiring is correct; a wrong prefix doesn't fail the build, it just 404s at runtime.

### Step 4 — Seed the new permissions

The `permissions` table is a synced projection of the registry (§1 of the architecture doc) — it doesn't update itself. Run the seed:

```
pnpm --filter @careerslk/database prisma:seed
```

This calls `seedPermissions()` ([`permissions.seeder.ts`](../packages/database/prisma/seeders/permissions.seeder.ts)), which inserts new keys, updates changed descriptions, and reports (never auto-deletes) orphaned keys no longer in the registry. It also re-runs `seedSuperAdmin()`, which grants every permission — including your new ones — to the `super_admin` role automatically. **No other role gets the new permissions automatically** — grant them to whichever roles need them via the Roles UI (`/admin/users/roles` → _Manage permissions_) or by editing [`admin-users.seeder.ts`](../packages/database/prisma/seeders/admin-users.seeder.ts) if it's a role that should have it by default in dev seed data.

### Step 5 — Build a frontend feature (if this module needs an admin UI)

Mirror the existing `users`/`roles`/`company` features under `apps/web/src/dashboard/features/<name>/`:

```
api/api.ts          — axios calls, one function per endpoint
hooks/query-keys.ts — the React Query key factory
hooks/use-<name>.ts — one hook per query/mutation, using the axios instance from @dashboard-lib/axios
components/         — table, dialogs, buttons
```

Gate anything permission-sensitive with `<Can>`:

```tsx
import { PERMISSIONS } from '@careerslk/types';
import { Can } from '@dashboard-components/can';

<Can permission={PERMISSIONS.COMPANIES_CREATE}>
  <CreateCompanyButton />
</Can>;
```

or, in a Server Component page, gate the whole page:

```tsx
import { PERMISSIONS } from '@careerslk/types';
import { requirePermission } from '@dashboard-lib/session';

export default async function CompaniesPage() {
  await requirePermission(PERMISSIONS.COMPANIES_READ);
  return <CompaniesTable />;
}
```

If the session is valid but lacks the permission, `requirePermission`/`requireAnyPermission` render Next's `notFound()` — the visitor gets the styled 404 from `apps/web/src/app/admin/(dashboard)/not-found.tsx` (dashboard shell still around it), not a redirect. This is deliberate, see architecture doc §7 — don't change it back to a redirect without reading why. This only protects pages that actually call `requirePermission`/`requireAnyPermission`; a page that skips it is wide open regardless of what the sidebar shows.

**Remember this is UX only** (architecture doc §7) — it hides the button, it doesn't protect the data. The `PermissionsGuard` on the backend is what actually enforces it; if you skip Steps 1–2, gating the frontend alone does nothing.

If the route matters enough to appear in navigation, add an entry to [`icon-sidebar-links.ts`](../apps/web/src/dashboard/config/icon-sidebar-links.ts) and/or [`sidebar-links.ts`](../apps/web/src/dashboard/config/sidebar-links.ts) with a `permission: PERMISSIONS.COMPANIES_READ` field — both configs support an optional `permission?: PermissionKey` per entry, and `icon-sidebar.tsx`/`sidebar-menu.tsx` already filter through `useAuth().can()` before rendering (a sub-menu section whose items are all filtered out is dropped entirely, not shown empty). Omit the field to always show an entry (that's what the ungated `company` icon-rail entry does today).

**Dialogs triggered from a `DropdownMenu` row-action:** don't nest a `Dialog`'s trigger inside a `DropdownMenuItem`. The menu's own close (which unmounts/moves focus) races the dialog's open, and the dialog visibly flashes open and immediately closes — `onSelect={(e) => e.preventDefault()}` on the item is not enough to fully prevent this. Instead, make the dialog component **controlled** (`open`/`onOpenChange` props, no internal trigger) and render it as a **sibling** of the `DropdownMenu`, with the parent row component owning an `activeDialog` piece of state that the menu items just set via `onClick`. See `users-table.tsx`'s `RowActions` and `assign-roles-dialog.tsx` for the pattern — every dialog in the Users/Roles features follows it.

## 2. Adding a role/permission mutation with escalation rules

If your new module lets someone grant _other users_ access to something (not just CRUD on its own resource — e.g. "assign this campaign to an editor"), and that grant is itself sensitive, don't invent new escalation logic. Either:

- **Route it through the existing Users/Roles system** — if "access to X" is really just "holds permission Y," make it a permission and let role assignment handle it (Steps 1–4 above are enough).
- **If it's a genuinely different kind of grant** (not modeled as a permission), extend `RbacPolicyService` with a new method rather than writing ad-hoc checks in your service. The whole point of that file (architecture doc §6) is that every escalation rule lives in one auditable place. A new service calling `this.policy.assertYourNewRule(actor, ...)` is the pattern; a new service rolling its own `if (actor.id === target.id) throw ...` is the anti-pattern this system was built to avoid.

## 3. If you're retrofitting an existing ungated controller

Adding `@UseGuards(PermissionsGuard)` to a controller that currently has **no** guard beyond the global `JwtAuthGuard` (i.e. "any logged-in user, any role, full access") is a **behavior change**, not just an addition — every existing caller needs the relevant permission from now on, and nobody has it until you seed it and grant it to a role (Step 4). Before doing this to a live module:

1. Confirm which roles currently need access, and make sure at least the `super_admin` role (which gets everything automatically) and whichever role real users actually hold both end up with the right grants — otherwise you'll lock out everyone except the bootstrap super admin.
2. Do Steps 1–4 together in one change, not staged across separate deploys — a controller with the guard added but permissions not yet seeded/granted will 403 every request except from a super admin.
3. Mention it in your PR description as a permissions change, not just a refactor — it's the kind of thing that's invisible in a diff (`@UseGuards(PermissionsGuard)` looks like a one-line addition) but changes who can call the endpoint in production.

This is exactly the situation `CompaniesController`, `JobsController`, `KeywordsController`, `ScrapeLogsController`, and `DashboardModule` are in today — none of them have been brought under `PermissionsGuard` yet (a deliberate scope cut when RBAC was first built, not an oversight). Bringing any of them in is a good first exercise for this whole guide.
