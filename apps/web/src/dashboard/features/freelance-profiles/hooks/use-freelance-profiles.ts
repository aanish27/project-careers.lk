import { useQuery } from "@tanstack/react-query";
import type { FreelanceProfileFilters } from "../api/api";
import { freelanceProfilesApi } from "../api/api";
import { freelanceProfilesKeys } from "./query-keys";

export function useFreelanceProfiles(filters?: FreelanceProfileFilters) {
  return useQuery({
    queryKey: freelanceProfilesKeys.list(filters),
    queryFn: () => freelanceProfilesApi.list(filters),
  });
}

export function useFreelanceProfile(id: number) {
  return useQuery({
    queryKey: freelanceProfilesKeys.detail(id),
    queryFn: () => freelanceProfilesApi.get(id),
    enabled: Number.isFinite(id),
  });
}
