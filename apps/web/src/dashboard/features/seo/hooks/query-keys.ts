import type { SeoPageFilters } from "../api/api";

export const seoKeys = {
  all: ["seo-pages"] as const,
  lists: () => [...seoKeys.all, "list"] as const,
  list: (filters?: SeoPageFilters) =>
    [...seoKeys.lists(), filters ?? {}] as const,
  details: () => [...seoKeys.all, "detail"] as const,
  detail: (id: number) => [...seoKeys.details(), id] as const,
};
