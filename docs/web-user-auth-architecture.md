# Web User Auth Architecture (Google + passwordless email OTP, BFF pattern)

Companion to [`admin-auth-architecture.md`](./admin-auth-architecture.md), which this
implementation deliberately mirrors. This document describes the **web-user** (job-seeker)
auth system: a completely separate account population from `AdminUser`, with no password and
no RBAC. Web users can sign in two ways — **Google OAuth** or **passwordless email + a
6-digit OTP** — with `email` as the identifier shared between both, so the same person ends
up as one `WebUser` account regardless of which method they used or when.

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

| Component                                             | Lives in                                                           | Responsibility                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `WebUser` model                                       | `packages/database/prisma/schema.prisma`                           | `id`, `email` (unique), `googleId` (**nullable**, unique — a row created via email OTP has none until it's linked), nullable `firstName`/`lastName`/`avatarUrl`, `isActive`, `refreshTokenHash`, `deletedAt`, timestamps. No `password`. No relation to `AdminUser`/`Role`/`Permission`. Table `web_users`.                                                                                                                                                                                                                                |
| `WebUserEmailOtp` model                               | `packages/database/prisma/schema.prisma`                           | `email` (not unique — many rows over time), `codeHash` (HMAC-SHA256, see §5b), `expiresAt`, `attempts`, `consumedAt`, `invalidatedAt`, `createdAt`. Not FK'd to `WebUser` — a row may not exist yet at first-request time. Table `web_user_email_otps`.                                                                                                                                                                                                                                                                                    |
| `WebUsersService`                                     | `apps/api/src/modules/web-users/web-users.service.ts`              | Data access only: `findByGoogleId`, `findByEmail`, `findById`, `create`, `touchLoginProfile`, `linkGoogleId`, `setRefreshTokenHash`, `clearRefreshTokenHash`. All filter `deletedAt: null`; `findByEmail`/`create` normalize (lowercase + trim) via `normalizeEmail()` (`common/utils/email.util.ts`).                                                                                                                                                                                                                                     |
| `WebUserEmailOtpService`                              | `apps/api/src/modules/web-user-auth/web-user-email-otp.service.ts` | Pure OTP mechanics, deliberately separate from `WebUserAuthService` (which orchestrates issuing a session) — see §5b for the full generate/verify design.                                                                                                                                                                                                                                                                                                                                                                                  |
| `MailService`                                         | `apps/api/src/shared/mail/mail.service.ts`                         | `nodemailer` over SMTP, config-driven (no provider-specific SDK). Transport is built lazily so a missing SMTP config doesn't fail app boot — only the first actual send throws.                                                                                                                                                                                                                                                                                                                                                            |
| `WebUserAuthService` / `WebUserAuthController`        | `apps/api/src/modules/web-user-auth/`                              | `POST web-users/auth/google/upsert`, `POST .../email/otp/request`, `POST .../email/otp/verify`, `POST .../refresh`, `POST .../logout`, `GET .../me`. Issues its own access (15m) / refresh (7d) JWT pair, bcrypt-hashes the refresh token on the row exactly like `AuthService` does for admins (bcrypt is still correct here — the refresh token is high-entropy, unlike the OTP code).                                                                                                                                                   |
| `WebUserJwtStrategy` / `WebUserJwtAuthGuard`          | `apps/api/src/modules/web-user-auth/{strategies,guards}/`          | Passport strategy name `'jwt-web-user'`, secret `JWT_WEB_USER_SECRET` — entirely distinct from the admin `'jwt'` strategy/`JWT_SECRET`. Not global; applied per-route.                                                                                                                                                                                                                                                                                                                                                                     |
| `InternalOnlyGuard`                                   | `apps/api/src/common/guards/internal-only.guard.ts`                | Gates `POST .../google/upsert` and both `.../email/otp/*` routes to callers presenting `x-internal-key: INTERNAL_API_KEY` (`crypto.timingSafeEqual`). For Google, this is the actual trust boundary (§8). For email OTP it's defense-in-depth only — see §5b for why it does **not** substitute for real anti-abuse controls there.                                                                                                                                                                                                        |
| `web-app/lib/google-oauth.ts`                         | Next server only                                                   | Hand-rolled OAuth (no library — see §5): builds the Google authorization URL, exchanges the code server-to-server, fetches the profile from Google's userinfo endpoint.                                                                                                                                                                                                                                                                                                                                                                    |
| `web-app/lib/web-user-session.ts`                     | Next server only                                                   | Mirrors `dashboard/lib/session.ts` exactly: `encrypt/decryptWebUserSession`, `createWebUserSession`, `updateWebUserSessionTokens`, `destroyWebUserSession`, read-only `getWebUserSession`/`verifyWebUserSession` (cached, safe from Server Component renders), and `getValidWebUserAccessToken` (the only function allowed to refresh-and-rewrite the cookie — Server Actions/Route Handlers only). No RBAC-equivalent (`requirePermission`) — web users don't have permissions. Identity-method-agnostic — unchanged by adding email OTP. |
| `web-app/lib/web-user-client.ts`                      | Next server only (`"server-only"`)                                 | The only code that speaks HTTP to the NestJS API for this feature. Reuses `apiFetch`/`ApiError`/`extractCookieValue` from the shared `@lib/api-client.ts` rather than duplicating them. `googleUpsertRequest`, `requestEmailOtpRequest`, `verifyEmailOtpRequest`, `webUserRefreshRequest`, `webUserLogoutRequest`, `fetchCurrentWebUser`.                                                                                                                                                                                                  |
| `web-app/features/auth/components/email-otp-form.tsx` | Next server + client                                               | Two-step client component (email → code), two independent `useActionState` hooks (`requestEmailOtp`, `verifyEmailOtp`), following the same pattern as the admin `LoginForm`.                                                                                                                                                                                                                                                                                                                                                               |
| `apps/web/src/proxy.ts`                               | Next server, runs on every matched request                         | Already dispatches by path prefix (admin auth vs. the pSEO 410-retirement check); extended in place with a `handleWebUserAuth()` function and `/profile/:path*` added to the matcher. Same "optimistic check" caveat as admin: proves a plausibly-valid session cookie exists, not that the access token inside is still good — the real check is still the API's guard. Unaffected by adding email OTP — session creation is identity-method-agnostic.                                                                                    |

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

## 4b. Sequence: login (email OTP)

```
Browser              Next Server                   NestJS API                MailService (SMTP)
  │  submit email       │                                │                          │
  │────────────────────▶│                                │                          │
  │                      │  requestEmailOtpRequest(email)  │                          │
  │                      │  POST .../email/otp/request ───▶│                          │
  │                      │  x-internal-key                 │  rate/cooldown gate,      │
  │                      │                                │  invalidate prior code,   │
  │                      │                                │  generate + HMAC-hash,    │
  │                      │                                │  store row ──────────────▶│ sends email
  │                      │◀──── { success: true } ─────────│                          │
  │  (form now shows      │                                │                          │
  │   the code field)      │                                │                          │
  │                      │                                │                          │
  │  submit code         │                                │                          │
  │────────────────────▶│                                │                          │
  │                      │  verifyEmailOtpRequest(email,   │                          │
  │                      │  code)                          │                          │
  │                      │  POST .../email/otp/verify ────▶│  atomic attempt-cap       │
  │                      │  x-internal-key                 │  claim, HMAC compare,     │
  │                      │                                │  find-or-create WebUser   │
  │                      │                                │  by email, sign tokens     │
  │                      │◀── { user, accessToken } ───────│                          │
  │                      │  Set-Cookie: webUserRefreshToken│                          │
  │                      │                                │                          │
  │                      │  createWebUserSession(...)      │                          │
  │◀── redirect → /profile│                                │                          │
  │  Set-Cookie: web_user_session=...                       │                          │
```

No Google involvement at all — the OTP itself is the proof of identity (control of the
inbox). Same session-issuing tail as the Google flow (`issueSession()` in
`WebUserAuthService`), so from `createWebUserSession` onward the two flows are identical.

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

## 5b. Email OTP design

A 6-digit code has only 1,000,000 possibilities, which shapes every decision here
differently from a high-entropy secret like a JWT.

**Hashed with HMAC-SHA256, not bcrypt.** Bcrypt's slow-hash property exists to raise
attacker cost against _offline_ brute-force of high-entropy secrets. Against a 1e6-value
space, bcrypt's cost factor doesn't raise that cost enough to matter within the 10-minute
expiry if the `codeHash` column is ever read out-of-band (a DB leak, a backup exposure) —
while still adding real latency to every legitimate `verify()` call. An HMAC keyed with a
dedicated `OTP_HASH_SECRET` (never reused from `INTERNAL_API_KEY`/JWT secrets — same "one
secret, one purpose" pattern as the rest of this system) is the right tool: without the key,
a DB-only compromise gives an attacker no way to test candidates at all. Compared with
`crypto.timingSafeEqual`, not `===`. The defense against _online_ guessing lives entirely in
the attempt cap below.

**Atomic attempt-cap claim.** `verify()` doesn't read `attempts`, compare in application
code, then write an increment — that read-then-write shape is exactly how a 5-attempt cap
gets bypassed: fire several `verify` calls concurrently and each one can read `attempts: 0`
before any of them commits. Instead the cap check and the increment are one DB operation:

```ts
const claimed = await prisma.webUserEmailOtp.updateMany({
  where: {
    id: row.id,
    attempts: { lt: MAX_ATTEMPTS },
    consumedAt: null,
    invalidatedAt: null,
    expiresAt: { gt: now },
  },
  data: { attempts: { increment: 1 } },
});
if (claimed.count === 0)
  throw new UnauthorizedException('Invalid or expired code');
// only now compare the code
```

The code comparison only ever runs if this claim succeeds, so concurrent requests can each
increment at most once and the cap holds regardless of request timing.

**Per-email rate gate, not `InternalOnlyGuard`/`@Throttle`.** `InternalOnlyGuard` proves a
request came from this Next.js server — it says nothing about whether the request is a
legitimate rate-limited end user, since every real user's browser reaches the API through
that same server using the same internal key. `@Throttle`'s default per-IP limiting is also
likely measuring the Next.js server's egress IP rather than the end user's, since the
browser never calls the API directly — so it either throttles all users collectively or
misses a real attacker entirely. The actual anti-abuse control lives inside
`WebUserEmailOtpService.generate()`, scoped to the recipient email itself, independent of
caller IP:

- A resend cooldown (60s) — checked _before_ anything else, so a burst of requests can never
  supersede a code the recipient is actively about to enter. This closes a subtle
  denial-of-service shape: without it, "a new request invalidates the previous code" lets an
  attacker (or just an impatient user mashing "resend") repeatedly kill a code before its
  legitimate recipient can use it.
- A request-rate window (3 requests / 10 minutes per email) — checked after the cooldown,
  independent of it.

**Consumed vs. invalidated.** `consumedAt` means this exact code was used to log in.
`invalidatedAt` means it was superseded by a newer request before ever being used. Kept as
two separate columns (not one shared "no longer active" flag) so a future fraud-signal pass
over this table can tell "user actually signed in" from "user abandoned/never received this
one" — costs nothing now, useful later.

**Account-linking is provably safe here because OTP verification proves email ownership
directly** (the recipient had to read the code out of their own inbox) — unlike the Google
flow, where "does this profile's email claim actually belong to the presenter" has to be
checked explicitly (see §8, item 6).

## 6. Routes

| Route                                           | Guards                                                  | Notes                                                                                         |
| ----------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `POST /api/v1/web-users/auth/google/upsert`     | `@Public()` + `InternalOnlyGuard`                       | Called only by the Next.js server, never the browser.                                         |
| `POST /api/v1/web-users/auth/email/otp/request` | `@Public()` + `InternalOnlyGuard` + `@Throttle(5/min)`  | Body `{ email }`. Always a generic success — never reveals whether an account exists.         |
| `POST /api/v1/web-users/auth/email/otp/verify`  | `@Public()` + `InternalOnlyGuard` + `@Throttle(10/min)` | Body `{ email, code }`. Same response shape as `google/upsert`.                               |
| `POST /api/v1/web-users/auth/refresh`           | `@Public()`                                             | Reads its own httpOnly cookie (`webUserRefreshToken`), mirrors admin's `/auth/refresh` shape. |
| `POST /api/v1/web-users/auth/logout`            | `@Public()` + `WebUserJwtAuthGuard`                     |                                                                                               |
| `GET /api/v1/web-users/auth/me`                 | `@Public()` + `WebUserJwtAuthGuard`                     |                                                                                               |

`@Public()` is required on every one of these, including the JWT-guarded two: the global
`APP_GUARD` (`JwtAuthGuard`) is hardcoded to Passport strategy `'jwt'` (admin-only) and would
reject a web-user token before the web-user-specific guard ever ran. `@Public()` opts the
route out of the global admin guard; the local `@UseGuards(WebUserJwtAuthGuard)` supplies
the real check.

### Account-linking policy

Both sign-in paths resolve to a `WebUser` by identity proof, then reconcile against the row
matching `email` (normalized — see §8, item 7):

- **Email OTP** (`verifyEmailOtp`) only ever proves email ownership → look up strictly by
  email. Found → log into that row regardless of whether it has a `googleId` yet. Not found
  → create an email-only row (`googleId: null`).
- **Google** (`upsertFromGoogleProfile`) looks up by `googleId` first (the stable
  identifier). Not found there, and an existing row matches `email` with `googleId: null`
  (an email-only account signing in with Google for the first time) → **link**, setting
  `googleId` on that row (`WebUsersService.linkGoogleId`). Not found at all → create. Row
  matches `email` but its `googleId` is already set to a _different_ value → reject with
  `409 Conflict` — this is the one case that must never be silently reassigned, since it
  would mean detaching the account from a Google identity it's already linked to.

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
3. **Open redirect via `next`** — the `?next=` param on `/api/auth/google` (and the OTP
   verify action) is attacker-influenceable (a phishing link could set it). Validated with
   `isSafeRedirectPath` **twice**: once when stashing it at initiation, and again before the
   final redirect — trusting the round-tripped value implicitly the second time is the
   common mistake this avoids.
4. **The Google-upsert endpoint's trust boundary** — admin login has a password as its
   proof; this endpoint has none unless `InternalOnlyGuard` closes it (§3).
5. **Account collision/linking** — differing `googleId` with a matching `email` is rejected,
   never silently reassigned; linking only happens onto a row with no `googleId` yet (§6).
6. **`emailVerified` must be checked, not just carried** — `GoogleUpsertDto.emailVerified`
   is populated from Google's `email_verified` claim, and `upsertFromGoogleProfile` hard-
   rejects (`401`) unless it's strictly `true`, checked before either the linking or the
   409-collision branch. This gate is what makes the linking policy in §6 actually safe: both
   branches trust the email claim, and without this check an attacker presenting a Google
   profile with an _unverified_ email claim matching a victim's existing email-OTP account
   could get linked directly onto it.
7. **Email normalization** — `WebUsersService.findByEmail`/`.create` lowercase + trim via
   `normalizeEmail()` before every read/write. Without this, `User@Gmail.com` (however
   Google echoes back registered casing) and `user@gmail.com` (typed into the OTP form)
   would silently become two different `WebUser` rows for the same mailbox — directly
   defeating "email is the shared identifier," the entire point of having both sign-in
   methods resolve to one account.
8. **OTP-specific**: see §5b in full — HMAC-vs-bcrypt choice, the atomic attempt-cap claim
   (closes a concurrent-request race that would otherwise bypass the cap), and the
   per-email rate gate (since `InternalOnlyGuard`/`@Throttle` don't provide real anti-abuse
   protection for this specific endpoint shape).

## 9. Env vars

**`apps/api`**: `JWT_WEB_USER_SECRET`, `JWT_WEB_USER_ACCESS_TOKEN_EXPIRES_IN` (default
`15m`), `JWT_WEB_USER_REFRESH_SECRET`, `JWT_WEB_USER_REFRESH_TOKEN_EXPIRES_IN` (default
`7d`), `INTERNAL_API_KEY`, `OTP_HASH_SECRET`. SMTP config —
`SMTP_HOST`/`SMTP_PORT`/`SMTP_SECURE`/`SMTP_USER`/`SMTP_PASSWORD`/`SMTP_FROM_EMAIL`/`SMTP_FROM_NAME`
— is **optional** at the env-validation layer (unlike the JWT/internal/OTP secrets): a
provider hasn't been chosen yet, so leaving these blank doesn't fail app startup, following
the same pattern as the optional AI-cost-widget keys. `MailService` only throws when an
actual send is attempted without them configured. No Google credentials on the API side —
it never talks to Google.

**`apps/web`**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
(`http://localhost:3000/api/auth/google/callback` in dev), `WEB_USER_SESSION_SECRET`,
`INTERNAL_API_KEY` (must match the API's value exactly).

`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` and the SMTP credentials are the pieces that can't
be generated — they require, respectively, a real OAuth client registered in Google Cloud
Console with the redirect URI above added as an authorized redirect URI, and a chosen SMTP
provider.

## 10. File map

```
packages/database/prisma/schema.prisma          # WebUser (googleId now nullable), WebUserEmailOtp

apps/api/src/modules/web-users/                  # data access
  web-users.module.ts
  web-users.service.ts               # + linkGoogleId, normalizeEmail on every email boundary

apps/api/src/modules/web-user-auth/              # auth flow
  web-user-auth.module.ts                        # imports MailModule
  web-user-auth.controller.ts        # @Controller('web-users/auth') — + email/otp/{request,verify}
  web-user-auth.service.ts           # + requestEmailOtp, verifyEmailOtp, emailVerified gate
  web-user-email-otp.service.ts      # OTP generate/verify mechanics — see §5b
  dto/web-user-auth.dto.ts           # + RequestEmailOtpDto, VerifyEmailOtpDto
  interfaces/web-user-jwt-payload.interface.ts
  strategies/web-user-jwt.strategy.ts            # Passport strategy 'jwt-web-user'
  guards/web-user-jwt-auth.guard.ts

apps/api/src/shared/mail/                        # new — parallel to shared/storage/
  mail.module.ts
  mail.service.ts                    # nodemailer/SMTP, sendOtpEmail()

apps/api/src/common/guards/internal-only.guard.ts
apps/api/src/common/constants/routes.constant.ts # WEB_USER_REFRESH_COOKIE, COOKIE_PATHS.webUserAuthRefresh
apps/api/src/common/utils/email.util.ts          # new — normalizeEmail()
apps/api/src/config/{index.ts,env.validation.ts} # jwtWebUser.*, internal.apiKey, otp.hashSecret, mail.*
apps/api/src/app.module.ts                       # WebUsersModule/WebUserAuthModule registration

apps/web/src/web-app/config/constants.ts         # WEB_USER_* + GOOGLE_OAUTH_* cookie constants
apps/web/src/web-app/lib/web-user-session.ts     # @web-app-lib/web-user-session (unchanged)
apps/web/src/web-app/lib/web-user-client.ts      # @web-app-lib/web-user-client — + requestEmailOtpRequest, verifyEmailOtpRequest
apps/web/src/web-app/lib/google-oauth.ts         # @web-app-lib/google-oauth
apps/web/src/web-app/features/auth/components/google-login-button.tsx
apps/web/src/web-app/features/auth/components/email-otp-form.tsx   # new — two-step client component
apps/web/src/web-app/features/auth/api/web-user-auth.actions.ts    # + requestEmailOtp, verifyEmailOtp actions

apps/web/src/app/api/auth/google/route.ts          # GET — initiate
apps/web/src/app/api/auth/google/callback/route.ts # GET — exchange + upsert + session

apps/web/src/app/(public)/(auth)/login/page.tsx     # renders GoogleLoginButton + EmailOtpForm
apps/web/src/app/(public)/(account)/profile/page.tsx

apps/web/src/proxy.ts   # handleWebUserAuth() added alongside the existing
                         # handleAdminAuth()/handleRetirementCheck(); /profile/:path*
                         # added to the matcher — unaffected by adding email OTP
```

## 11. What this deliberately does not do (out of scope, by design)

- **No RBAC / roles / permissions for web users.** `WebUser` has no relation to
  `Role`/`Permission`/`RoleAssignment` at all — those are admin-only concepts.
- **No traditional password.** Both sign-in methods (Google, email OTP) are passwordless —
  there's no `password` field on `WebUser`, no `RegisterDto`-equivalent.
- **No web-user-facing features beyond auth.** This is the foundation only — a placeholder
  `/profile` page proves the round trip regardless of which method was used. Saved jobs,
  applications, editable profile fields, etc. are future work that will hang off the same
  `WebUser` row.
- **No generic BFF proxy Route Handler for web users yet** (the admin side has
  `app/api/server/[...path]/route.ts` for client-side data fetching through the API). Not
  needed until a web-user feature actually needs client-side data fetching — the pattern to
  follow when that happens is the same one the admin proxy already establishes, using
  `getValidWebUserAccessToken()` in place of the admin equivalent.
- **No cleanup job for expired/consumed `WebUserEmailOtp` rows.** They accumulate
  indefinitely for now — fine at this scale, a future scheduled-cleanup pass (mirroring the
  existing SEO cron jobs' pattern) is the natural extension point if it ever matters.
