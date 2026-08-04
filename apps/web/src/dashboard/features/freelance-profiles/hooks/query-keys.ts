import type { FreelanceProfileFilters } from "../api/api";

export const freelanceProfilesKeys = {
  all: ["freelance-profiles"] as const,
  lists: () => [...freelanceProfilesKeys.all, "list"] as const,
  list: (filters?: FreelanceProfileFilters) =>
    [...freelanceProfilesKeys.lists(), filters ?? {}] as const,
  details: () => [...freelanceProfilesKeys.all, "detail"] as const,
  detail: (id: number) => [...freelanceProfilesKeys.details(), id] as const,
};
