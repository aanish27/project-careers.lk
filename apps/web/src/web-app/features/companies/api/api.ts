import { apiFetch, ApiError } from "@/lib/api-client";
import type {
  PublicCompanyJobsResponse,
  PublicCompanyResponse,
} from "../types";

export const companiesApi = {
  async getBySlug(slug: string): Promise<PublicCompanyResponse | null> {
    try {
      const { data } = await apiFetch<PublicCompanyResponse>(
        `/public/companies/${slug}`,
      );
      return data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  async getJobsBySlug(slug: string): Promise<PublicCompanyJobsResponse | null> {
    try {
      const { data } = await apiFetch<PublicCompanyJobsResponse>(
        `/public/companies/${slug}/jobs`,
      );
      return data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
};
