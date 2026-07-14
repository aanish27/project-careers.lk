# `apps/web` project structure

Adapted from [bulletproof-react](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md),
split across the two product areas this app serves: the public **job board**
and the admin **dashboard**.

## Why this shape

- Next.js App Router requires a single `app/` directory to do routing — you
  cannot have two routers. So `app/` stays as **one** folder containing only
  routes (`page.tsx`, `layout.tsx`, route groups), and it imports UI/logic
  from the two product folders below. Keep route files thin.
- Everything that _isn't_ routing (`components`, `config`, `features`,
  `hooks`, `lib`, `stores`, `types`, `utils`) is duplicated under
  `jobboard/` and `dashboard/`, because the two products share very little —
  different layouts, different users, mostly different domain logic.
- Anything genuinely used by **both** areas (shadcn primitives, the root
  Redux store, the generic fetch client) lives at `src/` top level instead of
  being duplicated.
- No barrel files (`index.ts` re-exporting everything) — they defeat
  tree-shaking and create import cycles. Import directly from the file.

## Tree

```
apps/web/src/
├── app/                                # routing ONLY — Next's required single router
│   ├── layout.tsx
│   ├── provider.tsx                    # global providers (store, theme, etc.)
│   ├── globals.css
│   ├── (public)/                       # job board routes → import from src/jobboard/*
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── jobs/{page.tsx,[slug]/page.tsx}
│   │   ├── companies/{page.tsx,[slug]/page.tsx}
│   │   ├── (auth)/{login,register}/page.tsx
│   │   └── (account)/{applications,profile}/page.tsx
│   └── admin/                          # admin routes → import from src/dashboard/*
│       ├── (auth)/login/page.tsx       # no dashboard chrome
│       └── (dashboard)/
│           ├── layout.tsx              # sidebar/topbar shell
│           ├── page.tsx
│           ├── jobs/{page.tsx,new/page.tsx,[id]/page.tsx}
│           ├── employers/page.tsx
│           ├── applicants/page.tsx
│           └── settings/page.tsx
│
├── components/ui/                      # TRUE global — shadcn primitives, used by both areas
├── config/                             # global config/env constants
├── hooks/                              # global shared hooks
├── lib/                                # generic reusable libs (api-client.ts)
├── stores/                             # root store.ts — combines jobboard + dashboard slices
├── testing/                            # test utils/mocks
├── types/                              # FE-only shared types (domain types live in @careerslk/types)
├── utils/                              # global shared utility functions
│
├── jobboard/                           # public job board product area
│   ├── components/                     # product-wide shared UI (public header/footer/nav)
│   ├── config/                         # nav links, etc.
│   ├── hooks/
│   ├── lib/
│   ├── stores/                         # jobboard slice(s), registered into root store
│   ├── types/
│   ├── utils/
│   └── features/
│       └── <feature>/{api,components,hooks,stores,types}
│           # e.g. jobs, companies, applications, auth (seeker)
│
└── dashboard/                          # admin panel product area
    ├── components/                     # DashboardSidebar, Topbar, IconSidebar
    ├── config/                         # sidebar-links.ts, icon-sidebar-links.ts
    ├── hooks/                          # use-sidebar-context.ts
    ├── lib/                            # session.ts (admin cookie handling)
    ├── stores/                         # sidebar slice
    ├── types/
    ├── utils/
    └── features/
        └── <feature>/{api,components,hooks,stores,types}
            # e.g. auth (admin login), jobs (admin CRUD), employers, applicants
```

### Inside a feature folder

Only create the sub-folders a feature actually needs — most won't need all
five.

| Folder        | Contents                                                |
| ------------- | ------------------------------------------------------- |
| `api/`        | Server actions / API request functions for this feature |
| `components/` | Components scoped to this feature only                  |
| `hooks/`      | Hooks scoped to this feature only                       |
| `stores/`     | Redux slice(s) for this feature's client state          |
| `types/`      | Types scoped to this feature only                       |

## Path aliases

Defined in `apps/web/tsconfig.json`. Prefer the specific alias over `@/*`
when one exists — it's shorter and signals intent.

| Alias                     | Resolves to                  | Example                                       |
| ------------------------- | ---------------------------- | --------------------------------------------- |
| `@ui/*`                   | `src/components/ui/*`        | `@ui/button`                                  |
| `@components/*`           | `src/components/*`           | `@components/ui/card`                         |
| `@config/*`               | `src/config/*`               | `@config/constants`                           |
| `@hooks/*`                | `src/hooks/*`                | `@hooks/use-debounce`                         |
| `@lib/*`                  | `src/lib/*`                  | `@lib/api-client`                             |
| `@stores/*`               | `src/stores/*`               | `@stores/store`                               |
| `@testing/*`              | `src/testing/*`              | `@testing/mocks`                              |
| `@types/*`                | `src/types/*`                | `@types/api`                                  |
| `@utils/*`                | `src/utils/*`                | `@utils/format-date`                          |
| `@jobboard/*`             | `src/jobboard/*`             | `@jobboard/features/jobs/components/job-card` |
| `@jobboard-components/*`  | `src/jobboard/components/*`  | `@jobboard-components/public-header`          |
| `@jobboard-config/*`      | `src/jobboard/config/*`      | `@jobboard-config/nav`                        |
| `@jobboard-hooks/*`       | `src/jobboard/hooks/*`       | `@jobboard-hooks/use-job-filters`             |
| `@jobboard-lib/*`         | `src/jobboard/lib/*`         | `@jobboard-lib/seeker-client`                 |
| `@jobboard-stores/*`      | `src/jobboard/stores/*`      | `@jobboard-stores/jobs.slice`                 |
| `@jobboard-types/*`       | `src/jobboard/types/*`       | `@jobboard-types/job`                         |
| `@jobboard-utils/*`       | `src/jobboard/utils/*`       | `@jobboard-utils/format-salary`               |
| `@jobboard-features/*`    | `src/jobboard/features/*`    | `@jobboard-features/jobs/components/job-card` |
| `@dashboard/*`            | `src/dashboard/*`            | `@dashboard/features/auth/api/auth.actions`   |
| `@dashboard-components/*` | `src/dashboard/components/*` | `@dashboard-components/topbar`                |
| `@dashboard-config/*`     | `src/dashboard/config/*`     | `@dashboard-config/sidebar-links`             |
| `@dashboard-hooks/*`      | `src/dashboard/hooks/*`      | `@dashboard-hooks/use-sidebar-context`        |
| `@dashboard-lib/*`        | `src/dashboard/lib/*`        | `@dashboard-lib/session`                      |
| `@dashboard-stores/*`     | `src/dashboard/stores/*`     | `@dashboard-stores/sidebar.slice`             |
| `@dashboard-types/*`      | `src/dashboard/types/*`      | `@dashboard-types/employer`                   |
| `@dashboard-utils/*`      | `src/dashboard/utils/*`      | `@dashboard-utils/format-date`                |
| `@dashboard-features/*`   | `src/dashboard/features/*`   | `@dashboard-features/auth/api/auth.actions`   |
| `@/*`                     | `src/*`                      | fallback for `app/` route files               |

## Migration status

Directory skeleton is scaffolded locally as empty folders (not tracked by
git until they hold real files) with `jobboard/features/jobs/` and
`dashboard/features/auth/` fleshed out as the reference features. Existing
files have **not** been moved yet. Planned mapping when that happens:

| Current location                                                                                          | New location                                  |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `components/ui/*`                                                                                         | `components/ui/*` (unchanged, already global) |
| `components/dashboard-sidebar.tsx`, `topbar.tsx`, `sidebar.tsx`, `sidebar-search.tsx`, `icon-sidebar.tsx` | `dashboard/components/`                       |
| `components/sidebar-links.ts`, `icon-sidebar-links.ts`                                                    | `dashboard/config/`                           |
| `components/contexts.ts`, `lib/use-context.ts`                                                            | `dashboard/hooks/`                            |
| `components/dashboard-providers.tsx`, `components/store-provider.tsx`                                     | merge into `app/provider.tsx`                 |
| `store/store.ts`                                                                                          | `stores/store.ts`                             |
| `store/sidebar-context.tsx`                                                                               | `dashboard/stores/sidebar.slice.ts`           |
| `lib/actions/auth.actions.ts`, `app/admin/login/login-form.tsx`                                           | `dashboard/features/auth/`                    |
| `lib/session.ts`, `lib/constants.ts` (admin-cookie bits)                                                  | `dashboard/lib/`                              |
| `lib/api-client.ts`, `lib/utils.ts`                                                                       | stay global (`lib/`, `utils/`)                |
| `app/admin/layout.tsx`                                                                                    | `app/admin/(dashboard)/layout.tsx`            |
| `app/admin/login/`                                                                                        | `app/admin/(auth)/login/`                     |
