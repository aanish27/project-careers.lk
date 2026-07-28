import { useQuery } from "@tanstack/react-query";
import { jobsApi } from "../api/api";
import { jobsQueryKey } from "./query-keys";

export function useJobs() {
  return useQuery({
    queryKey: jobsQueryKey,
    queryFn: () => jobsApi.list(),
  });
}
