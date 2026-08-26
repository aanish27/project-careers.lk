import { JobFilters } from "../types";

export const jobsKeys = {
  list: (filters: JobFilters) => ["jobs", "list", filters] as const,
};
