import { useQuery } from "@tanstack/react-query";
import type { JobFilters } from "../api/api";
import { jobsApi } from "../api/api";
import { jobsKeys } from "./query-keys";

export function useJobs(filters?: JobFilters) {
  return useQuery({
    queryKey: jobsKeys.list(filters),
    queryFn: () => jobsApi.list(filters),
  });
}

export function useJob(id: number) {
  return useQuery({
    queryKey: jobsKeys.detail(id),
    queryFn: () => jobsApi.get(id),
    enabled: Number.isFinite(id),
  });
}
