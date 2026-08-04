import type { JobFilters } from "../api/api";

export const jobsKeys = {
  all: ["jobs"] as const,
  lists: () => [...jobsKeys.all, "list"] as const,
  list: (filters?: JobFilters) => [...jobsKeys.lists(), filters ?? {}] as const,
  details: () => [...jobsKeys.all, "detail"] as const,
  detail: (id: number) => [...jobsKeys.details(), id] as const,
};
