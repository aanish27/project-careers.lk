import { useQuery } from "@tanstack/react-query";
import { aiBatchLogsApi, type AiBatchLogFilters } from "../api/api";
import { aiBatchLogsKeys } from "./query-keys";

export function useAiBatchLogs(filters?: AiBatchLogFilters) {
  return useQuery({
    queryKey: aiBatchLogsKeys.list(filters),
    queryFn: () => aiBatchLogsApi.list(filters),
  });
}
