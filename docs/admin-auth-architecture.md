# Admin Web Auth Architecture (BFF Pattern)

Companion to [`admin-auth-plan.md`](./admin-auth-plan.md) (the step-by-step build guide). This document is the architecture reference: what talks to what, what each cookie is for, and where the real security boundary is versus what's just UX.

## 1. High-level picture

```
┌──────────────┐          ┌───────────────────────┐          ┌──────────────────┐
│   Browser    │          │   Next.js server       │          │   NestJS API     │
│ (admin user) │          │   apps/web             │          │   apps/api       │
│              │          │   localhost:3000       │          │   localhost:8000 │
└──────┬───────┘          └───────────┬────────────┘          └────────┬─────────┘
       │                              │                                │
       │  1 cookie only:              │  2 cookies only:               │
       │  admin_session (httpOnly,    │  - admin_session (reads/writes │
       │  signed, this domain)        │    on ITS OWN domain)          │
       │                              │  - refreshToken (received      │
       │  Browser never sees or       │    from API, re-extracted      │
       │  sends the API's tokens.     │    manually, stored INSIDE     │
       │  It only ever talks to       │    admin_session, never set    │
       │  the Next.js server.         │    as a browser-facing cookie) │
       │                              │                                │
       │──── HTTP (same-origin) ────▶│                                │
       │                              │──── server-to-server fetch ──▶│
       │                              │      Authorization: Bearer     │
       │                              │      <accessToken>             │
       │                              │◀──── JSON + Set-Cookie ────────│
       │◀──── HTML / redirect ───────│                                │
```

**The core idea:** the browser has exactly one relationship — with the Next.js server, same-origin, one cookie. The Next.js server has exactly one relationship — with the NestJS API, server-to-server, using the two tokens the API issues. Nothing about the API's token model is ever exposed across that first boundary.

## 2. Why this shape (the one-sentence version)

The API's access token must be sent as a bearer header (not cookie-based), which means whoever holds it can impersonate the user to the API. Keeping that token server-side, behind an httpOnly cookie the browser can't read even under XSS, means a compromised page script still can't steal it — it can only ride along on requests the Next server itself chooses to make. See §7 for the full threat-model breakdown.

## 3. Components and responsibilities

| Component                                                 | Lives in                                                                       | Responsibility                                                                                                                                                                    | Must NOT do                                                                                                                                                |
| --------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin_session` cookie                                    | Browser, set by Next server                                                    | Carries a signed blob (`user`, `accessToken`, `accessTokenExpiresAt`, `refreshToken`) between the browser and the Next server                                                     | Be readable by client JS (httpOnly), be sent to the API (wrong domain entirely)                                                                            |
| `refreshToken` cookie                                     | Never touches the browser under this design                                    | The API sets this on its _own_ login/refresh responses, scoped to its own origin + `/api/v1/auth/refresh` path                                                                    | — the Next server reads it once off the response header and re-stores the raw value inside `admin_session`; it is not forwarded to the browser as a cookie |
| `proxy.ts`                                                | Next server, runs on every `/admin/*` request                                  | Optimistic gate: is there a validly-signed session cookie at all? Redirect to `/admin/login` if not                                                                               | Make network calls, refresh tokens, or be treated as the real security boundary                                                                            |
| `session.ts` — `getSession`/`verifySession`/`requireRole` | Next server, called from **plain renders** (layouts, pages) as well as actions | **Read-only.** Decrypt + return the cookie's payload as-is (the `accessToken` inside may be stale), redirect if missing/invalid/disallowed role                                   | Write the cookie in any way — no refresh, no rotation, no `destroySession()`                                                                               |
| `session.ts` — `getValidAccessToken`                      | Next server, **only** from Server Actions/Route Handlers                       | The one function allowed to write the cookie: checks `accessTokenExpiresAt`, refreshes-and-persists via the API if stale, `destroySession()`s if the refresh token itself is dead | Be called from a layout or page render — throws at runtime if it is                                                                                        |
| `api-client.ts`                                           | Next server only                                                               | The only code that speaks HTTP to the NestJS API; owns all `Authorization`/`Cookie`/`Set-Cookie` header handling                                                                  | Be imported by any client component (`import 'server-only'` enforces this)                                                                                 |
| Server Actions (`login`, `logout`)                        | Next server, invoked by `<form action={...}>`                                  | Orchestrate: call api-client, write/clear the session cookie (`login` via `createSession`, `logout` via `getValidAccessToken` + `destroySession`), redirect                       | Contain HTTP header logic directly (that's api-client's job) or auth-decoding logic directly (that's session.ts's job)                                     |
| NestJS `JwtAuthGuard` + `JwtStrategy`                     | apps/api                                                                       | The **actual, authoritative** authentication check — re-derives the user (and their live `role`) from the database on every single request                                        | —                                                                                                                                                          |

**Why `session.ts` is split into a read-only half and a write-capable half:** this is a direct consequence of a Next.js constraint, not a stylistic choice — cookie writes (`.set()`/`.delete()`) are only permitted inside a Server Action or Route Handler; a plain Server Component render (which is what `admin/layout.tsx` and `admin/page.tsx` are) can only read cookies. A single function that both reads _and_ conditionally refreshes-and-rewrites the session would crash the moment it's called from a layout/page render — which is exactly what happened during implementation before this split existed. So the read path never writes, and the one function that does (`getValidAccessToken`) is documented and convention-enforced to only be called from somewhere writes are legal.

## 4. Sequence: Login

```
Browser              Next Server                          NestJS API
  │                       │                                    │
  │  POST /admin/login    │                                    │
  │  (form submit,        │                                    │
  │   Server Action)      │                                    │
  │──────────────────────▶│                                    │
  │                       │  POST /api/v1/auth/login            │
  │                       │  { email, password }                │
  │                       │───────────────────────────────────▶│
  │                       │                                    │  validate credentials,
  │                       │                                    │  sign accessToken (15m)
  │                       │                                    │  + refreshToken (7d),
  │                       │                                    │  store bcrypt hash of
  │                       │                                    │  refreshToken on user row
  │                       │◀───────────────────────────────────│
  │                       │  200 { data: { accessToken, user }} │
  │                       │  Set-Cookie: refreshToken=...       │
  │                       │  (scoped to API's own origin,       │
  │                       │   path /api/v1/auth/refresh)        │
  │                       │                                    │
  │                       │  api-client.ts manually reads        │
  │                       │  the Set-Cookie header (Node's       │
  │                       │  fetch has no cookie jar — this      │
  │                       │  extraction is NOT automatic)        │
  │                       │                                    │
  │                       │  session.ts: sign a NEW cookie        │
  │                       │  { user, accessToken,                │
  │                       │    accessTokenExpiresAt,              │
  │                       │    refreshToken }                    │
  │                       │  → Set-Cookie: admin_session=...      │
  │                       │  (this domain, httpOnly, 7d)          │
  │◀──────────────────────│                                    │
  │  302 → /admin          │                                    │
  │  Set-Cookie:            │                                    │
  │  admin_session=...      │                                    │
```

Note the two `Set-Cookie` events are **not the same cookie** — the API's `refreshToken` cookie dies at the Next server's doorstep (its value is extracted and repackaged); the browser only ever receives `admin_session`.

## 5. Sequence: loading a protected page (`/admin`)

`admin/layout.tsx` and `admin/page.tsx` are plain Server Component renders — Next.js forbids cookie writes in that context, so **this path never refreshes anything, regardless of how stale the access token is.** It's a pure read:

```
Browser                 Next Server (proxy.ts)         Next Server (page + DAL)
  │  GET /admin              │                                │
  │─────────────────────────▶│                                │
  │                          │  decryptSession(cookie)         │
  │                          │  → valid, has a user             │
  │                          │  → NextResponse.next()           │
  │                          │──────────────────────────────▶│
  │                          │                                │  verifySession()
  │                          │                                │  → getSession()
  │                          │                                │  → decrypt + return,
  │                          │                                │    no expiry check,
  │                          │                                │    no network call,
  │                          │                                │    no cookie write —
  │                          │                                │    accessToken may
  │                          │                                │    already be stale
  │◀─────────────────────────────────────────────────────────│
  │  200 HTML "Welcome, X"    │                                │
```

This is safe because the placeholder page never uses `accessToken` to call the API — it only reads `user.firstName` off the payload for display. A stale token sitting unused in a cookie has no consequence until something actually tries to use it.

## 5b. Sequence: refreshing at the point of use (inside a Server Action / Route Handler)

Refresh only happens where a cookie write is legal — today, that's exclusively the `logout` Server Action; once a data-fetching Route Handler exists (per the React Query/axios follow-up pattern), it happens there too, on the same principle:

```
Browser         logout Server Action        session.ts (getValidAccessToken)      NestJS API
  │  form submit      │                              │                                │
  │  action={logout}  │                              │                                │
  │──────────────────▶│                              │                                │
  │                   │  getValidAccessToken()         │                                │
  │                   │─────────────────────────────▶│                                │
  │                   │                              │  getSession() → decrypt cookie  │
  │                   │                              │  accessTokenExpiresAt stale?    │
  │                   │                              │                                │
  │                   │                              │  if stale: refreshRequest()      │
  │                   │                              │──────────────────────────────────▶│
  │                   │                              │  POST /auth/refresh              │
  │                   │                              │  Cookie: refreshToken=...        │
  │                   │                              │  (MANUALLY attached — read       │
  │                   │                              │   from our own session           │
  │                   │                              │   payload, not auto-sent)        │
  │                   │                              │                                │  verify + rotate
  │                   │                              │                                │  refresh token,
  │                   │                              │                                │  invalidate old one
  │                   │                              │◀──────────────────────────────────│
  │                   │                              │  { accessToken, refreshToken }   │
  │                   │                              │  (no user — session.ts keeps      │
  │                   │                              │   the cached one)                 │
  │                   │                              │                                │
  │                   │                              │  updateSessionTokens():          │
  │                   │                              │  re-sign cookie, fresh 7-day      │
  │                   │                              │  maxAge — LEGAL HERE because      │
  │                   │                              │  we're inside a Server Action     │
  │                   │◀─────────────────────────────│                                │
  │                   │  fresh accessToken             │                                │
  │                   │                              │                                │
  │                   │  logoutRequest(accessToken)     │                                │
  │                   │──────────────────────────────────────────────────────────────▶│
  │                   │  POST /auth/logout, Bearer &lt;fresh token&gt;                       │
  │                   │◀──────────────────────────────────────────────────────────────│
  │                   │  destroySession(), redirect('/admin/login')                     │
  │◀──────────────────│                              │                                │
```

`getSession()`/`getValidAccessToken()` are wrapped in React's `cache()`, so within one Server Action or Route Handler invocation this refresh happens **at most once** even if called multiple times — critical, since the API invalidates the old refresh token the moment the new one is issued; a second concurrent refresh using the stale token would fail and wrongly log the user out.

## 6. Sequence: unauthenticated / tampered / expired-outer-bound access

```
Browser                              proxy.ts
  │  GET /admin (no cookie, OR            │
  │  cookie present but signature          │
  │  invalid, OR 7-day maxAge lapsed        │
  │  so browser never sent it)              │
  │────────────────────────────────────────▶│
  │                                        │  decryptSession() → null
  │                                        │  in all three cases —
  │                                        │  proxy treats "missing"
  │                                        │  and "invalid" identically
  │◀────────────────────────────────────────│
  │  302 → /admin/login?from=%2Fadmin        │
```

This is the **optimistic** check — cheap, local, no network call, runs on every navigation including prefetches. It answers "is there a plausible session at all?", not "is this access token still good with the API?" — `verifySession()` inside the page itself (§5) answers the same coarse question (still no refresh, still render-safe). The finer-grained "is the access token actually still valid" question is only ever answered lazily, at the point something is about to call the API (§5b), which is why proxy alone is never treated as sufficient (§7).

## 7. Where the real security boundary is (read this before trusting any of the above)

There are two distinct kinds of check happening in this system, and conflating them is the most common mistake in this kind of architecture:

| Check          | Where                                                                                                                  | What it actually proves                                                                         | What happens if bypassed                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Optimistic** | `proxy.ts`, `admin/layout.tsx` (display only)                                                                          | "A signed `admin_session` cookie exists with a plausible payload"                               | User briefly sees a page shell before a real API call 403s — no data exposure       |
| **Real**       | Every NestJS controller, via `JwtAuthGuard` + `RolesGuard`, re-deriving `user.role` from the database on every request | "This exact bearer token is currently valid, and the DB row it maps to currently has this role" | This is the actual authorization decision — nothing in the frontend can override it |

Concretely: if a user hand-edits their `admin_session` cookie's `role` field in devtools (they can't forge the signature, but suppose they somehow could, or suppose signing were skipped entirely), the **worst case** is that the Next.js frontend shows them an admin-only button. Clicking it makes a request to the NestJS API using the _actual_ `accessToken` still embedded in the cookie — and the API independently looks up that token's owner in the database and checks _their_ real `role`, ignoring whatever the frontend cookie claimed. **The frontend's role-gating is a UX convenience, not a security control.** The backend is, and remains, the only place actual authorization happens. This is also exactly why `/auth/refresh` doesn't bother returning an updated `user` object — the frontend's cached `user.role` is allowed to be stale, because it was never the thing doing the real check.

## 8. Cookie inventory (the two easiest things to confuse)

|                           | `admin_session`                                                                                                                                                                          | `refreshToken`                                                                                                                                      |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Set by                    | Next.js server                                                                                                                                                                           | NestJS API                                                                                                                                          |
| Domain                    | `localhost:3000` (or the deployed web origin)                                                                                                                                            | `localhost:8000` (or the deployed API origin)                                                                                                       |
| Ever sent to the browser? | Yes — this is the only cookie the browser holds for this feature                                                                                                                         | Only as a `Set-Cookie` response header the Next **server** reads and discards after extracting the value — never relayed to the browser as a cookie |
| Path scope                | `/`                                                                                                                                                                                      | `/api/v1/auth/refresh` only                                                                                                                         |
| Contents                  | Signed JSON: `{ user, accessToken, accessTokenExpiresAt, refreshToken }`                                                                                                                 | Opaque 7-day JWT                                                                                                                                    |
| Who verifies it           | `jose.jwtVerify` in `session.ts`, using `SESSION_SECRET`                                                                                                                                 | NestJS `AuthService.refresh()`, using `JWT_REFRESH_SECRET` + a bcrypt hash comparison against the stored hash on the user row                       |
| Rotates on                | Every successful refresh triggered by `getValidAccessToken()` (fresh 7-day `admin_session` maxAge each time) — only from a Server Action/Route Handler, never on a plain page load (§5b) | Every use — the API invalidates the previous refresh token the moment a new one is issued                                                           |

## 9. What this architecture deliberately does not do (out of scope, by design)

- **No direct browser → API calls, ever**, for anything in this feature's scope. If a future data screen needs client-side interactivity (e.g. React Query), the pattern is: add a same-origin Next.js Route Handler that itself calls the API server-to-server (reusing `api-client.ts`/`session.ts`), and point the client-side fetch at that Route Handler instead. The browser still never learns the API's origin or token format.
- **No reactive 401-refresh-and-retry.** Only the proactive, `accessTokenExpiresAt`-driven refresh in §5b exists, and it only runs from Server Actions/Route Handlers, never on a plain page load. There's currently no code path that calls the API mid-page-render, so there's nothing to retry yet — flagged in the build plan as the natural extension point once real data-fetching is added.
- **Page loads never refresh the token, even if it's expired.** This is a direct consequence of Next.js only allowing cookie writes in Server Actions/Route Handlers (§3) — `getSession()`/`verifySession()` are strictly read-only, so `admin/layout.tsx` and `admin/page.tsx` will happily render with a stale `accessToken` sitting in the cookie. This is harmless today because neither of them uses it to call the API. It stops being harmless the moment a page starts fetching real data directly (rather than going through a Route Handler) — don't do that; route all API-bound calls through something that can call `getValidAccessToken()`.
- **No multi-session / multi-device refresh-token tracking.** The API stores exactly one refresh-token hash per user row; logging in on a second device invalidates the first device's refresh token on its next use. This is an existing backend behavior, not something the frontend changes.
