import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { SeoPageType } from "@careerslk/types";
import { SeoPagesTable } from "@dashboard-features/seo/components/seo-pages-table";
import type { SeoPageFilters } from "@dashboard-features/seo/api/api";

// Grouped by slug prefix, not just semantics — every page type below
// generates under "jobs/..." (see seo-generation.service.ts), so they all
// belong in the Jobs module regardless of what taxonomy they browse by.
// See dashboard/config/sidebar-links.ts (the "seo" module) for the sidebar
// entries that link here with these category values.
const JOBS_PAGE_TYPES = [
  SeoPageType.SECTOR, // jobs/sector/...
  SeoPageType.ROLE, // jobs/...
  SeoPageType.LOCATION, // jobs/in/...
  SeoPageType.ROLE_LOCATION, // jobs/.../in/...
  SeoPageType.REMOTE, // jobs/remote/..., jobs/remote-jobs
  SeoPageType.INTERNSHIP, // jobs/internship
  SeoPageType.TALENT_POOL, // jobs/talent-pools
  SeoPageType.ALL_JOBS, // jobs
].join(",");

const CATEGORY_CONFIG: Record<string, { title: string; pageTypes: string }> = {
  jobs: { title: "SEO Pages — Jobs", pageTypes: JOBS_PAGE_TYPES },
  companies: {
    title: "SEO Pages — Companies",
    pageTypes: SeoPageType.COMPANY, // companies/...
  },
  public: {
    title: "SEO Pages — Public Pages",
    pageTypes: SeoPageType.HOME, // / (site root)
  },
  // Nothing currently lives here — freelance SEO is a separate, entity-
  // scoped system (see docs/seo-new-page-type-guide.md), not a SeoPageType.
  freelance: { title: "SEO Pages — Freelance", pageTypes: "" },
};

export default async function SeoPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; needsReview?: string }>;
}) {
  await requirePermission(PERMISSIONS.SEO_READ);
  const { category, needsReview } = await searchParams;

  const config = category ? CATEGORY_CONFIG[category] : undefined;
  const filters: SeoPageFilters = {
    ...(config ? { pageTypes: config.pageTypes } : {}),
    ...(needsReview === "true" ? { needsReview: true } : {}),
  };
  const title =
    needsReview === "true" ? "SEO Pages — Needs Review" : config?.title;

  return (
    <div className="p-6">
      <SeoPagesTable filters={filters} title={title} />
    </div>
  );
}
