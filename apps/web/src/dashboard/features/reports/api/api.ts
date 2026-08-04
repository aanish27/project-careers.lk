import type {
  AbuseReportCategory,
  AbuseReportEntityType,
  AbuseReportStatus,
  AbuseReportWithReporter,
} from "@careerslk/types";
import { api } from "@dashboard-lib/axios";

export interface ReportFilters {
  status?: AbuseReportStatus;
  entityType?: AbuseReportEntityType;
  category?: AbuseReportCategory;
}

export interface ResolveReportInput {
  resolutionNotes?: string;
}

export const reportsApi = {
  list: (filters?: ReportFilters) =>
    api
      .get<AbuseReportWithReporter[]>("/admin/reports", { params: filters })
      .then((res) => res.data),
  get: (id: number) =>
    api
      .get<AbuseReportWithReporter>(`/admin/reports/${id}`)
      .then((res) => res.data),
  review: (id: number, dto: ResolveReportInput) =>
    api
      .post<AbuseReportWithReporter>(`/admin/reports/${id}/review`, dto)
      .then((res) => res.data),
  dismiss: (id: number, dto: ResolveReportInput) =>
    api
      .post<AbuseReportWithReporter>(`/admin/reports/${id}/dismiss`, dto)
      .then((res) => res.data),
};
