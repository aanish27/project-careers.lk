# SEO Architecture (Public Job Board + Programmatic SEO)

Implements SRS [`SRS_JobScraper.md`](./SRS_JobScraper.md) §5.5 (Public Job Board Website) and §12 (SEO Architecture & Programmatic SEO), sections 12.1–12.11, 12.13–12.14, 12.16–12.18. **Deferred**: §12.12 (Google Search Console integration) and everything gated on it, plus §12.18's own deferred list (industry/category pages, AI content refinement, advanced topical clustering).

Of the 15 functional requirements in §12.17, 12 are fully satisfied (FR-SEO-1,2,3,4,5,6,7,8,9,10,11,15); FR-SEO-12/13 are deferred with GSC; FR-SEO-14 is satisfied via a **hard gate** (see §5).

## 1. High-level picture

```
                          ┌─────────────────────────────┐
                          │   SeoRole / SeoLocation /    │
                          │   SeoSkill (lookup tables)   │
                          │   + SECTORS (code constant)  │
                          └──────────────┬───────────────┘
                                         │ enumerated by
                                         ▼
┌──────────────┐   reads   ┌───────────────────────────┐   writes   ┌──────────────┐
│  Job / Company │────────▶│  SeoGenerationService      │──────────▶│   SeoPage     │
│  (real data)   │         │  (seo-generation.service)   │           │  (one row per  │
└──────────────┘           │  aggregate → template →     │           │   page)        │
                            │  validate → related links   │           └───────┬────────┘
                            └───────────────┬─────────────┘                   │
                                            │                                  │ read by
                     ┌──────────────────────┴──────────────────┐             ▼
                     ▼                                          ▼   ┌──────────────────┐
          ┌────────────────────┐                     ┌────────────────────┐  │  Next.js pages   │
          │ SeoLifecycleService │                     │ SeoValidationService│  │  (ISR, on-demand) │
          │ (weekly, real-time  │                     │ (12.14 QC — hard   │  └──────────────────┘
          │  grace period)      │                     │  gate on isIndexable)│
          └────────────────────┘                     └────────────────────┘
```

Three independent schedules drive the pipeline (decision #7 — deliberately not one blind cron):

| Schedule             | Cadence                                    | What it does                                                             |
| -------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| Expiry flip          | Daily, calendar-based                      | `Job.status: ACTIVE → EXPIRED` after 14 days unseen                      |
| Generation           | Daily, offset after the scraper's own cron | Rebuilds every `SeoPage` row from current job data                       |
| Lifecycle evaluation | Weekly                                     | Deactivates/reactivates/retires pages based on sustained threshold state |

Generation was originally going to be triggered by a BullMQ `QueueEvents` listener on scrape completion (true event-driven). That was simplified to a daily cron offset after the scraper's own cron — the scraper itself only runs once a day, so the practical freshness is identical, and it avoids an under-documented BullMQ API path. Admin-triggered manual scrapes don't get instant regeneration; the always-available `POST /admin/seo/pages/generate` covers that gap.

## 2. Why this shape

- **SeoPage's dimension FKs are real relations, not string matching.** `Job.roleCategory` is an AI-classified controlled vocabulary, so exact-match FK resolution (`Job.seoRoleId`, `Job.seoLocationId`, `JobSkill.seoSkillId`) at ingestion time turns every threshold/aggregate check into an indexed Prisma `count()`/`groupBy()` instead of a string scan repeated per page per generation run.
- **Sector is the one exception** — `SeoPage.sector` is a plain string, not a lookup-table FK. Sectors are a small, fixed, code-defined taxonomy (`SECTOR_TAXONOMY` in `@careerslk/types`), not noisy scraped free text like location/skill, so there's nothing to normalize or dedupe.
- **Lifecycle uses a timestamp, not a counter.** `SeoPage.firstBelowThresholdAt` records _when_ a page first dropped below threshold; deactivation only fires once `now - firstBelowThresholdAt >= 14 days`. An earlier design used a counter incremented once per generation run — that breaks the moment generation runs more than once a week (which it now does, daily), deactivating pages after a few days instead of two real weeks. Flapping a URL between indexed/noindexed erodes Google's trust in it even after reactivation, so the grace period has to be measured in real elapsed time.
- **FR-SEO-14 is a hard gate.** A validation failure (duplicate title, unresolved template placeholder, keyword stuffing) sets `isIndexable=false` directly, not just `needsReview=true`. A softer "flag but still index" reading would fail to satisfy "validate **before** marking indexable" literally. Trade-off: a template bug can accidentally noindex an otherwise-good page until an admin catches it in the review queue — judged preferable to shipping non-compliant metadata.
- **Manual override freezes content, not stats.** `SeoPage.manualOverride=true` stops generation from rewriting `title`/`introText`/`bottomText`/etc., but `jobCount`/`companyCount`/`lastmod` are still refreshed every run — an admin's hand-written copy doesn't go stale on the numbers it quotes.
- **Template variant selection is deterministic** (hashed from the slug), so re-running generation on an unchanged page never reshuffles which of the 3 variants is shown — required for the uniqueness check in §12.14 to mean anything across runs.

## 3. Data model

`packages/database/prisma/schema.prisma` — `SeoPage`, `SeoRole`, `SeoLocation`, `SeoSkill`, plus new fields added directly to `Job`/`Company`/`JobSkill`.

| Model / field                                                          | Purpose                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Job.slug`, `Company.slug`                                             | `slugify(title)-slugify(company)-{id}` for jobs (id suffix guarantees uniqueness even on title/company collisions); `slugify(name)` + collision suffix for companies                                                                                                                      |
| `Job.seoRoleId` / `.seoLocationId`, `JobSkill.seoSkillId`              | Real FKs, resolved at scrape-ingestion time (`apps/scrapper/src/services/job.service.ts`)                                                                                                                                                                                                 |
| `SeoPageType` enum                                                     | `SECTOR, ROLE, LOCATION, ROLE_LOCATION, COMPANY, SKILL, REMOTE, INTERNSHIP, ALL_JOBS`                                                                                                                                                                                                     |
| `SeoPage.sector/roleId/locationId/companyId/skillId`                   | Nullable dimension columns — which combo of these is set (plus `pageType`) identifies the page                                                                                                                                                                                            |
| `SeoPage.jobCount/companyCount`                                        | Cached aggregate stats, refreshed every generation run regardless of `manualOverride`                                                                                                                                                                                                     |
| `SeoPage.firstBelowThresholdAt/deactivatedAt/retiredAt`                | Lifecycle timestamps (§4 below)                                                                                                                                                                                                                                                           |
| `SeoPage.needsReview/validationIssues`                                 | §12.14 QC output                                                                                                                                                                                                                                                                          |
| `SeoPage.faqJson`                                                      | `{question, answer}[]`, **admin-authored only, never templated** — Google's guidance discourages fabricated Q&A                                                                                                                                                                           |
| `@@unique([pageType, roleId, locationId, companyId, skillId, sector])` | Prevents duplicate generation for the same entity combo (actual idempotency in practice comes from upserting by the unique `slug`, since Postgres treats `NULL` as distinct from `NULL` in unique constraints — this composite key doesn't fully protect singleton pages like `ALL_JOBS`) |

## 4. Generation → lifecycle pipeline

**`apps/api/src/modules/seo/`**

| File                                      | Responsibility                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `seo-query.util.ts`                       | `buildJobWhereForPage()` — single source of truth for "what jobs does this page represent," used both to aggregate stats and to list jobs on the public page, so the displayed count always matches the displayed jobs                                                                                                                       |
| `seo-input.service.ts`                    | Builds the §12.11.4 "SEO Input Object" (`jobCount`, `companyCount`, `topSkills`, `jobTypes`, `workModes`) per entity combo                                                                                                                                                                                                                   |
| `seo-templates.ts`                        | 3 template variants × 8 page types (SRS asks for 5–10; scoped down for a first pass — purely a config-data change to add more later), deterministic selection via a hash of the slug                                                                                                                                                         |
| `seo-links.service.ts`                    | Related-link computation per §12.5 — **only ever links to `isIndexable=true` pages**, so link authority never flows toward a thin/deactivated page. Sector pages link down to their role-category pages and vice versa.                                                                                                                      |
| `seo-validation.service.ts`               | §12.14 QC: threshold met, title/meta uniqueness, no unresolved `{placeholder}` tokens, canonical present, basic keyword-stuffing check                                                                                                                                                                                                       |
| `seo-generation.service.ts`               | Orchestrator (`regenerateAll()`, `regenerateOne()`) — enumerates every sector/role/location/role×location-with-jobs/skill/company-with-jobs/remote-role/remote-global/internship combo, builds input → threshold check → template (skipped if `manualOverride`) → validate (hard gate) → related links → upsert                              |
| `seo-expiry.service.ts`                   | Phase-0 prerequisite: flips stale `Job.status` to `EXPIRED`                                                                                                                                                                                                                                                                                  |
| `seo-lifecycle.service.ts`                | Weekly evaluation — grace-period deactivation, reactivation, 90-day retirement (`retiredAt`)                                                                                                                                                                                                                                                 |
| `seo.scheduler.ts` + `processors/`        | Three BullMQ repeatable schedules + in-process workers (first BullMQ _consumer_ in `apps/api` — justified since this is lightweight DB work, unlike the scraper's browser automation, which is why it lives in a separate `apps/scrapper` process)                                                                                           |
| `seo-pages.controller.ts` / `.service.ts` | Public read API: `GET /seo-pages` (list, for sitemap), `GET /seo-pages/by-slug?slug=` (page + resolved jobs + related links — slug passed as a query param, not a path param, because slugs contain `/` and Express/path-to-regexp handles encoded slashes awkwardly), `GET /seo-pages/retirement-status?slug=` (lightweight, for the proxy) |

**`apps/api/src/modules/seo-admin/`** — separate module (not the same module registered twice) per this app's existing convention of nesting admin controllers under the `admin` `RouterModule` prefix while public controllers stay flat-imported. `seo-admin.controller.ts` exposes list/get/patch/regenerate/generate-all/deactivate/reactivate, all behind `SEO_READ`/`SEO_UPDATE` permissions and audit-logged like the existing jobs/companies admin actions.

## 5. Public API surface

All under `/api/v1/`, unauthenticated (`@Public()`), consumed server-side by Next.js:

| Route                                                                          | Module                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /public/jobs`                                                             | Full SRS 5.5.3 filter set (location, sector, work mode, employment type, skills, keywords, salary range, company, full-text `q`), cursor-paginated on `(lastSeenAt, id)`                                                                                    |
| `GET /public/jobs/:slug`                                                       | Resolves the trailing `-{id}`; returns `isStaleSlug`/`canonicalSlug` as **data**, not an HTTP redirect (this endpoint is called server-side during page render, so an HTTP redirect here wouldn't reach the browser — the Next.js page issues the real 308) |
| `GET /public/jobs/sitemap-entries`, `GET /public/jobs/:slug/retirement-status` | Bulk export and lightweight lifecycle check, respectively — deliberately separate from the full detail endpoint to avoid over-fetching                                                                                                                      |
| `GET /public/companies/:slug`, `.../jobs`                                      | Company profile + job listing                                                                                                                                                                                                                               |
| `GET /seo-pages`, `/seo-pages/by-slug`, `/seo-pages/retirement-status`         | See §4                                                                                                                                                                                                                                                      |

## 6. Frontend routing

**Next.js 16** (`apps/web` — see `apps/web/AGENTS.md`: this version has real breaking changes from training-data expectations, e.g. `middleware.ts` → `proxy.ts`, `generateSitemaps()`'s `id` is now `Promise<string>`).

A real routing constraint shaped the URL structure: Next.js requires one consistent dynamic-segment name per directory level, so `/jobs/[slug]` (job detail) and `/jobs/[role]` (the ROLE pSEO page) **cannot** be sibling directories. They're merged into one file, disambiguated cheaply by regex before any data fetch:

```
apps/web/src/app/(public)/jobs/[slug]/page.tsx        → job detail (slug ends in "-{id}") OR the ROLE page
apps/web/src/app/(public)/jobs/[slug]/in/[location]/page.tsx   → ROLE_LOCATION (nested under the same [slug] dir — not a conflict)
apps/web/src/app/(public)/jobs/in/[location]/page.tsx          → LOCATION (static "in" prefix, no conflict)
apps/web/src/app/(public)/jobs/remote/[role]/page.tsx          → REMOTE (role-scoped)
apps/web/src/app/(public)/jobs/skills/[skill]/page.tsx         → SKILL
apps/web/src/app/(public)/jobs/sector/[sector]/page.tsx        → SECTOR
apps/web/src/app/(public)/companies/[company]/page.tsx         → COMPANY
apps/web/src/app/(public)/companies/[company]/jobs/page.tsx    → company's full job list (bypasses the generic SeoPage job-listing cap)
apps/web/src/app/(public)/internships/page.tsx                 → INTERNSHIP (global)
apps/web/src/app/(public)/remote-jobs/page.tsx                 → REMOTE (global)
apps/web/src/app/(public)/jobs/page.tsx                        → ALL_JOBS + the real job listing UI
```

All nine pSEO routes share `apps/web/src/web-app/features/seo/components/pseo-page-layout.tsx` (H1 → intro → job grid → related links → bottom text → FAQ, per §12.3.2), rendering `introText`/`bottomText` as admin-authored/templated HTML inside shadcn's Typeset CSS system (`.typeset` class — already present in this repo from an earlier commit) rather than a hand-rolled prose stylesheet.

**Rendering strategy** (§12.10.2):

| Page type      | Strategy                                                         |
| -------------- | ---------------------------------------------------------------- |
| `/jobs`        | `force-dynamic` — always freshest, per spec                      |
| Job detail     | ISR, `revalidate = 21600` (6h)                                   |
| All pSEO pages | ISR, `revalidate = 86400` (24h), **no `generateStaticParams()`** |

No page is pre-rendered at build time — this is "on-demand ISR." The first request for any given URL triggers a live render (reads `SeoPage` + a live job query); Next.js caches that result for the revalidate window, then regenerates in the background on the next request past it (stale-while-revalidate). This was a deliberate choice over full static generation: the combination space (role×location pairs, companies, skills) is large and changes daily as jobs are scraped, and build-time enumeration would need a full rebuild to reflect any change.

## 7. Sitemap, robots, and the 410 lifecycle

- **`apps/web/src/app/sitemap.ts`** — 8 buckets via `generateSitemaps()` (`job-detail`, `sector`, `roles`, `locations`, `role-location`, `skills`, `companies`, `misc` [remote+internship+all_jobs]). `job-detail` sources from the bulk `sitemap-entries` endpoint; the rest from `GET /seo-pages?pageType=`.
- **`apps/web/src/app/robots.ts`** — disallows `/admin`, `/api`, and parameterized filter URLs (`sort`, `salary`, `experience`, `posted`, `page`); lists all 8 sitemap bucket URLs directly rather than a separate hand-rolled sitemap-index route (the bucket set is fixed and known ahead of time).
- **`apps/web/src/proxy.ts`** — FR-SEO-10 requires retired pages to return a real HTTP 410, which `notFound()` from inside a page component can never produce (only ever 404). This has to happen in `proxy.ts`, before the page renders. **This file already existed** (admin-panel session-auth redirect logic) — the retirement check was merged into it rather than overwriting it, branching on path prefix. Backed by the two lightweight `retirement-status` endpoints from §5 rather than fetching full page/job payloads on every matched request. Known, deliberately-accepted cost: this adds one extra backend round-trip to every `/jobs/*`, `/companies/*`, `/internships`, `/remote-jobs` request; no caching layer was added since realistically zero pages will be retired for the first 90+ days of the system's operation.

## 8. Structured data

`apps/web/src/web-app/lib/structured-data.ts` — pure builders for `JobPosting`, `BreadcrumbList`, `Organization`, `CollectionPage`, `FAQPage` (only emitted when `faqJson` is non-empty — never fabricated, per §12.6.4). Rendered via `apps/web/src/web-app/components/structured-data.tsx`, which escapes `<` to `<` before `dangerouslySetInnerHTML` — without it, a scraped or admin-input string containing `</script>` could break out of the JSON-LD tag.

## 9. Admin UI

`apps/web/src/dashboard/features/seo/` — list view + editable detail form (title/meta/H1/isIndexable, intro/bottom text via a TipTap rich-text editor, an FAQ repeater), validation-issues callout, and Regenerate-now / Reset-to-template (only shown when `manualOverride`, confirms before discarding edits) / Deactivate / Reactivate actions. Gated behind `SEO_READ`/`SEO_UPDATE`.

The rich-text editor (`apps/web/src/components/tiptap/rich-text-editor.tsx`) was previously a hardcoded demo component with no `value`/`onChange` props — it was made into a genuine controlled component (and renamed from `RichTextEditorDemo`) as part of this work, since it's now backing real form fields.

## 10. Known simplifications / deferred work

- **§12.12 GSC integration** — deferred entirely, per explicit user decision. FR-SEO-12/13 depend on it.
- **Event-driven generation** — simplified to a daily cron (see §1).
- **Regeneration cadence** — one daily run for every page, not SRS §12.11.8's traffic-tiered daily/3-day/weekly schedule (that tiering needs GSC traffic data).
- **Template variant count** — 3 per page type, not 5–10. Config-only to extend.
- **Proxy retirement-check caching** — none; acceptable given near-zero retired pages in the near term.
- **Full-text search** — Postgres `ILIKE`/`contains`, not `tsvector`/`pg_trgm`. Fine at current data volume; flagged as the upgrade path if search quality becomes an issue.
