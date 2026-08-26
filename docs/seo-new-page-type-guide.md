# Adding a New pSEO Page Type

Companion to [`seo-architecture.md`](./seo-architecture.md) — that document explains what exists and why; this one is the step-by-step runbook for extending it with a new page type (a new dimension of landing page, like the existing ROLE/LOCATION/SKILL/COMPANY/SECTOR pages).

Worked example throughout: **SECTOR** pages (`/jobs/sector/[sector]`), added after the initial 8 page types shipped — every step below is a real thing that was actually done, not a hypothetical, so you can diff against the real commit if you want to see the exact change.

## Before you start: two design questions

1. **Does this page type need a brand-new dimension, or does it reuse an existing one?** `SeoPage` already has five nullable dimension columns: `roleId`, `locationId`, `companyId`, `skillId`, `sector`. If your new page type slices data along role/location/company/skill, you don't need a schema change for the dimension itself — you're just introducing a new _combination_ of the existing columns (this is how `ROLE_LOCATION` works: both `roleId` and `locationId` set on the same row). You only need a new column if the page groups jobs by something genuinely new (the way `sector` was new — sectors aren't `Job.roleCategory`, they're a broader grouping over it).
2. **Is the dimension a real, scraped/AI-classified value (fuzzy) or a fixed, code-defined taxonomy (exact)?** This decides whether you need a lookup table + FK (like `SeoRole`/`SeoLocation`/`SeoSkill` — for fuzzy scraped values that need normalization) or a plain string column (like `sector` — for a small fixed list defined in code, nothing to normalize). Don't default to "always add a lookup table" — that's the wrong call for a fixed taxonomy and adds pointless indirection.

For SECTOR: sectors are a fixed, code-defined taxonomy (`SECTOR_TAXONOMY` in `@careerslk/types`) — so the answer was "new dimension, plain string column," not a new lookup table.

## Step 1 — Schema

**File:** `packages/database/prisma/schema.prisma`

1. Add the new value to the `SeoPageType` enum.
2. If it's a genuinely new dimension: add the column to `SeoPage` (nullable — most pages won't use it) and, if it's a fuzzy/scraped value, the lookup table + relation (mirror `SeoRole`/`SeoLocation`/`SeoSkill`: `id`, `name`, `slug @unique`, back-relations). If it's a fixed taxonomy, just the plain column — no relation, no lookup table.
3. Add the new column to the `@@unique([pageType, roleId, locationId, companyId, skillId, sector, ...])` composite and its own `@@index`.

```prisma
enum SeoPageType {
  SECTOR   // ← added
  ROLE
  LOCATION
  ...
}

model SeoPage {
  ...
  sector String?   // ← added: plain column, fixed taxonomy, no relation
  ...
  @@unique([pageType, roleId, locationId, companyId, skillId, sector])  // ← sector added here
  @@index([sector])                                                     // ← and here
}
```

Then, from `packages/database/`:

```bash
npx prisma format && npx prisma validate
npx prisma db push          # check row counts first if the DB isn't empty — see below
npx prisma generate
npx tsdown                  # rebuild the package so the new fields are in dist/
```

**Before running `db push` against a non-empty database**, check whether the change could violate a new/changed constraint (a new enum value or a new nullable column never can; changing an existing unique constraint's column list can, if there are already duplicate rows under the new key — check with a `SELECT ... GROUP BY ... HAVING COUNT(*) > 1` first). Nullable additions are always safe.

## Step 2 — Shared types (`packages/types`)

Two files need a matching update — **neither is auto-generated from the Prisma schema**, so it's easy to forget one and get a confusing type mismatch later:

1. `packages/types/enums/index.ts` — add the same value to the `SeoPageType` const object. (Note this is a `const {...} as const` + derived type, **not** a real TS `enum` — deliberately, so Prisma's generated union-of-literals type for `SeoPage.pageType` is directly assignable to/from it in both directions. If you ever see a TypeScript error like "Type '\"SECTOR\"' is not assignable to type 'SeoPageType'" after adding a value, check whether the type declaration accidentally became a real `enum` — see `seo-architecture.md` §2 for why this bit before.)
2. `packages/types/seo/index.ts` — add a threshold entry to `SEO_PAGE_THRESHOLDS` (SRS 12.11.3 — pick a minimum active-job-count; look at the existing values for similarly-scoped page types as a reference point).

Rebuild: `cd packages/types && npx tsdown`.

## Step 3 — Backend generation engine (`apps/api/src/modules/seo/`)

Five files, in this order:

1. **`seo-query.util.ts`** — `buildJobWhereForPage()`. Add a branch that builds the Prisma `where` clause for jobs matching this page. This function is the single source of truth for "what jobs does this page represent" — both the aggregation step (next) and the actual job listing shown on the page read through it, so they can never disagree.
2. **`seo-input.service.ts`** — `BuildSeoInputParams`. If the new dimension isn't already one of `role`/`location`/`company`/`skill`, add a field for it (see how `sector?: string` was added there) and pass it through to `buildJobWhereForPage()`.
3. **`seo-templates.ts`** — write a new template function returning 3 variants of `{title, metaDescription, h1, introText, bottomText}` (look at `sectorTemplates()` as the template for the template — pun intended), then register it in the `TEMPLATES_BY_PAGE_TYPE` map keyed by the new enum value.
4. **`seo-links.service.ts`** — add a case to `buildRelatedLinks()`'s switch statement computing which other pages this one should link to. Whatever you return **must** be filtered to `isIndexable: true` pages only — never link to a page that isn't currently indexable, or you leak link equity toward thin/deactivated content.
5. **`seo-generation.service.ts`** — add an enumeration loop inside `regenerateAll()`: fetch the list of possible values for the new dimension (a Prisma `findMany()` on its lookup table, or a code constant if it's a fixed taxonomy like `SECTORS`), and for each one call `this.generateOne({ pageType: ..., <dimension>: value, slug: ... }, summary)`. The `slug` format should match the URL path you're about to create in Step 4, without the leading domain (e.g. `jobs/sector/${slugify(sector)}`).

If the new page type's jobCount can legitimately drop to zero for a value that used to have jobs (the way a role×location pair can), also add a `updateMany` cleanup pass zeroing `jobCount`/`companyCount` for stale rows not in the current enumeration — see the `liveRoleLocationSlugs` handling in `regenerateAll()` for the pattern. If the dimension's full value set never shrinks (like `SECTORS`, a fixed list — every sector always gets re-evaluated every run regardless of current job count), you don't need this.

## Step 4 — Frontend route

**Before creating the route file**, check for a routing conflict: Next.js requires one consistent dynamic-segment name per directory level. If your new URL's first dynamic segment lands at the same directory level as an _existing_ dynamic segment with a _different_ param name, you cannot add it as a sibling — see `seo-architecture.md` §6 for how `/jobs/[slug]` (job detail) and the ROLE page were forced to merge into one file over exactly this constraint. Static-prefixed segments (`in/`, `remote/`, `skills/`, `sector/`) never conflict with a sibling dynamic segment — only two _dynamic_ segments at the same level do.

For SECTOR, `/jobs/sector/[sector]` — `sector` is a new static prefix folder, so no conflict.

1. Create `apps/web/src/app/(public)/<path>/page.tsx`. Copy the shape of an existing simple pSEO route (`.../jobs/skills/[skill]/page.tsx` is the shortest reference) — it's a thin wrapper: `generateMetadata()` fetches the `SeoPage` by slug and returns title/description/canonical/robots; the default export fetches the same page + jobs + related links and hands them to the shared `PseoPageLayout` component with a `breadcrumbs` array.
2. If the URL param needs resolving back to a real value before it can be used as a slug lookup (the way a sector's URL slug needs resolving back to its display name via `resolveSectorFromSlug()`), add that helper next to the feature it belongs to (`apps/web/src/web-app/features/jobs/utils/`) rather than inlining it in the page file.
3. `export const revalidate = 86400` (24h ISR) — matches every other pSEO page. Don't add `generateStaticParams()` — this system deliberately uses on-demand ISR (see `seo-architecture.md` §6) so new values show up without a rebuild.

## Step 5 — Sitemap & robots

**File:** `apps/web/src/app/sitemap.ts`

Add the new `SeoPageType` value to `PAGE_TYPES_BY_BUCKET` — either give it its own bucket key (add to `SITEMAP_BUCKETS` too) or fold it into the existing `misc` bucket if it's a low-volume type (that's what `REMOTE`/`INTERNSHIP`/`ALL_JOBS` share). If you add a new bucket, also add its name to `apps/web/src/app/robots.ts`'s `SITEMAP_BUCKETS` array so it gets listed in `robots.txt`'s `Sitemap:` lines.

## Step 6 — Admin UI

Usually **nothing to do here**. `/admin/seo`'s list and detail views are generic over `pageType` already — a new value just shows up as another row with its own badge. Only touch the admin UI if the new page type needs a field the generic form doesn't have (it currently doesn't for SECTOR).

## Step 7 — Verify

1. `POST /api/v1/admin/seo/pages/generate` (admin token) — confirm new `SeoPage` rows appear: `SELECT COUNT(*) FROM "SeoPage" WHERE "pageType" = 'YOUR_NEW_TYPE';` should match the number of possible values for the dimension.
2. Visit the new route in dev for a value you know has enough jobs to clear the threshold — page renders, H1/intro/job grid/related links/bottom text all populated.
3. Visit it for a value with too few jobs — page still renders (not skipped), but view-source shows `<meta name="robots" content="noindex,follow">`.
4. `curl localhost:3000/sitemap/<bucket>.xml` — the new page's URL appears, with a real `lastmod`.
5. Full checklist: [`seo-test-plan.md`](./seo-test-plan.md) §3 and §6 cover the generation-engine and pSEO-page checks generically for any page type, new or old.

## What if it's not a new page type, but a whole new entity (e.g. Freelance)?

Everything above assumes you're adding another dimension to the **existing** job-board pSEO system — a new kind of page about `Job`/`Company` data. That's a different problem from bringing SEO to an entirely separate part of the product, like the freelance marketplace (`Gig`, `FreelanceProfile` — see `packages/database/prisma/schema.prisma`). Both already have their own `slug` (unique) and `category`/`skills` fields, so the shape is genuinely similar to `Job`, but the two domains aren't related to each other, and that changes the right architecture.

### The question: extend `SeoPage`, or build a parallel system?

**Don't extend `SeoPage`/`SeoPageType` with freelance values.** `SeoPage`'s dimension columns (`roleId`, `locationId`, `companyId`, `skillId`, `sector`) are job-domain concepts. Bolting `gigId`/`freelanceProfileId`/a second `category` column onto the same table to shoehorn in an unrelated entity is exactly the kind of thing that makes a table wide and its generation service (`SeoGenerationService.regenerateAll()`) into an unreadable monolith handling two unrelated domains with a giant if/else fork through every method. It also means one entity's SEO bug risks breaking the other's, and the weekly lifecycle/validation jobs start doing double duty for no shared benefit.

**Build a parallel, entity-scoped system**: its own Prisma model (e.g. `FreelanceSeoPage`), its own `FreelanceSeoPageType` enum (`GIG`, `GIG_CATEGORY`, `FREELANCER_PROFILE`, `FREELANCER_CATEGORY`, `FREELANCE_SKILL`, `ALL_GIGS`, ...), its own generation/lifecycle/validation services, its own sitemap bucket set, its own routes under `/freelance/...`. This mirrors how the codebase already treats freelance as a separate feature area from jobs (separate models, separate modules per the git history) — the SEO layer should follow the same boundary, not cut across it.

### But don't duplicate everything either — extract the entity-agnostic pieces first

A handful of things in the existing `apps/api/src/modules/seo/` code have nothing to do with jobs specifically and are pure, reusable logic. Pull these into shared utilities (e.g. `packages/lib` or a new `packages/seo-kit`) **before** writing the freelance version, so both systems call the same tested code instead of maintaining two copies that will drift:

| Reusable as-is                                   | Where it lives now                                          | Why it's generic                                                                                                                                                                                               |
| ------------------------------------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deterministic variant picker (`pickVariant`)     | `seo-templates.ts`                                          | Pure function: `(variants[], slug) => variants[hash(slug) % length]`. No job concepts in it at all.                                                                                                            |
| Grace-period / retirement date math              | `seo-lifecycle.service.ts`                                  | `now - firstBelowThresholdAt >= N days` and `now - deactivatedAt >= 90 days` are pure timestamp comparisons — the _fields_ live on whatever page model you pass in, the _logic_ doesn't care whose page it is. |
| Unresolved-placeholder / keyword-stuffing checks | `seo-validation.service.ts`                                 | Regex over a string, word-frequency ratio over a string — no job-specific input.                                                                                                                               |
| JSON-LD escaping                                 | `apps/web/src/web-app/components/structured-data.tsx`       | Pure string escaping.                                                                                                                                                                                          |
| `slugify()` / `generateUniqueSlug()`             | `@careerslk/lib/slugify`, `@careerslk/database`'s `slug.ts` | Already shared, already used by both `Job`/`Company` slugs — reuse directly for `Gig`/`FreelanceProfile` too.                                                                                                  |

**Not reusable as-is** (these need a from-scratch, freelance-specific version, because the actual field names and business rules differ): the title/meta-description **uniqueness query** (needs to check against `FreelanceSeoPage`, not `SeoPage`), the **threshold table** (freelance categories will have different meaningful minimums than job roles/locations), the **related-links computation** (what's "related" for a gig is category/skill-based, not role/location-based), and obviously every template's actual copy.

### Concrete shape, mirroring the job-board system 1:1

| Job-board piece                                        | Freelance equivalent                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SeoPage` model                                        | `FreelanceSeoPage` model (own table, own dimension columns: `categoryId`?/`skillId`?/`gigId`?/`profileId`? — decide per Step 1's two questions above, applied fresh to this domain)                                                                                                                                                                         |
| `SeoPageType` enum                                     | `FreelanceSeoPageType` enum                                                                                                                                                                                                                                                                                                                                 |
| `apps/api/src/modules/seo/`                            | `apps/api/src/modules/freelance-seo/` — same file breakdown (`*-query.util.ts`, `*-input.service.ts`, `*-templates.ts`, `*-links.service.ts`, `*-validation.service.ts`, `*-generation.service.ts`, `*-lifecycle.service.ts`, `*.scheduler.ts`), built on top of the extracted shared pieces above                                                          |
| `apps/api/src/modules/seo-admin/`                      | `apps/api/src/modules/freelance-seo-admin/` — or, if you'd rather have one admin screen listing _all_ SEO pages regardless of domain, that's a legitimate reason to add a thin read-only aggregation endpoint that unions both tables for display purposes only — don't let display convenience pull you back into merging the underlying write-side models |
| `apps/web/src/app/(public)/jobs/...`, `/companies/...` | `apps/web/src/app/(public)/freelance/gigs/[slug]`, `/freelance/categories/[category]`, etc. — same routing-conflict check from Step 4 applies                                                                                                                                                                                                               |
| `apps/web/src/app/sitemap.ts`'s bucket list            | Either new buckets in the same `sitemap.ts` (simplest — one sitemap system, more bucket entries) or a fully separate `generateSitemaps()` id set if the two domains' sitemaps should be submitted/managed independently                                                                                                                                     |
| `packages/types/seo/`                                  | `packages/types/freelance-seo/` (own `SEO_PAGE_THRESHOLDS`-equivalent, own DTOs)                                                                                                                                                                                                                                                                            |

Job detail pages already established the pattern for "existing entity gets an SEO-friendly URL without a separate landing-page system": `Gig.slug`/`FreelanceProfile.slug` already exist, so gig/profile _detail_ pages (as opposed to _aggregate_ landing pages like categories) don't need `FreelanceSeoPage` rows at all — mirror `apps/web/src/app/(public)/jobs/[slug]/page.tsx`'s job-detail half directly: `generateMetadata()` + JSON-LD built from the `Gig`/`FreelanceProfile` row itself, no generation/lifecycle machinery involved, exactly like individual job postings today.

## Full file checklist (copy this when starting a new page type)

- [ ] `packages/database/prisma/schema.prisma` — enum value, column (if new dimension), `@@unique`/`@@index`
- [ ] `packages/types/enums/index.ts` — matching `SeoPageType` value
- [ ] `packages/types/seo/index.ts` — `SEO_PAGE_THRESHOLDS` entry
- [ ] `apps/api/src/modules/seo/seo-query.util.ts` — `buildJobWhereForPage()` case
- [ ] `apps/api/src/modules/seo/seo-input.service.ts` — new field on `BuildSeoInputParams` (if new dimension)
- [ ] `apps/api/src/modules/seo/seo-templates.ts` — template function + registry entry
- [ ] `apps/api/src/modules/seo/seo-links.service.ts` — `buildRelatedLinks()` case
- [ ] `apps/api/src/modules/seo/seo-generation.service.ts` — enumeration loop in `regenerateAll()`
- [ ] `apps/web/src/app/(public)/<new-route>/page.tsx` — new route file
- [ ] `apps/web/src/app/sitemap.ts` — bucket mapping
- [ ] `apps/web/src/app/robots.ts` — bucket list (only if a new bucket was added)
