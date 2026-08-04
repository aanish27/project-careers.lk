import { apiFetch } from "@/lib/api-client";
import type { PublicFreelancerProfile, PublicGig } from "../types";

export interface FreelanceBrowseFilters {
  category?: string;
  skill?: string;
}

function buildQuery(filters: FreelanceBrowseFilters): string {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.skill) params.set("skill", filters.skill);
  return params.toString();
}

export const freelancerProfilesApi = {
  async list(
    filters: FreelanceBrowseFilters = {},
  ): Promise<PublicFreelancerProfile[]> {
    const query = buildQuery(filters);
    const { data } = await apiFetch<PublicFreelancerProfile[]>(
      `/public/freelance-profiles${query ? `?${query}` : ""}`,
    );
    return data;
  },

  async getBySlug(slug: string): Promise<PublicFreelancerProfile> {
    const { data } = await apiFetch<PublicFreelancerProfile>(
      `/public/freelance-profiles/${slug}`,
    );
    return data;
  },

  async sitemapEntries(): Promise<{ slug: string; updatedAt: string }[]> {
    const { data } = await apiFetch<{ slug: string; updatedAt: string }[]>(
      "/public/freelance-profiles/sitemap-entries",
    );
    return data;
  },
};

export const gigsApi = {
  async list(filters: FreelanceBrowseFilters = {}): Promise<PublicGig[]> {
    const query = buildQuery(filters);
    const { data } = await apiFetch<PublicGig[]>(
      `/public/gigs${query ? `?${query}` : ""}`,
    );
    return data;
  },

  async getBySlug(slug: string): Promise<PublicGig> {
    const { data } = await apiFetch<PublicGig>(`/public/gigs/${slug}`);
    return data;
  },

  async sitemapEntries(): Promise<{ slug: string; updatedAt: string }[]> {
    const { data } = await apiFetch<{ slug: string; updatedAt: string }[]>(
      "/public/gigs/sitemap-entries",
    );
    return data;
  },
};
