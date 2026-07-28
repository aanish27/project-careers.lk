import { useQuery } from "@tanstack/react-query";
import { auditLogsApi, type AuditLogFilters } from "../api/api";
import { auditLogsKeys } from "./query-keys";

export function useAuditLogs(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: auditLogsKeys.list(filters),
    queryFn: () => auditLogsApi.list(filters),
  });
}
