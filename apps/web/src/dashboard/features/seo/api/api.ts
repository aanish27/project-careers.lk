import type {
  SeoPageDetail,
  SeoPageSummary,
  UpdateSeoPageInput,
} from "@careerslk/types";
import { api } from "@dashboard-lib/axios";

export interface SeoPageFilters {
  pageType?: string;
  needsReview?: boolean;
  manualOverride?: boolean;
}

export interface SeoGenerationSummary {
  created: number;
  updated: number;
  skippedManualOverride: number;
  belowThreshold: number;
  failedValidation: number;
}

export const seoAdminApi = {
  list: (filters?: SeoPageFilters) =>
    api
      .get<SeoPageSummary[]>("/admin/seo/pages", { params: filters })
      .then((res) => res.data),
  get: (id: number) =>
    api.get<SeoPageDetail>(`/admin/seo/pages/${id}`).then((res) => res.data),
  update: (id: number, body: UpdateSeoPageInput) =>
    api
      .patch<SeoPageDetail>(`/admin/seo/pages/${id}`, body)
      .then((res) => res.data),
  regenerate: (id: number, force = false) =>
    api
      .post<SeoPageDetail>(
        `/admin/seo/pages/${id}/regenerate${force ? "?force=true" : ""}`,
      )
      .then((res) => res.data),
  generateAll: () =>
    api
      .post<SeoGenerationSummary>("/admin/seo/pages/generate")
      .then((res) => res.data),
  deactivate: (id: number) =>
    api
      .patch<SeoPageDetail>(`/admin/seo/pages/${id}/deactivate`)
      .then((res) => res.data),
  reactivate: (id: number) =>
    api
      .patch<SeoPageDetail>(`/admin/seo/pages/${id}/reactivate`)
      .then((res) => res.data),
};
