# Freelance Marketplace Architecture

Implements `/home/aanish/Downloads/FREELANCE_INTEGRATION_REQUIREMENTS.md` — a freelance-marketplace subsystem layered on top of the existing web-user account system (Google + email-OTP auth). Built in two phases:

- **Phase 1**: freelance profiles, gigs, admin approval moderation, S3 file uploads, public browse pages with SEO.
- **Phase 2**: 1:1 polling-based chat, blocking, abuse reporting, email notifications.

The platform's role is strictly discovery + communication facilitation — no payment processing, no contract/dispute mediation, no ratings/reviews (all explicitly out of scope for v1).

## 1. Data model

`packages/database/prisma/schema.prisma`

### Phase 1

| Model                     | Purpose                                                                                                                                                                                                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FreelanceProfile`        | One per `WebUser` (`webUserId` unique). Fields: `bio`, `rate`/`rateCurrency`, `category`, `skills[]`, `portfolioLinks[]`, `workHistory` (Json array), `cvFileKey`, `portfolioFileKeys[]`. Own approval workflow — mirrors `Job.approvalStatus` exactly rather than sharing a flag with `Company`. |
| `Gig`                     | `postedByWebUserId` → `WebUser`. Fields: `title`, `description`, `category`, `skills[]`, `budgetMin`/`budgetMax`/`budgetCurrency`, `deadline`, `attachmentFileKeys[]`. Same approval shape as `FreelanceProfile`.                                                                                 |
| `FreelanceApprovalStatus` | `PENDING \| APPROVED \| REJECTED`, shared by both models.                                                                                                                                                                                                                                         |

Both models carry **two separate rejection fields**: `rejectionReason` (shown to the submitter) and `internalReviewNotes` (admin-only, never returned on any public/self-service endpoint) — a deliberate deviation from `Job`'s single `rejectionReason`, per explicit product direction.

**Editing an approved profile/gig takes it offline immediately** (reverts to `PENDING`, clears `approvedAt`/`approvedByAdminId`) rather than staying live during re-review — a single-row/single-status-field model, chosen for simplicity over a dual live/pending-snapshot design.

`FREELANCE_CATEGORY_TAXONOMY` (`packages/types/freelance-taxonomy/index.ts`) is a fixed, code-defined taxonomy (same pattern as `SECTOR_TAXONOMY`), not a lookup-table FK — stored as a plain string column on both models.

### Phase 2

| Model          | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Conversation` | One thread **per user pair, forever** — `participantOneId`/`participantTwoId` always ordered (`min`/`max` of the two ids) so `(A,B)` and `(B,A)` collapse to the same row regardless of who initiates. Optional `contextGigId`/`contextFreelanceProfileId`, set once at creation and never overwritten by later messages about something else.                                                                                                                                                                                                                                                                                                         |
| `ChatMessage`  | `conversationId`, `senderId`, `body`, `createdAt`. No read receipts, no edit history (out of scope).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `WebUserBlock` | `blockerId`/`blockedId` self-relation pair on `WebUser`. Checked **bidirectionally** everywhere (either party may have blocked the other) — a block makes the thread read-only for both sides, not just for the blocker.                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `AbuseReport`  | Polymorphic: `entityType` (`FREELANCE_PROFILE \| GIG \| CHAT_MESSAGE \| CHAT_THREAD`) + `entityId` (plain `Int`, not a real FK — mirrors `AuditLog.entityId`'s generic-by-design shape, since one column can't point at four different tables). `contentSnapshot` captures the reported content **at filing time** (server-resolved, never client-supplied) so the admin queue never needs a per-entity-type join and the snapshot survives the source being later edited/deleted. Review shape mirrors `CompanyClaim`/Phase 1's approval pattern: `status` (`PENDING \| REVIEWED \| DISMISSED`) + `reviewedByAdminId`/`reviewedAt`/`resolutionNotes`. |

No in-app notification model was added — the requirements only call for an **email** notification on new messages, and read receipts are explicitly out of scope, so there's no unread-badge state to track.

## 2. Backend (NestJS, `apps/api/src/modules/`)

Follows the existing three-way split used throughout this codebase:

- **Admin modules** (`freelance-profiles/`, `gigs/`, `reports/`) — registered in `app.module.ts`'s `RouterModule` admin-children array (routes resolve under `/admin/*`) _and_ the plain root `imports` array. Guarded by `PermissionsGuard` + `@RequirePermissions(...)`. Approve/reject/review/dismiss all go through the same `$transaction` + `AuditService.record()` shape as `JobsService`.
- **Self-service modules** (`web-user-freelance/`, `web-user-chat/`, `web-user-blocks/`, `web-user-reports/`) — plain root `imports` only. `@Public()` + `@UseGuards(WebUserJwtAuthGuard)` at the controller level (bypasses the app-wide admin `JwtAuthGuard`), `@CurrentUser('webUserId')` per handler.
- **Public browse modules** (`public-freelance-profiles/`, `public-gigs/`) — unauthenticated, only ever return `approvalStatus: APPROVED` rows.

### Key backend decisions

- **File keys, not URLs, are persisted.** `StorageService.upload()` returns a presigned URL that expires after 1 hour; storing that directly (as an existing pre-Phase-1 code path for company logos does) would 403 after an hour. Freelance CV/portfolio/gig-attachment uploads persist the storage **key**, and public/self-service read endpoints call `storageService.getUrl(key)` fresh on every response.
- **RBAC permissions auto-sync.** New permission keys only need adding to `packages/lib/permissions/index.ts` (`PERMISSION_DESCRIPTIONS` + `PERMISSIONS`, both required by a compile-time exhaustiveness check) — `packages/database/prisma/seeders/permissions.seeder.ts` diffs and upserts on every seed run; `super_admin` auto-grants everything new.
- **Chat is available regardless of `FreelanceProfile` approval status.** The requirements explicitly state a `PENDING` profile can still browse and use chat — no approval-status gate anywhere in the chat/report code path, only web-user authentication.
- **Blocking gates both send and start.** `isBlockedEitherDirection()` (in `WebUserBlocksService`, exported for `WebUserChatModule` to import) is checked both when starting a new conversation and when sending a message — otherwise a block is trivially bypassed by opening a fresh thread.
- **Email is best-effort.** `MailService.sendNewMessageEmail()` (added alongside the existing `sendOtpEmail`, same inline-string-interpolation style, no template engine) is called from `WebUserChatService.sendMessage()` inside a `try/catch` — a missing/broken SMTP config logs a warning but never fails the message-send request.
- **Report content snapshots are server-resolved**, and for `CHAT_MESSAGE`/`CHAT_THREAD` reports, the reporter's participation in that conversation is verified before the snapshot is built — otherwise any authenticated user could probe arbitrary message/conversation ids.

### Routes added

```
# Admin
GET/POST   /admin/freelance-profiles[/:id/approve|reject]
GET/POST   /admin/gigs[/:id/approve|reject]
GET/POST   /admin/reports[/:id/review|dismiss]

# Self-service
POST/GET/PATCH/DELETE  /web-users/freelance-profiles[/me|/me/cv|/me/portfolio-files]
POST/GET/PATCH/DELETE  /web-users/gigs[/mine|/:id/attachments]
POST/GET               /web-users/chat/conversations[/:id|/:id/messages]
POST/DELETE/GET        /web-users/blocks[/:blockedWebUserId]
POST                   /web-users/reports

# Public (unauthenticated)
GET  /public/freelance-profiles[/:slug|/sitemap-entries]
GET  /public/gigs[/:slug|/sitemap-entries]
```

## 3. Frontend — public site (`apps/web/src/web-app/`, `apps/web/src/app/(public)/freelance/`)

- **Server Actions, not direct browser→API calls.** The public site's web-user access token never reaches the browser — every authenticated action is a `"use server"` function (`features/*/api/*.actions.ts`) that reads the session cookie server-side (`getValidWebUserAccessToken()`) and calls a `*Request` helper (`web-app/lib/*-client.ts`, `"server-only"`, wraps `apiFetch`).
- **TanStack Query wired onto the public site for the first time**, specifically for chat polling — it was already a dependency and already used by the admin dashboard, just not wired into `(public)/layout.tsx` before Phase 2. Reuses the same generic `makeQueryClient()` helper the dashboard uses. New chat/report hooks' `queryFn`/`mutationFn` call the Server Action (never `apiFetch` directly — it's `"server-only"` and can't be imported into client code).
- Conversation list polls every 15s, active thread every 4s (same order of magnitude as the dashboard's existing 5s queue-log polling).
- SEO: freelancer/gig detail pages follow the exact same pattern as job detail pages — `generateMetadata()`, ISR `revalidate`, JSON-LD via `<StructuredData>` fed by new `buildFreelancerProfileSchema()`/`buildGigPostingSchema()` builders in `web-app/lib/structured-data.ts` (schema.org `Person`/`Service`), new `freelancer-detail`/`gig-detail` sitemap buckets in `app/sitemap.ts` + `app/robots.ts`.
- Terminology: the codebase's pre-existing navbar stub used "Talent" throughout — reworded to "Freelancer" everywhere (route segments, component names, copy) per product direction; "talent" does not appear anywhere in the new code.

### New routes

```
/freelance                              (existing landing page, categories now sourced from FREELANCE_CATEGORY_TAXONOMY)
/freelance/freelancers[/​[slug]]
/freelance/gigs[/​[slug]|/new]
/freelance/profile/edit                 (create/edit own FreelanceProfile, CV/portfolio upload)
/freelance/messages[/​[conversationId]]  (chat inbox + thread, blocked-users list)
```

## 4. Frontend — admin (`apps/web/src/dashboard/`)

New sidebar module `"freelance"` (`dashboard/config/sidebar-links.ts`) with three pending-queue pages, each a direct copy-adapt of the existing `pending-jobs-table.tsx` pattern (`@ui/data-table`'s `useDataTable`/`DataTable`, TanStack Query hooks with `invalidateQueries` + `sonner` toasts):

- **Pending Profiles** (`/admin/freelance/profiles/pending`)
- **Pending Gigs** (`/admin/freelance/gigs/pending`)
- **Reports** (`/admin/freelance/reports`) — reject/reject-style dialogs replaced with Mark Reviewed / Dismiss, each opening a `resolutionNotes` dialog.

Deliberately **not** a single merged Job+FreelanceProfile+Gig+Report moderation table — the existing sidebar convention always gives each domain its own dedicated pending-queue page, and the row shapes differ too much to unify usefully.

The freelance-profile/gig reject dialogs show **two separate fields**: "Reason shown to user" (→ `rejectionReason`) and "Internal note, admins only" (→ `internalReviewNotes`) — both optional, submitted together.

## 5. Known v1 simplifications (documented, not oversights)

- `AbuseReport.entityId` has no DB-level referential integrity (see §1) — mitigated by the content snapshot, not a foreign key.
- Chat message pagination only refetches the latest page on each poll; a burst of more than 50 messages between polls could skip older-than-page messages until a manual "load more" (not yet built).
- No throttling on new-message emails — one email per message, unconditionally.
- Blocking only affects chat; blocked users can still see each other's public profile/gig pages and can still report each other.
- No committed `prisma/migrations/` directory exists anywhere in this repo — schema changes are applied via `prisma db push`, consistent with every prior schema change (Job approval fields, CompanyClaim, etc.).
