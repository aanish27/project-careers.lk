import type { AiBatchLogDetail, AuditLogWithActor } from "@careerslk/types";
import { api } from "@dashboard-lib/axios";
import { useQuery } from "@tanstack/react-query";

export function useJobAiBatch(batchId: string | null) {
  return useQuery({
    queryKey: ["ai-batch-logs", batchId] as const,
    queryFn: () =>
      api
        .get<AiBatchLogDetail>(`/admin/ai-batch-logs/${batchId}`)
        .then((res) => res.data),
    enabled: !!batchId,
  });
}

export function useJobAuditLogs(jobId: number) {
  return useQuery({
    queryKey: ["audit-logs", "job", jobId] as const,
    queryFn: () =>
      api
        .get<AuditLogWithActor[]>("/admin/audit-logs", {
          params: { entityType: "job", entityId: String(jobId) },
        })
        .then((res) => res.data),
    enabled: Number.isFinite(jobId),
  });
}
