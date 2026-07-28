import type { AdminUser } from "@careerslk/types";
import { api } from "@dashboard-lib/axios";
import type {
  CreateUserInput,
  ResetPasswordInput,
  SetUserRolesInput,
  UpdateUserProfileInput,
} from "../types/user.types";

export const usersApi = {
  list: () => api.get<AdminUser[]>("/admin/users").then((res) => res.data),
  get: (id: number) =>
    api.get<AdminUser>(`/admin/users/${id}`).then((res) => res.data),
  create: (body: CreateUserInput) =>
    api.post<AdminUser>("/admin/users", body).then((res) => res.data),
  updateProfile: (id: number, body: UpdateUserProfileInput) =>
    api.patch<AdminUser>(`/admin/users/${id}`, body).then((res) => res.data),
  setRoles: (id: number, body: SetUserRolesInput) =>
    api
      .put<AdminUser>(`/admin/users/${id}/roles`, body)
      .then((res) => res.data),
  resetPassword: (id: number, body: ResetPasswordInput) =>
    api
      .post<{ success: true }>(`/admin/users/${id}/password`, body)
      .then((res) => res.data),
  remove: (id: number) =>
    api.delete<void>(`/admin/users/${id}`).then((res) => res.data),
};
