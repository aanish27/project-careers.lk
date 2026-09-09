import {
  freelancerProfilesApi,
  gigsApi,
} from "@web-app-features/freelance/api/api";
import { jobsApi } from "@web-app-features/jobs/api/api";
import { seoPagesApi } from "@web-app-features/seo/api/api";
import type { MetadataRoute } from "next";

const SITEMAP_BUCKETS = [
  "job-detail",
  "sector",
  "roles",
  "locations",
  "role-location",
  "skills",
  "companies",
  "misc",
  "freelancer-detail",
  "gig-detail",
] as const;

type SitemapBucket = (typeof SITEMAP_BUCKETS)[number];

const PAGE_TYPES_BY_BUCKET: Record<
  Exclude<SitemapBucket, "job-detail" | "freelancer-detail" | "gig-detail">,
  string[]
> = {
  sector: ["SECTOR"],
  roles: ["ROLE"],
  locations: ["LOCATION"],
  "role-location": ["ROLE_LOCATION"],
  skills: ["SKILL"],
  companies: ["COMPANY"],
  misc: ["REMOTE", "INTERNSHIP", "TALENT_POOL", "ALL_JOBS", "HOME"],
};

function absoluteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/${path}`.replace(/([^:]\/)\/+/g, "$1");
}

export async function generateSitemaps() {
  return SITEMAP_BUCKETS.map((id) => ({ id }));
}

export default async function sitemap({
  id,
}: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const bucketId = (await id) as SitemapBucket;

  if (bucketId === "job-detail") {
    const entries = await jobsApi.sitemapEntries();
    return entries.map((entry) => ({
      url: absoluteUrl(`job/${entry.slug}`),
      lastModified: entry.updatedAt,
    }));
  }

  if (bucketId === "freelancer-detail") {
    const entries = await freelancerProfilesApi.sitemapEntries();
    return entries.map((entry) => ({
      url: absoluteUrl(`freelance/freelancers/${entry.slug}`),
      lastModified: entry.updatedAt,
    }));
  }

  if (bucketId === "gig-detail") {
    const entries = await gigsApi.sitemapEntries();
    return entries.map((entry) => ({
      url: absoluteUrl(`freelance/gigs/${entry.slug}`),
      lastModified: entry.updatedAt,
    }));
  }

  const pageTypes = PAGE_TYPES_BY_BUCKET[bucketId] ?? [];
  const results = await Promise.all(
    pageTypes.map((pageType) => seoPagesApi.list(pageType)),
  );

  // Company pSEO pages live at /companies/[slug]/jobs — the bare
  // /companies/[slug] route is a 404/noindex stub.
  return results.flat().map((page) => ({
    url: absoluteUrl(
      bucketId === "companies" ? `${page.slug}/jobs` : page.slug,
    ),
    lastModified: page.lastmod,
  }));
}
