# Admin Web Authentication & Authorization — Step-by-Step Implementation Guide

## Context

`apps/api` already has a complete JWT auth module (login/refresh/logout/me, access + refresh tokens, a `role` field on the User model), but `apps/web`'s admin panel has nothing wired to it: `apps/web/src/app/admin/login/page.tsx` is an unwired shadcn boilerplate stub (fake OAuth buttons, dead links, no `onSubmit`), there's no `apps/web/src/app/admin/layout.tsx`, no route protection, no API client, and no session handling anywhere in the frontend. This guide walks through building real login, session management, logout, and role-aware route protection for the admin panel, step by step, ending with a minimal protected placeholder page that proves the whole flow works.

**Chosen architecture: BFF (Backend-for-Frontend) pattern**, confirmed with you over a discussion of tradeoffs vs. a client-managed/in-memory-token approach. The Next.js server holds an httpOnly session cookie on its own origin; the browser never sees the API's access or refresh tokens. The Next server calls the NestJS API server-to-server for login/refresh/logout, attaching `Authorization: Bearer` itself. This closes the XSS token-theft surface (in-memory/interceptor storage narrows blast radius but doesn't eliminate it — any JS running on the page could still read a module-level variable) and matches the officially documented Next.js 16 pattern.

**Scope, confirmed with you:** auth scaffold only — login, session, logout, route protection, role-gate helper, one protected placeholder page. No dashboard/data screens, no users-management UI, no React Query/data-proxy routes (natural follow-ups, not part of this task). No self-registration page — admin accounts are created by other admins (`createdById` in the Prisma schema); `/auth/register` being publicly callable at all is a separate pre-existing backend concern, not addressed here.

**Framework note — read this before writing any code:** this is Next.js 16.2.2, confirmed via the bundled docs at `apps/web/node_modules/next/dist/docs/` to have real breaking changes from older Next.js/your training data (per `apps/web/AGENTS.md`'s warning):

- `middleware.ts` is renamed to **`proxy.ts`** (same functionality, `export function proxy(request)` instead of `export function middleware(request)`, still supports `export const config = { matcher }`, defaults to the Node.js runtime now — not Edge-only like older Next).
- `cookies()` from `next/headers` is **async**: `const cookieStore = await cookies()`.
- Server Actions + `useActionState` are the documented, idiomatic pattern for login forms (not a client-side `onSubmit` + manual `fetch`).
- **Cookie writes (`.set()`/`.delete()`) are only legal inside a Server Action or Route Handler — never during a plain Server Component render.** Reads are fine anywhere. This one is easy to miss until it throws at runtime (`Cookies can only be modified in a Server Action or Route Handler`), and it directly shapes the `getSession()`/`getValidAccessToken()` split in Step 6 below — a naive "read the cookie, and refresh-and-rewrite it if stale" reader will crash the moment it's called from `admin/layout.tsx` or `admin/page.tsx`, both of which are plain renders.

**Doc references you should actually read (all local, no internet needed):**

- `apps/web/node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` — proxy fundamentals, matcher config.
- `apps/web/node_modules/next/dist/docs/01-app/02-guides/authentication.md` — the exact pattern this plan follows: session cookies, the Data Access Layer (DAL)/`verifySession()` pattern, optimistic vs. secure checks, why layouts aren't a sufficient auth boundary.
- `apps/web/node_modules/next/dist/docs/01-app/02-guides/backend-for-frontend.md` — Route Handlers as a backend layer, proxying to another backend, security section on header handling.
- `apps/web/node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md` — exact `cookies()` API surface.
- `apps/api/src/modules/auth/*` — the real backend contract you're integrating against (controller, service, DTOs, strategies) — treat this as ground truth over anything below if they ever diverge.
- `apps/api/docs/decorators.guide.md` — background on `@Public`/`@Roles`/`@CurrentUser`, though note it's somewhat aspirational (mentions a `MODERATOR` role that doesn't exist, implies `RolesGuard` is global when it isn't) — cross-check against actual code, not this doc, for anything load-bearing.
- [jose docs](https://github.com/panva/jose) — `SignJWT`/`jwtVerify` API, used for signing the session cookie.

## Backend contract you're integrating against (do not modify these files)

Read `apps/api/src/modules/auth/auth.controller.ts`, `auth.service.ts`, `dto/auth.dto.ts`, and `strategies/jwt.strategy.ts` yourself before starting — this summary is a map, not a replacement for reading the real code:

- Base path `/api/v1`. All success responses wrapped by a global interceptor: `{ success: true, data: <payload>, meta: {...} }`. All errors wrapped by a global filter: `{ success: false, error: { code, message, details? }, meta: {...} }`, with normal HTTP status codes alongside.
- `POST /auth/login` — public, body `{ email, password }` → `data: { accessToken, user: { id, email, firstName, lastName, role } }`, plus response header `Set-Cookie: refreshToken=...; HttpOnly; Path=/api/v1/auth/refresh; SameSite=Lax` (7 days). Rate-limited 5 requests/min (429 beyond that).
- `POST /auth/refresh` — public, requires the `refreshToken` cookie on the request → `data: { accessToken, refreshToken }` — **note: no `user` field in the response.** Whatever session-refresh code you write must keep the previously-known `user` object and only replace the tokens.
- `POST /auth/logout` — requires `Authorization: Bearer <accessToken>` → clears the server-side refresh hash.
- Access token: 15-minute JWT, payload `{ sub, email, role }`. Must be sent as `Authorization: Bearer <token>` — the API's `JwtStrategy` uses `ExtractJwt.fromAuthHeaderAsBearerToken()` and never reads it from a cookie.
- Refresh token: 7-day JWT, only ever transmitted via the httpOnly cookie scoped to `/api/v1/auth/refresh`.
- Roles: exactly `ADMIN` and `SUPER_ADMIN` (uppercase — from `@careerslk/database`'s Prisma-generated enum). Backend role checks (`apps/api/src/common/guards/role.guard.ts`) are **exact-match, no hierarchy**: `requiredRoles.some(r => user.role === r)`. A `SUPER_ADMIN` does **not** automatically pass an `@Roles(ADMIN)`-only check. Mirror this exact-match behavior on the frontend — don't assume `SUPER_ADMIN` is "greater than" `ADMIN`.
- Do **not** import either backend `UserRole` enum into the frontend. `@careerslk/database` isn't a web dependency, and `@careerslk/types`'s own `UserRole` uses incompatible lowercase values (`'admin'`/`'super_admin'`) — a pre-existing naming collision between two same-named-but-different enums in the backend, out of scope to fix. Define your own frontend-local role constants instead (Step 3 below).
- The backend re-derives `role` fresh from the DB on **every** request (`JwtStrategy.validate()` calls `usersService.getFindById(payload.sub)`), never trusting a role embedded in a client-supplied token. This is why your frontend session cookie doesn't need to be a security-critical source of truth — just tamper-evident (explained in Step 6).
- Known, pre-existing, unrelated backend bug for awareness only: `RouterModule` in `apps/api/src/app.module.ts` nests `UsersModule` under `admin/users` and `admin/companies` incorrectly (double-segment paths result; `companies` mistakenly points at `UsersModule` instead of `CompaniesModule`). This does **not** affect `/auth/*` (`AuthModule` is registered directly, not through that router tree). Do not fix this as part of this task — it's unrelated to auth/authz.
- `apps/api/.env`'s `FRONTEND_URL=https://localhost:3000` (https) vs. Next dev's actual `http://localhost:3000` — harmless under the BFF pattern since the browser never calls the API cross-origin (CORS is a browser-only enforcement mechanism; server-to-server fetches from your Next server to the API aren't subject to it at all). Not fixed as part of this task, just flagged so it doesn't confuse you later if you ever add direct browser→API calls.

## Session design (read this fully before Step 6 — it's the crux of the whole implementation)

**Cookie:** name it `admin_session` (not `session`, to avoid confusion with the API's own `refreshToken` cookie name/semantics). Attributes: `httpOnly: true`, `secure: process.env.NODE_ENV === 'production'`, `sameSite: 'lax'`, `path: '/'`, rolling `maxAge` of 7 days — **reset on every successful refresh**, not fixed from the original login. This mirrors the backend's own behavior exactly (`/auth/refresh` rotates the refresh token and reissues its cookie with a fresh 7-day window each time), so an actively-used admin session effectively never expires while an idle one dies after 7 days.

**Why a cookie at all, and why on the Next.js domain specifically:** the API's refresh-token cookie is scoped to its own origin and to the exact path `/api/v1/auth/refresh` — it's useless to store or forward as-is, because the browser will only ever send it back to the API on that one path, and under the BFF pattern the browser never talks to the API at all. So the Next server needs its **own** cookie, on its own domain, holding whatever state it needs to act on the user's behalf when talking to the API server-to-server.

**Payload shape:**

```ts
interface SessionPayload {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'SUPER_ADMIN';
  };
  accessToken: string;
  accessTokenExpiresAt: number; // epoch ms
  refreshToken: string;
}
```

`accessTokenExpiresAt` is computed at issuance time (`Date.now() + ACCESS_TOKEN_TTL_MS`), not decoded from the JWT's `exp` claim — decoding would mean pulling in a JWT-parsing step for one field. Mirror the backend's `15m` default as a constant (Step 4); if it drifts from the real backend value it only affects how eagerly you proactively refresh, never actual security, since the backend independently and authoritatively rejects a truly-expired token regardless of what this field says.

**Signed, not encrypted — and why that split matters:**

- Signing (via `jose`'s `SignJWT`/`jwtVerify`, HS256, a new `SESSION_SECRET` env var) adds **tamper-evidence**: without it, a user could open devtools → Application → Cookies and hand-edit the cookie's JSON, e.g. flip `user.role` to `SUPER_ADMIN`, and your frontend's own optimistic role-gate would be fooled by it.
- It would **never** fool the backend, because the backend re-derives role from the DB on every call — so the actual blast radius of _not_ signing is bounded to "the frontend's own UI shows/hides the wrong buttons," not a real privilege escalation. Signing is still worth doing (cheap, one dependency, the officially documented pattern) as defense-in-depth, but understand it is not your real security boundary — the backend is.
- **Not encrypting is deliberate, not an oversight:** the cookie is already `httpOnly`, so client-side JS can't read it regardless of signing or encryption. Nothing in the payload is independently sensitive beyond what the two already-opaque, backend-signed JWTs inside it already gate. Encrypting would add real implementation complexity (key management, `jose`'s `EncryptJWT` instead of `SignJWT`) for no corresponding security gain here.

**The single trickiest implementation detail — read this twice before Step 5:** Node's server-side `fetch` (what Next uses under the hood) has **no cookie jar**. It does not automatically store or resend cookies the way a browser does. Concretely:

1. When you call `POST /auth/login` or `POST /auth/refresh` from your Next server, the API's `Set-Cookie: refreshToken=...` response header will **not** be "handled" for you — you must read it manually off the `Response` object (`response.headers.getSetCookie()`), and parse the actual token value out of it (split on `;`, take the part before it).
2. When you later call `POST /auth/refresh`, you must manually attach `Cookie: refreshToken=<value>` as a **request** header yourself, using the value you extracted and stored in your own session payload. Without this, the API's refresh handler (`req.cookies[REFRESH_COOKIE]`) will see no cookie at all and always 401.

This logic belongs in exactly one place (the API client module, Step 5) so it's never duplicated.

**Refresh strategy — proactive, not reactive, and why:** given this is a low-QPS internal admin tool with no proxied data-fetch routes yet in this scope, there's no call site for "retry after a 401" to attach to — the only place an access token is used at all is inside the session-reading function itself. So: check `accessTokenExpiresAt` against a small buffer (e.g. 60s) every time a valid token is needed, and refresh transparently before returning it if it's stale or about to be.

**But — refresh means a cookie write, and cookie writes are only legal in a Server Action or Route Handler (see the framework note above).** `admin/layout.tsx` and `admin/page.tsx` are plain Server Component renders, not Server Actions or Route Handlers, so a single "read-and-maybe-refresh" function cannot be called from both places safely. The resolution is to split the reader into two functions with different contracts:

- **`getSession()` — render-safe, read-only.** Decrypts the cookie and returns it as-is, including a possibly-stale `accessToken`. No network call, no write, safe to call from anywhere (layouts, pages, actions). This is fine because a stale `accessToken` sitting unused in a cookie is harmless — it only matters at the moment something is about to _use_ it to call the API, and the placeholder page in this scope never does that; it just reads `user.firstName` off the payload for display.
- **`getValidAccessToken()` — write-capable, restricted to Server Actions/Route Handlers.** Calls `getSession()` internally, checks staleness, and if a refresh is needed, calls the API and **persists** the rotated tokens via a cookie write — which is only legal because this function is documented and enforced-by-convention to only ever be called from a context where that's allowed (the `logout` Server Action today; any future data-fetching Route Handler once React Query/axios is added, per the follow-up pattern discussed separately).

Both are wrapped in React's `cache()` so `getSession()` only actually decrypts once per request even if multiple components read it, and so a single `getValidAccessToken()` call within one Server Action/Route Handler invocation only triggers at most one refresh — this matters because the backend **rotates and invalidates** the previous refresh token on every use, so two near-simultaneous refresh calls using the same stale token would race and the loser would get logged out.

## Step-by-step build order

### Step 0 — save this plan into the repo

Done — this file.

### Step 1 — environment variables

Create `apps/web/.env.example` (committed) and `apps/web/.env.local` (gitignored, real dev values):

```
API_URL=http://localhost:8000/api/v1
SESSION_SECRET=<generate with: openssl rand -base64 32>
```

**Why not `NEXT_PUBLIC_`-prefixed:** both are read exclusively in server-only modules (Steps 5–6, Server Actions, `proxy.ts`). `NEXT_PUBLIC_` vars get inlined into client bundles — the whole point of the BFF pattern is that the browser never needs the API's location or any secret, so prefixing these would be actively wrong, not just unnecessary.

### Step 2 — install `jose`

Add `jose` to `apps/web/package.json` dependencies. It's the session-signing library the Next.js docs themselves recommend (`app/lib/session.ts`'s `encrypt`/`decrypt` example uses it), and it's zero-dependency and Node/Edge-runtime-compatible.

### Step 3 — `apps/web/src/lib/roles.ts`

```ts
export const ROLES = { ADMIN: 'ADMIN', SUPER_ADMIN: 'SUPER_ADMIN' } as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];
```

**Why a new file instead of importing a backend enum:** explained above — neither backend `UserRole` enum is safe to import (one's not a web dependency, the other has incompatible values). This file is the frontend's single source of truth for role strings, matching the Prisma enum's actual uppercase values.

### Step 4 — `apps/web/src/lib/constants.ts`

Define and export: `ACCESS_TOKEN_TTL_MS` (15 _ 60 _ 1000, mirroring the backend's `JWT_ACCESS_TOKEN_EXPIRES_IN` default), `SESSION_MAX_AGE_MS` (7 _ 24 _ 60 _ 60 _ 1000, mirroring `JWT_REFRESH_TOKEN_EXPIRES_IN`), `REFRESH_THRESHOLD_MS` (a buffer, e.g. 60 \* 1000, for the proactive-refresh check), `SESSION_COOKIE_NAME = 'admin_session'`.
**Why centralize these:** they're read from at least three different files (session.ts, proxy.ts indirectly, and the login action) — defining them once avoids silently-drifting magic numbers.

### Step 5 — `apps/web/src/lib/api-client.ts` (`import 'server-only'` at the top)

This is the only module that talks to the NestJS API over the network. Build:

- `class ApiError extends Error { constructor(public status: number, public code: string, message: string, public details?: unknown) }` — a typed error so callers (the login action, Step 8) can branch on `status`/`code` instead of parsing strings.
- `async function apiFetch<T>(path: string, init?: RequestInit): Promise<{ data: T; setCookies: string[] }>` — calls `fetch(`${process.env.API_URL}${path}`, init)`, parses the JSON body once, and:
  - if `body.success` is true → returns `{ data: body.data, setCookies: res.headers.getSetCookie() }` (the envelope-unwrapping logic described in the backend contract section above).
  - if false → throws `new ApiError(res.status, body.error.code, body.error.message, body.error.details)`.
  - if the `fetch` call itself throws (network failure) → catch and rethrow as `ApiError(0, 'NETWORK_ERROR', ...)` so callers have one error type to handle.
- `async function loginRequest(email: string, password: string)` → `POST /auth/login`, extracts the `refreshToken` value out of the `Set-Cookie` header returned in `setCookies` (this is the "no cookie jar" detail from the session design section — implement it here, nowhere else), returns `{ user, accessToken, refreshToken }`.
- `async function refreshRequest(refreshToken: string)` → `POST /auth/refresh` with a manually-set `Cookie: refreshToken=${refreshToken}` request header, again extracts the rotated `refreshToken` from the response's `Set-Cookie`, returns `{ accessToken, refreshToken }`.
- `async function logoutRequest(accessToken: string)` → `POST /auth/logout` with `Authorization: Bearer ${accessToken}`.

**Why this needs to exist as its own module, separate from session.ts:** it isolates "how to talk to the API" (URLs, headers, envelope shape, cookie extraction) from "how to manage the session" (cookie signing, storage, refresh timing) — session.ts should be able to call `loginRequest`/`refreshRequest` without knowing anything about HTTP, and api-client.ts should have zero knowledge of cookies-on-the-Next-domain or jose signing.

### Step 6 — `apps/web/src/lib/session.ts` (`import 'server-only'`)

Build, in this order (each depends on the previous):

1. `encryptSession(payload: SessionPayload): Promise<string>` and `decryptSession(token: string): Promise<SessionPayload | null>` — thin wrappers around `jose`'s `SignJWT`/`jwtVerify` using `SESSION_SECRET`. `decryptSession` must **never throw** — catch any verify/parse failure and return `null`, since callers (including `proxy.ts` in Step 9) treat "invalid cookie" and "no cookie" identically.
2. `createSession(payload: SessionPayload): Promise<void>` — signs the payload, calls `(await cookies()).set(SESSION_COOKIE_NAME, signed, { httpOnly: true, secure: ..., sameSite: 'lax', path: '/', maxAge: SESSION_MAX_AGE_MS })`.
3. `updateSessionTokens(patch: { accessToken; accessTokenExpiresAt; refreshToken }): Promise<SessionPayload>` — reads the current cookie, merges in just the new token fields (**keeps the existing `user` object**, since `/auth/refresh` doesn't return one — this is exactly the "note" flagged in the backend contract section), re-signs, re-sets the cookie with a **fresh** `maxAge` (the rolling-window behavior described in the session design section), returns the merged payload.
4. `destroySession(): Promise<void>` — `(await cookies()).delete(SESSION_COOKIE_NAME)`.
5. `getSession = cache(async (): Promise<SessionPayload | null> => { ... })` — **render-safe, read-only.** Reads the cookie, verifies it via `decryptSession`, and returns the payload exactly as stored — including a possibly-stale `accessToken`. No network call, no cookie write. Safe to call from anywhere, including plain Server Component renders (`admin/layout.tsx`, `admin/page.tsx`), because it never attempts a write.
6. `verifySession = cache(async (): Promise<SessionPayload> => { const s = await getSession(); if (!s) redirect('/admin/login'); return s })` — the redirecting variant, for use in pages. Still render-safe (redirects don't count as cookie writes).
7. `async function requireRole(allowedRoles: Role[]): Promise<SessionPayload>` — calls `verifySession()`, then checks `allowedRoles.includes(session.user.role)` (exact match, mirroring the backend's `RolesGuard` semantics described above — no hierarchy), `redirect('/admin/login')` if not allowed, else returns the session.
8. `async function getValidAccessToken(): Promise<string | null>` — **the only function in this module allowed to write the cookie, and therefore the only one allowed to be called from a Server Action or Route Handler — never from a layout/page render.** Calls `getSession()`; if `accessTokenExpiresAt` is within `REFRESH_THRESHOLD_MS` of now (or already past), calls `refreshRequest(session.refreshToken)` and, on success, persists the rotated tokens via `updateSessionTokens(...)` (a cookie write — legal here because of the calling-context restriction) and returns the fresh `accessToken`; on failure (refresh token itself dead), calls `destroySession()` (also a legal write here) and returns `null`. If the cached token is still fresh, returns it without any network call.

**Why `getSession()`/`verifySession()` and `getValidAccessToken()` need to be separate functions, not one:** two independent constraints point the same way. First, `proxy.ts` (Step 9) needs a non-network, non-redirecting signature-check-only behavior — it must never make an outbound refresh call on every navigation (the Next docs are explicit that proxy runs on every request including prefetches, and should stay fast/local), so it uses `decryptSession()` directly, bypassing all of the above. Second, and the reason `getSession()` itself no longer refreshes at all: refreshing means writing the cookie, and Next.js only permits cookie writes inside a Server Action or Route Handler — never a plain render. `admin/layout.tsx` and `admin/page.tsx` (Steps 10–11) call `getSession()`/`verifySession()` during ordinary renders, so those two must stay strictly read-only. `getValidAccessToken()` carries the refresh-and-persist responsibility instead, and is only ever called from somewhere writes are legal — today, the `logout` Server Action (Step 7); in the future, any Route Handler built to proxy real API data (see the React Query/axios follow-up pattern discussed separately — those Route Handlers should call `getValidAccessToken()`, never read `session.accessToken` directly off `getSession()`).

### Step 7 — `apps/web/src/lib/actions/auth.actions.ts` (`'use server'` at the top)

Build:

- `login(state: LoginFormState, formData: FormData): Promise<LoginFormState>` where `LoginFormState = { error?: string; fieldErrors?: { email?: string; password?: string } } | undefined`:
  1. Pull `email`/`password` off `formData`, do minimal presence/shape checks (no schema library needed for two fields — see the note on this below).
  2. Call `loginRequest(email, password)`.
  3. On success: compute `accessTokenExpiresAt = Date.now() + ACCESS_TOKEN_TTL_MS`, call `createSession({...})`, then `redirect(...)` — target a validated same-origin `from` search param if present (validate it's a relative path starting with `/`, to avoid an open-redirect via a crafted `?from=https://evil.com`), else `/admin`.
  4. On `ApiError`: branch on `.status` — `401` → surface `.message` directly (the backend's own "Invalid credentials"/"Account is inactive" text, since both collapse to 401 and are meant to be shown); `429` → return a **static, frontend-authored** message like "Too many login attempts. Please wait a minute and try again." (do not pass through the raw throttle exception text — it's not meant for end users and its exact shape isn't guaranteed); `400` → attempt to map `.details` (an array of validator messages, per `HttpExceptionFilter`'s shape) onto `fieldErrors`, else fall back to `.error`; anything else (including `NETWORK_ERROR`) → a generic "Something went wrong. Please try again."
  - **Why `redirect()` must be called outside any try/catch that wraps the above:** Next's `redirect()` works by throwing a special internal signal that the framework catches higher up — if your own `try { ... } catch (e) { return {error: ...} }` around the whole function also catches that throw, the redirect silently turns into an error state instead of navigating. Structure the function so `redirect()` is the last statement in the success path, not inside the same catch block as the API call.
- `logout(): Promise<void>`: since this is a Server Action, cookie writes are legal here — calls `getValidAccessToken()` (not `getSession()`) so the server-side logout call has a genuinely fresh token even if the cached one had gone stale; if it returns non-null, calls `logoutRequest(accessToken)` wrapped in a `.catch(() => {})` (still best-effort — even a fresh token's logout call failing shouldn't block the user from logging out locally), then unconditionally `destroySession()` and `redirect('/admin/login')`.

**Why validate `from` before redirecting to it:** an unvalidated redirect target taken from a query param is a classic open-redirect vector — even though the impact here is limited (redirecting _after_ a successful login, not before), it costs nothing to check `from.startsWith('/')` and reject anything else, so do it.

### Step 8 — login page rewrite

Two files:

- `apps/web/src/app/admin/login/login-form.tsx` (`'use client'`): owns `const [state, formAction, pending] = useActionState(login, undefined)`. Reuse the existing shadcn primitives already imported by the current stub — `Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`, `Field`/`FieldGroup`/`FieldLabel`, `Input`, `Button` — plus `FieldError` from `apps/web/src/components/ui/field.tsx` (already exported there, currently unused by the stub — confirmed by reading the file) to render `state?.error`/`state?.fieldErrors`. Keep the existing `name="email"`/`name="password"` attributes on the inputs — Server Actions read submitted values via `FormData`, keyed by `name`. Disable the submit button and show a pending indicator while `pending` is true.

- `apps/web/src/app/admin/login/page.tsx` (rewrite, stays a Server Component): reads `searchParams.from`, renders `<LoginForm />`. **Delete**, don't keep-but-hide: the "Acme Inc." brand block and `IconLayoutRows` icon, the fake "Login with Apple"/"Login with Google" buttons and the `FieldSeparator` "Or continue with" divider, the dead "Forgot your password?" / "Sign up" / "Terms of Service" / "Privacy Policy" links (`href="#"`). Replace the branding with plain text, e.g. "careers.lk Admin" — there's no logo/icon system elsewhere in the app to match, so don't invent one; keep it minimal per the agreed scope.

### Step 9 — `apps/web/src/proxy.ts`

```
matcher: ['/admin/:path*']
```

Logic: read `request.cookies.get('admin_session')?.value`, run it through `decryptSession()` (imported from session.ts — signature-verify only, **not** `getSession()`/`verifySession()`). If no valid session and the path isn't `/admin/login` → `NextResponse.redirect` to `/admin/login?from=<original path>`. If a valid session exists and the path _is_ `/admin/login` → redirect to `/admin` (no reason to show a logged-in user the login form again).

**Why the matcher is just `/admin/:path*` and not the broader negative-lookahead pattern shown in the Next.js docs example** (which excludes `_next/static`, images, etc.): that broader pattern exists for guarding an entire site; here, nothing outside `/admin` needs gating in this scope (the `(public)` route group is explicitly out of scope), so a narrow positive matcher is simpler and equally correct.

**Why this must stay network-free:** proxy runs on every navigation to a matched path, including prefetches the browser fires speculatively — the Next.js docs are explicit that proxy "is not intended for slow data fetching" and optimistic checks should read only the cookie. `verifySession()` at the page level (Step 11) is only about "does a session exist" (still no refresh — it's also render-safe, per Step 6). Token freshness itself is only ever handled by `getValidAccessToken()`, and only at the point something is about to call the API from a Server Action/Route Handler — not on ordinary page loads.

### Step 10 — `apps/web/src/app/admin/layout.tsx`

A Server Component that calls the **non-redirecting** `getSession()` (not `verifySession()`) purely to render shared chrome: a header showing `user.firstName` and a `<form action={logout}><button type="submit">Log out</button></form>`. If `getSession()` returns `null` here, render minimal/no chrome rather than redirecting.

**Why the layout must not redirect, and why it calls `getSession()` not `verifySession()`:** the Next.js authentication guide explicitly warns that layouts don't re-render on client-side navigation between sibling routes (due to Partial Rendering), so a layout-level redirect check would not reliably re-run on every navigation the way `proxy.ts` does — making the layout an unreliable, sometimes-stale auth boundary if you relied on it alone. `proxy.ts` (Step 9) already guarantees an unauthenticated request never reaches this layout in the first place, so a second redirect here would either be dead code or, worse, behave inconsistently. The layout's job is display only.

### Step 11 — `apps/web/src/app/admin/page.tsx`

```ts
export default async function AdminHomePage() {
  const { user } = await verifySession()
  return (
    <div>
      <h1>Welcome, {user.firstName}</h1>
      <form action={logout}><button type="submit">Log out</button></form>
    </div>
  )
}
```

This is the post-login landing page and the proof that the whole flow works end to end. It calls the **redirecting** `verifySession()` (Step 6) — this page is where the real auth boundary for this specific route lives, per the same Next.js docs guidance referenced in Step 10 ("do the checks close to your data source / the component that'll be conditionally rendered," not solely in a shared layout). Gets user data straight from the session payload — no extra `/auth/me` round-trip needed for this scope.

## Edge cases — decisions already made, implement accordingly

- **Refresh token itself expired/invalid:** `getValidAccessToken()` (Step 6.8) catches the `refreshRequest` failure, destroys the cookie, returns `null` — this only surfaces the next time something calls `getValidAccessToken()` from a writable context (e.g. the user hits `logout`, or a future Route Handler tries to fetch data). At that point, `destroySession()` clears the cookie, so the _next_ page navigation's `proxy.ts` check (or `verifySession()`) sees no valid session and redirects to login like any unauthenticated case — no special-case messaging needed. Note this means a dead refresh token doesn't force an _immediate_ redirect on its own; it's discovered lazily, at the next point of actual use.
- **Login throttle (429):** always show the static frontend-authored message from Step 7, never the raw backend throttle text.
- **`isActive: false` users:** already fully handled server-side (401 at login with "Account is inactive," and 401 on every subsequent request if deactivated mid-session, per `JwtStrategy.validate()`). Do **not** add a duplicate `isActive` check anywhere on the frontend — both cases already collapse into the existing 401-handling paths in Steps 7 and 6.
- **Stale cached `user.role`/name if another admin edits this user mid-session:** accepted limitation — `/auth/refresh` doesn't return an updated `user`, so the cookie's snapshot can lag until the next full login. This is safe because the backend always re-derives `role` from the DB for actual authorization; only the frontend's optimistic UI can lag, never real access control.
- **Concurrent tabs racing a refresh:** accepted limitation for a low-traffic internal tool — the backend's refresh-token rotation means a losing concurrent refresh 401s and that tab gets logged out. `cache()`-scoping on `getValidAccessToken()` (Step 6.8) keeps this to at most once _per Server Action/Route Handler invocation_, but doesn't prevent two genuinely simultaneous requests (e.g. two different tabs both hitting `logout` at once) from racing.
- **Do not** enable Next 16's experimental `authInterrupts`/`unauthorized()`/`forbidden()` file conventions for this scope — plain `redirect('/admin/login')` covers both "not authenticated" and "wrong role" cases, since there are no role-differentiated routes yet to distinguish.
- **No `zod`/`react-hook-form` install** — the login form has 2 fields; handle validation manually in the Server Action (Step 7). Revisit if a richer form (e.g. an eventual settings page) needs it later.

## Verification checklist

1. Run `pnpm dev:web` and `pnpm dev:api` concurrently (or `pnpm dev` for both), against a seeded DB user (the repo has a user seeder per recent commit history — check `packages/database` for it).
2. Visit `http://localhost:3000/admin` while logged out → confirm `proxy.ts` redirects to `/admin/login?from=%2Fadmin`.
3. Submit wrong credentials → confirm the friendly 401 error renders inline on the form, no redirect happens.
4. Submit correct credentials → confirm redirect to `/admin` (or back to the original `from` path if you started at step 2), and the header shows the logged-in user's first name.
5. Open devtools → Application → Cookies → confirm `admin_session` is present, `HttpOnly` is checked, and the value is an opaque signed token, not raw readable JSON.
6. Click logout → confirm redirect to `/admin/login` and the cookie is cleared; revisiting `/admin` redirects to login again.
7. Manually corrupt the `admin_session` cookie's value in devtools, then reload `/admin` → confirm a graceful redirect to login (the `decryptSession` signature-failure path), not a crash or unhandled error.
8. Reloading `/admin` after the access token goes stale does **not** trigger a refresh in this scope — `getSession()`/`verifySession()` are read-only by design (Step 6), and this page never calls the API. To actually exercise `getValidAccessToken()`'s proactive-refresh path: temporarily lower `ACCESS_TOKEN_TTL_MS` (frontend) and the backend's `JWT_ACCESS_TOKEN_EXPIRES_IN` env var to something like `10s`, log in, wait past that window, then click **Log out** → confirm the network tab shows a successful `POST /auth/refresh` (triggered inside the `logout` Server Action via `getValidAccessToken()`) followed by a successful `POST /auth/logout`, rather than the logout call failing/being skipped. Revert both values afterward. (Once a real data-fetching Route Handler exists, re-verify this same refresh path from that call site too.)
9. Submit 6+ rapid login attempts with wrong credentials within a minute → confirm the 6th attempt shows the static rate-limit message from Step 7, not a raw/technical throttle error.
