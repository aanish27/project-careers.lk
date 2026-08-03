import { apiFetch } from "@/lib/api-client";
import type { PublicJobDetailResponse, PublicJobsListResponse } from "../types";

export interface JobFilters {
  location?: string;
  sector?: string;
  workMode?: string[];
  employmentType?: string[];
  skills?: string[];
  keywords?: string[];
  salaryMin?: number;
  salaryMax?: number;
  company?: string;
  q?: string;
  cursor?: string;
  limit?: number;
}

function buildQuery(filters: JobFilters): string {
  const params = new URLSearchParams();
  if (filters.location) params.set("location", filters.location);
  if (filters.sector) params.set("sector", filters.sector);
  if (filters.workMode?.length)
    params.set("workMode", filters.workMode.join(","));
  if (filters.employmentType?.length) {
    params.set("employmentType", filters.employmentType.join(","));
  }
  if (filters.skills?.length) params.set("skills", filters.skills.join(","));
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
  async list(filters: JobFilters): Promise<PublicJobsListResponse> {
    const query = buildQuery(filters);
    const { data } = await apiFetch<PublicJobsListResponse>(
      `/public/jobs${query ? `?${query}` : ""}`,
    );
    return data;
  },

  async getBySlug(slug: string): Promise<PublicJobDetailResponse> {
    const { data } = await apiFetch<PublicJobDetailResponse>(
      `/public/jobs/${slug}`,
    );
    return data;
  },
};
