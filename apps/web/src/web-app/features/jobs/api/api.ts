import { apiFetch } from "@/lib/api-client";
import type { ApiFetchOptions } from "@/types";
import type {
  JobFilters,
  PublicJobDetailResponse,
  PublicJobsListResponse,
} from "../types";

function buildQuery(filters: JobFilters): string {
  const params = new URLSearchParams();

  if (filters.slug) params.set("slug", filters.slug);

  if (filters.title) params.set("title", filters.title);

  if (filters.location) params.set("location", filters.location);

  if (filters.sector) params.set("sector", filters.sector);

  if (filters.province?.length)
    params.set("province", filters.province.join(","));

  if (filters.district?.length)
    params.set("district", filters.district.join(","));

  if (filters.workMode?.length)
    params.set("workMode", filters.workMode.join(","));
  if (filters.employmentType?.length) {
    params.set("employmentType", filters.employmentType.join(","));
  }
  if (filters.keywords?.length)
    params.set("keywords", filters.keywords.join(","));
  if (filters.salaryMin !== undefined) {
    params.set("salaryMin", String(filters.salaryMin));
  }
  if (filters.salaryMax !== undefined) {
    params.set("salaryMax", String(filters.salaryMax));
  }
  if (filters.company) params.set("company", filters.company);
  if (filters.q) params.set("q", filters.q);
  if (filters.cursor) params.set("cursor", filters.cursor);
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
  return params.toString();
}

export const jobsApi = {
  async list(
    filters: JobFilters,
    options?: ApiFetchOptions,
  ): Promise<PublicJobsListResponse> {
    const query = buildQuery(filters);
    const { data } = await apiFetch<PublicJobsListResponse>(
      `/public/jobs${query ? `?${query}` : ""}`,
      options,
    );
    return data;
  },

  async getBySlug(slug: string): Promise<PublicJobDetailResponse> {
    const { data } = await apiFetch<PublicJobDetailResponse>(
      `/public/jobs/${slug}`,
    );
    return data;
  },

  async sitemapEntries(): Promise<{ slug: string; updatedAt: string }[]> {
    const { data } = await apiFetch<{ slug: string; updatedAt: string }[]>(
      "/public/jobs/sitemap-entries",
    );
    return data;
  },

  async isRetired(slug: string): Promise<boolean> {
    const { data } = await apiFetch<{ retired: boolean }>(
      `/public/jobs/${slug}/retirement-status`,
    );
    return data.retired;
  },
};
