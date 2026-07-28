import { useQuery } from "@tanstack/react-query";
import { queueLogsApi } from "../api/api";
import { queueLogsKeys } from "./query-keys";

/** Live view — polled on an interval rather than invalidated by a mutation. */
const REFETCH_INTERVAL_MS = 5000;

export function useQueueLogs() {
  return useQuery({
    queryKey: queueLogsKeys.lists(),
    queryFn: () => queueLogsApi.list(),
    refetchInterval: REFETCH_INTERVAL_MS,
  });
}
