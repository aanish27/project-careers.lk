import type { ScrapeLogFilters } from "../api/api";

export const scrapeLogsKeys = {
  all: ["scrape-logs"] as const,
  lists: () => [...scrapeLogsKeys.all, "list"] as const,
  list: (filters?: ScrapeLogFilters) =>
    [...scrapeLogsKeys.lists(), filters ?? {}] as const,
  details: () => [...scrapeLogsKeys.all, "detail"] as const,
  detail: (id: number) => [...scrapeLogsKeys.details(), id] as const,
};
