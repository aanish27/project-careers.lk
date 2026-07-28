import type {
  AiLogWithCompany,
  AuditLogWithActor,
  ScrapeLogWithCompany,
} from "@careerslk/types";
import { api } from "@dashboard-lib/axios";
import { useQuery } from "@tanstack/react-query";

export function useCompanyScrapeLogs(companyId: number) {
  return useQuery({
    queryKey: ["scrape-logs", "company", companyId] as const,
    queryFn: () =>
      api
        .get<ScrapeLogWithCompany[]>("/admin/scrape-logs", {
          params: { companyId },
        })
        .then((res) => res.data),
    enabled: Number.isFinite(companyId),
  });
}

export function useCompanyAiLogs(companyId: number) {
  return useQuery({
    queryKey: ["ai-logs", "company", companyId] as const,
    queryFn: () =>
      api
        .get<AiLogWithCompany[]>("/admin/ai-logs", { params: { companyId } })
        .then((res) => res.data),
    enabled: Number.isFinite(companyId),
  });
}

export function useCompanyAuditLogs(companyId: number) {
  return useQuery({
    queryKey: ["audit-logs", "company", companyId] as const,
    queryFn: () =>
      api
        .get<AuditLogWithActor[]>("/admin/audit-logs", {
          params: { entityType: "company", entityId: String(companyId) },
        })
        .then((res) => res.data),
    enabled: Number.isFinite(companyId),
  });
}
