import { useQuery } from "@tanstack/react-query";
import type { GigFilters } from "../api/api";
import { gigsApi } from "../api/api";
import { gigsKeys } from "./query-keys";

export function useGigs(filters?: GigFilters) {
  return useQuery({
    queryKey: gigsKeys.list(filters),
    queryFn: () => gigsApi.list(filters),
  });
}

export function useGig(id: number) {
  return useQuery({
    queryKey: gigsKeys.detail(id),
    queryFn: () => gigsApi.get(id),
    enabled: Number.isFinite(id),
  });
}
