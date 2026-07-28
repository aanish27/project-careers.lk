import { useQuery } from "@tanstack/react-query";
import { scrapeLogsApi, type ScrapeLogFilters } from "../api/api";
import { scrapeLogsKeys } from "./query-keys";

export function useScrapeLogs(filters?: ScrapeLogFilters) {
  return useQuery({
    queryKey: scrapeLogsKeys.list(filters),
    queryFn: () => scrapeLogsApi.list(filters),
  });
}

export function useScrapeLog(id: number) {
  return useQuery({
    queryKey: scrapeLogsKeys.detail(id),
    queryFn: () => scrapeLogsApi.get(id),
    enabled: Number.isFinite(id),
  });
}
