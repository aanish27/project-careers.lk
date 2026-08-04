import type { ReportFilters } from "../api/api";

export const reportsKeys = {
  all: ["reports"] as const,
  lists: () => [...reportsKeys.all, "list"] as const,
  list: (filters?: ReportFilters) =>
    [...reportsKeys.lists(), filters ?? {}] as const,
  details: () => [...reportsKeys.all, "detail"] as const,
  detail: (id: number) => [...reportsKeys.details(), id] as const,
};
