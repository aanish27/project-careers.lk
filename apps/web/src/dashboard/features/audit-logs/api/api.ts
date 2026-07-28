import type { AuditLogWithActor } from "@careerslk/types";
import { api } from "@dashboard-lib/axios";

export interface AuditLogFilters {
  actorUserId?: number;
  entityType?: string;
  action?: string;
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const auditLogsApi = {
  list: (filters?: AuditLogFilters) =>
    api
      .get<AuditLogWithActor[]>("/admin/audit-logs", { params: filters })
      .then((res) => res.data),
};
