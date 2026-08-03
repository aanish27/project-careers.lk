# SEO / Public Job Board — Test Plan

Companion to [`seo-architecture.md`](./seo-architecture.md). Manual test plan for the SRS §5.5 + §12 implementation, organized bottom-up (schema → backend → generation logic → frontend → admin). Run roughly in order — later sections assume earlier ones pass.

## 0. Prerequisites

- `pnpm --filter @careerslk/database prisma db push` applied, dev API and web servers running.
- At least one company + a handful of jobs seeded (`pnpm --filter @careerslk/database` seed script), so `Job.seoRoleId`/`seoLocationId` are populated and `SeoRole`/`SeoLocation`/`SeoSkill` lookup tables aren't empty.
- An admin bearer token (log into `/admin`) for the authenticated checks.

## 1. Schema / data integrity

- [ ] `prisma studio` (or `psql`): every `Job` row has a non-null `slug`; format is `{title-slug}-{company-slug}-{id}`.
- [ ] Every `Company` row has a non-null, unique `slug`.
- [ ] For jobs with a non-null `roleCategory`, `seoRoleId` is set. For jobs with a resolvable `location`, `seoLocationId` is set.
- [ ] `SeoRole` count matches `ALL_CATEGORIES` from `@careerslk/types` (currently ~83); `SeoLocation` count matches `SRI_LANKAN_CITIES`.
- [ ] Attempt to insert two `SeoPage` rows with identical `(pageType, roleId, locationId, companyId, skillId, sector)` where all are non-null — second insert should violate the `@@unique` constraint. (Singleton types like `ALL_JOBS` are _not_ protected by this constraint — see architecture doc §3 note — verify by slug-uniqueness instead: `SeoPage.slug` is `@unique`, so a duplicate-slug upsert should update in place, not create a second row.)

## 2. Public API (unauthenticated)

Run these **without** an Authorization header — all should return `200`, proving `@Public()` is wired correctly (contrast with `/admin/jobs`, which 401s without a token).

- [ ] `GET /api/v1/public/jobs` → `{items, nextCursor}`, `items` non-empty if jobs exist.
- [ ] `GET /api/v1/public/jobs?location=colombo&workMode=remote&employmentType=full_time` → results narrow correctly; confirm `employmentType` values in the DB are `full_time`/`part_time`/... (underscored) and `workMode` is `remote`/`hybrid`/`onsite` (lowercase) — a mismatch here would silently return zero results.
- [ ] `GET /api/v1/public/jobs?salaryMin=50000` → only jobs with **both** `salaryMin`/`salaryMax` set and overlapping the range; jobs with null salary never appear.
- [ ] `GET /api/v1/public/jobs?q=<a real job title word>` → matches via title/description/company/skill/keyword.
- [ ] Cursor pagination: request with `limit=1`, take `nextCursor` from the response, pass it back — confirm the second page doesn't repeat the first item and ordering is `lastSeenAt desc`.
- [ ] `GET /api/v1/public/jobs/{a-real-job-slug}` → full detail + `relatedJobs.sameCompany`/`.sameRole`.
- [ ] `GET /api/v1/public/jobs/{same-job-id}-wrong-title-slug` (keep the trailing `-{id}` but change the words before it) → `isStaleSlug: true`, `canonicalSlug` equal to the real slug.
- [ ] `GET /api/v1/public/jobs/not-a-real-slug-999999` → `404`.
- [ ] `GET /api/v1/public/jobs/sitemap-entries` → array of `{slug, updatedAt}` for **all** active jobs, unbounded (not capped at 20/50).
- [ ] `GET /api/v1/public/jobs/{slug}/retirement-status` → `{retired: false}` for a normal active/recently-expired job.
- [ ] `GET /api/v1/public/companies/{slug}` and `.../jobs` → company profile / job list.
- [ ] `GET /api/v1/seo-pages/by-slug?slug=jobs/some-role` → `404` if generation hasn't run yet (expected — see §3), or `{page, jobs, relatedLinks}` once it has.

## 3. Generation engine

- [ ] `POST /api/v1/admin/seo/pages/generate` (admin token) → returns `{created, updated, skippedManualOverride, belowThreshold, failedValidation}`; `created` should roughly equal (sectors + roles + locations + qualifying role×location pairs + skills + companies-with-jobs + remote-role variants + 2 globals).
- [ ] Spot-check row counts by type: `SELECT "pageType", COUNT(*) FROM "SeoPage" GROUP BY 1;` — `SECTOR` = 16 (fixed taxonomy size), `ROLE`/`REMOTE` ≈ `SeoRole` count, etc.
- [ ] Pick a role/location combo you know has few jobs (below its threshold — role+location threshold is 5) — confirm its `SeoPage.isIndexable = false` but the row still exists (not skipped entirely).
- [ ] Re-run `generate` a second time with no data changes — `created` should be `0`, `updated` should cover most rows, and `contentVersion` increments only on rows that actually changed (compare before/after `contentVersion` on one row).
- [ ] Manually `PATCH /api/v1/admin/seo/pages/{id}` to set custom `title`, confirming `manualOverride` becomes `true`. Re-run `generate` — confirm that row's `title` is unchanged but `jobCount`/`lastmod` still refresh if the underlying job count changed.
- [ ] Break a template deliberately (temporarily edit `seo-templates.ts` to leave a literal `{role}` in one variant, rebuild, regenerate one page type) — confirm the affected pages get `needsReview: true`, `validationIssues` containing the placeholder message, **and** `isIndexable: false` even though they're above threshold (this is the FR-SEO-14 hard gate — the important case to verify, since it's easy to accidentally implement as a soft flag). Revert the template change afterward.
- [ ] Confirm two `SeoPage` rows never have an identical `title` or `metaDescription` (`SELECT title, COUNT(*) FROM "SeoPage" GROUP BY 1 HAVING COUNT(*) > 1;` should return nothing) — validates the uniqueness check is actually catching collisions across template variants.

## 4. Lifecycle (deactivation / reactivation / retirement)

Best tested by direct DB manipulation rather than waiting real days:

- [ ] Pick an indexable `SeoPage` row above threshold. Manually set its `jobCount` low in the DB (or reduce real job data behind it) so it reads as below threshold, then trigger the lifecycle evaluation (call `SeoLifecycleService.evaluateAll()` directly, or wait for its weekly cron / add a temporary admin-triggerable endpoint for testing). First run: confirm `firstBelowThresholdAt` gets set but `isIndexable` **stays true** (grace period hasn't elapsed).
- [ ] Manually backdate `firstBelowThresholdAt` to 15+ days ago, re-run evaluation → confirm `isIndexable` flips to `false` and `deactivatedAt` is set.
- [ ] Restore the job count above threshold, re-run evaluation → confirm `isIndexable` returns to `true`, `firstBelowThresholdAt`/`deactivatedAt` clear back to `null`.
- [ ] Manually backdate `deactivatedAt` to 91+ days ago on a still-deactivated page, re-run evaluation → confirm `retiredAt` gets set.
- [ ] Confirm a page with `needsReview: true` does **not** get reactivated to `isIndexable: true` even if its job count recovers (the QC hard gate should still apply) — set both conditions and check the reactivation branch respects it.

## 5. Frontend — public job board

- [ ] `/jobs` renders real DB jobs, not a mock array. Change each filter (location, work mode, employment type, salary range, skills) one at a time and confirm the URL updates and results narrow correctly.
- [ ] `/jobs` with `?salaryMin=50000` in the URL — view page source, confirm `<meta name="robots" content="noindex,follow">` is present (or absent when no salary filter is set).
- [ ] Click a sector in the sidebar → navigates via a real `<a href>` (check with JS disabled, or view source for an actual anchor tag) to `/jobs/sector/{slug}`, not just a client-side filter.
- [ ] Job card company logos render via `next/image` (check Network tab for `/_next/image?url=...`, not a raw passthrough) with `alt="{Company} logo"` — not a generic placeholder string.
- [ ] Click "Apply Now" — opens `applyUrl` in a new tab (`target="_blank"`).
- [ ] Visit a job detail page (`/jobs/{slug}`) — view page source (not devtools' rendered DOM) and confirm `<script type="application/ld+json">` blocks for `JobPosting` and `BreadcrumbList` are present in the initial HTML (proves SSR, not client-injected).
- [ ] Paste that JSON-LD into Google's [Rich Results Test](https://search.google.com/test/rich-results) — no errors.
- [ ] Visit a job detail page for an `EXPIRED` job less than 90 days past `lastSeenAt` — page still renders with a "no longer active" banner, `<meta name="robots" content="noindex,follow">`, no 404.
- [ ] Manually set a job's `status=EXPIRED` and `lastSeenAt` to 91+ days ago — visiting its detail page returns `404` (not retired to 410 yet — see §7 for the actual 410 path via the proxy).
- [ ] Visit a job detail URL with a deliberately wrong (but correctly `-{id}`-suffixed) slug — confirm a real HTTP 308 redirect to the canonical slug (check via `curl -I`, not just the browser following it silently).

## 6. Frontend — pSEO landing pages

Requires generation to have run (§3) first.

- [ ] Visit each of: `/jobs/{a-role-slug}`, `/jobs/in/{a-location-slug}`, `/jobs/{role}/in/{location}`, `/jobs/remote/{role}`, `/jobs/skills/{skill}`, `/jobs/sector/{sector}`, `/companies/{company}`, `/companies/{company}/jobs`, `/internships`, `/remote-jobs` — each renders H1, intro text, a job grid, related links, bottom text without error.
- [ ] Related links on any page only point to other pages that are themselves `isIndexable: true` (spot-check one link's target page's DB row).
- [ ] View source on one pSEO page — confirm `BreadcrumbList` and `CollectionPage` JSON-LD present; if that `SeoPage.faqJson` is non-empty, confirm `FAQPage` JSON-LD too.
- [ ] Force a page below threshold (§4) — visiting its URL still renders (not noindex-hidden from users), but view source shows `<meta name="robots" content="noindex,follow">`.
- [ ] Visit a role/location/skill/sector slug that doesn't exist at all (never generated, e.g. a nonsense string) → `404`.
- [ ] `/jobs` itself — scroll to the bottom, confirm the `ALL_JOBS` `SeoPage`'s intro/bottom/FAQ content renders below the listing (requires generation to have created that row — `pageType=ALL_JOBS` is exempt from the enumeration loop, confirm it's seeded once separately or created on first generate).

## 7. Sitemap, robots, 410

- [ ] `curl localhost:3000/robots.txt` — `Disallow: /admin`, `/api`, and the parameterized-filter patterns; `Sitemap:` lines listing all 8 bucket URLs.
- [ ] `curl localhost:3000/sitemap/roles.xml` (and each other bucket) — valid XML, only URLs for `isIndexable: true, retiredAt: null` rows, `<lastmod>` populated.
- [ ] `curl localhost:3000/sitemap/job-detail.xml` — one entry per **active** job (not expired/deleted), `<lastmod>` = `updatedAt`.
- [ ] Force a page's `retiredAt` to a past date in the DB. `curl -I localhost:3000/{that-pages-path}` → **`410 Gone`**, and the body should be empty/minimal (confirms the proxy intercepted before the page rendered, not a rendered 404 page with a spoofed status).
- [ ] Confirm the admin-auth proxy behavior for `/admin/*` still works (log out, hit an `/admin` route, confirm redirect to `/admin/login`) — regression check, since the retirement-check logic was merged into the same `proxy.ts` file.
- [ ] Un-retire the page (`retiredAt = null`) and confirm the URL renders normally again — the proxy's fail-open behavior (a transient API error lets the request through) is hard to test directly, but you can simulate it by pointing `API_URL` at an unreachable port temporarily and confirming pages still render (proxy fails open) rather than every request 500ing.

## 8. Admin UI

- [ ] Log in with a role that has `SEO_READ` but not `SEO_UPDATE` — `/admin/seo` list and detail pages are visible, but save/regenerate/deactivate/reactivate actions are disabled or return 403 on attempt.
- [ ] `/admin/seo` — table loads, "Run generation now" button triggers `POST .../generate` and shows a toast with the summary counts.
- [ ] Open a page's detail view — edit title/meta/H1, use the rich-text editor to add a heading and a paragraph to intro text, add an FAQ entry, save. Confirm: `manualOverride` badge appears, the public-facing page reflects the new content (may need to wait for ISR revalidation or force a fresh request).
- [ ] Click "Regenerate now" (force=false) on that same manually-overridden page — confirm the edited content is **not** reverted, only `jobCount`/`lastmod` refresh.
- [ ] Click "Reset to template" — confirm the confirmation dialog appears, and on confirming, `manualOverride` clears and content reverts to the template output.
- [ ] Click "Deactivate" on an indexable page, confirm `isIndexable` flips false immediately in the UI and DB; click "Reactivate", confirm it flips back.
- [ ] On a page with `needsReview: true`, confirm the validation issues list renders prominently and matches the DB's `validationIssues` array.
- [ ] Confirm every admin SEO mutation (update/regenerate/deactivate/reactivate) produces an `AuditLog` row (`SELECT * FROM "AuditLog" WHERE "entityType" = 'seo_page' ORDER BY "createdAt" DESC;`).

## 9. Regression checks (things this work touched but didn't own)

- [ ] Existing admin `/admin/jobs`, `/admin/company` pages still work unauthenticated-401/authenticated-200 as before (public jobs/companies modules are separate from the admin ones, but both now exist side by side under similar route prefixes — confirm no accidental route shadowing).
- [ ] The homepage (`/`) "Recent Jobs" section renders real jobs (it was migrated off its own mock array as a side effect of changing `JobCard`'s prop contract).
- [ ] `/text-editor` (the standalone TipTap demo page) still renders with its default demo content, unaffected by the `RichTextEditor` prop changes.
- [ ] Full monorepo type-check (`tsc --noEmit` in `apps/api` and `apps/web`) — clean, or only the pre-existing unrelated tiptap/dashboard-table errors that predate this work.
