import { useQuery } from "@tanstack/react-query";
import { seoAdminApi, type SeoPageFilters } from "../api/api";
import { seoKeys } from "./query-keys";

export function useSeoPages(filters?: SeoPageFilters) {
  return useQuery({
    queryKey: seoKeys.list(filters),
    queryFn: () => seoAdminApi.list(filters),
  });
}

export function useSeoPage(id: number) {
  return useQuery({
    queryKey: seoKeys.detail(id),
    queryFn: () => seoAdminApi.get(id),
    enabled: Number.isFinite(id),
  });
}
