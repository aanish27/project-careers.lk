# Freelance Marketplace — Test Plan

Companion to [`freelance-marketplace-architecture.md`](./freelance-marketplace-architecture.md). Manual test plan covering both phases, organized bottom-up (schema → backend → frontend). Run roughly in order — later sections assume earlier ones pass. Endpoints assume the API is mounted at `/api/v1` (adjust if different locally).

## 0. Prerequisites

- `pnpm --filter @careerslk/database prisma db push` applied; `pnpm --filter @careerslk/database` seed script run (syncs the new `reports.read`/`reports.review`/`freelance-profiles.*`/`gigs.*` permissions onto `super_admin`).
- Dev API and web servers running; SMTP env vars set for the email tests in §11 (and deliberately unset for one negative test).
- Two separate web-user accounts (A and B) with valid sessions — most of Phase 2 requires two distinct parties. An admin bearer token / admin session with `super_admin` (or explicitly granted `FREELANCE_PROFILES_APPROVE`/`GIGS_APPROVE`/`REPORTS_REVIEW`) for the moderation checks.
- At least one `Company`/`Job` unaffected by any of this — regression-check that existing job-board flows still work after the schema/permissions changes.

## 1. Schema / data integrity

- [ ] `psql`/Prisma Studio: `freelance_profiles.webUserId` is unique — attempt to create a second profile for the same web user via the API (§2) and confirm it's rejected (409), not silently duplicated at the DB level.
- [ ] `conversations` has a unique constraint on `(participantOneId, participantTwoId)` — confirm `participantOneId < participantTwoId` always holds for every row (`SELECT * FROM conversations WHERE "participantOneId" >= "participantTwoId";` returns nothing).
- [ ] `abuse_reports.contentSnapshot` is never null/empty for any row created via the API.
- [ ] Every `FreelanceProfile`/`Gig` row's `approvalStatus` defaults to `PENDING` on creation (confirm via direct insert through the API, not a manual DB insert).

## 2. Self-service API — freelance profiles (`/web-users/freelance-profiles`)

Authenticate as web user A for this section.

- [ ] `POST /web-users/freelance-profiles` with a valid body → `201`, `approvalStatus: "PENDING"`, `slug` set.
- [ ] `POST` again as the same user → `409` (already has a profile).
- [ ] `GET /web-users/freelance-profiles/me` → returns A's profile, including `rejectionReason`/`internalReviewNotes`... **confirm `internalReviewNotes` is NOT present** in this response (admin-only field must never leak to self-service).
- [ ] `PATCH /web-users/freelance-profiles/me` while `PENDING` → stays `PENDING`.
- [ ] Get the profile approved (§4), then `PATCH` it again → `approvalStatus` reverts to `PENDING`, `approvedAt`/`approvedByAdminId` clear to `null` (edit-takes-it-offline-immediately behavior).
- [ ] `POST /web-users/freelance-profiles/me/cv` with a PDF → `200`, `cvFileKey` set on the profile (not `cvUrl` — self-service responses expose the raw key, not a resolved URL).
- [ ] Upload a `.docx` CV → succeeds (doc/docx added to the MIME allowlist for this feature). Upload a `.exe` or other disallowed type → `400`.
- [ ] `POST /web-users/freelance-profiles/me/portfolio-files` with 5 images → succeeds; attempt a 6th → `400` (max 5 enforced).
- [ ] `DELETE /web-users/freelance-profiles/me` → soft-deletes (confirm `deletedAt` set in DB, and the profile disappears from `GET /me` and public browse).

## 3. Self-service API — gigs (`/web-users/gigs`)

- [ ] `POST /web-users/gigs` with a valid body → `201`, `PENDING`.
- [ ] Submit 5 gigs while all remain `PENDING`, then a 6th → `400` (max 5 pending per user).
- [ ] `GET /web-users/gigs/mine` → lists all of A's gigs regardless of status.
- [ ] `PATCH /web-users/gigs/:id` on an approved gig → reverts to `PENDING` (same edit-offline behavior as profiles).
- [ ] `POST /web-users/gigs/:id/attachments` — up to 3 files succeed, a 4th → `400`.
- [ ] `DELETE /web-users/gigs/:id` → soft-delete, disappears from public browse.
- [ ] Rapid-fire `POST /web-users/gigs` beyond the throttle limit (10/60s) → `429`.

## 4. Admin moderation API

Authenticate as an admin with `FREELANCE_PROFILES_APPROVE`/`GIGS_APPROVE` for this section.

- [ ] `GET /admin/freelance-profiles?approvalStatus=PENDING` → includes A's submitted profile; response includes `internalReviewNotes` field (admin surface — confirm it's present here, contrasting with §2's confirmation that it's absent from self-service).
- [ ] `POST /admin/freelance-profiles/:id/approve` → `approvalStatus: "APPROVED"`, `approvedByAdminId` set, `rejectionReason`/`internalReviewNotes` cleared to `null`.
- [ ] `POST /admin/freelance-profiles/:id/reject` with `{ "reason": "...", "internalNotes": "..." }` → `REJECTED`, both fields persisted distinctly.
- [ ] Repeat approve/reject for `/admin/gigs/:id/approve|reject`.
- [ ] Confirm every approve/reject/delete action appears in `/admin/logs/audit` (or the equivalent audit endpoint) with the correct `action`/`entityType`/`entityId`.
- [ ] As an admin **without** `FREELANCE_PROFILES_APPROVE`, call the approve endpoint → `403`.
- [ ] As a non-admin (web-user token) call any `/admin/*` freelance route → `401`/`403`.

## 5. Public browse API (unauthenticated)

Run without an Authorization header — should all `200`.

- [ ] `GET /public/freelance-profiles` → only `APPROVED` profiles; a still-`PENDING` or `REJECTED` profile never appears.
- [ ] `GET /public/freelance-profiles?category=<a real category>` and `?skill=<a real skill>` → results narrow correctly.
- [ ] `GET /public/freelance-profiles/:slug` → includes `cvUrl`/`portfolioUrls` as resolved, currently-valid URLs (not the raw storage key) — open one, confirm it downloads/loads (not a 403 from an expired presigned URL).
- [ ] Wait >1h (or manually re-check) and re-fetch the same profile — `cvUrl` differs each time (freshly re-signed on every read) but the file still loads, proving keys are persisted rather than a one-time URL.
- [ ] `GET /public/freelance-profiles/sitemap-entries` → `{slug, updatedAt}[]` for approved profiles only.
- [ ] Repeat all of the above for `/public/gigs`.
- [ ] `GET /public/freelance-profiles/not-a-real-slug` → `404`.

## 6. Frontend — public browse & SEO

- [ ] `/freelance` — category tiles render from `FREELANCE_CATEGORY_TAXONOMY` (not a hardcoded duplicate list); clicking one navigates to `/freelance/freelancers?category=...` and narrows results.
- [ ] `/freelance/freelancers` and `/freelance/gigs` render real approved data, empty-state message shown correctly when a filter matches nothing.
- [ ] Visit a freelancer/gig detail page — view page source (not devtools), confirm `<script type="application/ld+json">` blocks (`Person`/`Service` + `BreadcrumbList`) are present in the initial HTML (SSR, not client-injected).
- [ ] Paste that JSON-LD into Google's [Rich Results Test](https://search.google.com/test/rich-results) — no errors.
- [ ] `curl -I` a detail page — confirm the `alternates.canonical` meta tag matches the page's own URL.
- [ ] `/sitemap/freelancer-detail.xml` and `/sitemap/gig-detail.xml` — both resolve and list only approved entries; both URLs also appear in `/robots.txt`'s sitemap list.

## 7. Frontend — self-service forms

- [ ] `/freelance/profile/edit` while logged out → redirects to login.
- [ ] Create a profile via the form (no prior profile) → redirects back to the edit page, now showing the "awaiting approval" notice.
- [ ] Upload a CV and portfolio files via the form buttons — confirm progress/disabled states and that `router.refresh()` picks up the new file without a full reload looking broken.
- [ ] `/freelance/gigs/new` — submit a gig, confirm redirect to the new gig's detail page.
- [ ] On a freelancer/gig detail page you **own**, confirm the "Message" button does **not** render (self-messaging guard).

## 8. Admin UI

- [ ] `/admin/freelance/profiles/pending` and `/admin/freelance/gigs/pending` — list, approve, reject (with both reason fields) all work end-to-end from the UI; toasts confirm success.
- [ ] Sidebar: the "freelance" module shows all three items (Pending Profiles / Pending Gigs / Reports) only for an admin with the relevant permissions; hidden otherwise.
- [ ] Icon rail: the freelance icon navigates to `/admin/freelance`, which redirects to `/admin/freelance/profiles/pending`.

## 9. Chat (Phase 2)

Requires two browser sessions (or one regular + one incognito) as web users A and B.

- [ ] As A, on B's gig detail page, click "Message" → `POST /web-users/chat/conversations` creates a `Conversation` row; redirected to `/freelance/messages/:id`.
- [ ] As B, visit `/freelance/messages` → the new conversation appears, with the correct "Re: {gig title}" context label.
- [ ] Send a message as A; without refreshing B's open thread, confirm it appears within ~4s (polling `refetchInterval`). Confirm the inbox list re-sorts by `lastMessageAt` within ~15s.
- [ ] As A, message B again from a **different** gig's page → confirms it reuses the **same** conversation (check `Conversation.id` is unchanged, and the context label on the thread still shows the _original_ gig, not the second one).
- [ ] `GET /web-users/chat/conversations/:id/messages` as a user who is **not** a participant → `404` (no data leak).
- [ ] Send an empty/whitespace-only message via the API directly → `400` (Zod min-length validation).
- [ ] Rapid-fire messages beyond the throttle (30/60s) → `429`.

## 10. Blocking

- [ ] As A, block B (via the thread's "Block user" dialog, with confirmation).
- [ ] Confirm the thread shows a "read-only" badge/notice for **both** A and B.
- [ ] `POST .../messages` as A → `403`. `POST .../messages` as B → also `403` (bidirectional).
- [ ] Message history remains fully visible to both via `GET .../messages` (nothing deleted).
- [ ] As A, try to start a **new** conversation with B (e.g. via a different gig's Message button) → `403` (block also gates conversation creation, not just sending).
- [ ] `/freelance/messages` for A — the "Blocked users" section lists B with an "Unblock" action.
- [ ] Unblock B → the thread becomes writable again for both sides; confirm via a fresh message send from either side.
- [ ] As B (who did _not_ initiate the block), confirm there is **no** unblock control shown to them anywhere (directionality is intentionally only actionable by the blocker).

## 11. Abuse reporting

- [ ] File a report on a `FREELANCE_PROFILE` (with each of the 5 categories at least once across this section) → `201`, `contentSnapshot` matches the profile's current bio.
- [ ] File a report on a `GIG` → snapshot is `title + description`.
- [ ] File a report on a `CHAT_MESSAGE` you're a participant of → snapshot matches the message body.
- [ ] File a report on a `CHAT_MESSAGE`/`CHAT_THREAD` you are **not** a participant of → `403`/`404`, not silently accepted.
- [ ] File a report on a nonexistent `entityId` → `404`.
- [ ] Rapid-fire reports beyond the throttle (5/60s) → `429`.
- [ ] As an admin, `/admin/freelance/reports` shows all filed reports with correct reporter, category, and truncated snapshot.
- [ ] "Mark Reviewed" and "Dismiss" both work, each with an optional resolution-notes field; confirm `status`/`reviewedByAdminId`/`reviewedAt`/`resolutionNotes` update correctly and the action appears in the audit log.
- [ ] Edit or soft-delete the reported profile/gig/message _after_ filing a report — confirm the report's `contentSnapshot` in the admin queue is unchanged (it's a point-in-time snapshot, not a live join).

## 12. Email notifications

- [ ] With SMTP configured (e.g. Mailhog/catch-all inbox in dev), send a chat message — confirm a "New message from {sender} on careers.lk" email arrives at the recipient's address, with a working link back to the conversation.
- [ ] Confirm the email body truncates long messages to ~200 characters with an ellipsis.
- [ ] **Unset SMTP env vars** (or point them at an unreachable host) and send a message again — confirm the `POST .../messages` call still returns `200`/`201` (email failure must never fail the send), and check the API logs for the expected warning.

## 13. Cross-cutting / regression

- [ ] Existing job-board flows (search, save job, company claim, post a job) still work unaffected after the schema/permission additions.
- [ ] `pnpm --filter @careerslk/database` seed script is idempotent — re-run it and confirm no duplicate permissions/roles are created (`Permissions: 0 inserted, 0 updated, N unchanged` on a second run with no schema changes).
- [ ] Full `tsc --noEmit` on both `apps/api` and `apps/web` — zero errors in any freelance/chat/blocks/reports file (pre-existing unrelated errors elsewhere are expected and out of scope).
