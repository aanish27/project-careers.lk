export const queueLogsKeys = {
  all: ["queue-logs"] as const,
  lists: () => [...queueLogsKeys.all, "list"] as const,
};
