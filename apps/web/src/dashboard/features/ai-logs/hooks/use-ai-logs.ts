import { useQuery } from "@tanstack/react-query";
import { aiLogsApi, type AiLogFilters } from "../api/api";
import { aiLogsKeys } from "./query-keys";

export function useAiLogs(filters?: AiLogFilters) {
  return useQuery({
    queryKey: aiLogsKeys.list(filters),
    queryFn: () => aiLogsApi.list(filters),
  });
}
