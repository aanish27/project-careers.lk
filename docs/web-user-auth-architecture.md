# Web User Auth Architecture (Google-only, BFF pattern)

Companion to [`admin-auth-architecture.md`](./admin-auth-architecture.md), which this
implementation deliberately mirrors. This document describes the **web-user** (job-seeker)
auth system: a completely separate account population from `AdminUser`, authenticating via
Google only, with no password and no RBAC.

## 1. Why a separate system, not an extension of admin auth

`AdminUser` is tied to a dynamic RBAC system (`Role`/`Permission`/`RoleAssignment`) that web
users structurally don't have. Two independent, both-disqualifying reasons for not reusing
any part of the admin auth stack:

1. **Semantic mismatch** — `PrincipalService`/`PrincipalSnapshot` compute `roleSlugs`,
   `permissions`, `isSuperAdmin`. A web user has none of these concepts.
2. **A real security bug, not just style** — both `AdminUser.id` and `WebUser.id` are
   `@id @default(autoincrement())`, starting at 1. If a web-user JWT were ever signed with
   the same secret and validated by the same Passport strategy as admin tokens, a web user
   with `sub: 7` could authenticate _as whichever unrelated `AdminUser` happens to have id
   7_ — pure numeric coincidence, no attacker cleverness required. Distinct secrets +
   distinct Passport strategy names close this off entirely (a token signed with the wrong
   secret simply fails signature verification).

So: new DB model, new API modules, new JWT secrets, new session cookie, new Next.js route
group — nothing shared with the admin path except the _pattern_.

## 2. High-level picture

```
┌──────────────┐          ┌───────────────────────┐          ┌──────────────────┐
│   Browser    │          │   Next.js server       │          │   NestJS API     │
│ (web user)   │          │   apps/web             │          │   apps/api       │
│              │          │   localhost:3000       │          │   localhost:8000 │
└──────┬───────┘          └───────────┬────────────┘          └────────┬─────────┘
       │                              │                                │
       │  Cookies:                    │  Holds the Google client       │
       │  - web_user_session (httpOnly│  secret. Does the full OAuth   │
       │    session, this domain)     │  code exchange itself —        │
       │  - short-lived OAuth state/  │  Google never talks to the     │
       │    PKCE cookies, only during │  NestJS API directly.          │
       │    the redirect round trip   │                                │
       │                              │  webUserRefreshToken (received │
       │  Browser never sees or       │  from API, re-extracted        │
       │  sends the API's tokens.     │  manually, stored INSIDE       │
       │  It only ever talks to       │  web_user_session, never set   │
       │  the Next.js server (and,    │  as a browser-facing cookie)   │
       │  during login, Google).      │                                │
       │                              │                                │
       │── /api/auth/google ─────────▶│                                │
       │◀── 302 to Google consent ────│                                │
       │── (Google's own UI) ────────▶│ Google                         │
       │◀── 302 back to callback ─────│                                │
       │── /api/auth/google/callback ▶│──── code exchange (server- ──▶│ (Google, not
       │                              │      to-server, client secret) │  the API)
       │                              │──── POST /web-users/auth/ ───▶│
       │                              │     google/upsert              │
       │                              │     (x-internal-key header)    │
       │                              │◀──── JSON + Set-Cookie ────────│
       │◀── 302 to /profile ──────────│                                │
       │  Set-Cookie: web_user_session│                                │
```

**The core idea** (identical to admin): the browser has exactly one relationship with the
Next.js server. The Next.js server has exactly one relationship with the NestJS API,
server-to-server, using the tokens the API issues. The one addition versus the admin flow is
that the Next.js server _also_ has a relationship with Google during login — but that
relationship ends the moment the callback finishes; Google is never involved again.

## 3. Components and responsibilities

| Component                                      | Lives in                                                  | Responsibility                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WebUser` model                                | `packages/database/prisma/schema.prisma`                  | `id`, `email` (unique), `googleId` (unique, the Google `sub` claim), nullable `firstName`/`lastName`/`avatarUrl`, `isActive`, `refreshTokenHash`, `deletedAt`, timestamps. No `password`. No relation to `AdminUser`/`Role`/`Permission`. Table `web_users`.                                                                                                                                                                                                                     |
| `WebUsersService`                              | `apps/api/src/modules/web-users/web-users.service.ts`     | Data access only: `findByGoogleId`, `findByEmail`, `findById`, `create`, `touchLoginProfile`, `setRefreshTokenHash`, `clearRefreshTokenHash`. All filter `deletedAt: null`.                                                                                                                                                                                                                                                                                                      |
| `WebUserAuthService` / `WebUserAuthController` | `apps/api/src/modules/web-user-auth/`                     | `POST web-users/auth/google/upsert`, `POST .../refresh`, `POST .../logout`, `GET .../me`. Issues its own access (15m) / refresh (7d) JWT pair, bcrypt-hashes the refresh token on the row exactly like `AuthService` does for admins.                                                                                                                                                                                                                                            |
| `WebUserJwtStrategy` / `WebUserJwtAuthGuard`   | `apps/api/src/modules/web-user-auth/{strategies,guards}/` | Passport strategy name `'jwt-web-user'`, secret `JWT_WEB_USER_SECRET` — entirely distinct from the admin `'jwt'` strategy/`JWT_SECRET`. Not global; applied per-route.                                                                                                                                                                                                                                                                                                           |
| `InternalOnlyGuard`                            | `apps/api/src/common/guards/internal-only.guard.ts`       | Gates `POST .../google/upsert` to callers presenting `x-internal-key: INTERNAL_API_KEY` (`crypto.timingSafeEqual`). Without this, anyone with network access to the API could POST a fabricated Google profile and mint/hijack accounts — the endpoint's whole trust model is "the caller already verified this with Google," which only the Next.js server is trusted to have done.                                                                                             |
| `web-app/lib/google-oauth.ts`                  | Next server only                                          | Hand-rolled OAuth (no library — see §5): builds the Google authorization URL, exchanges the code server-to-server, fetches the profile from Google's userinfo endpoint.                                                                                                                                                                                                                                                                                                          |
| `web-app/lib/web-user-session.ts`              | Next server only                                          | Mirrors `dashboard/lib/session.ts` exactly: `encrypt/decryptWebUserSession`, `createWebUserSession`, `updateWebUserSessionTokens`, `destroyWebUserSession`, read-only `getWebUserSession`/`verifyWebUserSession` (cached, safe from Server Component renders), and `getValidWebUserAccessToken` (the only function allowed to refresh-and-rewrite the cookie — Server Actions/Route Handlers only). No RBAC-equivalent (`requirePermission`) — web users don't have permissions. |
| `web-app/lib/web-user-client.ts`               | Next server only (`"server-only"`)                        | The only code that speaks HTTP to the NestJS API for this feature. Reuses `apiFetch`/`ApiError`/`extractCookieValue` from the shared `@lib/api-client.ts` rather than duplicating them.                                                                                                                                                                                                                                                                                          |
| `apps/web/src/proxy.ts`                        | Next server, runs on every matched request                | Already dispatches by path prefix (admin auth vs. the pSEO 410-retirement check); extended in place with a `handleWebUserAuth()` function and `/profile/:path*` added to the matcher. Same "optimistic check" caveat as admin: proves a plausibly-valid session cookie exists, not that the access token inside is still good — the real check is still the API's guard.                                                                                                         |

## 4. Sequence: login (Google)

```
Browser                Next Server                              Google                    NestJS API
  │  GET /api/auth/google   │                                        │                          │
  │────────────────────────▶│                                        │                          │
  │                         │  validate ?next with isSafeRedirectPath │                          │
  │                         │  generate state + PKCE verifier/challenge│                          │
  │                         │  (node:crypto, no library)               │                          │
  │◀── 302 + 3 short-lived  │                                        │                          │
  │    httpOnly cookies:    │                                        │                          │
  │    state/verifier/next  │                                        │                          │
  │    (path scoped to      │                                        │                          │
  │    /api/auth/google)    │                                        │                          │
  │                         │                                        │                          │
  │── (browser follows) ──────────────────────────────────────────▶│                          │
  │                         │                    user approves on Google's own consent screen    │
  │◀── 302 to /api/auth/google/callback?code=...&state=... ──────────│                          │
  │                         │                                        │                          │
  │── GET .../callback ────▶│                                        │                          │
  │                         │  state param === state cookie? (CSRF)   │                          │
  │                         │  POST oauth2.googleapis.com/token ─────▶│                          │
  │                         │  (client_secret + code_verifier)         │                          │
  │                         │◀──────────── access_token ───────────────│                          │
  │                         │  GET .../oauth2/v3/userinfo ────────────▶│                          │
  │                         │◀──────────── profile (sub/email/name) ───│                          │
  │                         │                                        │                          │
  │                         │  POST /web-users/auth/google/upsert ────────────────────────────────▶│
  │                         │  x-internal-key: INTERNAL_API_KEY                                    │  find-or-create
  │                         │  { googleId, email, firstName, ... }                                 │  by googleId,
  │                         │                                        │                          │  sign token pair,
  │                         │◀──────── { user, accessToken } ──────────────────────────────────────│  bcrypt-hash
  │                         │  Set-Cookie: webUserRefreshToken=...  │                          │  refresh token
  │                         │  (API's own origin, path scoped)      │                          │
  │                         │                                        │                          │
  │                         │  extract webUserRefreshToken from the   │                          │
  │                         │  Set-Cookie header (no cookie jar on    │                          │
  │                         │  Node's fetch — manual, same as admin)  │                          │
  │                         │  sign NEW cookie: web_user_session      │                          │
  │                         │  { user, accessToken,                    │                          │
  │                         │    accessTokenExpiresAt, refreshToken }  │                          │
  │                         │  re-validate `next` with                │                          │
  │                         │  isSafeRedirectPath AGAIN (don't trust   │                          │
  │                         │  the round-tripped cookie value blindly) │                          │
  │◀── 302 → next (default /profile) ─│                                        │                          │
  │  Set-Cookie: web_user_session=... │                                        │                          │
  │  (this domain, httpOnly, 7d)      │                                        │                          │
```

Same principle as admin login: the two `Set-Cookie` events are not the same cookie. The
API's `webUserRefreshToken` dies at the Next server's doorstep; the browser only ever
receives `web_user_session`.

## 5. Why hand-rolled OAuth instead of a library

The plan originally called for [`arctic`](https://www.npmjs.com/package/arctic) (purpose-
built for exactly this: authorization-code + PKCE against known providers). At
implementation time, `npm view arctic` showed it's now marked **deprecated/unsupported** on
the registry. Depending on an unmaintained package for anything security-sensitive (OAuth
token exchange) isn't worth the convenience, and this codebase already prefers small
hand-rolled auth code (`jose` for session signing, no NextAuth/Clerk/Lucia anywhere) over
pulling in a framework — so `web-app/lib/google-oauth.ts` implements the three calls
directly with `fetch` and Node's built-in `crypto`:

- `generateState()` / `generateCodeVerifier()` — `crypto.randomBytes(32).toString("base64url")`
- `codeChallengeFromVerifier()` — SHA-256 of the verifier, base64url
- `buildGoogleAuthorizationUrl()` — plain URL construction against `accounts.google.com/o/oauth2/v2/auth`
- `exchangeGoogleCode()` — `POST oauth2.googleapis.com/token` with the client secret
- `fetchGoogleProfile()` — `GET www.googleapis.com/oauth2/v3/userinfo` with the access token

Fetching the profile via the userinfo endpoint (rather than decoding the ID token) avoids
needing any JWKS/ID-token verification code — the access token used to fetch it was already
obtained through a direct, client-secret-authenticated, server-to-server exchange with
Google, so it's trustworthy by construction.

## 6. Routes

| Route                                       | Guards                              | Notes                                                                                         |
| ------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| `POST /api/v1/web-users/auth/google/upsert` | `@Public()` + `InternalOnlyGuard`   | Called only by the Next.js server, never the browser.                                         |
| `POST /api/v1/web-users/auth/refresh`       | `@Public()`                         | Reads its own httpOnly cookie (`webUserRefreshToken`), mirrors admin's `/auth/refresh` shape. |
| `POST /api/v1/web-users/auth/logout`        | `@Public()` + `WebUserJwtAuthGuard` |                                                                                               |
| `GET /api/v1/web-users/auth/me`             | `@Public()` + `WebUserJwtAuthGuard` |                                                                                               |

`@Public()` is required on every one of these, including the "protected" two: the global
`APP_GUARD` (`JwtAuthGuard`) is hardcoded to Passport strategy `'jwt'` (admin-only) and would
reject a web-user token before the web-user-specific guard ever ran. `@Public()` opts the
route out of the global admin guard; the local `@UseGuards(WebUserJwtAuthGuard)` supplies
the real check.

### Account-collision policy

`upsertFromGoogleProfile` looks up by `googleId` first (the stable identifier):

- No row at all → create.
- Row with the same `googleId` → normal login, refresh profile fields + `lastLoginAt`.
- Row with the same `email` but a **different** `googleId` → reject with `409 Conflict`,
  never silently merge. Auto-merging on email match is an account-takeover shape (attacker
  registers a victim's real email with a `googleId` they control, first) — left as a manual
  path if it ever comes up, not an automatic branch.

## 7. Cookie inventory

|                           | `web_user_session`                                                         | `webUserRefreshToken`                                                                           | `google_oauth_state` / `_verifier` / `_next`                                                                                                         |
| ------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Set by                    | Next.js server                                                             | NestJS API                                                                                      | Next.js server                                                                                                                                       |
| Domain                    | `localhost:3000` (or deployed web origin)                                  | `localhost:8000` (or deployed API origin)                                                       | `localhost:3000`                                                                                                                                     |
| Ever sent to the browser? | Yes — the only long-lived cookie the browser holds for this feature        | Only as a `Set-Cookie` header the Next **server** reads and discards after extracting the value | Yes, but short-lived (10 min) and deleted immediately after the callback resolves either way                                                         |
| Path scope                | `/`                                                                        | `/api/v1/web-users/auth/refresh` only                                                           | `/api/auth/google` (so both the initiate and callback routes, which are nested under it, receive them)                                               |
| Contents                  | Signed JSON: `{ user, accessToken, accessTokenExpiresAt, refreshToken }`   | Opaque 7-day JWT                                                                                | Random state/PKCE verifier / the post-login redirect target                                                                                          |
| Who verifies it           | `jose.jwtVerify` in `web-user-session.ts`, using `WEB_USER_SESSION_SECRET` | `WebUserAuthService.refresh()`, using `JWT_WEB_USER_REFRESH_SECRET` + bcrypt hash comparison    | The callback route itself (state must equal the cookie; `next` is re-validated with `isSafeRedirectPath`, never trusted blindly from the round trip) |

`WEB_USER_SESSION_SECRET` is a separate secret from the admin `SESSION_SECRET`, and
`JWT_WEB_USER_SECRET`/`JWT_WEB_USER_REFRESH_SECRET` are separate from the admin
`JWT_SECRET`/`JWT_REFRESH_SECRET` — not just different cookie/route names. This is what
actually prevents the id-collision bug described in §1, not the naming alone.

## 8. Security notes specific to this flow (none of which exist in the password-based admin flow)

1. **CSRF via `state`** — the callback rejects unless the `state` query param Google echoes
   back matches the `google_oauth_state` cookie set before the redirect.
2. **PKCE** — included as defense-in-depth even though Google doesn't strictly require it
   for a confidential (server-side) client holding a client secret; cheap to add with
   `node:crypto` and protects the code-for-token exchange further.
3. **Open redirect via `next`** — the `?next=` param on `/api/auth/google` is
   attacker-influenceable (a phishing link could set it). Validated with `isSafeRedirectPath`
   **twice**: once when stashing it into a cookie at initiation, and again after the round
   trip at the callback before the final redirect — trusting the round-tripped value
   implicitly the second time is the common mistake this avoids.
4. **The Google-upsert endpoint's trust boundary** — admin login has a password as its
   proof; this endpoint has none unless `InternalOnlyGuard` closes it (§3).
5. **Account collision** — differing `googleId` with a matching `email` is rejected, not
   silently merged (§6).

## 9. Env vars

**`apps/api`**: `JWT_WEB_USER_SECRET`, `JWT_WEB_USER_ACCESS_TOKEN_EXPIRES_IN` (default
`15m`), `JWT_WEB_USER_REFRESH_SECRET`, `JWT_WEB_USER_REFRESH_TOKEN_EXPIRES_IN` (default
`7d`), `INTERNAL_API_KEY`. No Google credentials — the API never talks to Google.

**`apps/web`**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
(`http://localhost:3000/api/auth/google/callback` in dev), `WEB_USER_SESSION_SECRET`,
`INTERNAL_API_KEY` (must match the API's value exactly).

`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are the one piece that can't be generated —
they require a real OAuth client registered in Google Cloud Console with the redirect URI
above added as an authorized redirect URI.

## 10. File map

```
packages/database/prisma/schema.prisma          # WebUser model

apps/api/src/modules/web-users/                  # data access
  web-users.module.ts
  web-users.service.ts

apps/api/src/modules/web-user-auth/              # auth flow
  web-user-auth.module.ts
  web-user-auth.controller.ts        # @Controller('web-users/auth')
  web-user-auth.service.ts
  dto/web-user-auth.dto.ts
  interfaces/web-user-jwt-payload.interface.ts
  strategies/web-user-jwt.strategy.ts            # Passport strategy 'jwt-web-user'
  guards/web-user-jwt-auth.guard.ts

apps/api/src/common/guards/internal-only.guard.ts
apps/api/src/common/constants/routes.constant.ts # WEB_USER_REFRESH_COOKIE, COOKIE_PATHS.webUserAuthRefresh
apps/api/src/config/{index.ts,env.validation.ts} # jwtWebUser.*, internal.apiKey
apps/api/src/app.module.ts                       # WebUsersModule/WebUserAuthModule registration

apps/web/src/web-app/config/constants.ts         # WEB_USER_* + GOOGLE_OAUTH_* cookie constants
apps/web/src/web-app/lib/web-user-session.ts     # @web-app-lib/web-user-session
apps/web/src/web-app/lib/web-user-client.ts      # @web-app-lib/web-user-client
apps/web/src/web-app/lib/google-oauth.ts         # @web-app-lib/google-oauth
apps/web/src/web-app/features/auth/components/google-login-button.tsx
apps/web/src/web-app/features/auth/api/web-user-auth.actions.ts   # 'use server'; logout

apps/web/src/app/api/auth/google/route.ts          # GET — initiate
apps/web/src/app/api/auth/google/callback/route.ts # GET — exchange + upsert + session

apps/web/src/app/(public)/(auth)/login/page.tsx
apps/web/src/app/(public)/(account)/profile/page.tsx

apps/web/src/proxy.ts   # handleWebUserAuth() added alongside the existing
                         # handleAdminAuth()/handleRetirementCheck(); /profile/:path*
                         # added to the matcher
```

## 11. What this deliberately does not do (out of scope, by design)

- **No RBAC / roles / permissions for web users.** `WebUser` has no relation to
  `Role`/`Permission`/`RoleAssignment` at all — those are admin-only concepts.
- **No email/password registration.** Google is the only sign-in method, per the original
  requirement — there's no `RegisterDto`-equivalent, no password field on `WebUser`.
- **No web-user-facing features beyond auth.** This is the foundation only — a placeholder
  `/profile` page proves the round trip. Saved jobs, applications, editable profile fields,
  etc. are future work that will hang off the same `WebUser` row.
- **No generic BFF proxy Route Handler for web users yet** (the admin side has
  `app/api/server/[...path]/route.ts` for client-side data fetching through the API). Not
  needed until a web-user feature actually needs client-side data fetching — the pattern to
  follow when that happens is the same one the admin proxy already establishes, using
  `getValidWebUserAccessToken()` in place of the admin equivalent.
