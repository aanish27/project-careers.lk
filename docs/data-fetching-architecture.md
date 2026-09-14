# Data Fetching & Mutation Architecture

`apps/web` intentionally runs two different data-fetching stacks:

- `src/web-app/` (public site + `/account`): Next.js Server Components/Server
  Actions + a `fetch` wrapper.
- `src/dashboard/` (internal admin panel): React Query + axios, behind a
  same-origin BFF route.

This doc explains what each does, why they differ, and where they intentionally
overlap.

## Side by side

|                 | web-app                                                                                        | dashboard                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Rendering       | Server Components, data fetched at render time                                                 | Client Components (`"use client"`), SPA-style                                                           |
| Fetch mechanism | `fetch` via `apiFetch()` in `apps/web/src/lib/api-client.ts`                                   | axios instance in `apps/web/src/dashboard/lib/axios.ts`                                                 |
| Mutations       | Server Actions (`"use server"`), via `useActionState` / `startTransition`                      | `useMutation` (React Query)                                                                             |
| Cache           | None — Next.js render cache + `redirect()` after mutation                                      | React Query cache, `invalidateQueries` on mutation success                                              |
| Auth target     | Calls the backend API directly from the server, Bearer token read from a signed session cookie | Calls a same-origin BFF (`/api/server/[...path]`), which attaches the Bearer token; axios never sees it |

## Why two patterns exist

1. **SEO forces web-app to be server-rendered.** Job listings, job detail
   pages, pSEO pages, sitemap/robots must be crawlable HTML on first response.
   Server Components fetching directly, plus Server Actions for mutations, is
   the fit — no client cache needed because the server is re-rendered on every
   navigation anyway.

2. **The dashboard has no SEO concern and is interaction-heavy.** Sortable
   tables, approve/reject actions, live edits, toasts. React Query solves
   exactly this: dedup, background refetch, `invalidateQueries` after a
   mutation. Doing this the web-app way would mean a full reload or manual
   `router.refresh()` after every click.

3. **The auth transport differs for a structural reason, not inconsistency.**
   - web-app: Server Actions run **on the server**, so they read the httpOnly
     session cookie directly (`getValidWebUserAccessToken()` in
     `web-user-session.ts`) and call the backend with a Bearer token — the
     token never reaches the browser.
   - dashboard: axios runs **in the browser**, which cannot safely hold a
     token or read an httpOnly cookie. It calls
     `apps/web/src/app/api/server/[...path]/route.ts`, a Next.js Route Handler
     acting as a BFF: it reads/refreshes the session server-side and forwards
     the request with `Authorization: Bearer`.

4. **`/account` uses Server Actions too, despite not being an SEO page —
   deliberately, not by default.** The reasons hold independent of crawlers:
   - No BFF/proxy route exists for the web-user session (only the dashboard
     has one, for admin sessions). Building one just for `/account` would
     duplicate infrastructure Server Actions already give for free.
   - No client-server waterfall: `account/company/page.tsx` fetches server-side
     so the page renders already populated, instead of
     empty-state → spinner → data on every load.
   - The interaction shape is simple forms that `redirect()` on success, not a
     persistent client-side data structure needing cache coherence across
     widgets — so React Query wouldn't be paying for anything.
   - Progressive enhancement (form still submits if JS fails to hydrate) and
     built-in CSRF origin-checking are user-visible benefits, not just
     SEO-adjacent ones.

   Where this would flip: a genuinely dashboard-like screen inside `/account`
   (e.g. a live-filtered "manage applications" board with several widgets that
   must update together without a full-page redirect) is exactly where wrapping
   the existing Server Action as a React Query `queryFn`/`mutationFn` earns its
   keep for that one page — not porting all of `/account` to axios+BFF.

## What's shared (proof this is a deliberate split, not drift)

- **Zod schemas** in `packages/types` (`@careerslk/types`) — e.g.
  `updateJobSchema`, company schemas — are imported by both the dashboard's
  `api.ts` files and the web-app's `*.actions.ts` files. One validation source
  of truth on both sides.
- `apps/web/src/lib/query-client.ts` (`makeQueryClient`, `staleTime: 60_000`,
  `retry: 1`) is shared config. web-app even has its own `QueryProvider` for
  incidental client interactivity — it's just not the primary loading
  mechanism there.
- Both sides use the same signed-JWT-in-httpOnly-cookie session design
  (`jose`), just read from different execution contexts (Server Action vs.
  Route Handler), because only one of them runs somewhere that can safely
  hold a bearer token.
- **The two patterns already bridge on purpose.** `use-jobs-query.ts`
  (`apps/web/src/web-app/features/jobs/hooks/use-jobs-query.ts`) wraps the
  Server Action `listJobsAction` as a React Query `queryFn` for the
  infinite-scroll job listing — proving Server Actions and React Query are not
  mutually exclusive: Server Actions stay the auth-safe transport, React Query
  is layered on top only where a page needs client-side pagination/cache
  behavior after an SSR'd first page.

## Code walkthrough

### web-app: `apiFetch` + Server Actions

`apps/web/src/lib/api-client.ts:53-99` — `"server-only"` generic fetch
wrapper; unwraps the API's `{success, data}` / `{success:false, error}`
envelope; throws a typed `ApiError`; auto-attaches a bearer token when called
with `{ auth: true }`.

```ts
if (auth) {
  accessToken = await getValidWebUserAccessToken();
  if (!accessToken) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
}
res = await fetch(`${process.env.API_URL}${path}`, { ...requestInit, headers: {...} });
const body = await res.json();
if (body.success) return { data: body.data, setCookies: res.headers.getSetCookie() };
throw new ApiError(res.status, body.error.code, body.error.message, body.error.details);
```

`apps/web/src/web-app/lib/web-user-client.ts` layers one typed function per
endpoint on top of `apiFetch` (`fetchMyCompanyRequest`, `submitJobRequest`,
`createCompanyRequest`, ...).

`apps/web/src/web-app/lib/web-user-session.ts`:

- `getWebUserSession` (React `cache()`-wrapped) — safe read-only accessor for
  use during render; never mutates cookies.
- `getValidWebUserAccessToken()` — refreshes and persists a rotated token when
  near expiry; only safe inside Server Actions/Route Handlers (Next.js only
  allows cookie writes there).

Two Server Action shapes, both `"use server"`:

- **Form actions** — `(prevState, formData) => newState`, consumed via
  `useActionState`:
  ```tsx
  const [state, formAction, isPending] = useActionState(postJob, undefined);
  <form action={formAction}>
  ```
- **Imperative actions** (`withdrawJob`, `saveJob`/`unsaveJob`, `claimCompany`)
  — plain async functions called via `startTransition` from click handlers,
  returning a discriminated union:
  ```tsx
  startTransition(async () => {
    const result = next ? await saveJob(jobId) : await unsaveJob(jobId);
    if ('ok' in result) return;
  });
  ```

Validation: `apps/web/src/web-app/lib/form-validation.ts`
(`extractFormData`, `fieldErrorsFromZod`) against zod schemas from
`packages/types`. No `revalidatePath`/`revalidateTag` in this layer —
mutations rely on `redirect()` forcing a fresh server render.

### dashboard: axios + React Query

`apps/web/src/dashboard/lib/axios.ts` — `baseURL: "/api/server"`, response
interceptor unwraps the envelope, error interceptor hard-redirects to
`/admin/login` on 401 (refresh already failed server-side by that point).

`apps/web/src/app/api/server/[...path]/route.ts` — the BFF: reads/refreshes
the session, forwards the request with `Authorization: Bearer`.

Per-feature structure: `api/api.ts` (axios calls) → `hooks/query-keys.ts`
(key factories) → `hooks/use-*.ts` (one `useQuery`/`useMutation` each) →
consumed directly in `"use client"` components (`company-detail.tsx`,
`job-detail.tsx`).

Standard mutation shape:

```ts
useMutation({
  mutationFn: (id: number) => jobsApi.approve(id),
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });
    queryClient.invalidateQueries({ queryKey: jobsKeys.detail(data.id) });
    toast.success('Job approved');
  },
  onError: (error) => toast.error(toMessage(error, 'Failed to approve job')),
});
```

No optimistic updates (`onMutate`) anywhere in the codebase currently —
invalidate-and-refetch only.

## Bottom line

The split tracks a real architectural boundary: SEO-critical/read-heavy pages
get server-rendered fetch + Server Actions; the internal, interaction-heavy
admin app gets a client cache library behind a token-injecting BFF.
`/account` stays on the Server Action side even without an SEO need, because
it shares the same session/auth infrastructure and its mutations are simple
submit-then-redirect flows that don't benefit from a client cache. Where a
future `/account` screen needs dashboard-like live interactivity, the fix is
to wrap the existing Server Action as a React Query fetcher/mutator for that
page (as `use-jobs-query.ts` already does for job listings) — not to build a
parallel BFF+axios stack.
