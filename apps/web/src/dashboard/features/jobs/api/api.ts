import { JobWithCompany } from "@careerslk/types";
import { api } from "@dashboard-lib/axios";

export const jobsApi = {
  list: (filters?: { companyId?: number }) =>
    api
      .get<JobWithCompany[]>("/admin/jobs", { params: filters })
      .then((res) => res.data),
  get: (id: number) =>
    api.get<JobWithCompany>(`/admin/jobs/${id}`).then((res) => res.data),
  // create: (body: CreateUserInput) =>
  //   api.post<AdminUser>("/admin/users", body).then((res) => res.data),
  // updateProfile: (id: number, body: UpdateUserProfileInput) =>
  //   api.patch<AdminUser>(`/admin/users/${id}`, body).then((res) => res.data),
  // setRoles: (id: number, body: SetUserRolesInput) =>
  //   api
  //     .put<AdminUser>(`/admin/users/${id}/roles`, body)
  //     .then((res) => res.data),
  // resetPassword: (id: number, body: ResetPasswordInput) =>
  //   api
  //     .post<{ success: true }>(`/admin/users/${id}/password`, body)
  //     .then((res) => res.data),
  remove: (id: number) =>
    api.delete<void>(`/admin/users/${id}`).then((res) => res.data),
};
