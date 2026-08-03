import { apiFetch, ApiError } from "@/lib/api-client";
import type { SeoPageListItem, SeoPageResponse } from "../types";

export const seoPagesApi = {
  async getBySlug(slug: string): Promise<SeoPageResponse | null> {
    try {
      const { data } = await apiFetch<SeoPageResponse>(
        `/seo-pages/by-slug?slug=${encodeURIComponent(slug)}`,
      );
      return data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  async list(pageType?: string): Promise<SeoPageListItem[]> {
    const query = pageType ? `?pageType=${pageType}` : "";
    const { data } = await apiFetch<SeoPageListItem[]>(`/seo-pages${query}`);
    return data;
  },

  async isRetired(slug: string): Promise<boolean> {
    const { data } = await apiFetch<{ retired: boolean }>(
      `/seo-pages/retirement-status?slug=${encodeURIComponent(slug)}`,
    );
    return data.retired;
  },
};
