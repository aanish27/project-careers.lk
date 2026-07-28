import type { JobDetail, JobWithCompany } from "@careerslk/types";
import { api } from "@dashboard-lib/axios";

export const jobsApi = {
  list: (filters?: { companyId?: number }) =>
    api
      .get<JobWithCompany[]>("/admin/jobs", { params: filters })
      .then((res) => res.data),
  get: (id: number) =>
    api.get<JobDetail>(`/admin/jobs/${id}`).then((res) => res.data),
  remove: (id: number) =>
    api.delete<void>(`/admin/jobs/${id}`).then((res) => res.data),
};
