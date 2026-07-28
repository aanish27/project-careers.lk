import type { AiLogFilters } from "../api/api";

export const aiLogsKeys = {
  all: ["ai-logs"] as const,
  lists: () => [...aiLogsKeys.all, "list"] as const,
  list: (filters?: AiLogFilters) =>
    [...aiLogsKeys.lists(), filters ?? {}] as const,
};
