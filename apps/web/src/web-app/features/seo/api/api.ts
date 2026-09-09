import { ApiError, apiFetch } from "@/lib/api-client";
import { AppType } from "@careerslk/types";
import type {
  SeoContentResponse,
  SeoJobsPublic,
  SeoPageListItem,
  SeoPageResponse,
} from "../types";

export const seoPagesApi = {
  async getPublic(type: AppType): Promise<SeoJobsPublic | null> {
    try {
      const { data } = await apiFetch<SeoJobsPublic>(
        `/seo-pages/public?appType=${encodeURIComponent(type)}`,
        { next: { revalidate: 86400 } },
      );
      return data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

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

  async getSeoContent(slug: string): Promise<SeoContentResponse | null> {
    try {
      const { data } = await apiFetch<SeoContentResponse>(
        `/seo-pages/seo?slug=${encodeURIComponent(slug)}`,
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
