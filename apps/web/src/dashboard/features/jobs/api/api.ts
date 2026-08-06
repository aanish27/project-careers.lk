import type {
  JobApprovalStatus,
  JobDetail,
  JobSource,
  JobWithCompany,
  UpdateJobInput,
} from "@careerslk/types";
import { api } from "@dashboard-lib/axios";

export interface JobFilters {
  companyId?: number;
  approvalStatus?: JobApprovalStatus;
  source?: JobSource;
}

export const jobsApi = {
  list: (filters?: JobFilters) =>
    api
      .get<JobWithCompany[]>("/admin/jobs", { params: filters })
      .then((res) => res.data),
  get: (id: number) =>
    api.get<JobDetail>(`/admin/jobs/${id}`).then((res) => res.data),
  remove: (id: number) =>
    api.delete<void>(`/admin/jobs/${id}`).then((res) => res.data),
  update: (id: number, body: UpdateJobInput) =>
    api
      .patch<JobWithCompany>(`/admin/jobs/${id}`, body)
      .then((res) => res.data),
  approve: (id: number) =>
    api
      .post<JobWithCompany>(`/admin/jobs/${id}/approve`)
      .then((res) => res.data),
  reject: (id: number, reason: string) =>
    api
      .post<JobWithCompany>(`/admin/jobs/${id}/reject`, { reason })
      .then((res) => res.data),
};
