import type { AiBatchLogFilters } from "../api/api";

export const aiBatchLogsKeys = {
  all: ["ai-batch-logs"] as const,
  lists: () => [...aiBatchLogsKeys.all, "list"] as const,
  list: (filters?: AiBatchLogFilters) =>
    [...aiBatchLogsKeys.lists(), filters ?? {}] as const,
};
