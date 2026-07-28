import type { AuditLogFilters } from "../api/api";

export const auditLogsKeys = {
  all: ["audit-logs"] as const,
  lists: () => [...auditLogsKeys.all, "list"] as const,
  list: (filters?: AuditLogFilters) =>
    [...auditLogsKeys.lists(), filters ?? {}] as const,
};
