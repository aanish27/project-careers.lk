import type { GigFilters } from "../api/api";

export const gigsKeys = {
  all: ["gigs"] as const,
  lists: () => [...gigsKeys.all, "list"] as const,
  list: (filters?: GigFilters) => [...gigsKeys.lists(), filters ?? {}] as const,
  details: () => [...gigsKeys.all, "detail"] as const,
  detail: (id: number) => [...gigsKeys.details(), id] as const,
};
