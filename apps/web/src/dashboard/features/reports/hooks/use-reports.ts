import { useQuery } from "@tanstack/react-query";
import type { ReportFilters } from "../api/api";
import { reportsApi } from "../api/api";
import { reportsKeys } from "./query-keys";

export function useReports(filters?: ReportFilters) {
  return useQuery({
    queryKey: reportsKeys.list(filters),
    queryFn: () => reportsApi.list(filters),
  });
}
