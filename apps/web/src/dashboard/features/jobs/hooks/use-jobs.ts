import { useQuery } from "@tanstack/react-query";
import { jobsApi } from "../api/api";
import { jobsKeys } from "./query-keys";

export function useJobs(filters?: { companyId?: number }) {
  return useQuery({
    queryKey: jobsKeys.list(filters),
    queryFn: () => jobsApi.list(filters),
  });
}
